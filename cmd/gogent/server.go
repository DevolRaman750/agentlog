package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"gogent/internal/agents"
	"gogent/internal/apikeys"
	"gogent/internal/auth"
	"gogent/internal/db"
	"gogent/internal/gogent"
	"gogent/internal/heartbeat"
	"gogent/internal/teams"
	"gogent/internal/templates"
	"gogent/internal/types"

	"github.com/imran31415/gracewrap"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

// Server represents our HTTP server
type Server struct {
	client *gogent.Client
	config *types.GeminiClientConfig
	// Removed executions map and mutex - now using database for status tracking
	authService         *auth.AuthService
	authHandlers        *auth.AuthHandlers
	templateIntegration *templates.TemplateIntegration
	agentsHandler       *agents.AgentsHandler
	teamsHandler        *teams.Handler
	apiKeysService      *apikeys.Service
	apiKeysHandler      *apikeys.Handler
	heartbeatExecutor   *heartbeat.HeartbeatExecutor
}

// ExecutionStatus tracks the status of an async execution (used by gRPC/BusinessLogic)
type ExecutionStatus struct {
	ID                 string     `json:"id"`
	RealExecutionRunID string     `json:"realExecutionRunId,omitempty"` // The actual UUID from database
	Status             string     `json:"status"`                       // pending, running, completed, failed
	ErrorMessage       string     `json:"errorMessage,omitempty"`
	StartTime          time.Time  `json:"startTime"`
	EndTime            *time.Time `json:"endTime,omitempty"`
	FirstResultServed  bool       `json:"-"` // Track if we've served the result to prevent immediate cleanup
}

// ExecutionEngineAdapter adapts the gogent client to the templates.ExecutionEngine interface
type ExecutionEngineAdapter struct {
	client *gogent.Client
}

// StartExecution implements the ExecutionEngine interface for templates
func (e *ExecutionEngineAdapter) StartExecution(request *types.MultiExecutionRequest, useMock bool, sessionAPIKeys map[string]string) (string, *types.ExecutionRun, error) {
	ctx := context.Background()

	// For template execution, we use a system user ID
	// Since templates have their own authentication mechanism
	systemUserID := "template-system"

	// Execute the request
	result, err := e.client.ExecuteMultiVariation(ctx, systemUserID, request)
	if err != nil {
		return "", nil, err
	}

	// Return the execution ID and the execution run from the result
	return result.ExecutionRun.ID, &result.ExecutionRun, nil
}

// GetExecutionStatus implements the ExecutionEngine interface
func (e *ExecutionEngineAdapter) GetExecutionStatus(executionID string) (string, string, *time.Time, *time.Time, *types.ExecutionResult, error) {
	// This is a simplified implementation
	// In a real implementation, you might query the database for execution status
	return executionID, "completed", nil, nil, nil, nil
}

// NewServer creates a new HTTP server
func NewServer() (*Server, error) {
	// Load environment variables
	if err := godotenv.Load("config.env"); err != nil {
		log.Printf("Warning: could not load config.env file: %v", err)
	}

	// Get configuration from environment
	dbURL := os.Getenv("DB_URL")
	jwtSecret := os.Getenv("JWT_SECRET")

	if dbURL == "" {
		return nil, fmt.Errorf("DB_URL environment variable is required")
	}

	// Create Gemini client configuration (deprecated fields removed)
	config := &types.GeminiClientConfig{
		MaxRetries:  3,
		TimeoutSecs: 600, // 10 minutes - very tolerant for async execution
	}

	// Create gogent client (without session keys for server client)
	client, err := gogent.NewClient(dbURL, config, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create gogent client: %w", err)
	}

	// Sync system specifications from JSON files to database
	if err := client.SyncSystemSpecs(context.Background()); err != nil {
		log.Printf("⚠️ Failed to sync system specs: %v", err)
		// Continue anyway - this shouldn't block server startup
	}

	// Create auth service and handlers
	authService := auth.NewAuthService(client.GetDB(), jwtSecret)
	authHandlers := auth.NewAuthHandlers(authService)

	// Create execution engine adapter
	executionEngine := &ExecutionEngineAdapter{client: client}

	// Create template integration
	templateIntegration := templates.NewTemplateIntegration(client.GetDB(), authService, executionEngine)

	// Create agents handler
	agentsHandler := agents.NewAgentsHandler(client.GetDB())

	// Create teams handler
	teamsHandler := teams.NewTeamsHandler(client.GetDB())

	// Create API key service and handler
	apiKeysService, err := apikeys.NewService(client.GetDB())
	if err != nil {
		return nil, fmt.Errorf("failed to create API keys service: %w", err)
	}
	apiKeysHandler := apikeys.NewHandler(apiKeysService)

	// Create HeartbeatExecutor
	heartbeatConfig := heartbeat.LoadConfigFromEnv()
	heartbeatExecutor := heartbeat.NewHeartbeatExecutor(client, heartbeatConfig)

	return &Server{
		client: client,
		config: config,
		// Removed executions map - using database for status tracking
		authService:         authService,
		authHandlers:        authHandlers,
		templateIntegration: templateIntegration,
		agentsHandler:       agentsHandler,
		teamsHandler:        teamsHandler,
		apiKeysService:      apiKeysService,
		apiKeysHandler:      apiKeysHandler,
		heartbeatExecutor:   heartbeatExecutor,
	}, nil
}

// Close closes the server resources
func (s *Server) Close() error {
	// Stop HeartbeatExecutor first
	if s.heartbeatExecutor != nil {
		if err := s.heartbeatExecutor.Stop(); err != nil {
			log.Printf("⚠️ Error stopping HeartbeatExecutor: %v", err)
		}
	}

	if s.client != nil {
		return s.client.Close()
	}
	return nil
}

