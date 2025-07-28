package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"gogent/internal/auth"
	pb "gogent/proto"

	"github.com/joho/godotenv"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// GRPCGateway provides HTTP-to-gRPC conversion for the frontend
type GRPCGateway struct {
	grpcClient pb.GogentServiceClient
	grpcConn   *grpc.ClientConn
}

// NewGRPCGateway creates a new HTTP-to-gRPC gateway
func NewGRPCGateway() (*GRPCGateway, error) {
	// Load environment variables
	if err := godotenv.Load("config.env"); err != nil {
		log.Printf("Warning: could not load config.env file: %v", err)
	}

	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" {
		grpcPort = "9090"
	}

	// Connect to gRPC server
	conn, err := grpc.NewClient(
		"localhost:"+grpcPort,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to gRPC server: %w", err)
	}

	client := pb.NewGogentServiceClient(conn)

	return &GRPCGateway{
		grpcClient: client,
		grpcConn:   conn,
	}, nil
}

// Close closes the gateway resources
func (g *GRPCGateway) Close() error {
	if g.grpcConn != nil {
		return g.grpcConn.Close()
	}
	return nil
}

// Health check endpoint
func (g *GRPCGateway) healthHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	req := &pb.HealthRequest{}
	resp, err := g.grpcClient.Health(ctx, req)
	if err != nil {
		http.Error(w, fmt.Sprintf("gRPC health check failed: %v", err), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"status":     resp.Status,
		"version":    resp.Version,
		"timestamp":  resp.Timestamp.AsTime().Format(time.RFC3339),
		"database":   resp.Database,
		"gemini_api": resp.GeminiApi,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Execute multi-variation endpoint
func (g *GRPCGateway) executeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the JSON request (same format as REST API)
	var httpReq map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&httpReq); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	// Convert HTTP request to gRPC request
	grpcReq := &pb.ExecuteRequest{
		ExecutionRunName:      getStringFromMap(httpReq, "executionRunName"),
		Description:           getStringFromMap(httpReq, "description"),
		BasePrompt:            getStringFromMap(httpReq, "basePrompt"),
		Context:               getStringFromMap(httpReq, "context"),
		EnableFunctionCalling: getBoolFromMap(httpReq, "enableFunctionCalling"),
		UseMock:               r.Header.Get("X-Use-Mock") == "true",
		SessionApiKeys:        make(map[string]string),
	}

	// Initialize header encryption utility
	headerEncryption := auth.NewHeaderEncryption()

	// First, try to decrypt encrypted API keys from headers
	encryptedKeys := headerEncryption.GetDecryptedAPIKeysFromHeaders(r.Header)

	// Merge decrypted keys into session API keys
	for key, value := range encryptedKeys {
		grpcReq.SessionApiKeys[key] = value
		log.Printf("🔓 Using decrypted API key: %s", key)
	}

	// Fallback: Collect legacy plain-text API keys from headers (for backward compatibility)
	if geminiKey := r.Header.Get("X-Gemini-API-Key"); geminiKey != "" {
		grpcReq.SessionApiKeys["geminiApiKey"] = geminiKey
		log.Printf("⚠️ Using legacy plain-text Gemini API key")
	}
	if openWeatherKey := r.Header.Get("X-OpenWeather-API-Key"); openWeatherKey != "" {
		grpcReq.SessionApiKeys["openWeatherApiKey"] = openWeatherKey
		log.Printf("⚠️ Using legacy plain-text OpenWeather API key")
	}
	if neo4jUrl := r.Header.Get("X-Neo4j-URL"); neo4jUrl != "" {
		grpcReq.SessionApiKeys["neo4jUrl"] = neo4jUrl
		log.Printf("⚠️ Using legacy plain-text Neo4j URL")
	}
	if neo4jUsername := r.Header.Get("X-Neo4j-Username"); neo4jUsername != "" {
		grpcReq.SessionApiKeys["neo4jUsername"] = neo4jUsername
		log.Printf("⚠️ Using legacy plain-text Neo4j username")
	}
	if neo4jPassword := r.Header.Get("X-Neo4j-Password"); neo4jPassword != "" {
		grpcReq.SessionApiKeys["neo4jPassword"] = neo4jPassword
		log.Printf("⚠️ Using legacy plain-text Neo4j password")
	}
	if neo4jDatabase := r.Header.Get("X-Neo4j-Database"); neo4jDatabase != "" {
		grpcReq.SessionApiKeys["neo4jDatabase"] = neo4jDatabase
		log.Printf("⚠️ Using legacy plain-text Neo4j database")
	}

	// Log the number of API keys we have
	log.Printf("🔑 Total API keys available: %d", len(grpcReq.SessionApiKeys))

	// Convert configurations
	if configs, ok := httpReq["configurations"].([]interface{}); ok {
		var protoConfigs []*pb.APIConfiguration
		for _, configInterface := range configs {
			if configMap, ok := configInterface.(map[string]interface{}); ok {
				protoConfig := &pb.APIConfiguration{
					Id:            getStringFromMap(configMap, "id"),
					VariationName: getStringFromMap(configMap, "variationName"),
					ModelName:     getStringFromMap(configMap, "modelName"),
					SystemPrompt:  getStringFromMap(configMap, "systemPrompt"),
					Temperature:   getFloat32FromMap(configMap, "temperature"),
					MaxTokens:     getInt32FromMap(configMap, "maxTokens"),
					TopP:          getFloat32FromMap(configMap, "topP"),
					TopK:          getInt32FromMap(configMap, "topK"),
					CreatedAt:     timestamppb.Now(),
				}
				protoConfigs = append(protoConfigs, protoConfig)
			}
		}
		grpcReq.Configurations = protoConfigs
	}

	// Call gRPC service
	ctx := context.Background()
	resp, err := g.grpcClient.Execute(ctx, grpcReq)
	if err != nil {
		http.Error(w, fmt.Sprintf("gRPC execution failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Convert gRPC response to HTTP response (same format as REST API)
	response := map[string]interface{}{
		"executionRun": map[string]interface{}{
			"id":     resp.ExecutionId,
			"name":   resp.ExecutionRun.Name,
			"status": resp.ExecutionRun.Status,
		},
		"message": resp.Message,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Get execution status endpoint
func (g *GRPCGateway) executionStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract execution ID from URL path
	path := r.URL.Path
	statusPrefix := "/api/execution-runs/status/"
	if !strings.HasPrefix(path, statusPrefix) {
		http.Error(w, "Invalid status endpoint", http.StatusBadRequest)
		return
	}

	executionID := path[len(statusPrefix):]
	if executionID == "" {
		http.Error(w, "Execution ID required", http.StatusBadRequest)
		return
	}

	// Call gRPC service
	ctx := context.Background()
	req := &pb.GetExecutionStatusRequest{
		ExecutionId: executionID,
	}

	resp, err := g.grpcClient.GetExecutionStatus(ctx, req)
	if err != nil {
		http.Error(w, fmt.Sprintf("gRPC status check failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Convert gRPC response to HTTP response
	response := map[string]interface{}{
		"status": resp.Status,
	}

	if resp.ErrorMessage != "" {
		response["error"] = resp.ErrorMessage
	}

	if resp.Result != nil {
		response["result"] = convertExecutionResultToMap(resp.Result)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// List execution runs endpoint
func (g *GRPCGateway) executionRunsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse query parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := int32(10)
	offset := int32(0)

	if limitStr != "" {
		if parsedLimit, err := strconv.ParseInt(limitStr, 10, 32); err == nil {
			limit = int32(parsedLimit)
		}
	}

	if offsetStr != "" {
		if parsedOffset, err := strconv.ParseInt(offsetStr, 10, 32); err == nil {
			offset = int32(parsedOffset)
		}
	}

	// Call gRPC service
	ctx := context.Background()
	req := &pb.ListExecutionRunsRequest{
		Limit:  limit,
		Offset: offset,
	}

	resp, err := g.grpcClient.ListExecutionRuns(ctx, req)
	if err != nil {
		http.Error(w, fmt.Sprintf("gRPC list failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Convert gRPC response to HTTP response
	var runs []map[string]interface{}
	for _, run := range resp.ExecutionRuns {
		runMap := map[string]interface{}{
			"id":          run.Id,
			"name":        run.Name,
			"description": run.Description,
			"createdAt":   run.CreatedAt.AsTime().Format(time.RFC3339),
			"updatedAt":   run.UpdatedAt.AsTime().Format(time.RFC3339),
		}
		runs = append(runs, runMap)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(runs)
}

// List configurations endpoint
func (g *GRPCGateway) configurationsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		g.listConfigurations(w, r)
	case http.MethodPost:
		g.createConfiguration(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (g *GRPCGateway) configurationByIDHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPut:
		g.updateConfiguration(w, r)
	case http.MethodDelete:
		g.deleteConfiguration(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (g *GRPCGateway) listConfigurations(w http.ResponseWriter, r *http.Request) {
	// Call gRPC service
	ctx := context.Background()
	req := &pb.ListConfigurationsRequest{}

	resp, err := g.grpcClient.ListConfigurations(ctx, req)
	if err != nil {
		http.Error(w, fmt.Sprintf("gRPC configurations failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Convert gRPC response to HTTP response
	var configs []map[string]interface{}
	for _, config := range resp.Configurations {
		configMap := map[string]interface{}{
			"id":            config.Id,
			"variationName": config.VariationName,
			"modelName":     config.ModelName,
			"systemPrompt":  config.SystemPrompt,
			"temperature":   config.Temperature,
			"maxTokens":     config.MaxTokens,
			"topP":          config.TopP,
			"topK":          config.TopK,
			"createdAt":     config.CreatedAt.AsTime().Format(time.RFC3339),
		}
		configs = append(configs, configMap)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(configs)
}

func (g *GRPCGateway) createConfiguration(w http.ResponseWriter, r *http.Request) {
	var configData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&configData); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Convert to protobuf
	protoConfig := &pb.APIConfiguration{
		Id:            getStringFromMap(configData, "id"),
		VariationName: getStringFromMap(configData, "variationName"),
		ModelName:     getStringFromMap(configData, "modelName"),
		SystemPrompt:  getStringFromMap(configData, "systemPrompt"),
		Temperature:   getFloat32FromMap(configData, "temperature"),
		MaxTokens:     getInt32FromMap(configData, "maxTokens"),
		TopP:          getFloat32FromMap(configData, "topP"),
		TopK:          getInt32FromMap(configData, "topK"),
	}

	// Call gRPC service
	ctx := context.Background()
	req := &pb.CreateConfigurationRequest{Configuration: protoConfig}

	resp, err := g.grpcClient.CreateConfiguration(ctx, req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create configuration: %v", err), http.StatusInternalServerError)
		return
	}

	// Convert response back to HTTP format
	resultConfig := map[string]interface{}{
		"id":            resp.Configuration.Id,
		"variationName": resp.Configuration.VariationName,
		"modelName":     resp.Configuration.ModelName,
		"systemPrompt":  resp.Configuration.SystemPrompt,
		"temperature":   resp.Configuration.Temperature,
		"maxTokens":     resp.Configuration.MaxTokens,
		"topP":          resp.Configuration.TopP,
		"topK":          resp.Configuration.TopK,
		"createdAt":     resp.Configuration.CreatedAt.AsTime().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resultConfig)
}

func (g *GRPCGateway) updateConfiguration(w http.ResponseWriter, r *http.Request) {
	// Extract ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/configurations/")
	configID := strings.Split(path, "/")[0]

	if configID == "" {
		http.Error(w, "Configuration ID required", http.StatusBadRequest)
		return
	}

	var configData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&configData); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Convert to protobuf
	protoConfig := &pb.APIConfiguration{
		Id:            configID,
		VariationName: getStringFromMap(configData, "variationName"),
		ModelName:     getStringFromMap(configData, "modelName"),
		SystemPrompt:  getStringFromMap(configData, "systemPrompt"),
		Temperature:   getFloat32FromMap(configData, "temperature"),
		MaxTokens:     getInt32FromMap(configData, "maxTokens"),
		TopP:          getFloat32FromMap(configData, "topP"),
		TopK:          getInt32FromMap(configData, "topK"),
	}

	// Call gRPC service
	ctx := context.Background()
	req := &pb.UpdateConfigurationRequest{
		Id:            configID,
		Configuration: protoConfig,
	}

	resp, err := g.grpcClient.UpdateConfiguration(ctx, req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to update configuration: %v", err), http.StatusInternalServerError)
		return
	}

	// Convert response back to HTTP format
	resultConfig := map[string]interface{}{
		"id":            resp.Configuration.Id,
		"variationName": resp.Configuration.VariationName,
		"modelName":     resp.Configuration.ModelName,
		"systemPrompt":  resp.Configuration.SystemPrompt,
		"temperature":   resp.Configuration.Temperature,
		"maxTokens":     resp.Configuration.MaxTokens,
		"topP":          resp.Configuration.TopP,
		"topK":          resp.Configuration.TopK,
		"createdAt":     resp.Configuration.CreatedAt.AsTime().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resultConfig)
}

func (g *GRPCGateway) deleteConfiguration(w http.ResponseWriter, r *http.Request) {
	// Extract ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/configurations/")
	configID := strings.Split(path, "/")[0]

	if configID == "" {
		http.Error(w, "Configuration ID required", http.StatusBadRequest)
		return
	}

	// Call gRPC service
	ctx := context.Background()
	req := &pb.DeleteConfigurationRequest{Id: configID}

	resp, err := g.grpcClient.DeleteConfiguration(ctx, req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete configuration: %v", err), http.StatusInternalServerError)
		return
	}

	// Return success response
	result := map[string]interface{}{
		"message": resp.Message,
		"success": true,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// Database stats endpoint
func (g *GRPCGateway) databaseStatsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Call gRPC service
	ctx := context.Background()
	req := &pb.GetDatabaseStatsRequest{}

	resp, err := g.grpcClient.GetDatabaseStats(ctx, req)
	if err != nil {
		http.Error(w, fmt.Sprintf("gRPC database stats failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Convert gRPC response to HTTP response
	response := map[string]interface{}{
		"totalExecutionRuns": resp.TotalExecutionRuns,
		"totalApiRequests":   resp.TotalApiRequests,
		"totalApiResponses":  resp.TotalApiResponses,
		"totalFunctionCalls": resp.TotalFunctionCalls,
		"avgResponseTime":    resp.AvgResponseTime,
		"successRate":        resp.SuccessRate,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// CORS middleware
func (g *GRPCGateway) enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Gemini-API-Key, X-OpenWeather-API-Key, X-Neo4j-URL, X-Neo4j-Username, X-Neo4j-Password, X-Neo4j-Database, X-Use-Mock, X-Encrypted-Gemini-API-Key, X-Encrypted-Openweather-API-Key, X-Encrypted-Neo4j-URL, X-Encrypted-Neo4j-Username, X-Encrypted-Neo4j-Password, X-Encrypted-Neo4j-Database")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// Helper functions for type conversion
func getStringFromMap(m map[string]interface{}, key string) string {
	if val, ok := m[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func getBoolFromMap(m map[string]interface{}, key string) bool {
	if val, ok := m[key]; ok {
		if b, ok := val.(bool); ok {
			return b
		}
	}
	return false
}

func getFloat32FromMap(m map[string]interface{}, key string) float32 {
	if val, ok := m[key]; ok {
		if f, ok := val.(float64); ok {
			return float32(f)
		}
		if f, ok := val.(float32); ok {
			return f
		}
	}
	return 0.0
}

func getInt32FromMap(m map[string]interface{}, key string) int32 {
	if val, ok := m[key]; ok {
		if i, ok := val.(float64); ok {
			return int32(i)
		}
		if i, ok := val.(int32); ok {
			return i
		}
		if i, ok := val.(int); ok {
			return int32(i)
		}
	}
	return 0
}

// Convert gRPC ExecutionResult to map for JSON response
func convertExecutionResultToMap(result *pb.ExecutionResult) map[string]interface{} {
	resultMap := map[string]interface{}{
		"totalTime":    result.TotalTime,
		"successCount": result.SuccessCount,
		"errorCount":   result.ErrorCount,
	}

	if result.ExecutionRun != nil {
		resultMap["executionRun"] = map[string]interface{}{
			"id":          result.ExecutionRun.Id,
			"name":        result.ExecutionRun.Name,
			"description": result.ExecutionRun.Description,
			"createdAt":   result.ExecutionRun.CreatedAt.AsTime().Format(time.RFC3339),
			"updatedAt":   result.ExecutionRun.UpdatedAt.AsTime().Format(time.RFC3339),
		}
	}

	// Convert results
	var results []map[string]interface{}
	for _, vr := range result.Results {
		resultItem := map[string]interface{}{
			"executionTime": vr.ExecutionTime,
		}

		if vr.Configuration != nil {
			resultItem["configuration"] = map[string]interface{}{
				"id":            vr.Configuration.Id,
				"variationName": vr.Configuration.VariationName,
				"modelName":     vr.Configuration.ModelName,
				"systemPrompt":  vr.Configuration.SystemPrompt,
				"temperature":   vr.Configuration.Temperature,
				"maxTokens":     vr.Configuration.MaxTokens,
				"topP":          vr.Configuration.TopP,
				"topK":          vr.Configuration.TopK,
			}
		}

		if vr.Request != nil {
			resultItem["request"] = map[string]interface{}{
				"id":              vr.Request.Id,
				"executionRunId":  vr.Request.ExecutionRunId,
				"configurationId": vr.Request.ConfigurationId,
				"requestType":     vr.Request.RequestType,
				"prompt":          vr.Request.Prompt,
				"context":         vr.Request.Context,
			}
		}

		if vr.Response != nil {
			resultItem["response"] = map[string]interface{}{
				"id":             vr.Response.Id,
				"requestId":      vr.Response.RequestId,
				"responseStatus": vr.Response.ResponseStatus,
				"responseText":   vr.Response.ResponseText,
				"finishReason":   vr.Response.FinishReason,
				"responseTimeMs": vr.Response.ResponseTimeMs,
			}
		}

		results = append(results, resultItem)
	}
	resultMap["results"] = results

	// Convert comparison if available
	if result.Comparison != nil {
		resultMap["comparison"] = map[string]interface{}{
			"id":                  result.Comparison.Id,
			"executionRunId":      result.Comparison.ExecutionRunId,
			"comparisonType":      result.Comparison.ComparisonType,
			"metricName":          result.Comparison.MetricName,
			"bestConfigurationId": result.Comparison.BestConfigurationId,
			"analysisNotes":       result.Comparison.AnalysisNotes,
		}
	}

	return resultMap
}

// Start the gRPC gateway server
func runGRPCGateway() {
	gateway, err := NewGRPCGateway()
	if err != nil {
		log.Fatalf("Failed to create gRPC gateway: %v", err)
	}
	defer gateway.Close()

	// Set up routes (same as REST API routes)
	http.HandleFunc("/health", gateway.enableCORS(gateway.healthHandler))
	http.HandleFunc("/api/execute", gateway.enableCORS(gateway.executeHandler))
	http.HandleFunc("/api/execution-runs/status/", gateway.enableCORS(gateway.executionStatusHandler))
	http.HandleFunc("/api/execution-runs", gateway.enableCORS(gateway.executionRunsHandler))
	http.HandleFunc("/api/configurations", gateway.enableCORS(gateway.configurationsHandler))
	http.HandleFunc("/api/configurations/", gateway.enableCORS(gateway.configurationByIDHandler))
	http.HandleFunc("/api/database/stats", gateway.enableCORS(gateway.databaseStatsHandler))

	port := os.Getenv("GATEWAY_PORT")
	if port == "" {
		port = "8081"
	}

	fmt.Printf("🌉 GoGent gRPC Gateway starting on port %s\n", port)
	fmt.Printf("📡 Health check: http://localhost:%s/health\n", port)
	fmt.Printf("🔄 Converting HTTP requests to gRPC calls on port 9090\n")
	fmt.Printf("🎯 Frontend can use this gateway as a drop-in replacement for the REST API\n")
	fmt.Println()

	log.Fatal(http.ListenAndServe(":"+port, nil))
}