// Health check endpoint
func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":    "ok",
		"version":   "1.0.0",
		"timestamp": time.Now().Format(time.RFC3339),
		"database":  s.client != nil,
	}

	// Add HeartbeatExecutor status
	if s.heartbeatExecutor != nil {
		response["heartbeat_executor"] = map[string]interface{}{
			"status":  s.heartbeatExecutor.GetStatus(),
			"metrics": s.heartbeatExecutor.GetMetrics(),
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// HeartbeatExecutor status endpoint
func (s *Server) heartbeatStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	response := map[string]interface{}{
		"timestamp": time.Now().Format(time.RFC3339),
	}

	if s.heartbeatExecutor != nil {
		response["status"] = s.heartbeatExecutor.GetStatus()
		response["metrics"] = s.heartbeatExecutor.GetMetrics()

		// Get additional agent statistics
		queries := s.heartbeatExecutor.GetQueries()
		if stats, err := queries.GetAgentExecutionStats(r.Context()); err == nil {
			response["agent_stats"] = stats
		}

		if count, err := queries.GetActiveAgentCount(r.Context()); err == nil {
			response["active_agent_count"] = count
		}
	} else {
		response["status"] = "not_initialized"
		response["error"] = "HeartbeatExecutor not available"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Test connection endpoint
func (s *Server) testHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"message":   "Connection successful",
		"timestamp": time.Now().Format(time.RFC3339),
		"service":   "gogent-server",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Execute multi-variation endpoint (async)
func (s *Server) executeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract user ID from JWT context
	userID, err := s.getUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var request types.MultiExecutionRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	// DEBUG: Log what we parsed
	log.Printf("🔍 DEBUG - Parsed request:")
	log.Printf("  ExecutionRunName: '%s'", request.ExecutionRunName)
	log.Printf("  BasePrompt: '%s'", request.BasePrompt)
	log.Printf("  Description: '%s'", request.Description)
	log.Printf("  Configurations count: %d", len(request.Configurations))
	if request.AgentID != nil {
		log.Printf("  AgentID: '%s'", *request.AgentID)
	}
	if len(request.Configurations) > 0 {
		log.Printf("  First config - ModelName: '%s', VariationName: '%s'",
			request.Configurations[0].ModelName, request.Configurations[0].VariationName)
	}

	// If this is an agent execution, load the agent's effective context
	if request.AgentID != nil && *request.AgentID != "" {
		log.Printf("🤖 Agent execution detected - loading agent's effective context")

		// Load agent's effective context from database
		agentContext, err := s.loadAgentEffectiveContext(context.Background(), userID, *request.AgentID)
		if err != nil {
			log.Printf("⚠️ Failed to load agent effective context: %v", err)
			// Continue with original context - don't fail the execution
		} else if agentContext != "" {
			log.Printf("✅ Using agent's effective context (length: %d chars)", len(agentContext))
			request.Context = agentContext
		} else {
			log.Printf("ℹ️ Agent has no effective context, using original context")
		}
	}

	// Create the execution run first to get the real database UUID
	ctx := context.Background()
	log.Printf("Creating client to get real execution ID from database")

	// Get database URL from environment
	dbURL := os.Getenv("DB_URL")
	tempConfig := &types.GeminiClientConfig{MaxRetries: 3, TimeoutSecs: 30}
	tempClient, clientErr := gogent.NewClient(dbURL, tempConfig, nil)
	if clientErr != nil {
		log.Printf("Failed to create client for execution ID generation: %v", clientErr)
		http.Error(w, fmt.Sprintf("Failed to create client: %v", clientErr), http.StatusInternalServerError)
		return
	}
	defer tempClient.Close()

	// Create execution run to get real database UUID
	executionRun, err := tempClient.CreateExecutionRun(ctx, userID, request.ExecutionRunName, request.Description, request.EnableFunctionCalling, request.AgentID)
	if err != nil {
		log.Printf("Failed to create execution run: %v", err)
		http.Error(w, fmt.Sprintf("Failed to create execution run: %v", err), http.StatusInternalServerError)
		return
	}

	// Use the real database UUID as the execution ID
	executionID := executionRun.ID
	log.Printf("✅ Created execution with real database UUID: %s", executionID)

	// Update execution status to pending in database (already created with this status)
	log.Printf("📌 Execution created in database with status 'pending': %s", executionID)

	// Start async execution with user ID using the real database UUID
	go s.runAsyncExecution(executionID, &request, r.Header.Get("X-Use-Mock") == "true", r.Header, userID)

	// Return immediately with real database execution ID
	response := map[string]interface{}{
		"executionRun": map[string]interface{}{
			"id":     executionID,
			"name":   request.ExecutionRunName,
			"status": "pending",
		},
		"message": "Execution started. Use GET /api/execution-runs/" + executionID + "/status to check progress.",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Helper function to extract user ID from request context
func (s *Server) getUserID(r *http.Request) (string, error) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok || user == nil {
		return "", fmt.Errorf("user not found in context")
	}
	return user.ID, nil
}

// runAsyncExecution runs the execution in a goroutine
func (s *Server) runAsyncExecution(executionID string, request *types.MultiExecutionRequest, useMock bool, headers http.Header, userID string) {
	// Update status to running in database
	ctx := context.Background()
	runningErr := s.client.UpdateExecutionRunStatus(ctx, userID, executionID, "running", "")
	if runningErr != nil {
		log.Printf("⚠️ Failed to update execution status to running in database: %v", runningErr)
	} else {
		log.Printf("🏃 Updated execution status to running in database: %s", executionID)
	}

	log.Printf("🚀 Starting async execution: %s for user: %s", executionID, userID)

	// Initialize header encryption utility
	headerEncryption := auth.NewHeaderEncryption()

	// First, try to decrypt encrypted API keys from headers
	log.Printf("🔍 DEBUG: All headers received: %v", headers)
	encryptedKeys := headerEncryption.GetDecryptedAPIKeysFromHeaders(headers)
	log.Printf("🔍 DEBUG: Decrypted keys: %v", func() map[string]string {
		masked := make(map[string]string)
		for k, v := range encryptedKeys {
			if len(v) > 10 {
				masked[k] = v[:10] + "..."
			} else {
				masked[k] = "***"
			}
		}
		return masked
	}())

	// API keys are now managed in database - headers are deprecated
	log.Printf("🔑 API keys will be loaded from database for user %s (headers are deprecated)", userID)

	// Get OpenWeather API key from encrypted headers first, then fallback to plain text
	var openWeatherAPIKey string
	log.Printf("🔍 DEBUG: Looking for OpenWeather API key...")
	log.Printf("🔍 DEBUG: encryptedKeys has openWeatherAPIKey: %v", encryptedKeys["openWeatherAPIKey"] != "")
	log.Printf("🔍 DEBUG: Headers has X-OpenWeather-API-Key: %v", headers.Get("X-OpenWeather-API-Key") != "")
	log.Printf("🔍 DEBUG: Headers has X-Encrypted-Openweather-Api-Key: %v", headers.Get("X-Encrypted-Openweather-Api-Key") != "")

	if decryptedKey, exists := encryptedKeys["openWeatherAPIKey"]; exists && decryptedKey != "" {
		openWeatherAPIKey = decryptedKey
		log.Printf("🌤️ Using decrypted OpenWeather API key from frontend: %s...", openWeatherAPIKey[:10])
	} else if plainKey := headers.Get("X-OpenWeather-API-Key"); plainKey != "" {
		openWeatherAPIKey = plainKey
		log.Printf("🌤️ Using plain-text OpenWeather API key from frontend: %s...", openWeatherAPIKey[:10])
		log.Printf("⚠️ Warning: OpenWeather API key transmitted in plain text")
	} else {
		log.Printf("⚠️ No OpenWeather API key provided")
	}

	// Get Neo4j configuration from encrypted headers first, then fallback to plain text
	var neo4jURL, neo4jUsername, neo4jPassword, neo4jDatabase string

	if decryptedURL, exists := encryptedKeys["neo4jUrl"]; exists && decryptedURL != "" {
		neo4jURL = decryptedURL
		log.Printf("🔗 Using decrypted Neo4j URL from frontend")
	} else {
		neo4jURL = headers.Get("X-Neo4j-URL")
		if neo4jURL != "" {
			log.Printf("🔗 Using plain-text Neo4j URL from frontend")
			log.Printf("⚠️ Warning: Neo4j URL transmitted in plain text")
		}
	}

	if decryptedUsername, exists := encryptedKeys["neo4jUsername"]; exists && decryptedUsername != "" {
		neo4jUsername = decryptedUsername
		log.Printf("🔗 Using decrypted Neo4j username from frontend")
	} else {
		neo4jUsername = headers.Get("X-Neo4j-Username")
		if neo4jUsername != "" {
			log.Printf("🔗 Using plain-text Neo4j username from frontend")
			log.Printf("⚠️ Warning: Neo4j username transmitted in plain text")
		}
	}

	if decryptedPassword, exists := encryptedKeys["neo4jPassword"]; exists && decryptedPassword != "" {
		neo4jPassword = decryptedPassword
		log.Printf("🔗 Using decrypted Neo4j password from frontend")
	} else {
		neo4jPassword = headers.Get("X-Neo4j-Password")
		if neo4jPassword != "" {
			log.Printf("🔗 Using plain-text Neo4j password from frontend")
			log.Printf("⚠️ Warning: Neo4j password transmitted in plain text")
		}
	}

	if decryptedDatabase, exists := encryptedKeys["neo4jDatabase"]; exists && decryptedDatabase != "" {
		neo4jDatabase = decryptedDatabase
		log.Printf("🔗 Using decrypted Neo4j database from frontend")
	} else {
		neo4jDatabase = headers.Get("X-Neo4j-Database")
		if neo4jDatabase != "" {
			log.Printf("🔗 Using plain-text Neo4j database from frontend")
			log.Printf("⚠️ Warning: Neo4j database transmitted in plain text")
		}
	}

	// Get GitHub API key from encrypted headers
	var githubAPIKey string
	if decryptedKey, exists := encryptedKeys["githubAPIKey"]; exists && decryptedKey != "" {
		githubAPIKey = decryptedKey
		log.Printf("🐙 Using decrypted GitHub API key from frontend: %s...", githubAPIKey[:10])
	} else {
		log.Printf("⚠️ No GitHub API key provided")
	}

	// Get OpenRouter API key from encrypted headers
	var openRouterAPIKey string
	if decryptedKey, exists := encryptedKeys["openRouterAPIKey"]; exists && decryptedKey != "" {
		openRouterAPIKey = decryptedKey
		log.Printf("🚀 Using decrypted OpenRouter API key from frontend: %s...", openRouterAPIKey[:10])
	} else {
		log.Printf("⚠️ No OpenRouter API key provided")
	}

	// ctx is already declared earlier in this function
	var err error

	// Always try real execution first with database API keys
	// Create a client that will load API keys from database
	tempConfig := &types.GeminiClientConfig{
		MaxRetries:  s.config.MaxRetries,
		TimeoutSecs: s.config.TimeoutSecs,
	}

	log.Printf("Creating client that will load API keys from database")

	// Get database URL from environment for client
	dbURL := os.Getenv("DB_URL")
	tempClient, clientErr := gogent.NewClient(dbURL, tempConfig, nil)
	if clientErr != nil {
		log.Printf("Failed to create client: %v", clientErr)
		s.markExecutionFailed(executionID, userID, fmt.Sprintf("Failed to create client: %v", clientErr))
		return
	}
	defer tempClient.Close()

	// Load API keys from database for this user
	if loadErr := tempClient.LoadDatabaseAPIKeys(ctx, userID); loadErr != nil {
		log.Printf("⚠️ Failed to load API keys from database: %v", loadErr)
		// Continue execution - the client will determine if mock responses are needed
	}

	log.Printf("Using client with database API keys for execution (execution already created with ID: %s)", executionID)

	// Since we already created the execution run, we need to use the existing ID
	// Execute the variations for the existing execution run
	ctx = context.WithValue(ctx, "execution_run_id", executionID)
	_, err = tempClient.ExecuteMultiVariationWithExistingRun(ctx, userID, executionID, request)
	if err != nil {
		log.Printf("Execution failed: %v", err)
		s.markExecutionFailed(executionID, userID, fmt.Sprintf("Execution failed: %v", err))
		return
	}

	// Mark execution as completed in database
	completedErr := s.client.UpdateExecutionRunStatus(ctx, userID, executionID, "completed", "")
	if completedErr != nil {
		log.Printf("⚠️ Failed to update execution status to completed in database: %v", completedErr)
	} else {
		log.Printf("✅ Execution completed and updated in database: %s", executionID)
	}

	log.Printf("✅ Async execution completed: %s", executionID)
}

// loadAgentEffectiveContext loads the agent's effective context from the database
func (s *Server) loadAgentEffectiveContext(ctx context.Context, userID, agentID string) (string, error) {
	// Query the agent's effective context from database
	query := `SELECT effective_context FROM agents WHERE id = ? AND user_id = ?`
	var effectiveContext sql.NullString

	err := s.client.GetDB().QueryRowContext(ctx, query, agentID, userID).Scan(&effectiveContext)
	if err != nil {
		return "", fmt.Errorf("failed to load agent effective context: %w", err)
	}

	if effectiveContext.Valid {
		return effectiveContext.String, nil
	}

	return "", nil // No effective context set
}

// markExecutionFailed marks an execution as failed in database
func (s *Server) markExecutionFailed(executionID, userID, errorMessage string) {
	ctx := context.Background()
	failedErr := s.client.UpdateExecutionRunStatus(ctx, userID, executionID, "failed", errorMessage)
	if failedErr != nil {
		log.Printf("⚠️ Failed to update execution status to failed in database: %v", failedErr)
	} else {
		log.Printf("❌ Execution marked as failed in database: %s - %s", executionID, errorMessage)
	}
}

// Periodic cleanup removed - using database-based status tracking

// executionStatusHandler handles execution status requests using database-only tracking
func (s *Server) executionStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract user ID for all subsequent operations
	userID, err := s.getUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract execution ID from URL path
	// URL format: /api/execution-runs/status/{execution-id}
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

	log.Printf("🔍 Database-based status lookup for execution ID: %s", executionID)

	ctx := context.Background()

	// Get execution run from database (works across all pods)
	executionRun, err := s.client.GetExecutionRun(ctx, userID, executionID)
	if err != nil {
		log.Printf("❌ Execution %s not found in database: %v", executionID, err)
		response := map[string]interface{}{
			"status": "not_found",
			"error":  "Execution not found",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	log.Printf("✅ Found execution %s in database with status: %s", executionID, executionRun.Status)

	// Build response based on execution status
	response := map[string]interface{}{
		"id":     executionRun.ID,
		"status": executionRun.Status,
	}

	// Add error message if execution failed
	if executionRun.Status == "failed" && executionRun.ErrorMessage != "" {
		response["error"] = executionRun.ErrorMessage
	}

	// For completed executions, include the full result
	if executionRun.Status == "completed" {
		log.Printf("🔍 Getting execution result for completed execution: %s", executionID)

		executionResult, resultErr := s.client.GetExecutionResult(ctx, userID, executionID)
		if resultErr == nil {
			log.Printf("✅ Successfully retrieved execution result for: %s", executionID)
			response["result"] = executionResult
		} else {
			log.Printf("⚠️ Failed to get execution result for %s: %v", executionID, resultErr)
			// Still return completed status, but without detailed result
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// configurationsHandler handles API configuration requests
func (s *Server) configurationsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.listConfigurations(w, r)
	case http.MethodPost:
		s.createConfiguration(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// configurationByIDHandler handles individual configuration operations
func (s *Server) configurationByIDHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPut:
		s.updateConfiguration(w, r)
	case http.MethodDelete:
		s.deleteConfiguration(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) listConfigurations(w http.ResponseWriter, r *http.Request) {
	userID, err := s.getUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := context.Background()

	// Get user configurations
	userConfigs, err := s.client.ListAPIConfigurationsByUser(ctx, userID, 50, 0)
	if err != nil {
		log.Printf("⚠️ Failed to load user configurations from DB: %v", err)
		http.Error(w, "Failed to load configurations", http.StatusInternalServerError)
		return
	}

	// Get system configurations using dedicated query
	systemConfigs, err := s.client.GetSystemConfigurations(ctx)
	if err != nil {
		log.Printf("⚠️ Failed to load system configurations from DB: %v", err)
		// Don't fail the request, just log the error and continue with user configs only
		systemConfigs = []types.APIConfiguration{}
	}

	// With the new schema, configurations are already unique - no deduplication needed
	// Simply combine user and system configurations
	allConfigs := append(userConfigs, systemConfigs...)

	log.Printf("📋 Returning configurations for user %s: %d user configs, %d system configs, %d total",
		userID, len(userConfigs), len(systemConfigs), len(allConfigs))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(allConfigs)
}

func (s *Server) createConfiguration(w http.ResponseWriter, r *http.Request) {
	userID, err := s.getUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var configData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&configData); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Create configuration object
	temp := getFloat32FromMap(configData, "temperature")
	maxTokens := getInt32FromMap(configData, "maxTokens")
	topP := getFloat32FromMap(configData, "topP")
	topK := getInt32FromMap(configData, "topK")

	config := &types.APIConfiguration{
		ID:            getStringFromMap(configData, "id"),
		VariationName: getStringFromMap(configData, "variationName"),
		ModelName:     getStringFromMap(configData, "modelName"),
		SystemPrompt:  getStringFromMap(configData, "systemPrompt"),
		Temperature:   &temp,
		MaxTokens:     &maxTokens,
		TopP:          &topP,
		TopK:          &topK,
	}

	ctx := context.Background()
	err = s.client.CreateAPIConfiguration(ctx, userID, config)
	if err != nil {
		log.Printf("❌ Failed to create configuration: %v", err)
		http.Error(w, "Failed to create configuration", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(config)
}

func (s *Server) updateConfiguration(w http.ResponseWriter, r *http.Request) {
	userID, err := s.getUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

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

	// Create configuration object
	temp := getFloat32FromMap(configData, "temperature")
	maxTokens := getInt32FromMap(configData, "maxTokens")
	topP := getFloat32FromMap(configData, "topP")
	topK := getInt32FromMap(configData, "topK")

	config := &types.APIConfiguration{
		ID:            configID,
		VariationName: getStringFromMap(configData, "variationName"),
		ModelName:     getStringFromMap(configData, "modelName"),
		SystemPrompt:  getStringFromMap(configData, "systemPrompt"),
		Temperature:   &temp,
		MaxTokens:     &maxTokens,
		TopP:          &topP,
		TopK:          &topK,
	}

	ctx := context.Background()
	err = s.client.UpdateAPIConfiguration(ctx, userID, config)
	if err != nil {
		log.Printf("❌ Failed to update configuration: %v", err)
		http.Error(w, "Failed to update configuration", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

func (s *Server) deleteConfiguration(w http.ResponseWriter, r *http.Request) {
	userID, err := s.getUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/configurations/")
	configID := strings.Split(path, "/")[0]

	if configID == "" {
		http.Error(w, "Configuration ID required", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	err = s.client.DeleteAPIConfiguration(ctx, configID, userID)
	if err != nil {
		log.Printf("❌ Failed to delete configuration: %v", err)
		http.Error(w, "Failed to delete configuration", http.StatusInternalServerError)
		return
	}

	// Return success response
	result := map[string]interface{}{
		"message": fmt.Sprintf("Configuration %s deleted successfully", configID),
		"success": true,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// Mock execution for when API key is not available
func (s *Server) executeMockVariation(ctx context.Context, request *types.MultiExecutionRequest) *types.ExecutionResult {
	executionRun := types.ExecutionRun{
		ID:          fmt.Sprintf("mock-%d", time.Now().UnixNano()%1000000),
		Name:        request.ExecutionRunName,
		Description: request.Description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	results := make([]types.VariationResult, 0, len(request.Configurations))
	startTime := time.Now()

	for i, config := range request.Configurations {
		// Simulate realistic delay
		time.Sleep(time.Duration(200+i*50) * time.Millisecond)

		responseText := s.generateMockResponse(request.BasePrompt, config)
		responseTime := int32(200 + i*50)

		apiRequest := types.APIRequest{
			ID:              fmt.Sprintf("req-%d", time.Now().UnixNano()%1000000),
			ExecutionRunID:  executionRun.ID,
			ConfigurationID: config.ID,
			RequestType:     "generate",
			Prompt:          request.BasePrompt,
			Context:         request.Context,
			CreatedAt:       time.Now(),
		}

		apiResponse := types.APIResponse{
			ID:             fmt.Sprintf("resp-%d", time.Now().UnixNano()%1000000),
			RequestID:      apiRequest.ID,
			ResponseStatus: "success",
			ResponseText:   responseText,
			FinishReason:   "stop",
			ResponseTimeMs: int64(responseTime),
			UsageMetadata: map[string]interface{}{
				"prompt_tokens":     int32(len(request.BasePrompt) / 4),
				"completion_tokens": int32(len(responseText) / 4),
				"total_tokens":      int32((len(request.BasePrompt) + len(responseText)) / 4),
			},
			CreatedAt: time.Now(),
		}

		variationResult := types.VariationResult{
			Configuration: config,
			Request:       apiRequest,
			Response:      apiResponse,
			ExecutionTime: int64(responseTime), // Already in milliseconds
		}

		results = append(results, variationResult)
	}

	totalTime := time.Since(startTime)

	result := &types.ExecutionResult{
		ExecutionRun: executionRun,
		Results:      results,
		TotalTime:    totalTime.Milliseconds(),
		SuccessCount: len(results),
		ErrorCount:   0,
	}

	// Always perform comparison for better user experience (like real execution)
	var fastest *types.VariationResult
	for i := range results {
		if fastest == nil || results[i].Response.ResponseTimeMs < fastest.Response.ResponseTimeMs {
			fastest = &results[i]
		}
	}

	if fastest != nil {
		// Store all configurations for reference
		var allConfigs []types.APIConfiguration
		for _, r := range results {
			allConfigs = append(allConfigs, r.Configuration)
		}

		result.Comparison = &types.ComparisonResult{
			ID:                  fmt.Sprintf("comp-%d", time.Now().UnixNano()%1000000),
			ExecutionRunID:      executionRun.ID,
			ComparisonType:      "performance",
			MetricName:          "response_time",
			BestConfigurationID: fastest.Configuration.ID,
			BestConfiguration:   &fastest.Configuration,
			AllConfigurations:   allConfigs,
			AnalysisNotes:       fmt.Sprintf("Fastest response: %dms with variation '%s'", fastest.Response.ResponseTimeMs, fastest.Configuration.VariationName),
			CreatedAt:           time.Now(),
		}
	}

	return result
}

func (s *Server) generateMockResponse(prompt string, config types.APIConfiguration) string {
	responses := map[string]string{
		"creative":     "🎨 [MOCK Creative Response] " + prompt + " - This creative variation emphasizes artistic expression with vivid imagery and imaginative storytelling elements.",
		"analytical":   "🔍 [MOCK Analytical Response] " + prompt + " - This analytical variation provides structured, logical analysis with clear reasoning and factual information.",
		"balanced":     "⚖️ [MOCK Balanced Response] " + prompt + " - This balanced variation offers a well-rounded perspective combining creativity with analytical thinking.",
		"conservative": "📊 [MOCK Conservative Response] " + prompt + " - This conservative variation focuses on precision, accuracy, and measured responses.",
		"experimental": "🚀 [MOCK Experimental Response] " + prompt + " - This experimental variation takes bold creative risks with unconventional approaches.",
	}

	// Determine response style based on variation name or temperature
	for key, response := range responses {
		if containsSubstring(config.VariationName, key) {
			return response
		}
	}

	// Default based on temperature
	if config.Temperature != nil {
		if *config.Temperature < 0.3 {
			return responses["conservative"]
		} else if *config.Temperature > 0.7 {
			return responses["creative"]
		}
	}

	return responses["balanced"]
}

func containsSubstring(text, substr string) bool {
	return len(text) >= len(substr) &&
		(text == substr ||
			(len(text) > len(substr) &&
				(stringContains(text, substr))))
}

func stringContains(text, substr string) bool {
	for i := 0; i <= len(text)-len(substr); i++ {
		if text[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// Get specific execution run endpoint
func (s *Server) getSpecificExecutionRun(w http.ResponseWriter, r *http.Request, runID string) {
	ctx := context.Background()

	log.Printf("📊 Getting REAL execution data for run: %s", runID)

	// Now using database UUIDs directly, no mapping needed
	realExecutionRunID := runID

	// If this looks like a legacy temporary ID, try to find by timestamp (backward compatibility)
	if strings.HasPrefix(runID, "exec-") {
		log.Printf("🔍 Legacy temporary ID detected, attempting to find by recent executions: %s", runID)
		userID, err := s.getUserID(r)
		if err == nil && s.client != nil {
			// Get recent execution runs (last 10) and find the most recent one
			recentRuns, err := s.client.ListExecutionRuns(ctx, userID, 10, 0)
			if err == nil && len(recentRuns) > 0 {
				// Use the most recent execution run as a fallback
				realExecutionRunID = recentRuns[0].ID
				log.Printf("🎯 Using most recent execution run as fallback: %s", realExecutionRunID)
			}
		}
	}

	// Try to get REAL execution result from database
	if s.client != nil {
		userID, err := s.getUserID(r)
		if err != nil {
			log.Printf("❌ Failed to get user ID for execution run lookup: %v", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		executionResult, err := s.client.GetExecutionResult(ctx, userID, realExecutionRunID)
		if err == nil && executionResult != nil {
			log.Printf("✅ Found REAL execution data with %d results", len(executionResult.Results))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(executionResult)
			return
		}
		log.Printf("⚠️ Failed to get real execution result for %s (real ID: %s): %v", runID, realExecutionRunID, err)
	}

	// Fallback: Check if the execution run exists in the database
	if s.client != nil {
		userID, err := s.getUserID(r)
		if err != nil {
			log.Printf("❌ Failed to get user ID for execution run lookup: %v", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		executionRun, err := s.client.GetExecutionRun(context.Background(), userID, realExecutionRunID)
		if err == nil && executionRun != nil {
			log.Printf("📋 Found execution run but no detailed results, creating mock data based on real run")
			mockResult := s.createMockExecutionResult(executionRun)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(mockResult)
			return
		}
		log.Printf("❌ Execution run %s not found in database: %v", runID, err)
	}

	log.Printf("🎭 Creating generic mock data for run: %s", runID)
	// Last resort: Create generic mock data
	mockResult := s.createGenericMockExecutionResult(runID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(mockResult)
}

// Delete execution run endpoint
func (s *Server) deleteExecutionRun(w http.ResponseWriter, r *http.Request, runID string) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// For now, just return success (no actual deletion in mock mode)
	response := map[string]string{
		"message": fmt.Sprintf("Execution run %s deleted successfully", runID),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Handle execution runs with different HTTP methods
func (s *Server) executionRunsHandler(w http.ResponseWriter, r *http.Request) {
	// Check if this is a request for a specific run (e.g., /api/execution-runs/run-1)
	path := r.URL.Path
	if path != "/api/execution-runs" && len(path) > len("/api/execution-runs/") {
		// Extract run ID from path
		runID := path[len("/api/execution-runs/"):]

		switch r.Method {
		case http.MethodGet:
			s.getSpecificExecutionRun(w, r, runID)
		case http.MethodDelete:
			s.deleteExecutionRun(w, r, runID)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	// Handle requests to /api/execution-runs (no specific ID)
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse query parameters for limit/offset
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := int32(10) // default limit
	offset := int32(0) // default offset

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

	// Get real execution runs from database
	ctx := context.Background()
	userID, err := s.getUserID(r)
	if err != nil {
		log.Printf("❌ Failed to get user ID for execution runs listing: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	executionRuns, err := s.client.ListExecutionRuns(ctx, userID, limit, offset)
	if err != nil {
		log.Printf("Failed to list execution runs: %v", err)
		// Fall back to mock data if database fails
		mockRuns := []types.ExecutionRun{
			{
				ID:          "run-1",
				Name:        "creative-writing-test",
				Description: "Testing different temperature settings for creative writing",
				CreatedAt:   time.Now().Add(-2 * time.Hour),
				UpdatedAt:   time.Now().Add(-2 * time.Hour),
			},
			{
				ID:          "run-2",
				Name:        "analytical-comparison",
				Description: "Comparing analytical vs creative responses",
				CreatedAt:   time.Now().Add(-1 * time.Hour),
				UpdatedAt:   time.Now().Add(-1 * time.Hour),
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mockRuns)
		return
	}

	// Convert to the format expected by frontend (slice of values not pointers)
	var runs []types.ExecutionRun
	for _, run := range executionRuns {
		runs = append(runs, *run)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(runs)
}

// Database table data endpoint
func (s *Server) databaseTableDataHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract table name from path /api/database/tables/{tableName}
	path := r.URL.Path
	if len(path) <= len("/api/database/tables/") {
		http.Error(w, "Table name required", http.StatusBadRequest)
		return
	}

	tableName := path[len("/api/database/tables/"):]

	// Get query parameters for pagination
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 100 // default limit
	offset := 0  // default offset

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// Query real database data based on table name
	var tableData interface{}

	if s.client != nil {
		userID, err := s.getUserID(r)
		if err != nil {
			log.Printf("❌ Failed to get user ID for database table data lookup: %v", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		switch tableName {
		case "execution_runs":
			// Query real execution runs from database
			runs, err := s.client.ListExecutionRuns(context.Background(), userID, int32(limit), int32(offset))
			if err != nil {
				log.Printf("Error querying execution_runs: %v", err)
				http.Error(w, "Database query failed", http.StatusInternalServerError)
				return
			}

			// Convert to table format
			rows := make([][]interface{}, len(runs))
			for i, run := range runs {
				rows[i] = []interface{}{
					run.ID,
					run.Name,
					run.Description,
					run.CreatedAt.Format(time.RFC3339),
					run.UpdatedAt.Format(time.RFC3339),
				}
			}

			tableData = map[string]interface{}{
				"tableName": "execution_runs",
				"columns":   []string{"id", "name", "description", "created_at", "updated_at"},
				"rows":      rows,
				"totalRows": len(rows),
			}

		case "api_configurations":
			// Query real API configurations for user's execution runs
			query := `
				SELECT ac.id, ac.execution_run_id, ac.variation_name, ac.model_name, 
				       ac.system_prompt, ac.temperature, ac.max_tokens, ac.top_p, ac.top_k, ac.created_at
				FROM api_configurations ac
				INNER JOIN execution_runs er ON ac.execution_run_id = er.id
				WHERE er.user_id = ?
				ORDER BY ac.created_at DESC
				LIMIT ?
			`

			dbRows, err := s.client.GetDB().QueryContext(context.Background(), query, userID, limit)
			if err != nil {
				log.Printf("Error querying api_configurations: %v", err)
				http.Error(w, "Database query failed", http.StatusInternalServerError)
				return
			}
			defer dbRows.Close()

			var rows [][]interface{}
			for dbRows.Next() {
				var id, executionRunID, variationName, modelName, systemPrompt string
				var temperature, topP sql.NullFloat64
				var maxTokens, topK sql.NullInt32
				var createdAt time.Time

				err := dbRows.Scan(&id, &executionRunID, &variationName, &modelName,
					&systemPrompt, &temperature, &maxTokens, &topP, &topK, &createdAt)
				if err != nil {
					log.Printf("Error scanning api_configurations row: %v", err)
					continue
				}

				// Format nullable values
				tempStr := ""
				if temperature.Valid {
					tempStr = fmt.Sprintf("%.2f", temperature.Float64)
				}
				maxTokensStr := ""
				if maxTokens.Valid {
					maxTokensStr = fmt.Sprintf("%d", maxTokens.Int32)
				}
				topPStr := ""
				if topP.Valid {
					topPStr = fmt.Sprintf("%.2f", topP.Float64)
				}
				topKStr := ""
				if topK.Valid {
					topKStr = fmt.Sprintf("%d", topK.Int32)
				}

				row := []interface{}{
					id, executionRunID, variationName, modelName, systemPrompt,
					tempStr, maxTokensStr, topPStr, topKStr, createdAt.Format(time.RFC3339),
				}
				rows = append(rows, row)
			}

			tableData = map[string]interface{}{
				"tableName": "api_configurations",
				"columns":   []string{"id", "execution_run_id", "variation_name", "model_name", "system_prompt", "temperature", "max_tokens", "top_p", "top_k", "created_at"},
				"rows":      rows,
				"totalRows": len(rows),
			}

		case "api_requests":
			// Query real API requests for user's execution runs
			query := `
				SELECT ar.id, ar.execution_run_id, ar.configuration_id, ar.request_type, 
				       ar.prompt, ar.context, ar.function_name, ar.created_at
				FROM api_requests ar
				INNER JOIN execution_runs er ON ar.execution_run_id = er.id
				WHERE er.user_id = ?
				ORDER BY ar.created_at DESC
				LIMIT ?
			`

			dbRows, err := s.client.GetDB().QueryContext(context.Background(), query, userID, limit)
			if err != nil {
				log.Printf("Error querying api_requests: %v", err)
				http.Error(w, "Database query failed", http.StatusInternalServerError)
				return
			}
			defer dbRows.Close()

			var rows [][]interface{}
			for dbRows.Next() {
				var id, executionRunID, configurationID, requestType, prompt string
				var context, functionName sql.NullString
				var createdAt time.Time

				err := dbRows.Scan(&id, &executionRunID, &configurationID, &requestType,
					&prompt, &context, &functionName, &createdAt)
				if err != nil {
					log.Printf("Error scanning api_requests row: %v", err)
					continue
				}

				// Format nullable values
				contextStr := ""
				if context.Valid {
					contextStr = context.String
					if len(contextStr) > 100 {
						contextStr = contextStr[:100] + "..."
					}
				}
				functionNameStr := ""
				if functionName.Valid {
					functionNameStr = functionName.String
				}

				// Truncate long prompts for display
				promptDisplay := prompt
				if len(promptDisplay) > 100 {
					promptDisplay = promptDisplay[:100] + "..."
				}

				row := []interface{}{
					id, executionRunID, configurationID, requestType,
					promptDisplay, contextStr, functionNameStr, createdAt.Format(time.RFC3339),
				}
				rows = append(rows, row)
			}

			tableData = map[string]interface{}{
				"tableName": "api_requests",
				"columns":   []string{"id", "execution_run_id", "configuration_id", "request_type", "prompt", "context", "function_name", "created_at"},
				"rows":      rows,
				"totalRows": len(rows),
			}

		case "api_responses":
			// Query real API responses for user's requests
			query := `
				SELECT resp.id, resp.request_id, resp.response_status, resp.response_text, 
				       resp.finish_reason, resp.error_message, resp.response_time_ms, 
				       resp.usage_metadata, resp.created_at
				FROM api_responses resp
				INNER JOIN api_requests req ON resp.request_id = req.id
				INNER JOIN execution_runs er ON req.execution_run_id = er.id
				WHERE er.user_id = ?
				ORDER BY resp.created_at DESC
				LIMIT ?
			`

			dbRows, err := s.client.GetDB().QueryContext(context.Background(), query, userID, limit)
			if err != nil {
				log.Printf("Error querying api_responses: %v", err)
				http.Error(w, "Database query failed", http.StatusInternalServerError)
				return
			}
			defer dbRows.Close()

			var rows [][]interface{}
			for dbRows.Next() {
				var id, requestID, responseStatus, responseText string
				var finishReason, errorMessage sql.NullString
				var responseTimeMs sql.NullInt32
				var usageMetadata []byte
				var createdAt time.Time

				err := dbRows.Scan(&id, &requestID, &responseStatus, &responseText,
					&finishReason, &errorMessage, &responseTimeMs, &usageMetadata, &createdAt)
				if err != nil {
					log.Printf("Error scanning api_responses row: %v", err)
					continue
				}

				// Format nullable values
				finishReasonStr := ""
				if finishReason.Valid {
					finishReasonStr = finishReason.String
				}
				errorMessageStr := ""
				if errorMessage.Valid {
					errorMessageStr = errorMessage.String
				}
				responseTimeStr := ""
				if responseTimeMs.Valid {
					responseTimeStr = fmt.Sprintf("%d ms", responseTimeMs.Int32)
				}

				// Truncate long response text for display
				responseDisplay := responseText
				if len(responseDisplay) > 100 {
					responseDisplay = responseDisplay[:100] + "..."
				}

				// Truncate usage metadata for display
				usageStr := string(usageMetadata)
				if len(usageStr) > 100 {
					usageStr = usageStr[:100] + "..."
				}

				row := []interface{}{
					id, requestID, responseStatus, responseDisplay, finishReasonStr,
					errorMessageStr, responseTimeStr, usageStr, createdAt.Format(time.RFC3339),
				}
				rows = append(rows, row)
			}

			tableData = map[string]interface{}{
				"tableName": "api_responses",
				"columns":   []string{"id", "request_id", "response_status", "response_text", "finish_reason", "error_message", "response_time_ms", "usage_metadata", "created_at"},
				"rows":      rows,
				"totalRows": len(rows),
			}

		case "comparison_results":
			// Query real comparison results for user's execution runs
			query := `
				SELECT cr.id, cr.execution_run_id, cr.comparison_type, cr.metric_name, 
				       cr.best_configuration_id, cr.created_at
				FROM comparison_results cr
				INNER JOIN execution_runs er ON cr.execution_run_id = er.id
				WHERE er.user_id = ?
				ORDER BY cr.created_at DESC
				LIMIT ?
			`

			dbRows, err := s.client.GetDB().QueryContext(context.Background(), query, userID, limit)
			if err != nil {
				log.Printf("Error querying comparison_results: %v", err)
				http.Error(w, "Database query failed", http.StatusInternalServerError)
				return
			}
			defer dbRows.Close()

			var rows [][]interface{}
			for dbRows.Next() {
				var id, executionRunID, comparisonType, metricName, bestConfigurationID string
				var createdAt time.Time

				err := dbRows.Scan(&id, &executionRunID, &comparisonType, &metricName,
					&bestConfigurationID, &createdAt)
				if err != nil {
					log.Printf("Error scanning comparison_results row: %v", err)
					continue
				}

				row := []interface{}{
					id, executionRunID, comparisonType, metricName,
					bestConfigurationID, createdAt.Format(time.RFC3339),
				}
				rows = append(rows, row)
			}

			tableData = map[string]interface{}{
				"tableName": "comparison_results",
				"columns":   []string{"id", "execution_run_id", "comparison_type", "metric_name", "best_configuration_id", "created_at"},
				"rows":      rows,
				"totalRows": len(rows),
			}

		case "function_calls":
			// Query function calls for user's execution runs
			query := `
				SELECT fc.id, fc.request_id, fc.function_name, fc.function_arguments, 
				       fc.function_response, fc.execution_status, fc.execution_time_ms, 
				       fc.error_details, fc.created_at
				FROM function_calls fc 
				INNER JOIN api_requests req ON fc.request_id = req.id
				INNER JOIN execution_runs er ON req.execution_run_id = er.id
				WHERE er.user_id = ?
				ORDER BY fc.created_at DESC 
				LIMIT ?
			`

			dbRows, err := s.client.GetDB().QueryContext(context.Background(), query, userID, limit)
			if err != nil {
				log.Printf("Error querying function_calls: %v", err)
				http.Error(w, "Database query failed", http.StatusInternalServerError)
				return
			}
			defer dbRows.Close()

			var rows [][]interface{}
			for dbRows.Next() {
				var id, requestID, functionName, executionStatus string
				var errorDetails sql.NullString
				var functionArgs, functionResponse []byte
				var executionTimeMs sql.NullInt32
				var createdAt time.Time

				err := dbRows.Scan(&id, &requestID, &functionName, &functionArgs,
					&functionResponse, &executionStatus, &executionTimeMs, &errorDetails, &createdAt)
				if err != nil {
					log.Printf("Error scanning function_calls row: %v", err)
					continue
				}

				// Convert execution time to display format
				var execTimeStr string
				if executionTimeMs.Valid {
					execTimeStr = fmt.Sprintf("%d ms", executionTimeMs.Int32)
				} else {
					execTimeStr = ""
				}

				// Convert error details to display format
				var errorDetailsStr string
				if errorDetails.Valid {
					errorDetailsStr = errorDetails.String
				} else {
					errorDetailsStr = ""
				}

				// Truncate long JSON for display
				argsStr := string(functionArgs)
				if len(argsStr) > 100 {
					argsStr = argsStr[:100] + "..."
				}
				responseStr := string(functionResponse)
				if len(responseStr) > 100 {
					responseStr = responseStr[:100] + "..."
				}

				row := []interface{}{
					id,
					requestID,
					functionName,
					argsStr,
					responseStr,
					executionStatus,
					execTimeStr,
					errorDetailsStr,
					createdAt.Format(time.RFC3339),
				}
				rows = append(rows, row)
			}

			tableData = map[string]interface{}{
				"tableName": "function_calls",
				"columns": []string{
					"id", "request_id", "function_name", "function_arguments",
					"function_response", "execution_status", "execution_time_ms",
					"error_details", "created_at",
				},
				"rows":      rows,
				"totalRows": len(rows),
			}

		case "execution_logs":
			// Query execution logs for user's execution runs
			query := `
				SELECT el.id, el.execution_run_id, el.configuration_id, el.request_id,
				       el.log_level, el.log_category, el.message, 
				       COALESCE(el.details, JSON_OBJECT()) as details,
				       el.timestamp, el.sequence_number, el.duration_ms
				FROM execution_logs el
				INNER JOIN execution_runs er ON el.execution_run_id = er.id
				WHERE er.user_id = ?
				ORDER BY el.timestamp DESC
				LIMIT ?
			`

			dbRows, err := s.client.GetDB().QueryContext(context.Background(), query, userID, limit)
			if err != nil {
				log.Printf("Error querying execution_logs: %v", err)
				http.Error(w, "Database query failed", http.StatusInternalServerError)
				return
			}
			defer dbRows.Close()

			var rows [][]interface{}
			for dbRows.Next() {
				var id, executionRunID, logLevel, logCategory, message string
				var configurationID, requestID sql.NullString
				var details []byte
				var timestamp time.Time
				var sequenceNumber, durationMs sql.NullInt32

				err := dbRows.Scan(&id, &executionRunID, &configurationID, &requestID,
					&logLevel, &logCategory, &message, &details, &timestamp,
					&sequenceNumber, &durationMs)
				if err != nil {
					log.Printf("Error scanning execution_logs row: %v", err)
					continue
				}

				// Format nullable values
				configIDStr := ""
				if configurationID.Valid {
					configIDStr = configurationID.String
				}
				requestIDStr := ""
				if requestID.Valid {
					requestIDStr = requestID.String
				}
				seqNumStr := ""
				if sequenceNumber.Valid {
					seqNumStr = fmt.Sprintf("%d", sequenceNumber.Int32)
				}
				durationStr := ""
				if durationMs.Valid {
					durationStr = fmt.Sprintf("%d ms", durationMs.Int32)
				}

				// Truncate long message for display
				messageDisplay := message
				if len(messageDisplay) > 100 {
					messageDisplay = messageDisplay[:100] + "..."
				}

				// Truncate details for display
				detailsStr := string(details)
				if len(detailsStr) > 100 {
					detailsStr = detailsStr[:100] + "..."
				}

				row := []interface{}{
					id, executionRunID, configIDStr, requestIDStr, logLevel,
					logCategory, messageDisplay, detailsStr, timestamp.Format(time.RFC3339),
					seqNumStr, durationStr,
				}
				rows = append(rows, row)
			}

			tableData = map[string]interface{}{
				"tableName": "execution_logs",
				"columns": []string{
					"id", "execution_run_id", "configuration_id", "request_id", "log_level",
					"log_category", "message", "details", "timestamp", "sequence_number", "duration_ms",
				},
				"rows":      rows,
				"totalRows": len(rows),
			}

		case "function_definitions":
			// Query function definitions (both user and system functions)
			query := `
				SELECT fd.id, fd.user_id, fd.name, fd.display_name, fd.function_group,
				       fd.description, fd.endpoint_url, fd.http_method, 
				       fd.is_active, fd.is_system_resource, fd.created_at, fd.updated_at
				FROM function_definitions fd
				WHERE (fd.user_id = ? OR fd.user_id = 'system') AND fd.is_active = true
				ORDER BY fd.display_name ASC
				LIMIT ?
			`

			dbRows, err := s.client.GetDB().QueryContext(context.Background(), query, userID, limit)
			if err != nil {
				log.Printf("Error querying function_definitions: %v", err)
				http.Error(w, "Database query failed", http.StatusInternalServerError)
				return
			}
			defer dbRows.Close()

			var rows [][]interface{}
			for dbRows.Next() {
				var id, userID, name, displayName, functionGroup string
				var description, endpointURL, httpMethod sql.NullString
				var isActive, isSystemResource sql.NullBool
				var createdAt, updatedAt time.Time

				err := dbRows.Scan(&id, &userID, &name, &displayName, &functionGroup,
					&description, &endpointURL, &httpMethod, &isActive, &isSystemResource,
					&createdAt, &updatedAt)
				if err != nil {
					log.Printf("Error scanning function_definitions row: %v", err)
					continue
				}

				// Format nullable values
				descStr := ""
				if description.Valid {
					descStr = description.String
					if len(descStr) > 80 {
						descStr = descStr[:80] + "..."
					}
				}
				endpointStr := ""
				if endpointURL.Valid {
					endpointStr = endpointURL.String
				}
				methodStr := ""
				if httpMethod.Valid {
					methodStr = httpMethod.String
				}
				activeStr := "false"
				if isActive.Valid && isActive.Bool {
					activeStr = "true"
				}
				systemStr := "false"
				if isSystemResource.Valid && isSystemResource.Bool {
					systemStr = "true"
				}

				// Determine the owner type
				ownerType := "user"
				if userID == "system" {
					ownerType = "system"
				}

				row := []interface{}{
					id, ownerType, name, displayName, functionGroup, descStr,
					endpointStr, methodStr, activeStr, systemStr,
					createdAt.Format(time.RFC3339), updatedAt.Format(time.RFC3339),
				}
				rows = append(rows, row)
			}

			tableData = map[string]interface{}{
				"tableName": "function_definitions",
				"columns": []string{
					"id", "owner_type", "name", "display_name", "function_group", "description",
					"endpoint_url", "http_method", "is_active", "is_system_resource", "created_at", "updated_at",
				},
				"rows":      rows,
				"totalRows": len(rows),
			}

		default:
			// For other tables, return a placeholder
			tableData = map[string]interface{}{
				"tableName": tableName,
				"columns":   []string{"id", "data", "created_at"},
				"rows": [][]interface{}{
					{"1", "Real data for " + tableName + " (table not fully implemented)", time.Now().Format(time.RFC3339)},
				},
				"totalRows": 1,
			}
		}
	} else {
		// Fallback to mock data if client is not available
		switch tableName {
		case "execution_runs":
			tableData = map[string]interface{}{
				"tableName": "execution_runs",
				"columns":   []string{"id", "name", "description", "created_at", "updated_at"},
				"rows": [][]interface{}{
					{"run-1", "creative-writing-test", "Testing different temperature settings", "2025-07-24T11:00:00Z", "2025-07-24T11:00:00Z"},
					{"run-2", "analytical-comparison", "Comparing analytical vs creative responses", "2025-07-24T12:00:00Z", "2025-07-24T12:00:00Z"},
				},
				"totalRows": 2,
			}
		default:
			tableData = map[string]interface{}{
				"tableName": tableName,
				"columns":   []string{"id", "data", "created_at"},
				"rows": [][]interface{}{
					{"1", "Mock data for " + tableName, "2025-07-24T10:00:00Z"},
				},
				"totalRows": 1,
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tableData)
}

// Database stats endpoint
func (s *Server) databaseStatsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID for scoping data
	userID, err := s.getUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := context.Background()

	// Get real user-scoped statistics from database
	stats, err := s.getUserDatabaseStats(ctx, userID)
	if err != nil {
		log.Printf("❌ Failed to get user database stats: %v", err)
		// Fallback to empty stats if database query fails
		stats = map[string]interface{}{
			"totalExecutionRuns": 0,
			"totalApiRequests":   0,
			"totalApiResponses":  0,
			"totalFunctionCalls": 0,
			"avgResponseTime":    0.0,
			"successRate":        0.0,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// getUserDatabaseStats gets user-specific database statistics
func (s *Server) getUserDatabaseStats(ctx context.Context, userID string) (map[string]interface{}, error) {
	db := s.client.GetDB()

	// Count execution runs for this user
	var totalExecutionRuns int32
	err := db.QueryRowContext(ctx, `
		SELECT COALESCE(COUNT(*), 0) FROM execution_runs 
		WHERE user_id = ?
	`, userID).Scan(&totalExecutionRuns)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to count execution runs: %w", err)
	}

	// Count API requests for this user's execution runs
	var totalApiRequests int32
	err = db.QueryRowContext(ctx, `
		SELECT COALESCE(COUNT(*), 0) FROM api_requests ar 
		INNER JOIN execution_runs er ON ar.execution_run_id = er.id 
		WHERE er.user_id = ?
	`, userID).Scan(&totalApiRequests)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to count API requests: %w", err)
	}

	// Count API responses for this user's requests
	var totalApiResponses int32
	err = db.QueryRowContext(ctx, `
		SELECT COALESCE(COUNT(*), 0) FROM api_responses resp 
		INNER JOIN api_requests req ON resp.request_id = req.id 
		INNER JOIN execution_runs er ON req.execution_run_id = er.id 
		WHERE er.user_id = ?
	`, userID).Scan(&totalApiResponses)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to count API responses: %w", err)
	}

	// Count function calls for this user's execution runs
	var totalFunctionCalls int32
	err = db.QueryRowContext(ctx, `
		SELECT COALESCE(COUNT(*), 0) FROM function_calls fc 
		INNER JOIN api_requests ar ON fc.request_id = ar.id
		INNER JOIN execution_runs er ON ar.execution_run_id = er.id 
		WHERE er.user_id = ?
	`, userID).Scan(&totalFunctionCalls)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to count function calls: %w", err)
	}

	// Calculate average response time for this user
	var avgResponseTime float64
	err = db.QueryRowContext(ctx, `
		SELECT COALESCE(AVG(resp.response_time_ms), 0) FROM api_responses resp 
		INNER JOIN api_requests req ON resp.request_id = req.id 
		INNER JOIN execution_runs er ON req.execution_run_id = er.id 
		WHERE er.user_id = ? AND resp.response_time_ms IS NOT NULL
	`, userID).Scan(&avgResponseTime)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to calculate average response time: %w", err)
	}

	// Calculate success rate for this user
	var successRate float64
	var successCount, totalCount int

	err = db.QueryRowContext(ctx, `
		SELECT 
			COALESCE(SUM(CASE WHEN resp.response_status = 'success' THEN 1 ELSE 0 END), 0) as success_count,
			COALESCE(COUNT(resp.id), 0) as total_count
		FROM execution_runs er
		LEFT JOIN api_requests req ON req.execution_run_id = er.id 
		LEFT JOIN api_responses resp ON resp.request_id = req.id 
		WHERE er.user_id = ?
	`, userID).Scan(&successCount, &totalCount)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to calculate success rate: %w", err)
	}

	if totalCount > 0 {
		successRate = float64(successCount) / float64(totalCount)
	}

	return map[string]interface{}{
		"totalExecutionRuns": totalExecutionRuns,
		"totalApiRequests":   totalApiRequests,
		"totalApiResponses":  totalApiResponses,
		"totalFunctionCalls": totalFunctionCalls,
		"avgResponseTime":    avgResponseTime,
		"successRate":        successRate,
	}, nil
}

// Database tables endpoint
func (s *Server) databaseTablesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	tables := []string{
		"execution_runs",
		"comparison_results",
		"function_calls",
		"api_configurations",
		"api_requests",
		"api_responses",
		"execution_logs",
		"function_definitions",
		"execution_function_configs",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tables)
}

// CORS middleware
func (s *Server) enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow requests from any origin
		w.Header().Set("Access-Control-Allow-Origin", "*")

		// Specify allowed methods
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")

		// Specify allowed headers
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID, X-Gemini-API-Key, X-OpenWeather-API-Key, X-Neo4j-URL, X-Neo4j-Username, X-Neo4j-Password, X-Neo4j-Database, X-Use-Mock, X-Encrypted-Gemini-API-Key, X-Encrypted-Openweather-API-Key, X-Encrypted-Neo4j-URL, X-Encrypted-Neo4j-Username, X-Encrypted-Neo4j-Password, X-Encrypted-Neo4j-Database, X-Encrypted-Github-Api-Key, X-Encrypted-Openrouter-Api-Key")

		// Allow credentials to be sent
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Pass to next handler
		next.ServeHTTP(w, r)
	})
}

// Auth middleware for API key endpoints that sets X-User-ID header
func (s *Server) apiKeyAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		token, err := auth.ExtractTokenFromHeader(authHeader)
		if err != nil {
			http.Error(w, "Invalid authorization header", http.StatusUnauthorized)
			return
		}

		// Validate token and get user
		user, err := s.authService.ValidateToken(token)
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Set X-User-ID header for API key handlers
		r.Header.Set("X-User-ID", user.ID)

		// Add user to context as well (for compatibility)
		ctx := auth.AddUserToContext(r.Context(), user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Start the HTTP server
func runServer() {
	server, err := NewServer()
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}
	defer server.Close()

	// Start HeartbeatExecutor
	if err := server.heartbeatExecutor.Start(); err != nil {
		log.Fatalf("Failed to start HeartbeatExecutor: %v", err)
	}

	// Create a new ServeMux
	mux := http.NewServeMux()

	// Auth middleware for protected routes
	authMiddleware := auth.AuthMiddleware(server.authService)

	// Set up routes - public endpoints
	mux.HandleFunc("/health", server.healthHandler)
	mux.HandleFunc("/test", server.testHandler)

	// Add graceful shutdown health endpoints (will be added after graceful wrapper is created)

	// Auth endpoints
	mux.HandleFunc("/api/auth/register", server.authHandlers.RegisterHandler)
	mux.HandleFunc("/api/auth/login", server.authHandlers.LoginHandler)
	mux.HandleFunc("/api/auth/temp-user", server.authHandlers.CreateTemporaryUserHandler)
	mux.HandleFunc("/api/auth/verify-email", server.authHandlers.VerifyEmailHandler)

	// Protected auth endpoints
	mux.Handle("/api/auth/current", authMiddleware(http.HandlerFunc(server.authHandlers.GetCurrentUserHandler)))
	mux.Handle("/api/auth/save-temp", authMiddleware(http.HandlerFunc(server.authHandlers.SaveTemporaryAccountHandler)))
	mux.Handle("/api/auth/connect-temp-account", authMiddleware(http.HandlerFunc(server.authHandlers.ConnectTemporaryAccountHandler)))

	// Protected data endpoints - require authentication
	mux.Handle("/api/execute", authMiddleware(http.HandlerFunc(server.executeHandler)))
	mux.Handle("/api/execution-runs/", authMiddleware(http.HandlerFunc(server.executionRunsHandler)))          // Note the trailing slash
	mux.Handle("/api/execution-runs/status/", authMiddleware(http.HandlerFunc(server.executionStatusHandler))) // Status endpoint
	mux.Handle("/api/execution-runs", authMiddleware(http.HandlerFunc(server.executionRunsHandler)))

	// HeartbeatExecutor monitoring endpoint
	mux.Handle("/api/heartbeat/status", authMiddleware(http.HandlerFunc(server.heartbeatStatusHandler)))

	// Protected function management endpoints
	mux.Handle("/api/functions", authMiddleware(http.HandlerFunc(server.functionsHandler)))
	mux.Handle("/api/functions/", authMiddleware(http.HandlerFunc(server.functionByIDHandler)))
	mux.Handle("/api/functions/test/", authMiddleware(http.HandlerFunc(server.testFunctionHandler)))

	// Execution flow graph endpoints
	mux.Handle("/api/execution-flow/", authMiddleware(http.HandlerFunc(server.executionFlowGraphHandler)))

	// Configuration-specific logs and flow endpoints
	mux.Handle("/api/execution-logs/", authMiddleware(http.HandlerFunc(server.executionLogsRouter)))
	mux.Handle("/api/execution-flow-by-config/", authMiddleware(http.HandlerFunc(server.executionFlowByConfigHandler)))

	// Protected configuration management endpoints
	mux.Handle("/api/configurations", authMiddleware(http.HandlerFunc(server.configurationsHandler)))
	mux.Handle("/api/configurations/", authMiddleware(http.HandlerFunc(server.configurationByIDHandler)))

	// Protected database endpoints
	mux.Handle("/api/database/stats", authMiddleware(http.HandlerFunc(server.databaseStatsHandler)))
	mux.Handle("/api/database/tables/", authMiddleware(http.HandlerFunc(server.databaseTableDataHandler))) // Specific table data
	mux.Handle("/api/database/tables", authMiddleware(http.HandlerFunc(server.databaseTablesHandler)))     // List tables

	// Protected agent management endpoints
	mux.Handle("/api/agents", authMiddleware(http.HandlerFunc(server.agentsHandler.HandleAgents)))
	mux.Handle("/api/agents/", authMiddleware(http.HandlerFunc(server.agentsHandler.HandleAgentByID)))

	// Protected team management endpoints
	mux.Handle("/api/teams", authMiddleware(http.HandlerFunc(server.teamsHandler.HandleTeams)))
	mux.Handle("/api/teams/", authMiddleware(http.HandlerFunc(server.teamsHandler.HandleTeamByID)))

	// Protected API key management endpoints
	apiKeyMux := http.NewServeMux()
	apiKeyAuthMiddleware := server.apiKeyAuthMiddleware

	apiKeyMux.HandleFunc("/api/user/api-keys", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			server.apiKeysHandler.GetAPIKeys(w, r)
		case http.MethodPost:
			server.apiKeysHandler.CreateAPIKey(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	apiKeyMux.HandleFunc("/api/user/api-keys/function-groups/status", server.apiKeysHandler.GetFunctionGroupAPIKeyStatus)
	apiKeyMux.HandleFunc("/api/user/api-keys/statistics", server.apiKeysHandler.GetAPIKeyStatistics)
	apiKeyMux.HandleFunc("/api/user/api-keys/functions/", server.apiKeysHandler.HandleKeyRoutes)
	apiKeyMux.HandleFunc("/api/user/api-keys/", server.apiKeysHandler.HandleKeyRoutes)

	mux.Handle("/api/user/api-keys/", apiKeyAuthMiddleware(apiKeyMux))

	// Register execution template routes
	server.templateIntegration.RegisterRoutes(mux, func(h http.HandlerFunc) http.Handler {
		return authMiddleware(h)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 GoGent HTTP Server starting on port %s\n", port)
	fmt.Printf("📡 Health check: http://localhost:%s/health\n", port)
	fmt.Printf("🔧 API endpoints:\n")
	fmt.Printf("   POST /api/execute - Multi-variation execution (🔐 Protected)\n")
	fmt.Printf("   GET  /api/execution-runs - Execution history (🔐 Protected)\n")
	fmt.Printf("   POST /api/auth/register - User registration\n")
	fmt.Printf("   POST /api/auth/login - User login\n")
	fmt.Printf("   GET  /api/auth/current - Get current user (🔐 Protected)\n")
	fmt.Printf("   GET  /api/configurations - List API configurations (🔐 Protected)\n")
	fmt.Printf("   GET  /api/functions - List function definitions (🔐 Protected)\n")
	fmt.Printf("   POST /api/functions - Create function definition (🔐 Protected)\n")
	fmt.Printf("   GET  /api/functions/{id} - Get function by ID (🔐 Protected)\n")
	fmt.Printf("   PUT  /api/functions/{id} - Update function (🔐 Protected)\n")
	fmt.Printf("   DELETE /api/functions/{id} - Delete function (🔐 Protected)\n")
	fmt.Printf("   POST /api/functions/test/{id} - Test function execution (🔐 Protected)\n")
	fmt.Printf("   GET  /api/database/stats - Database statistics (🔐 Protected)\n")
	fmt.Printf("   GET  /api/database/tables - Database tables (🔐 Protected)\n")
	fmt.Printf("   GET  /api/templates - List execution templates (🔐 Protected)\n")
	fmt.Printf("   POST /api/templates - Create execution template (🔐 Protected)\n")
	fmt.Printf("   POST /api/public/templates/{id}/execute - Execute template via token (🌐 Public)\n")
	fmt.Printf("   GET  /api/agents - List agents (🔐 Protected)\n")
	fmt.Printf("   POST /api/agents - Create agent (🔐 Protected)\n")
	fmt.Printf("   GET  /api/agents/{id} - Get agent by ID (🔐 Protected)\n")
	fmt.Printf("   PUT  /api/agents/{id} - Update agent (🔐 Protected)\n")
	fmt.Printf("   DELETE /api/agents/{id} - Delete agent (🔐 Protected)\n")
	fmt.Printf("   GET  /api/agents/{id}/executions - Get agent executions (🔐 Protected)\n")
	fmt.Printf("   DELETE /api/agents/{id}/team - Remove agent from team (🔐 Protected)\n")
	fmt.Printf("   GET  /api/teams - List teams (🔐 Protected)\n")
	fmt.Printf("   POST /api/teams - Create team (🔐 Protected)\n")
	fmt.Printf("   GET  /api/teams/{id} - Get team by ID (🔐 Protected)\n")
	fmt.Printf("   PUT  /api/teams/{id} - Update team (🔐 Protected)\n")
	fmt.Printf("   DELETE /api/teams/{id} - Delete team (🔐 Protected)\n")
	fmt.Printf("   GET  /api/teams/{id}/agents - Get team with agents (🔐 Protected)\n")
	fmt.Printf("   POST /api/teams/{id}/agents/{agentId} - Assign agent to team (🔐 Protected)\n")
	fmt.Printf("   POST /api/teams/{id}/pause-all - Pause all team agents (🔐 Protected)\n")
	fmt.Printf("   POST /api/teams/{id}/resume-all - Resume all team agents (🔐 Protected)\n")
	fmt.Printf("   GET  /api/teams/{id}/stats - Get team statistics (🔐 Protected)\n")
	fmt.Printf("   GET  /api/teams/{id}/memory/read - Read team memory (🔐 Protected)\n")
	fmt.Printf("   POST /api/teams/{id}/memory/write - Write team memory (🔐 Protected)\n")
	fmt.Printf("   POST /api/teams/{id}/memory/search - Search team memory (🔐 Protected)\n")
	fmt.Printf("   POST /api/teams/{id}/memory/clear - Clear team memory (🔐 Protected)\n")
	fmt.Printf("   GET  /api/user/api-keys - List user API keys (🔐 Protected)\n")
	fmt.Printf("   POST /api/user/api-keys - Create API key (🔐 Protected)\n")
	fmt.Printf("   GET  /api/user/api-keys/{id} - Get API key by ID (🔐 Protected)\n")
	fmt.Printf("   PUT  /api/user/api-keys/{id} - Update API key (🔐 Protected)\n")
	fmt.Printf("   DELETE /api/user/api-keys/{id} - Delete API key (🔐 Protected)\n")
	fmt.Printf("   POST /api/user/api-keys/{id}/test - Test API key (🔐 Protected)\n")
	fmt.Printf("   GET  /api/user/api-keys/function-groups/status - Function group key status (🔐 Protected)\n")
	fmt.Printf("   GET  /api/user/api-keys/statistics - API key usage statistics (🔐 Protected)\n")
	fmt.Printf("💡 Use X-Use-Mock: true header for mock responses\n")
	fmt.Printf("🔑 Set GEMINI_API_KEY in config.env for real API calls\n")
	fmt.Printf("🔐 Most endpoints now require authentication\n")
	fmt.Println()

	// Removed periodic cleanup - using database for status tracking now

	// Apply CORS middleware to the mux
	handler := server.enableCORS(mux)

	// Create HTTP server with graceful shutdown support
	httpServer := &http.Server{
		Addr:    ":" + port,
		Handler: handler,
	}

	// Create graceful wrapper with Kubernetes-optimized config
	config := gracewrap.DefaultConfig()
	config.DrainTimeout = 30 * time.Second     // Wait 30s for in-flight requests
	config.HardStopTimeout = 10 * time.Second  // Hard stop after 10s
	config.LoadBalancerDelay = 5 * time.Second // Wait 5s for load balancer to notice
	graceful := gracewrap.New(&config)

	// Add graceful shutdown health endpoints for Kubernetes
	mux.Handle("/health/ready", graceful.HealthHandler())  // Readiness probe
	mux.Handle("/health/live", graceful.LivenessHandler()) // Liveness probe

	// Wrap HTTP server with graceful shutdown
	if err := graceful.WrapHTTP(httpServer); err != nil {
		log.Fatalf("Failed to wrap HTTP server: %v", err)
	}

	log.Printf("🚀 GoGent HTTP Server starting on port %s with graceful shutdown support", port)
	log.Printf("📊 Health endpoints: /health/ready (readiness), /health/live (liveness)")

	// Wait for shutdown signal and perform graceful shutdown
	if err := graceful.Wait(context.Background()); err != nil {
		log.Printf("Graceful shutdown error: %v", err)
	}
}

// createMockExecutionResult creates mock detailed data based on a real execution run
func (s *Server) createMockExecutionResult(run *types.ExecutionRun) *types.ExecutionResult {
	temp1 := float32(0.2)
	temp2 := float32(0.8)

	return &types.ExecutionResult{
		ExecutionRun: *run, // Use the real execution run data
		Results: []types.VariationResult{
			{
				Configuration: types.APIConfiguration{
					ID:            "config-1-" + run.ID,
					VariationName: "conservative",
					ModelName:     "gemini-1.5-flash",
					SystemPrompt:  "You are a precise, analytical assistant.",
					Temperature:   &temp1,
					CreatedAt:     run.CreatedAt,
				},
				Request: types.APIRequest{
					ID:              "req-1-" + run.ID,
					ExecutionRunID:  run.ID,
					ConfigurationID: "config-1-" + run.ID,
					RequestType:     "generate",
					Prompt:          "Mock prompt based on: " + run.Name,
					CreatedAt:       run.CreatedAt,
				},
				Response: types.APIResponse{
					ID:             "resp-1-" + run.ID,
					RequestID:      "req-1-" + run.ID,
					ResponseStatus: "success",
					ResponseText:   fmt.Sprintf("Mock conservative response for execution: %s. This response demonstrates analytical thinking with precise reasoning.", run.Name),
					FinishReason:   "stop",
					ResponseTimeMs: 450,
					UsageMetadata: map[string]interface{}{
						"prompt_tokens":     25,
						"completion_tokens": 75,
						"total_tokens":      100,
					},
					CreatedAt: run.CreatedAt,
				},
				ExecutionTime: 450, // milliseconds
			},
			{
				Configuration: types.APIConfiguration{
					ID:            "config-2-" + run.ID,
					VariationName: "creative",
					ModelName:     "gemini-1.5-flash",
					SystemPrompt:  "You are a highly creative assistant who uses vivid imagery.",
					Temperature:   &temp2,
					CreatedAt:     run.CreatedAt,
				},
				Request: types.APIRequest{
					ID:              "req-2-" + run.ID,
					ExecutionRunID:  run.ID,
					ConfigurationID: "config-2-" + run.ID,
					RequestType:     "generate",
					Prompt:          "Mock prompt based on: " + run.Name,
					CreatedAt:       run.CreatedAt,
				},
				Response: types.APIResponse{
					ID:             "resp-2-" + run.ID,
					RequestID:      "req-2-" + run.ID,
					ResponseStatus: "success",
					ResponseText:   fmt.Sprintf("Mock creative response for execution: %s. This response demonstrates imaginative thinking with vivid imagery and artistic expression.", run.Name),
					FinishReason:   "stop",
					ResponseTimeMs: 380,
					UsageMetadata: map[string]interface{}{
						"prompt_tokens":     25,
						"completion_tokens": 85,
						"total_tokens":      110,
					},
					CreatedAt: run.CreatedAt,
				},
				ExecutionTime: 380, // milliseconds
			},
		},
		TotalTime:    830, // milliseconds
		SuccessCount: 2,
		ErrorCount:   0,
		Comparison: &types.ComparisonResult{
			ID:                  "comp-" + run.ID,
			ExecutionRunID:      run.ID,
			ComparisonType:      "performance",
			MetricName:          "response_time",
			BestConfigurationID: "config-2-" + run.ID,
			AnalysisNotes:       fmt.Sprintf("Creative variation achieved faster response time (380ms vs 450ms) for execution: %s", run.Name),
			CreatedAt:           run.CreatedAt,
		},
	}
}

// Execution flow graph handlers

// executionFlowGraphHandler handles requests for execution flow graph data
func (s *Server) executionFlowGraphHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract user ID for authorization
	userID, err := s.getUserID(r)
	if err != nil {
		log.Printf("❌ Failed to get user ID from context for execution flow endpoint")
		log.Printf("   Request path: %s", r.URL.Path)
		log.Printf("   Request method: %s", r.Method)
		log.Printf("   Auth header present: %v", r.Header.Get("Authorization") != "")
		log.Printf("   Context keys: %+v", r.Context())
		log.Printf("   Error: %v", err)
		http.Error(w, "Unauthorized - user context not found", http.StatusUnauthorized)
		return
	}

	// Extract execution run ID from URL path
	// URL format: /api/execution-flow/{execution-run-id}
	path := r.URL.Path
	flowPrefix := "/api/execution-flow/"
	if !strings.HasPrefix(path, flowPrefix) {
		http.Error(w, "Invalid execution flow endpoint", http.StatusBadRequest)
		return
	}

	executionRunID := path[len(flowPrefix):]
	if executionRunID == "" {
		http.Error(w, "Execution run ID required", http.StatusBadRequest)
		return
	}

	log.Printf("🔍 Getting execution flow graph for execution run: %s, user: %s", executionRunID, userID)

	// Get execution flow data from database using the client
	flowGraph, err := s.client.GetExecutionFlowGraph(context.Background(), userID, executionRunID)
	if err != nil {
		log.Printf("❌ Failed to get execution flow graph: %v", err)
		http.Error(w, fmt.Sprintf("Failed to get execution flow graph: %v", err), http.StatusInternalServerError)
		return
	}

	if flowGraph == nil {
		http.Error(w, "Execution run not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(flowGraph)
}

// executionLogsHandler handles requests for execution logs filtered by configuration
func (s *Server) executionLogsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract user ID for authorization
	userID, err := s.getUserID(r)
	if err != nil {
		log.Printf("❌ Failed to get user ID from context for execution logs endpoint")
		http.Error(w, "Unauthorized - user context not found", http.StatusUnauthorized)
		return
	}

	// Extract execution run ID and configuration ID from URL path
	// URL format: /api/execution-logs/{execution-run-id}/{configuration-id}
	path := r.URL.Path
	logsPrefix := "/api/execution-logs/"
	if !strings.HasPrefix(path, logsPrefix) {
		http.Error(w, "Invalid execution logs endpoint", http.StatusBadRequest)
		return
	}

	pathParts := strings.Split(path[len(logsPrefix):], "/")
	if len(pathParts) != 2 || pathParts[0] == "" || pathParts[1] == "" {
		http.Error(w, "Both execution run ID and configuration ID required", http.StatusBadRequest)
		return
	}

	executionRunID := pathParts[0]
	configurationID := pathParts[1]

	log.Printf("🔍 Getting execution logs for execution run: %s, configuration: %s, user: %s", executionRunID, configurationID, userID)

	// First verify the execution run belongs to the user
	_, err = s.client.GetExecutionRun(context.Background(), userID, executionRunID)
	if err != nil {
		log.Printf("❌ Execution run not found or access denied: %v", err)
		http.Error(w, "Execution run not found or access denied", http.StatusNotFound)
		return
	}

	// Get execution logs filtered by configuration
	logs, err := s.client.GetExecutionLogsByConfiguration(context.Background(), executionRunID, configurationID)
	if err != nil {
		log.Printf("❌ Failed to get execution logs by configuration: %v", err)
		http.Error(w, fmt.Sprintf("Failed to get execution logs: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

// executionLogsAllHandler handles requests for ALL execution logs for a specific execution run ID
func (s *Server) executionLogsAllHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract user ID for authorization
	userID, err := s.getUserID(r)
	if err != nil {
		log.Printf("❌ Failed to get user ID from context for execution logs endpoint")
		http.Error(w, "Unauthorized - user context not found", http.StatusUnauthorized)
		return
	}

	// Extract execution run ID from URL path
	// URL format: /api/execution-logs/{execution-run-id}
	path := r.URL.Path
	logsPrefix := "/api/execution-logs/"
	if !strings.HasPrefix(path, logsPrefix) {
		http.Error(w, "Invalid execution logs endpoint", http.StatusBadRequest)
		return
	}

	executionRunID := path[len(logsPrefix):]
	if executionRunID == "" {
		http.Error(w, "Execution run ID required", http.StatusBadRequest)
		return
	}

	// Check if this contains a slash (which means it's the config-specific endpoint)
	if strings.Contains(executionRunID, "/") {
		// This should be handled by executionLogsHandler, not this one
		http.Error(w, "Invalid execution logs endpoint", http.StatusBadRequest)
		return
	}

	log.Printf("🔍 Getting ALL execution logs for execution run: %s, user: %s", executionRunID, userID)

	// First verify the execution run belongs to the user
	_, err = s.client.GetExecutionRun(context.Background(), userID, executionRunID)
	if err != nil {
		log.Printf("❌ Execution run not found or access denied: %v", err)
		http.Error(w, "Execution run not found or access denied", http.StatusNotFound)
		return
	}

	// Get ALL execution logs for this execution run (across all configurations)
	logs, err := s.client.GetExecutionLogsByRun(context.Background(), executionRunID)
	if err != nil {
		log.Printf("❌ Failed to get execution logs by run: %v", err)
		http.Error(w, fmt.Sprintf("Failed to get execution logs: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

// executionFlowByConfigHandler handles requests for execution flow graph data filtered by configuration
func (s *Server) executionFlowByConfigHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract user ID for authorization
	userID, err := s.getUserID(r)
	if err != nil {
		log.Printf("❌ Failed to get user ID from context for execution flow by config endpoint")
		http.Error(w, "Unauthorized - user context not found", http.StatusUnauthorized)
		return
	}

	// Extract execution run ID and configuration ID from URL path
	// URL format: /api/execution-flow-by-config/{execution-run-id}/{configuration-id}
	path := r.URL.Path
	flowPrefix := "/api/execution-flow-by-config/"
	if !strings.HasPrefix(path, flowPrefix) {
		http.Error(w, "Invalid execution flow by config endpoint", http.StatusBadRequest)
		return
	}

	pathParts := strings.Split(path[len(flowPrefix):], "/")
	if len(pathParts) != 2 || pathParts[0] == "" || pathParts[1] == "" {
		http.Error(w, "Both execution run ID and configuration ID required", http.StatusBadRequest)
		return
	}

	executionRunID := pathParts[0]
	configurationID := pathParts[1]

	log.Printf("🔍 Getting execution flow graph for execution run: %s, configuration: %s, user: %s", executionRunID, configurationID, userID)

	// First verify the execution run belongs to the user
	_, err = s.client.GetExecutionRun(context.Background(), userID, executionRunID)
	if err != nil {
		log.Printf("❌ Execution run not found or access denied: %v", err)
		http.Error(w, "Execution run not found or access denied", http.StatusNotFound)
		return
	}

	// Get execution flow data filtered by configuration
	flowGraph, err := s.client.GetExecutionFlowGraphByConfiguration(context.Background(), userID, executionRunID, configurationID)
	if err != nil {
		log.Printf("❌ Failed to get execution flow graph by configuration: %v", err)
		http.Error(w, fmt.Sprintf("Failed to get execution flow graph: %v", err), http.StatusInternalServerError)
		return
	}

	if flowGraph == nil {
		http.Error(w, "Execution run not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(flowGraph)
}

// Function management handlers

// functionsHandler handles CRUD operations for function definitions
func (s *Server) functionsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.listFunctions(w, r)
	case http.MethodPost:
		s.createFunction(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// functionByIDHandler handles operations on specific functions
func (s *Server) functionByIDHandler(w http.ResponseWriter, r *http.Request) {
	// Extract function ID from path
	path := r.URL.Path
	if len(path) < len("/api/functions/") {
		http.Error(w, "Function ID required", http.StatusBadRequest)
		return
	}
	functionID := path[len("/api/functions/"):]
	if functionID == "" {
		http.Error(w, "Function ID required", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.getFunctionByID(w, r, functionID)
	case http.MethodPut:
		s.updateFunction(w, r, functionID)
	case http.MethodDelete:
		s.deleteFunction(w, r, functionID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// testFunctionHandler handles function testing
func (s *Server) testFunctionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract function ID from path
	path := r.URL.Path
	if len(path) < len("/api/functions/test/") {
		http.Error(w, "Function ID required", http.StatusBadRequest)
		return
	}
	functionID := path[len("/api/functions/test/"):]
	if functionID == "" {
		http.Error(w, "Function ID required", http.StatusBadRequest)
		return
	}

	s.executeTestFunction(w, r, functionID)
}

// listFunctions returns all active function definitions
func (s *Server) listFunctions(w http.ResponseWriter, r *http.Request) {
	userID, err := s.getUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	log.Printf("📋 Listing function definitions from database")

	if s.client == nil {
		log.Printf("❌ No database client available")
		http.Error(w, "Database not available", http.StatusInternalServerError)
		return
	}

	ctx := context.Background()

	// Query the database directly for function definitions
	query := `
		SELECT id, user_id, name, display_name, function_group, description, parameters_schema,
		       mock_response, endpoint_url, http_method, headers, auth_config,
		       is_active, is_system_resource, required_api_keys, api_key_validation,
		       query_template, result_transformer, fallback_data, created_at, updated_at
		FROM function_definitions
		WHERE (user_id = ? OR user_id = 'system') AND is_active = true
		ORDER BY display_name ASC
	`

	rows, err := s.client.GetDB().QueryContext(ctx, query, userID)
	if err != nil {
		log.Printf("❌ Failed to query function definitions: %v", err)
		http.Error(w, "Failed to query functions", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var functions []types.FunctionDefinition

	for rows.Next() {
		var dbFunction db.FunctionDefinition
		var fallbackData sql.NullString

		err := rows.Scan(
			&dbFunction.ID,
			&dbFunction.UserID,
			&dbFunction.Name,
			&dbFunction.DisplayName,
			&dbFunction.FunctionGroup,
			&dbFunction.Description,
			&dbFunction.ParametersSchema,
			&dbFunction.MockResponse,
			&dbFunction.EndpointUrl,
			&dbFunction.HTTPMethod,
			&dbFunction.Headers,
			&dbFunction.AuthConfig,
			&dbFunction.IsActive,
			&dbFunction.IsSystemResource,
			&dbFunction.RequiredAPIKeys,
			&dbFunction.APIKeyValidation,
			&dbFunction.QueryTemplate,
			&dbFunction.ResultTransformer,
			&fallbackData,
			&dbFunction.CreatedAt,
			&dbFunction.UpdatedAt,
		)
		if err != nil {
			log.Printf("❌ Failed to scan function row: %v", err)
			continue
		}

		// Convert database model to types model
		function := types.FunctionDefinition{
			ID:               dbFunction.ID,
			Name:             dbFunction.Name,
			DisplayName:      dbFunction.DisplayName,
			IsActive:         dbFunction.IsActive.Bool,
			IsSystemResource: dbFunction.IsSystemResource.Bool,
			CreatedAt:        dbFunction.CreatedAt.Time,
			UpdatedAt:        dbFunction.UpdatedAt.Time,
		}

		// Handle nullable string fields
		if dbFunction.UserID != "" {
			function.UserID = dbFunction.UserID
		}
		if dbFunction.Description.Valid {
			function.Description = dbFunction.Description.String
		}
		function.FunctionGroup = dbFunction.FunctionGroup
		if dbFunction.EndpointUrl.Valid {
			function.EndpointURL = dbFunction.EndpointUrl.String
		}
		if dbFunction.HTTPMethod.Valid {
			function.HTTPMethod = dbFunction.HTTPMethod.String
		}
		if dbFunction.QueryTemplate.Valid {
			function.QueryTemplate = dbFunction.QueryTemplate.String
		}
		if dbFunction.ResultTransformer.Valid {
			function.ResultTransformer = dbFunction.ResultTransformer.String
		}

		// Handle JSON fields - no longer nullable after schema fix
		if err := json.Unmarshal(dbFunction.ParametersSchema, &function.ParametersSchema); err != nil {
			log.Printf("⚠️ Failed to parse parameters schema for %s: %v", function.Name, err)
			function.ParametersSchema = make(map[string]interface{})
		}

		if err := json.Unmarshal(dbFunction.MockResponse, &function.MockResponse); err != nil {
			log.Printf("⚠️ Failed to parse mock response for %s: %v", function.Name, err)
		}

		if err := json.Unmarshal(dbFunction.Headers, &function.Headers); err != nil {
			log.Printf("⚠️ Failed to parse headers for %s: %v", function.Name, err)
		}

		if err := json.Unmarshal(dbFunction.AuthConfig, &function.AuthConfig); err != nil {
			log.Printf("⚠️ Failed to parse auth config for %s: %v", function.Name, err)
		}

		// Handle FallbackData - check for NULL values first
		if fallbackData.Valid && len(fallbackData.String) > 0 {
			if err := json.Unmarshal([]byte(fallbackData.String), &function.FallbackData); err != nil {
				log.Printf("⚠️ Failed to parse fallback data for %s: %v", function.Name, err)
			}
		}

		// Handle RequiredAPIKeys and APIKeyValidation JSON fields
		if err := json.Unmarshal(dbFunction.RequiredAPIKeys, &function.RequiredAPIKeys); err != nil {
			log.Printf("⚠️ Failed to parse required API keys for %s: %v", function.Name, err)
			function.RequiredAPIKeys = []string{}
		}

		if err := json.Unmarshal(dbFunction.APIKeyValidation, &function.APIKeyValidation); err != nil {
			log.Printf("⚠️ Failed to parse API key validation for %s: %v", function.Name, err)
			function.APIKeyValidation = make(map[string]interface{})
		}

		functions = append(functions, function)
	}

	if err = rows.Err(); err != nil {
		log.Printf("❌ Error iterating function rows: %v", err)
		http.Error(w, "Error processing functions", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ Successfully loaded %d function definitions from database", len(functions))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    functions,
	})
}

// createFunction creates a new function definition
func (s *Server) createFunction(w http.ResponseWriter, r *http.Request) {
	log.Printf("➕ Creating new function definition in database")

	if s.client == nil {
		log.Printf("❌ No database client available")
		http.Error(w, "Database not available", http.StatusInternalServerError)
		return
	}

	var function types.FunctionDefinition
	if err := json.NewDecoder(r.Body).Decode(&function); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	// Validate required fields
	if function.Name == "" || function.DisplayName == "" || function.Description == "" {
		http.Error(w, "Name, DisplayName, and Description are required", http.StatusBadRequest)
		return
	}

	// Generate ID and timestamps
	function.ID = fmt.Sprintf("func-%d", time.Now().Unix())
	function.CreatedAt = time.Now()
	function.UpdatedAt = time.Now()
	function.IsActive = true

	// Get user ID for ownership
	userID, err := s.getUserID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Convert complex fields to JSON
	parametersSchemaJSON, err := json.Marshal(function.ParametersSchema)
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid parameters schema: %v", err), http.StatusBadRequest)
		return
	}

	mockResponseJSON, err := json.Marshal(function.MockResponse)
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid mock response: %v", err), http.StatusBadRequest)
		return
	}

	headersJSON, err := json.Marshal(function.Headers)
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid headers: %v", err), http.StatusBadRequest)
		return
	}

	authConfigJSON, err := json.Marshal(function.AuthConfig)
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid auth config: %v", err), http.StatusBadRequest)
		return
	}

	// Insert into database
	ctx := context.Background()
	query := `
		INSERT INTO function_definitions (
			id, user_id, name, display_name, description, 
			parameters_schema, mock_response, endpoint_url, http_method,
			headers, auth_config, is_active, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = s.client.GetDB().ExecContext(ctx, query,
		function.ID, userID, function.Name, function.DisplayName, function.Description,
		string(parametersSchemaJSON), string(mockResponseJSON), function.EndpointURL, function.HTTPMethod,
		string(headersJSON), string(authConfigJSON), function.IsActive, function.CreatedAt, function.UpdatedAt,
	)

	if err != nil {
		log.Printf("❌ Failed to insert function into database: %v", err)
		http.Error(w, "Failed to save function to database", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ Function created and saved to database: %s (%s)", function.DisplayName, function.Name)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    function,
		"message": "Function created successfully",
	})
}

// getFunctionByID returns a specific function definition
func (s *Server) getFunctionByID(w http.ResponseWriter, r *http.Request, functionID string) {
	log.Printf("🔍 Getting function by ID: %s", functionID)

	// TODO: Implement database lookup
	// For now, return mock data if ID matches
	if functionID == "func-1" {
		function := types.FunctionDefinition{
			ID:          "func-1",
			Name:        "get_weather",
			DisplayName: "Get Weather",
			Description: "Get current weather information for a location",
			ParametersSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"location": map[string]interface{}{
						"type":        "string",
						"description": "The location to get weather for",
					},
					"units": map[string]interface{}{
						"type":        "string",
						"enum":        []string{"celsius", "fahrenheit"},
						"description": "Temperature units",
					},
				},
				"required": []string{"location"},
			},
			MockResponse: map[string]interface{}{
				"temperature": 22,
				"condition":   "sunny",
				"humidity":    65,
			},
			EndpointURL: "https://api.weather.com/v1/current",
			HTTPMethod:  "GET",
			IsActive:    true,
			CreatedAt:   time.Now().Add(-24 * time.Hour),
			UpdatedAt:   time.Now().Add(-1 * time.Hour),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"data":    function,
		})
		return
	}

	http.Error(w, "Function not found", http.StatusNotFound)
}

// updateFunction updates an existing function definition
func (s *Server) updateFunction(w http.ResponseWriter, r *http.Request, functionID string) {
	log.Printf("✏️ Updating function: %s", functionID)

	var function types.FunctionDefinition
	if err := json.NewDecoder(r.Body).Decode(&function); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	// Validate required fields
	if function.Name == "" || function.DisplayName == "" || function.Description == "" {
		http.Error(w, "Name, DisplayName, and Description are required", http.StatusBadRequest)
		return
	}

	// Set ID and update timestamp
	function.ID = functionID
	function.UpdatedAt = time.Now()

	// TODO: Implement database update
	log.Printf("✅ Updated function: %s (%s)", function.DisplayName, function.Name)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    function,
	})
}

// deleteFunction deletes a function definition
func (s *Server) deleteFunction(w http.ResponseWriter, r *http.Request, functionID string) {
	log.Printf("🗑️ Deleting function: %s", functionID)

	// Implement database deletion (soft delete by setting is_active = false)
	query := `UPDATE function_definitions SET is_active = false, updated_at = NOW() WHERE id = ?`

	ctx := context.Background()
	result, err := s.client.GetDB().ExecContext(ctx, query, functionID)
	if err != nil {
		log.Printf("❌ Error deleting function %s: %v", functionID, err)
		http.Error(w, fmt.Sprintf("Failed to delete function: %v", err), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("❌ Error checking rows affected for function %s: %v", functionID, err)
		http.Error(w, "Failed to verify deletion", http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		log.Printf("❌ Function %s not found", functionID)
		http.Error(w, "Function not found", http.StatusNotFound)
		return
	}

	log.Printf("✅ Successfully deleted function: %s", functionID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Function %s deleted successfully", functionID),
	})
}

// executeTestFunction tests a function with provided arguments
func (s *Server) executeTestFunction(w http.ResponseWriter, r *http.Request, functionID string) {
	log.Printf("🧪 Testing function: %s", functionID)

	var testRequest struct {
		Arguments   map[string]interface{} `json:"arguments"`
		UseMockData bool                   `json:"useMockData"`
		TimeoutMs   int32                  `json:"timeoutMs,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&testRequest); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	startTime := time.Now()

	// For now, simulate function execution
	var result map[string]interface{}
	if testRequest.UseMockData {
		// Return mock response based on function
		switch functionID {
		case "func-1": // get_weather
			result = map[string]interface{}{
				"success":         true,
				"usedMockData":    true,
				"executionTimeMs": int32(time.Since(startTime).Milliseconds()),
				"response": map[string]interface{}{
					"temperature": 22,
					"condition":   "sunny",
					"humidity":    65,
					"location":    testRequest.Arguments["location"],
				},
			}
		case "func-2": // send_email
			result = map[string]interface{}{
				"success":         true,
				"usedMockData":    true,
				"executionTimeMs": int32(time.Since(startTime).Milliseconds()),
				"response": map[string]interface{}{
					"status":    "sent",
					"messageId": "mock_msg_123",
					"to":        testRequest.Arguments["to"],
				},
			}
		default:
			result = map[string]interface{}{
				"success":         true,
				"usedMockData":    true,
				"executionTimeMs": int32(time.Since(startTime).Milliseconds()),
				"response": map[string]interface{}{
					"status": "mock_success",
					"data":   "Mock response generated",
				},
			}
		}
	} else {
		// Implement real function calling using Gemini API
		result = s.executeRealFunctionTest(functionID, testRequest.Arguments)
		result["executionTimeMs"] = int32(time.Since(startTime).Milliseconds())
	}

	log.Printf("✅ Function test completed: %s", functionID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// executeRealFunctionTest executes a function test using the actual Gemini API
func (s *Server) executeRealFunctionTest(functionID string, arguments map[string]interface{}) map[string]interface{} {
	// For now, return a simplified implementation that works
	log.Printf("🧪 Real function test requested for: %s with args: %+v", functionID, arguments)

	// TODO: Implement proper real function testing once function methods are available
	return map[string]interface{}{
		"success":      true,
		"usedMockData": false,
		"response": map[string]interface{}{
			"functionCalled": false,
			"message":        "Real function testing implementation in progress. Function infrastructure needs to be completed first.",
			"functionId":     functionID,
			"providedArgs":   arguments,
			"warning":        "Real API function testing will be implemented once the function management methods are available.",
		},
	}
}

// createGenericMockExecutionResult creates generic mock data when no real run is found
func (s *Server) createGenericMockExecutionResult(runID string) *types.ExecutionResult {
	temp1 := float32(0.2)
	temp2 := float32(0.8)
	now := time.Now()

	return &types.ExecutionResult{
		ExecutionRun: types.ExecutionRun{
			ID:                    runID,
			Name:                  "execution-" + runID,
			Description:           "Mock execution details for run: " + runID,
			EnableFunctionCalling: false,
			CreatedAt:             now.Add(-2 * time.Hour),
			UpdatedAt:             now.Add(-2 * time.Hour),
		},
		Results: []types.VariationResult{
			{
				Configuration: types.APIConfiguration{
					ID:            "config-1-" + runID,
					VariationName: "conservative",
					ModelName:     "gemini-1.5-flash",
					SystemPrompt:  "You are a precise, analytical assistant.",
					Temperature:   &temp1,
					CreatedAt:     now.Add(-2 * time.Hour),
				},
				Request: types.APIRequest{
					ID:              "req-1-" + runID,
					ExecutionRunID:  runID,
					ConfigurationID: "config-1-" + runID,
					RequestType:     "generate",
					Prompt:          "Generic mock prompt for run: " + runID,
					CreatedAt:       now.Add(-2 * time.Hour),
				},
				Response: types.APIResponse{
					ID:             "resp-1-" + runID,
					RequestID:      "req-1-" + runID,
					ResponseStatus: "success",
					ResponseText:   fmt.Sprintf("Mock conservative response for run %s: This is a precise, analytical response demonstrating structured reasoning.", runID),
					FinishReason:   "stop",
					ResponseTimeMs: 450,
					UsageMetadata: map[string]interface{}{
						"prompt_tokens":     20,
						"completion_tokens": 60,
						"total_tokens":      80,
					},
					CreatedAt: now.Add(-2 * time.Hour),
				},
				ExecutionTime: 450, // milliseconds
			},
			{
				Configuration: types.APIConfiguration{
					ID:            "config-2-" + runID,
					VariationName: "creative",
					ModelName:     "gemini-1.5-flash",
					SystemPrompt:  "You are a highly creative assistant.",
					Temperature:   &temp2,
					CreatedAt:     now.Add(-2 * time.Hour),
				},
				Request: types.APIRequest{
					ID:              "req-2-" + runID,
					ExecutionRunID:  runID,
					ConfigurationID: "config-2-" + runID,
					RequestType:     "generate",
					Prompt:          "Generic mock prompt for run: " + runID,
					CreatedAt:       now.Add(-2 * time.Hour),
				},
				Response: types.APIResponse{
					ID:             "resp-2-" + runID,
					RequestID:      "req-2-" + runID,
					ResponseStatus: "success",
					ResponseText:   fmt.Sprintf("Mock creative response for run %s: This is an imaginative response with vivid imagery and artistic flair.", runID),
					FinishReason:   "stop",
					ResponseTimeMs: 380,
					UsageMetadata: map[string]interface{}{
						"prompt_tokens":     20,
						"completion_tokens": 70,
						"total_tokens":      90,
					},
					CreatedAt: now.Add(-2 * time.Hour),
				},
				ExecutionTime: 380, // milliseconds
			},
		},
		TotalTime:    830, // milliseconds
		SuccessCount: 2,
		ErrorCount:   0,
		Comparison: &types.ComparisonResult{
			ID:                  "comp-" + runID,
			ExecutionRunID:      runID,
			ComparisonType:      "performance",
			MetricName:          "response_time",
			BestConfigurationID: "config-2-" + runID,
			AnalysisNotes:       fmt.Sprintf("Creative variation achieved faster response time for run: %s", runID),
			CreatedAt:           now.Add(-2 * time.Hour),
		},
	}
}

// executionLogsRouter routes execution logs requests to the appropriate handler
func (s *Server) executionLogsRouter(w http.ResponseWriter, r *http.Request) {
	// Extract the path after /api/execution-logs/
	path := r.URL.Path
	logsPrefix := "/api/execution-logs/"
	if !strings.HasPrefix(path, logsPrefix) {
		http.Error(w, "Invalid execution logs endpoint", http.StatusBadRequest)
		return
	}

	pathRemainder := path[len(logsPrefix):]

	// If there's a slash in the remainder, it's {execution-run-id}/{configuration-id}
	// If there's no slash, it's just {execution-run-id}
	if strings.Contains(pathRemainder, "/") {
		// Route to configuration-specific handler
		s.executionLogsHandler(w, r)
	} else {
		// Route to all-logs handler
		s.executionLogsAllHandler(w, r)
	}
}
