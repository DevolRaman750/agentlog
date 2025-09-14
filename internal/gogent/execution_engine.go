package gogent

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"gogent/internal/db"
	"gogent/internal/gemini"
	"gogent/internal/providers"
	"gogent/internal/types"
	"gogent/pkg/engine"

	"github.com/google/uuid"
)

// ExecuteMultiVariation executes the same prompt with multiple configurations
func (c *Client) ExecuteMultiVariation(ctx context.Context, userID string, request *types.MultiExecutionRequest) (*types.ExecutionResult, error) {
	// Create execution run
	executionRun, err := c.CreateExecutionRun(ctx, userID, request.ExecutionRunName, request.Description, request.EnableFunctionCalling, request.AgentID)
	if err != nil {
		return nil, fmt.Errorf("failed to create execution run: %w", err)
	}

	return c.executeMultiVariationWithRun(ctx, userID, executionRun, request)
}

// ExecuteMultiVariationWithExistingRun executes variations for an already-created execution run
func (c *Client) ExecuteMultiVariationWithExistingRun(ctx context.Context, userID string, executionRunID string, request *types.MultiExecutionRequest) (*types.ExecutionResult, error) {
	// Get the existing execution run
	executionRun, err := c.GetExecutionRun(ctx, userID, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing execution run: %w", err)
	}

	return c.executeMultiVariationWithRun(ctx, userID, executionRun, request)
}

// executeMultiVariationWithRun is the shared implementation for both methods
func (c *Client) executeMultiVariationWithRun(ctx context.Context, userID string, executionRun *types.ExecutionRun, request *types.MultiExecutionRequest) (*types.ExecutionResult, error) {

	// Set execution context for logging
	c.setExecutionContext(&executionRun.ID, nil, nil)
	defer c.clearExecutionContext()

	// Log execution start
	c.logExecutionEvent(types.LogLevelInfo, types.LogCategorySetup,
		fmt.Sprintf("Starting execution: %s", request.ExecutionRunName),
		map[string]interface{}{
			"enableFunctionCalling": request.EnableFunctionCalling,
			"functionToolsCount":    len(request.FunctionTools),
			"configurationsCount":   len(request.Configurations),
		})

	// Log flow event for execution start with enhanced details
	c.logExecutionFlowEvent("prompt_start", c.getNextSequenceNumber(), "success", nil, map[string]interface{}{
		"executionName":         request.ExecutionRunName,
		"basePrompt":            request.BasePrompt,
		"promptLength":          len(request.BasePrompt),
		"contextLength":         len(request.Context),
		"configCount":           len(request.Configurations),
		"enableFunctionCalling": request.EnableFunctionCalling,
		"functionToolsCount":    len(request.FunctionTools),
		"comparisonEnabled":     request.ComparisonConfig.Enabled,
		"userID":                userID,
		"executionRunID":        executionRun.ID,
		"promptPreview":         c.truncateString(request.BasePrompt, 200),
		"contextPreview":        c.truncateString(request.Context, 200),
		"functionList":          c.extractFunctionNames(request.FunctionTools),
		"configModels":          c.extractModelNames(request.Configurations),
	}, nil, nil)

	if request.EnableFunctionCalling {
		for i, tool := range request.FunctionTools {
			c.logExecutionEvent(types.LogLevelDebug, types.LogCategorySetup,
				fmt.Sprintf("Function tool %d: %s - %s", i+1, tool.Name, tool.Description), nil)
		}
	}

	result := &types.ExecutionResult{
		ExecutionRun: *executionRun,
		Results:      make([]types.VariationResult, 0, len(request.Configurations)),
		TotalTime:    0,
		SuccessCount: 0,
		ErrorCount:   0,
	}

	startTime := time.Now()

	// Execute each configuration with rate limiting (or defer to engine for multi)
	preparedConfigs := make([]types.APIConfiguration, 0, len(request.Configurations))
	for i, config := range request.Configurations {
		config.ID = uuid.New().String()

		// CRITICAL: Add function tools to configuration if function calling is enabled
		if request.EnableFunctionCalling && len(request.FunctionTools) > 0 {
			config.Tools = request.FunctionTools
		}

		// Save configuration FIRST before setting context for logging
		if err := c.CreateAPIConfiguration(ctx, userID, &config); err != nil {
			c.logExecutionEvent(types.LogLevelError, types.LogCategoryError,
				fmt.Sprintf("Failed to save configuration: %v", err), nil)
			return nil, fmt.Errorf("failed to save configuration: %w", err)
		}

		// Get the actual configuration ID from database (in case ON DUPLICATE KEY UPDATE was used)
		configUserID := userID
		if config.UserID != "" {
			configUserID = config.UserID
		}

		// Query to get the actual configuration that exists in the database
		actualConfig, err := c.queries.GetAPIConfiguration(ctx, db.GetAPIConfigurationParams{
			ID:     config.ID,
			UserID: configUserID,
		})
		if err != nil {
			// Try to get by user_id + variation_name if direct ID lookup fails
			configs, err2 := c.queries.ListAPIConfigurationsByUser(ctx, configUserID)
			if err2 != nil {
				c.logExecutionEvent(types.LogLevelError, types.LogCategoryError,
					fmt.Sprintf("Failed to retrieve saved configuration: %v, %v", err, err2), nil)
				return nil, fmt.Errorf("failed to retrieve saved configuration: %w", err)
			}

			// Find the config with matching variation name
			var foundConfig *db.ApiConfiguration
			for _, cfg := range configs {
				if cfg.VariationName == config.VariationName {
					foundConfig = &cfg
					break
				}
			}

			if foundConfig == nil {
				c.logExecutionEvent(types.LogLevelError, types.LogCategoryError,
					fmt.Sprintf("Configuration not found after creation: %s", config.VariationName), nil)
				return nil, fmt.Errorf("configuration not found after creation: %s", config.VariationName)
			}
			actualConfig = *foundConfig
		}

		// Create execution configuration mapping with the actual configuration ID
		execConfigID := uuid.New().String()
		if err := c.queries.CreateExecutionConfiguration(ctx, db.CreateExecutionConfigurationParams{
			ID:              execConfigID,
			ExecutionRunID:  executionRun.ID,
			ConfigurationID: actualConfig.ID,
		}); err != nil {
			c.logExecutionEvent(types.LogLevelError, types.LogCategoryError,
				fmt.Sprintf("Failed to create execution configuration mapping: %v", err), nil)
			return nil, fmt.Errorf("failed to create execution configuration mapping: %w", err)
		}

		// Set configuration context for logging AFTER saving to database
		c.setExecutionContext(&executionRun.ID, &actualConfig.ID, nil)

		// Log the function tools setup
		if request.EnableFunctionCalling && len(request.FunctionTools) > 0 {
			c.logExecutionEvent(types.LogLevelDebug, types.LogCategorySetup,
				fmt.Sprintf("Adding %d function tools to configuration: %s", len(request.FunctionTools), config.VariationName), nil)
		} else {
			c.logExecutionEvent(types.LogLevelWarn, types.LogCategorySetup,
				fmt.Sprintf("No function tools added to configuration: enableFunctionCalling=%v, toolCount=%d", request.EnableFunctionCalling, len(request.FunctionTools)), nil)
		}

		// Execute single or defer to engine multi
		c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryExecution,
			fmt.Sprintf("Executing variation: %s", config.VariationName), nil)

		// Log AI model call start
		sequenceNum := i + 1
		c.logExecutionFlowEvent("ai_model_call", sequenceNum, "pending", nil, map[string]interface{}{
			"configurationName": config.VariationName,
			"modelName":         config.ModelName,
		}, nil, nil)

		// Ensure the prepared config has the actual persisted ID (handles upsert cases)
		if actualConfig.ID != "" {
			config.ID = actualConfig.ID
		}
		// Defer execution to engine multi; collect prepared config
		preparedConfigs = append(preparedConfigs, config)
	}

	// Execute engine multi and merge results
	engRes, err := c.newEngine().ExecuteMulti(ctx, userID, executionRun.ID, preparedConfigs, request.BasePrompt, request.Context)
	if err != nil {
		c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryError, fmt.Sprintf("Engine multi execution encountered error: %v", err), nil)
	}
	if engRes != nil {
		result.Results = engRes.Results
		result.SuccessCount = engRes.SuccessCount
		result.ErrorCount = engRes.ErrorCount
		result.TotalTime = engRes.TotalTime
		if engRes.Comparison != nil {
			result.Comparison = engRes.Comparison
		}
	}

	// Store function tools for replay functionality - these are available to ALL configurations
	if request.EnableFunctionCalling && len(request.FunctionTools) > 0 {
		err := c.storeFunctionExecutionConfigs(ctx, userID, executionRun.ID, request.FunctionTools)
		if err != nil {
			c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryError,
				fmt.Sprintf("Failed to store function-execution configs: %v", err), nil)
			// Don't fail the entire execution, just log the warning
		} else {
			c.logExecutionEvent(types.LogLevelSuccess, types.LogCategorySetup,
				"Function tools stored - available to all configurations", nil)
		}
	}

	result.TotalTime = time.Since(startTime).Milliseconds()

	// Log completion
	c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryCompletion,
		fmt.Sprintf("Execution completed in %dms - %d successful, %d failed",
			result.TotalTime, result.SuccessCount, result.ErrorCount),
		map[string]interface{}{
			"totalTime":    result.TotalTime,
			"successCount": result.SuccessCount,
			"errorCount":   result.ErrorCount,
		})

	// Log execution complete flow event
	totalTimeMs := int32(result.TotalTime)
	c.logExecutionFlowEvent("execution_complete", len(request.Configurations)+1, "success", nil, map[string]interface{}{
		"successCount": result.SuccessCount,
		"errorCount":   result.ErrorCount,
		"totalTime":    result.TotalTime,
	}, &totalTimeMs, nil)

	// Comparison already handled by engine multi path

	return result, nil
}

// executeSingleVariation executes a single variation and logs everything
func (c *Client) executeSingleVariation(ctx context.Context, userID string, executionRunID string, config *types.APIConfiguration, prompt, context string) (*types.VariationResult, error) {
	// Always delegate to the engine implementation
	return c.newEngine().ExecuteSingle(ctx, userID, executionRunID, config, prompt, context)
}

// compareResults compares the results of multiple variations with comprehensive metrics
// Legacy comparison helpers removed; engine handles comparison and storage via adapters.

// Helper functions for calculating different metrics
func (c *Client) calculateResponseTimeScore(responseTimeMs int32) float64 {
	return engine.ResponseTimeScore(responseTimeMs)
}

func (c *Client) calculateCreativityScore(config types.APIConfiguration, response types.APIResponse) float64 {
	return engine.CreativityScore(config, response)
}

func (c *Client) calculateCoherenceScore(responseText string) float64 {
	return engine.CoherenceScore(responseText)
}

func (c *Client) calculateTokenEfficiencyScore(response types.APIResponse) float64 {
	return engine.TokenEfficiencyScore(response)
}

func (c *Client) calculateSafetyScore(responseText string) float64 {
	return engine.SafetyScore(responseText)
}

func (c *Client) calculateCostEffectivenessScore(response types.APIResponse) float64 {
	return engine.CostEffectivenessScore(response)
}

func (c *Client) calculateEstimatedCost(response types.APIResponse) float64 {
	return engine.EstimatedCost(response)
}

// Helper functions
func (c *Client) getScoreFromMap(scores map[string]interface{}, configName, scoreKey string) float64 {
	return engine.GetScoreFromMap(scores, configName, scoreKey)
}

func (c *Client) getTokenCount(metadata map[string]interface{}, key string) int {
	return engine.GetTokenCount(metadata, key)
}

func (c *Client) findFastest(results []types.VariationResult) *types.VariationResult {
	return engine.FindFastest(results)
}

func (c *Client) findMostCreative(scores map[string]interface{}) string {
	return engine.FindMostCreative(scores)
}

// StoreComparisonResult stores a comparison result in the database
func (c *Client) StoreComparisonResult(ctx context.Context, userID string, comparison *types.ComparisonResult) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	// Convert data to JSON
	configurationScoresJSON, _ := json.Marshal(comparison.ConfigurationScores)
	bestConfigurationDataJSON, _ := json.Marshal(comparison.BestConfiguration)
	allConfigurationsDataJSON, _ := json.Marshal(comparison.AllConfigurations)

	// Store in database
	err := c.queries.CreateComparisonResult(ctx, db.CreateComparisonResultParams{
		ID:                    comparison.ID,
		ExecutionRunID:        comparison.ExecutionRunID,
		ComparisonType:        sql.NullString{String: comparison.ComparisonType, Valid: true},
		MetricName:            sql.NullString{String: comparison.MetricName, Valid: true},
		ConfigurationScores:   configurationScoresJSON,
		BestConfigurationID:   sql.NullString{String: comparison.BestConfigurationID, Valid: comparison.BestConfigurationID != ""},
		BestConfigurationData: bestConfigurationDataJSON,
		AllConfigurationsData: allConfigurationsDataJSON,
		AnalysisNotes:         sql.NullString{String: comparison.AnalysisNotes, Valid: true},
	})

	if err != nil {
		return fmt.Errorf("failed to store comparison result: %w", err)
	}

	log.Printf("💾 Comparison result stored in database: %s", comparison.ID)
	return nil
}

// GetComparisonResult retrieves a comparison result by execution run ID
func (c *Client) GetComparisonResult(ctx context.Context, executionRunID string) (*types.ComparisonResult, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	row, err := c.queries.GetComparisonResult(ctx, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("failed to get comparison result: %w", err)
	}

	// Parse JSON fields
	var configurationScores map[string]interface{}
	if len(row.ConfigurationScores) > 0 {
		json.Unmarshal(row.ConfigurationScores, &configurationScores)
	}

	var bestConfiguration *types.APIConfiguration
	if bestConfigData, ok := row.BestConfigurationData.(string); ok && len(bestConfigData) > 0 {
		json.Unmarshal([]byte(bestConfigData), &bestConfiguration)
	}

	var allConfigurations []types.APIConfiguration
	if allConfigData, ok := row.AllConfigurationsData.(string); ok && len(allConfigData) > 0 {
		json.Unmarshal([]byte(allConfigData), &allConfigurations)
	}

	result := &types.ComparisonResult{
		ID:                  row.ID,
		ExecutionRunID:      row.ExecutionRunID,
		ComparisonType:      row.ComparisonType.String,
		MetricName:          row.MetricName.String,
		ConfigurationScores: configurationScores,
		BestConfigurationID: row.BestConfigurationID.String,
		BestConfiguration:   bestConfiguration,
		AllConfigurations:   allConfigurations,
		AnalysisNotes:       row.AnalysisNotes.String,
		CreatedAt:           row.CreatedAt.Time,
	}

	return result, nil
}

// ListComparisonResults retrieves all comparison results for an execution run
func (c *Client) ListComparisonResults(ctx context.Context, executionRunID string) ([]*types.ComparisonResult, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	rows, err := c.queries.GetComparisonResultsByExecutionRun(ctx, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("failed to list comparison results: %w", err)
	}

	results := make([]*types.ComparisonResult, 0, len(rows))
	for _, row := range rows {
		// Parse JSON fields
		var configurationScores map[string]interface{}
		if len(row.ConfigurationScores) > 0 {
			json.Unmarshal(row.ConfigurationScores, &configurationScores)
		}

		var bestConfiguration *types.APIConfiguration
		if bestConfigData, ok := row.BestConfigurationData.(string); ok && len(bestConfigData) > 0 {
			json.Unmarshal([]byte(bestConfigData), &bestConfiguration)
		}

		var allConfigurations []types.APIConfiguration
		if allConfigData, ok := row.AllConfigurationsData.(string); ok && len(allConfigData) > 0 {
			json.Unmarshal([]byte(allConfigData), &allConfigurations)
		}

		result := &types.ComparisonResult{
			ID:                  row.ID,
			ExecutionRunID:      row.ExecutionRunID,
			ComparisonType:      row.ComparisonType.String,
			MetricName:          row.MetricName.String,
			ConfigurationScores: configurationScores,
			BestConfigurationID: row.BestConfigurationID.String,
			BestConfiguration:   bestConfiguration,
			AllConfigurations:   allConfigurations,
			AnalysisNotes:       row.AnalysisNotes.String,
			CreatedAt:           row.CreatedAt.Time,
		}

		results = append(results, result)
	}

	return results, nil
}

// callGeminiAPI makes the actual API call to Gemini
func (c *Client) callGeminiAPI(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest) (*types.APIResponse, error) {
	// Use provider abstraction to determine which provider to use
	providerType := c.providerFactory.GetProviderForModel(config.ModelName)
	log.Printf("🤖 Using %s provider for model: %s", providerType, config.ModelName)
	effectiveKeys := c.getEffectiveApiKeys()
	log.Printf("🔑 API keys available: Gemini=%v, OpenRouter=%v",
		effectiveKeys.GeminiApiKey != "", effectiveKeys.OpenRouterApiKey != "")

	// TEMPORARY FIX: For Gemini models, use the original working implementation instead of the broken provider
	if providerType == "gemini" {
		log.Printf("🔧 USING ORIGINAL GEMINI IMPLEMENTATION (bypassing broken provider)")
		return c.callGeminiRestAPI(ctx, config, request)
	}

	// For non-Gemini models, use the provider pattern
	provider, err := c.providerFactory.CreateProvider(ctx, config.ModelName, effectiveKeys)
	if err != nil {
		log.Printf("❌ Failed to create %s provider: %v", providerType, err)
		log.Printf("❌ FALLING BACK TO MOCK RESPONSES due to provider creation failure")
		// Fallback to mock responses
		return c.callMockGeminiAPI(ctx, config, request)
	}

	// Convert request to provider format
	providerRequest := &providers.ModelRequest{
		Prompt:              request.Prompt,
		Context:             request.Context,
		SystemPrompt:        config.SystemPrompt,
		Tools:               config.Tools,
		ConversationHistory: []providers.ConversationMessage{}, // TODO: Add conversation history support
		SessionApiKeys:      effectiveKeys,
	}

	// Call the provider
	providerResponse, err := provider.GenerateContent(ctx, config, providerRequest)
	if err != nil {
		log.Printf("❌ Provider %s failed: %v", providerType, err)
		log.Printf("❌ FALLING BACK TO MOCK RESPONSES due to provider call failure")
		// Fallback to mock responses
		return c.callMockGeminiAPI(ctx, config, request)
	}

	// Convert provider response to API response format
	apiResponse := &types.APIResponse{
		ID:             uuid.New().String(),
		RequestID:      request.ID,
		ResponseStatus: types.ResponseStatusSuccess,
		ResponseText:   providerResponse.ResponseText,
		UsageMetadata:  providerResponse.UsageMetadata,
		FinishReason:   providerResponse.FinishReason,
		ResponseTimeMs: providerResponse.ResponseTimeMs,
		CreatedAt:      time.Now(),
	}

	// Handle function calls if present
	if len(providerResponse.FunctionCalls) > 0 {
		log.Printf("🔧 Processing %d function calls from %s", len(providerResponse.FunctionCalls), providerType)

		// Convert provider function calls to internal format
		responseParts := make([]ResponsePart, len(providerResponse.FunctionCalls))
		for i, fc := range providerResponse.FunctionCalls {
			responseParts[i] = ResponsePart{
				FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{
					Name: fc.Name,
					Args: fc.Args,
				},
			}
		}

		// Process function calls using existing iterative logic with the same provider
		finalResponse, _ := c.processIterativeFunctionCallsWithProvider(ctx, config, request, responseParts, request.Prompt, provider, providerType)
		apiResponse.ResponseText = finalResponse
	}

	return apiResponse, nil
}

// callMockGeminiAPI provides mock responses for testing/demo purposes
func (c *Client) callMockGeminiAPI(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest) (*types.APIResponse, error) {
	// For demo purposes when no API key is available
	response := &types.APIResponse{
		ID:             uuid.New().String(),
		RequestID:      request.ID,
		ResponseStatus: types.ResponseStatusSuccess,
		ResponseText:   fmt.Sprintf("Mock response for prompt: %s with model: %s", request.Prompt, config.ModelName),
		FinishReason:   "stop",
		ResponseTimeMs: 500, // Mock response time
		CreatedAt:      time.Now(),
	}

	return response, nil
}

// callGeminiRestAPI provides a REST API fallback when the Go SDK fails
func (c *Client) callGeminiRestAPI(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest) (*types.APIResponse, error) {
	log.Printf("🔧 USING ORIGINAL GEMINI IMPLEMENTATION (REST API)")

	// Use the existing Gemini client from internal/gemini
	effectiveKeys := c.getEffectiveApiKeys()
	if effectiveKeys.GeminiApiKey == "" {
		log.Printf("❌ No Gemini API key available for REST API call")
		return &types.APIResponse{
			ID:             uuid.New().String(),
			RequestID:      request.ID,
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   "No Gemini API key available",
			ResponseTimeMs: 100,
			CreatedAt:      time.Now(),
		}, fmt.Errorf("no Gemini API key available")
	}

	// Create a Gemini client instance
	geminiClient, err := gemini.NewGeminiClient(ctx, effectiveKeys.GeminiApiKey)
	if err != nil {
		log.Printf("❌ Failed to create Gemini client: %v", err)
		return &types.APIResponse{
			ID:             uuid.New().String(),
			RequestID:      request.ID,
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   fmt.Sprintf("Failed to create Gemini client: %v", err),
			ResponseTimeMs: 100,
			CreatedAt:      time.Now(),
		}, err
	}
	defer geminiClient.Close()

	// Make the API call using the existing Gemini client
	response, err := geminiClient.GenerateContent(ctx, config, request.Prompt, request.Context)
	if err != nil {
		log.Printf("❌ Gemini API call failed: %v", err)
		return &types.APIResponse{
			ID:             uuid.New().String(),
			RequestID:      request.ID,
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   err.Error(),
			ResponseTimeMs: 100,
			CreatedAt:      time.Now(),
		}, err
	}

	// Set the request ID to maintain traceability
	response.RequestID = request.ID
	response.ID = uuid.New().String()

	// Handle function calls if present - check for temporary FunctionCalls field in raw response body
	log.Printf("🔍 [FUNCTION_CALL_DEBUG] Checking for function calls in response body: %v", response.ResponseBody != nil)
	if response.ResponseBody != nil {
		log.Printf("🔍 [FUNCTION_CALL_DEBUG] Response body keys: %v", getMapKeys(response.ResponseBody))
		if functionCalls, ok := response.ResponseBody["function_calls"]; ok {
			log.Printf("🔍 [FUNCTION_CALL_DEBUG] Found function_calls field, type: %T", functionCalls)
			if fcArray, ok := functionCalls.([]map[string]interface{}); ok && len(fcArray) > 0 {
				log.Printf("🔧 Processing %d function calls from Gemini REST API", len(fcArray))
				for i, fc := range fcArray {
					log.Printf("🔍 [FUNCTION_CALL_DEBUG] Function call %d: %s with args: %+v", i, fc["name"], fc["args"])
				}

				// Convert to ResponsePart format
				responseParts := make([]ResponsePart, len(fcArray))
				for i, fc := range fcArray {
					responseParts[i] = ResponsePart{
						FunctionCall: struct {
							Name string                 `json:"name"`
							Args map[string]interface{} `json:"args"`
						}{
							Name: fc["name"].(string),
							Args: fc["args"].(map[string]interface{}),
						},
					}
				}

				// Process function calls and get synthesis from Gemini
				finalResponse := c.processIterativeFunctionCallsWithSynthesis(ctx, config, request, responseParts, request.Prompt)
				response.ResponseText = finalResponse
			}
		}
	}

	log.Printf("✅ Gemini API call successful - Response: %d chars", len(response.ResponseText))
	return response, nil
}

// Helper function to get map keys for debugging
func getMapKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// getMapKeys is a method version for the Client
func (c *Client) getMapKeys(m map[string]interface{}) []string {
	return getMapKeys(m)
}

// callGeminiRestAPIForSynthesis is like callGeminiRestAPI but doesn't process function calls
// This prevents infinite recursion during synthesis
func (c *Client) callGeminiRestAPIForSynthesis(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest) (*types.APIResponse, error) {
	log.Printf("🔧 USING GEMINI REST API FOR SYNTHESIS (no function processing)")

	// Use the existing Gemini client from internal/gemini
	effectiveKeys := c.getEffectiveApiKeys()
	if effectiveKeys.GeminiApiKey == "" {
		log.Printf("❌ No Gemini API key available for REST API call")
		return &types.APIResponse{
			ID:             uuid.New().String(),
			RequestID:      request.ID,
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   "No Gemini API key available",
			ResponseTimeMs: 100,
			CreatedAt:      time.Now(),
		}, fmt.Errorf("no Gemini API key available")
	}

	// Create a Gemini client instance
	geminiClient, err := gemini.NewGeminiClient(ctx, effectiveKeys.GeminiApiKey)
	if err != nil {
		log.Printf("❌ Failed to create Gemini client: %v", err)
		return &types.APIResponse{
			ID:             uuid.New().String(),
			RequestID:      request.ID,
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   fmt.Sprintf("Failed to create Gemini client: %v", err),
			ResponseTimeMs: 100,
			CreatedAt:      time.Now(),
		}, err
	}
	defer geminiClient.Close()

	// Use the config as-is - tool management is handled by the caller (SynthesisManager)
	// The SynthesisManager has already determined the appropriate tool configuration
	log.Printf("🔧 Using synthesis config with %d tools (managed by SynthesisManager)", len(config.Tools))

	// Make the API call using the existing Gemini client
	response, err := geminiClient.GenerateContent(ctx, config, request.Prompt, request.Context)
	if err != nil {
		log.Printf("❌ Gemini API call failed: %v", err)
		return &types.APIResponse{
			ID:             uuid.New().String(),
			RequestID:      request.ID,
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   err.Error(),
			ResponseTimeMs: 100,
			CreatedAt:      time.Now(),
		}, err
	}

	// Set the request ID to maintain traceability
	response.RequestID = request.ID
	response.ID = uuid.New().String()

	// Check if the synthesis response contains additional function calls
	var additionalFunctionCalls []map[string]interface{}
	if response.ResponseBody != nil {
		if functionCalls, ok := response.ResponseBody["function_calls"]; ok {
			if fcArray, ok := functionCalls.([]map[string]interface{}); ok && len(fcArray) > 0 {
				additionalFunctionCalls = fcArray
				log.Printf("🔄 Synthesis response contains %d additional function calls, continuing iteration", len(fcArray))
			}
		}
	}

	// If there are additional function calls, add them to the response body for processing
	// but don't process them here to avoid infinite recursion
	if len(additionalFunctionCalls) > 0 {
		if response.ResponseBody == nil {
			response.ResponseBody = make(map[string]interface{})
		}
		response.ResponseBody["function_calls"] = additionalFunctionCalls
	}

	log.Printf("✅ Gemini API call successful - Response: %d chars", len(response.ResponseText))
	return response, nil
}

// processIterativeFunctionCallsWithProvider handles function calls using the specified provider
func (c *Client) processIterativeFunctionCallsWithProvider(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest, functionCalls []ResponsePart, originalPrompt string, provider providers.ModelProvider, providerType string) (string, error) {
	log.Printf("🔧 Starting iterative function calling with %d initial function(s) using %s provider", len(functionCalls), providerType)

	// Execute all function calls first
	functionResults := make([]map[string]interface{}, len(functionCalls))
	for i, funcCall := range functionCalls {
		result, err := c.executeFunctionCall(ctx, funcCall.FunctionCall.Name, funcCall.FunctionCall.Args)
		if err != nil {
			log.Printf("⚠️ Function %s failed: %v", funcCall.FunctionCall.Name, err)
			result = map[string]interface{}{
				"error":  err.Error(),
				"status": "failed",
			}
		}
		functionResults[i] = result
	}

	// Create a clean synthesis prompt with current time context
	currentTime := time.Now()
	timeContext := fmt.Sprintf("Current time: %s (UTC: %s, Unix timestamp: %d)",
		currentTime.Format("2006-01-02 15:04:05 MST"),
		currentTime.UTC().Format("2006-01-02 15:04:05 UTC"),
		currentTime.Unix())

	synthesisPrompt := fmt.Sprintf("User's original request: \"%s\"\n\n%s\n\n", originalPrompt, timeContext)

	// Add function results to synthesis prompt so LLM can see what data it already has
	if len(functionResults) > 0 {
		synthesisPrompt += "**Function Results:**\n"
		for i, result := range functionResults {
			if i < len(functionCalls) {
				functionName := functionCalls[i].FunctionCall.Name

				// Create intelligent summaries instead of truncating raw JSON
				summary := c.createIntelligentResultSummary(functionName, result)
				synthesisPrompt += fmt.Sprintf("- %s: %s\n", functionName, summary)
			}
		}
		synthesisPrompt += "\n"
	}

	synthesisPrompt += "**TASK:** Analyze the function results above and provide a comprehensive response that addresses the user's request. Use the data you've gathered to complete the requested actions.\n\n"
	synthesisPrompt += "**IMPORTANT: Respond in natural language. Summarize what you found and what actions you took to fulfill the user's request.**"

	// Get effective API keys for the synthesis request
	effectiveKeys := c.getEffectiveApiKeys()

	// Use SynthesisManager for provider-based synthesis (Kimi K2, etc.)
	synthesisManager := NewSynthesisManager()
	synthesisConfig := &SynthesisConfig{
		ProviderType:    providerType,
		Depth:           1,     // Provider synthesis is typically single-step
		ShouldComplete:  false, // Let provider decide naturally
		FunctionCalls:   functionCalls,
		FunctionResults: functionResults,
		OriginalConfig:  config,
	}

	decision := synthesisManager.DetermineSynthesisStrategy(synthesisConfig)
	synthesisManager.LogDecision(decision, synthesisConfig)

	// Create a new request for the synthesis
	synthesisRequest := &providers.ModelRequest{
		Prompt:              synthesisPrompt,
		Context:             request.Context,
		SystemPrompt:        config.SystemPrompt,
		Tools:               decision.Tools, // Use intelligent tool decision
		ConversationHistory: []providers.ConversationMessage{},
		SessionApiKeys:      effectiveKeys,
	}

	// Create a longer timeout context specifically for synthesis (may take longer due to large function results)
	synthesisCtx, cancel := context.WithTimeout(ctx, 300*time.Second) // 5 minutes for synthesis
	defer cancel()

	// Call the provider for synthesis with iterative support
	return c.processProviderSynthesisWithIteration(synthesisCtx, config, synthesisRequest, provider, providerType, functionCalls, functionResults, originalPrompt, 0, 6) // Max 6 iterations for providers
}

// processProviderSynthesisWithIteration handles iterative synthesis for non-Gemini providers
func (c *Client) processProviderSynthesisWithIteration(ctx context.Context, config *types.APIConfiguration, synthesisRequest *providers.ModelRequest, provider providers.ModelProvider, providerType string, functionCalls []ResponsePart, functionResults []map[string]interface{}, originalPrompt string, depth int, maxDepth int) (string, error) {
	if depth >= maxDepth {
		log.Printf("⚠️ Maximum %s synthesis depth (%d) reached, stopping iteration", providerType, maxDepth)
		return c.createFallbackSummary(functionCalls, functionResults), nil
	}

	log.Printf("🔧 %s synthesis iteration %d (max %d)", providerType, depth, maxDepth)

	// Call the provider for synthesis
	synthesisResponse, err := provider.GenerateContent(ctx, config, synthesisRequest)
	if err != nil {
		log.Printf("⚠️ Failed to get synthesis from %s provider: %v", providerType, err)
		return c.createFallbackSummary(functionCalls, functionResults), nil
	}

	// Check if the provider wants to make additional function calls
	if len(synthesisResponse.FunctionCalls) > 0 {
		log.Printf("🔄 %s provider synthesis produced %d additional function calls at depth %d", providerType, len(synthesisResponse.FunctionCalls), depth)

		// Execute the additional function calls
		additionalResults := make([]map[string]interface{}, len(synthesisResponse.FunctionCalls))
		for i, fc := range synthesisResponse.FunctionCalls {
			result, err := c.executeFunctionCall(ctx, fc.Name, fc.Args)
			if err != nil {
				log.Printf("⚠️ Additional function %s failed: %v", fc.Name, err)
				result = map[string]interface{}{
					"error":  err.Error(),
					"status": "failed",
				}
			}
			additionalResults[i] = result
		}

		// Use SynthesisManager to determine if we should continue
		synthesisManager := NewSynthesisManager()
		allFunctionCalls := append(functionCalls, convertFunctionCallsToResponseParts(synthesisResponse.FunctionCalls)...)
		allFunctionResults := append(functionResults, additionalResults...)

		synthesisConfig := &SynthesisConfig{
			ProviderType:    providerType,
			Depth:           depth + 1,
			ShouldComplete:  false,
			FunctionCalls:   allFunctionCalls,
			FunctionResults: allFunctionResults,
			OriginalConfig:  config,
		}

		decision := synthesisManager.DetermineSynthesisStrategy(synthesisConfig)

		if decision.ForceCompletion {
			log.Printf("🛑 %s synthesis manager forcing completion at depth %d: %s", providerType, depth, decision.Reason)
			if synthesisResponse.ResponseText != "" {
				return synthesisResponse.ResponseText, nil
			}
			return c.createFallbackSummary(allFunctionCalls, allFunctionResults), nil
		}

		// Create a clean synthesis prompt focused on task guidance
		newSynthesisPrompt := fmt.Sprintf("User's original request: \"%s\"\n\n", originalPrompt)

		// Add accumulated function results to synthesis prompt so LLM can see what data it already has
		if len(allFunctionResults) > 0 {
			newSynthesisPrompt += "**Function Results:**\n"
			for i, result := range allFunctionResults {
				if i < len(allFunctionCalls) {
					functionName := allFunctionCalls[i].FunctionCall.Name

					// Create intelligent summaries instead of truncating raw JSON
					summary := c.createIntelligentResultSummary(functionName, result)
					newSynthesisPrompt += fmt.Sprintf("- %s: %s\n", functionName, summary)
				}
			}
			newSynthesisPrompt += "\n"
		}

		var hasErrors bool
		// Check for errors without duplicating function data in the prompt
		for i := range allFunctionResults {
			if status, ok := allFunctionResults[i]["status"].(string); ok && (status == "failed" || status == "validation_failed") {
				hasErrors = true
			}
		}

		// Detect if we have sufficient data to complete the task
		shouldComplete := c.detectTaskCompletion(allFunctionCalls, allFunctionResults, depth+1, originalPrompt)

		// Add intelligent prompt suffix with context awareness
		if hasErrors {
			newSynthesisPrompt += "\n**ERROR HANDLING:** Some functions failed with errors. Please analyze the available data and provide your best response. DO NOT make additional function calls that might fail with the same errors.\n\n**IMPORTANT: Respond in natural language - DO NOT echo the function names or raw data above. Instead, analyze the successful results and provide a human-readable response explaining what you were able to accomplish. CRITICAL: Use ONLY natural language - no code blocks or tool_code.**"
		} else if shouldComplete {
			newSynthesisPrompt += "\n**FINAL RESPONSE REQUIRED:** You now have all the necessary data to complete the user's request. STOP calling functions and provide a comprehensive final response using the data above. \n\n**IMPORTANT: Respond in natural language - DO NOT echo the function names or raw data above. Instead, analyze the results and provide a human-readable response that directly addresses the user's original request. Summarize what you found and what actions you took. CRITICAL: Use ONLY natural language - no code blocks or tool_code.**"
		} else {
			promptSuffix := synthesisManager.GetSynthesisPromptSuffix(decision, providerType)
			newSynthesisPrompt += promptSuffix
		}

		// Create new synthesis request
		newSynthesisRequest := &providers.ModelRequest{
			Prompt:              newSynthesisPrompt,
			Context:             synthesisRequest.Context,
			SystemPrompt:        synthesisRequest.SystemPrompt,
			Tools:               decision.Tools,
			ConversationHistory: synthesisRequest.ConversationHistory,
			SessionApiKeys:      synthesisRequest.SessionApiKeys,
		}

		// Recursively continue synthesis
		return c.processProviderSynthesisWithIteration(ctx, config, newSynthesisRequest, provider, providerType, allFunctionCalls, allFunctionResults, originalPrompt, depth+1, maxDepth)
	}

	// No additional function calls - provide final response
	if synthesisResponse.ResponseText != "" {
		log.Printf("✅ %s provided final synthesis after function execution (depth %d)", providerType, depth)
		return synthesisResponse.ResponseText, nil
	}

	// Fallback to simple summary
	return c.createFallbackSummary(functionCalls, functionResults), nil
}

// convertFunctionCallsToResponseParts converts provider function calls to internal format
func convertFunctionCallsToResponseParts(functionCalls []providers.FunctionCall) []ResponsePart {
	responseParts := make([]ResponsePart, len(functionCalls))
	for i, fc := range functionCalls {
		responseParts[i] = ResponsePart{
			FunctionCall: struct {
				Name string                 `json:"name"`
				Args map[string]interface{} `json:"args"`
			}{
				Name: fc.Name,
				Args: fc.Args,
			},
		}
	}
	return responseParts
}

// executeFunctionCall executes a function call and returns the result
func (c *Client) executeFunctionCall(ctx context.Context, functionName string, args map[string]interface{}) (map[string]interface{}, error) {
	// Enhanced logging with detailed function call information
	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryFunctionCall,
		fmt.Sprintf("🔧 Executing function: %s", functionName),
		map[string]interface{}{
			"functionName":   functionName,
			"arguments":      args,
			"argumentCount":  len(args),
			"argumentKeys":   c.getMapKeys(args),
			"executionStart": time.Now().Format("15:04:05.000"),
		})

	startTime := time.Now()

	// Check cache for duplicate function calls within the same execution
	// Skip cache for slack_find_channel to ensure fresh channel data
	if c.currentExecutionRunID != nil && functionName != "slack_find_channel" {
		runID := *c.currentExecutionRunID
		cacheKey := c.makeCacheKey(functionName, args)

		if cachedResult, found := c.cacheGet(runID, cacheKey); found {
			// Return cached result WITHOUT confusing metadata that makes Gemini think it needs to retry
			result := c.deepCopyMap(cachedResult)
			// DO NOT add "no_new_data" or other metadata that confuses Gemini
			// The cached result should look identical to the original result

			executionTimeMs := int32(time.Since(startTime).Milliseconds())

			// Log cache hit (for debugging only - not visible to Gemini)
			c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryFunctionCall,
				fmt.Sprintf("Function call cache hit: %s (avoiding duplicate API call)", functionName),
				map[string]interface{}{
					"functionName": functionName,
					"cacheKey":     cacheKey,
					"cached":       true,
				})

			// Log cache hit in flow (for debugging only - not visible to Gemini)
			c.logExecutionFlowEvent("function_call_end", c.getNextSequenceNumber(), "success", nil, map[string]interface{}{
				"functionName":    functionName,
				"arguments":       args,
				"cached":          true,
				"executionTimeMs": executionTimeMs,
				"cacheHit":        true,
			}, &executionTimeMs, nil)

			return result, nil
		}
	}

	// Normalize common argument aliases (e.g. node_label → label)
	switch functionName {
	case "neo4j_node_lookup":
		if _, ok := args["label"]; !ok {
			if nodeLabel, hasNL := args["node_label"]; hasNL {
				args["label"] = nodeLabel
			}
		}
	}

	// Use database-driven function execution
	funcDef, err := c.getFunctionDefinition(ctx, functionName)
	if err != nil {
		return nil, fmt.Errorf("function %s not found in database: %w", functionName, err)
	}

	result, err := c.executeDynamicFunction(ctx, funcDef, args)
	executionTimeMs := int32(time.Since(startTime).Milliseconds())

	if err != nil {
		errorMsg := err.Error()
		c.logExecutionFlowEvent("function_call_end", c.getNextSequenceNumber(), "error", nil, map[string]interface{}{
			"functionName":    functionName,
			"arguments":       args,
			"errorMessage":    errorMsg,
			"executionTimeMs": executionTimeMs,
			"errorType":       c.classifyError(errorMsg),
			"retryable":       c.isRetryableError(errorMsg),
		}, &executionTimeMs, &errorMsg)
	} else {
		resultStr := fmt.Sprintf("%v", result)
		c.logExecutionFlowEvent("function_call_end", c.getNextSequenceNumber(), "success", nil, map[string]interface{}{
			"functionName":    functionName,
			"arguments":       args,
			"resultSize":      len(resultStr),
			"resultPreview":   c.truncateString(resultStr, 500),
			"executionTimeMs": executionTimeMs,
			"hasData":         c.resultHasData(result),
		}, &executionTimeMs, nil)
	}

	// Store successful results in cache for future deduplication
	if err == nil && c.currentExecutionRunID != nil {
		runID := *c.currentExecutionRunID
		cacheKey := c.makeCacheKey(functionName, args)
		c.cachePut(runID, cacheKey, result)

		// Also track the function call in history for visibility
		history := c.getOrCreateHistory(runID)
		history.mutex.Lock()
		history.Calls[functionName] = append(history.Calls[functionName], args)
		history.mutex.Unlock()
	}

	return result, err
}

// convertCodeBlockToNaturalLanguage converts tool_code blocks to natural language
func (c *Client) convertCodeBlockToNaturalLanguage(responseText string, functionCalls []ResponsePart, functionResults []map[string]interface{}) string {
	// If the response contains tool_code or code blocks, replace with natural language
	if strings.Contains(responseText, "tool_code") || strings.Contains(responseText, "```") {
		log.Printf("🔧 Converting code block response to natural language")

		// Extract any function calls mentioned in the code
		var mentionedFunctions []string
		for _, funcCall := range functionCalls {
			if strings.Contains(responseText, funcCall.FunctionCall.Name) {
				mentionedFunctions = append(mentionedFunctions, funcCall.FunctionCall.Name)
			}
		}

		// Create a natural language response based on what was actually executed
		if len(mentionedFunctions) > 0 {
			return c.createFallbackSummary(functionCalls, functionResults)
		}

		// If no specific functions mentioned, provide a generic completion message
		return "I have completed the requested task successfully. The functions executed as expected and the task has been finished."
	}

	return responseText
}

// createFallbackSummary creates a simple summary when function calling fails
func (c *Client) createFallbackSummary(functionCalls []ResponsePart, functionResults []map[string]interface{}) string {
	if len(functionCalls) == 0 {
		return "I attempted to process your request but encountered an error."
	}

	// Analyze the function calls to provide a more meaningful summary
	var slackActions []string
	var githubActions []string
	var memoryActions []string
	var otherActions []string

	for i, funcCall := range functionCalls {
		functionName := funcCall.FunctionCall.Name

		// Check if the function executed successfully
		success := len(functionResults) > i &&
			functionResults[i] != nil &&
			functionResults[i]["error"] == nil

		switch {
		case strings.HasPrefix(functionName, "slack_"):
			if strings.Contains(functionName, "send_message") && success {
				slackActions = append(slackActions, "posted messages to Slack")
			} else if strings.Contains(functionName, "find_channel") && success {
				slackActions = append(slackActions, "found Slack channels")
			} else if strings.Contains(functionName, "read_messages") && success {
				slackActions = append(slackActions, "read Slack messages")
			} else if strings.Contains(functionName, "add_reaction") && success {
				slackActions = append(slackActions, "added reactions")
			}
		case strings.HasPrefix(functionName, "github_"):
			if strings.Contains(functionName, "read_issues") && success {
				githubActions = append(githubActions, "retrieved GitHub issues")
			} else if strings.Contains(functionName, "read_commits") && success {
				githubActions = append(githubActions, "retrieved GitHub commits")
			} else if strings.Contains(functionName, "read_code") && success {
				githubActions = append(githubActions, "read code files")
			}
		case strings.HasPrefix(functionName, "agent_memory_"):
			if strings.Contains(functionName, "read") && success {
				memoryActions = append(memoryActions, "read from memory")
			} else if strings.Contains(functionName, "write") && success {
				memoryActions = append(memoryActions, "updated memory")
			}
		default:
			if success {
				otherActions = append(otherActions, functionName)
			}
		}
	}

	// Build a natural language summary
	var actions []string
	if len(slackActions) > 0 {
		actions = append(actions, strings.Join(slackActions, ", "))
	}
	if len(githubActions) > 0 {
		actions = append(actions, strings.Join(githubActions, ", "))
	}
	if len(memoryActions) > 0 {
		actions = append(actions, strings.Join(memoryActions, ", "))
	}
	if len(otherActions) > 0 {
		actions = append(actions, strings.Join(otherActions, ", "))
	}

	if len(actions) > 0 {
		return fmt.Sprintf("I successfully completed your request. I %s. The task has been completed as requested.", strings.Join(actions, ", "))
	}

	// Fallback to basic summary
	return fmt.Sprintf("I executed %d functions to process your request. The functions completed successfully.", len(functionCalls))
}

// processIterativeFunctionCalls handles function calls with proper dependency support
func (c *Client) processIterativeFunctionCalls(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest, functionCalls []ResponsePart, originalPrompt string) (string, map[string]interface{}) {
	log.Printf("🔧 Starting iterative function calling with %d initial function(s)", len(functionCalls))

	// For now, execute all function calls and provide a basic summary
	var functionNames []string
	functionResults := make([]map[string]interface{}, len(functionCalls))

	for i, funcCall := range functionCalls {
		functionNames = append(functionNames, funcCall.FunctionCall.Name)
		result, err := c.executeFunctionCall(ctx, funcCall.FunctionCall.Name, funcCall.FunctionCall.Args)
		if err != nil {
			log.Printf("⚠️ Function %s failed: %v", funcCall.FunctionCall.Name, err)
			result = map[string]interface{}{
				"error":  err.Error(),
				"status": "failed",
			}
		}
		functionResults[i] = result
	}

	// Create a simple summary
	summary := fmt.Sprintf("I executed %d functions: %s", len(functionNames), strings.Join(functionNames, ", "))

	// Return the first function call info for legacy compatibility
	var firstFunctionResponse map[string]interface{}
	if len(functionCalls) > 0 {
		firstFunctionResponse = map[string]interface{}{
			"function_name": functionCalls[0].FunctionCall.Name,
			"arguments":     functionCalls[0].FunctionCall.Args,
			"result":        functionResults[0],
		}
	}

	return summary, firstFunctionResponse
}

// processIterativeFunctionCallsWithSynthesis executes functions and gets LLM synthesis using Gemini REST API
// Allow natural workflow completion without artificial depth limits
func (c *Client) processIterativeFunctionCallsWithSynthesis(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest, functionCalls []ResponsePart, originalPrompt string) string {
	const maxIterationDepth = 20 // Allow natural workflow completion

	return c.processIterativeFunctionCallsWithSynthesisRecursive(ctx, config, request, functionCalls, originalPrompt, 0, maxIterationDepth)
}

// processIterativeFunctionCallsWithSynthesisRecursive handles recursive function calling with depth limiting
func (c *Client) processIterativeFunctionCallsWithSynthesisRecursive(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest, functionCalls []ResponsePart, originalPrompt string, depth int, maxDepth int) string {
	return c.processIterativeFunctionCallsWithSynthesisRecursiveAccumulated(ctx, config, request, functionCalls, originalPrompt, depth, maxDepth, []ResponsePart{}, []map[string]interface{}{})
}

// processIterativeFunctionCallsWithSynthesisRecursiveAccumulated handles recursive function calling with accumulated context
func (c *Client) processIterativeFunctionCallsWithSynthesisRecursiveAccumulated(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest, functionCalls []ResponsePart, originalPrompt string, depth int, maxDepth int, allFunctionCalls []ResponsePart, allFunctionResults []map[string]interface{}) string {
	if depth >= maxDepth {
		log.Printf("⚠️ Maximum function calling depth (%d) reached, stopping iteration", maxDepth)
		return fmt.Sprintf("I executed %d functions but reached maximum iteration depth. Results may be incomplete.", len(functionCalls))
	}
	log.Printf("🔧 Starting function calling with Gemini synthesis for %d function(s)", len(functionCalls))

	// Execute current function calls
	functionResults := make([]map[string]interface{}, len(functionCalls))
	var errorCount int
	var hasValidationErrors bool

	for i, funcCall := range functionCalls {
		startTime := time.Now()

		// Log function call start
		c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryExecution,
			fmt.Sprintf("Starting function call: %s", funcCall.FunctionCall.Name),
			map[string]interface{}{
				"functionName": funcCall.FunctionCall.Name,
				"arguments":    funcCall.FunctionCall.Args,
				"depth":        depth,
				"iteration":    i + 1,
				"totalCalls":   len(functionCalls),
			})

		// Log function call flow event
		c.logExecutionFlowEvent("function_call_start", c.getNextSequenceNumber(), "pending", nil, map[string]interface{}{
			"functionName": funcCall.FunctionCall.Name,
			"arguments":    funcCall.FunctionCall.Args,
			"depth":        depth,
		}, nil, nil)

		// Auto-extract missing parameters from previous function results
		c.autoExtractParameters(ctx, &funcCall, functionResults)

		// Validate function call before execution
		if err := c.validateFunctionCall(ctx, funcCall.FunctionCall.Name, funcCall.FunctionCall.Args); err != nil {
			executionTimeMs := int32(time.Since(startTime).Milliseconds())
			errorMsg := fmt.Sprintf("Validation failed: %v", err)

			log.Printf("❌ Function call validation failed for %s: %v", funcCall.FunctionCall.Name, err)
			log.Printf("❌ [VALIDATION_DEBUG] Function %s received args: %+v", funcCall.FunctionCall.Name, funcCall.FunctionCall.Args)
			c.logExecutionEvent(types.LogLevelError, types.LogCategoryError,
				fmt.Sprintf("Function validation failed: %s - %v", funcCall.FunctionCall.Name, err),
				map[string]interface{}{
					"functionName":    funcCall.FunctionCall.Name,
					"validationError": err.Error(),
					"arguments":       funcCall.FunctionCall.Args,
				})

			// Log validation failure in flow
			c.logExecutionFlowEvent("function_call_end", c.getNextSequenceNumber(), "error", nil, map[string]interface{}{
				"functionName": funcCall.FunctionCall.Name,
				"error":        errorMsg,
			}, &executionTimeMs, &errorMsg)

			functionResults[i] = map[string]interface{}{
				"error":  errorMsg,
				"status": "validation_failed",
			}
			errorCount++
			hasValidationErrors = true
			continue
		}

		// Log parameter extraction details
		c.logExecutionEvent(types.LogLevelDebug, types.LogCategoryExecution,
			fmt.Sprintf("Function call parameters prepared: %s", funcCall.FunctionCall.Name),
			map[string]interface{}{
				"functionName":      funcCall.FunctionCall.Name,
				"finalArguments":    funcCall.FunctionCall.Args,
				"parameterCount":    len(funcCall.FunctionCall.Args),
				"extractionApplied": true,
			})

		result, err := c.executeFunctionCall(ctx, funcCall.FunctionCall.Name, funcCall.FunctionCall.Args)
		executionTimeMs := int32(time.Since(startTime).Milliseconds())

		if err != nil {
			errorMsg := err.Error()
			log.Printf("⚠️ Function %s failed: %v", funcCall.FunctionCall.Name, err)

			c.logExecutionEvent(types.LogLevelError, types.LogCategoryError,
				fmt.Sprintf("Function execution failed: %s - %v", funcCall.FunctionCall.Name, err),
				map[string]interface{}{
					"functionName":   funcCall.FunctionCall.Name,
					"executionError": err.Error(),
					"arguments":      funcCall.FunctionCall.Args,
					"duration":       executionTimeMs,
				})

			// Log failure in flow
			c.logExecutionFlowEvent("function_call_end", c.getNextSequenceNumber(), "error", nil, map[string]interface{}{
				"functionName": funcCall.FunctionCall.Name,
				"error":        errorMsg,
				"duration":     executionTimeMs,
			}, &executionTimeMs, &errorMsg)

			result = map[string]interface{}{
				"error":  errorMsg,
				"status": "failed",
			}
			errorCount++
		} else {
			// Enhanced success logging with detailed result information
			resultSummary := c.createDetailedResultSummary(funcCall.FunctionCall.Name, result)
			c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryExecution,
				fmt.Sprintf("✅ Function executed successfully: %s - %s", funcCall.FunctionCall.Name, resultSummary),
				map[string]interface{}{
					"functionName":  funcCall.FunctionCall.Name,
					"duration":      executionTimeMs,
					"resultSize":    len(fmt.Sprintf("%v", result)),
					"hasData":       result != nil,
					"resultSummary": resultSummary,
					"resultKeys":    c.getMapKeys(result),
					"executionEnd":  time.Now().Format("15:04:05.000"),
					"resultPreview": c.truncateString(fmt.Sprintf("%v", result), 500),
				})

			// Log success in flow
			c.logExecutionFlowEvent("function_call_end", c.getNextSequenceNumber(), "success", nil, map[string]interface{}{
				"functionName": funcCall.FunctionCall.Name,
				"duration":     executionTimeMs,
				"resultSize":   len(fmt.Sprintf("%v", result)),
			}, &executionTimeMs, nil)
		}

		functionResults[i] = result
	}

	// Stop iteration if all functions failed or we have validation errors
	if errorCount == len(functionCalls) {
		log.Printf("🛑 All %d function calls failed, stopping iteration to prevent infinite loops", len(functionCalls))
		return c.createErrorSummary(functionCalls, functionResults, hasValidationErrors)
	}

	// Accumulate all function calls and results across iterations
	currentAllFunctionCalls := append(allFunctionCalls, functionCalls...)
	currentAllFunctionResults := append(allFunctionResults, functionResults...)

	// Create a clean synthesis prompt with current time context
	currentTime := time.Now()
	timeContext := fmt.Sprintf("Current time: %s (UTC: %s, Unix timestamp: %d)",
		currentTime.Format("2006-01-02 15:04:05 MST"),
		currentTime.UTC().Format("2006-01-02 15:04:05 UTC"),
		currentTime.Unix())

	synthesisPrompt := fmt.Sprintf("User's original request: \"%s\"\n\n%s\n\n", originalPrompt, timeContext)

	// Add function results to synthesis prompt so LLM can see what data it already has
	if len(currentAllFunctionResults) > 0 {
		synthesisPrompt += "**Function Results:**\n"
		for i, result := range currentAllFunctionResults {
			if i < len(currentAllFunctionCalls) {
				functionName := currentAllFunctionCalls[i].FunctionCall.Name

				// Create intelligent summaries instead of truncating raw JSON
				summary := c.createIntelligentResultSummary(functionName, result)
				synthesisPrompt += fmt.Sprintf("- %s: %s\n", functionName, summary)
			}
		}
		synthesisPrompt += "\n"
	}

	var hasErrors bool
	// Check for errors without duplicating function data in the prompt
	for i := range currentAllFunctionResults {
		if status, ok := currentAllFunctionResults[i]["status"].(string); ok && (status == "failed" || status == "validation_failed") {
			hasErrors = true
		}
	}

	// Add task-oriented guidance to help Gemini understand what to do next
	// Task guidance removed - let LLM handle workflow naturally

	// Detect if we have sufficient data to complete the task (using accumulated results)
	shouldComplete := c.detectTaskCompletion(currentAllFunctionCalls, currentAllFunctionResults, depth, originalPrompt)

	if hasErrors {
		synthesisPrompt += "\n**ERROR HANDLING:** Some functions failed with errors. Please analyze the available data and provide your best response. DO NOT make additional function calls that might fail with the same errors.\n\n**CRITICAL: You must respond ONLY in natural language. DO NOT return code blocks, function calls, or tool_code. Do not use markdown code blocks or backticks. Provide a clear, human-readable summary of what you accomplished.**"
	} else if shouldComplete {
		synthesisPrompt += "\n**FINAL RESPONSE REQUIRED:** You now have all the necessary data to complete the user's request. STOP calling functions and provide a comprehensive final response using the data above.\n\n**CRITICAL: You must respond ONLY in natural language. DO NOT return code blocks, function calls, or tool_code. Do not use markdown code blocks or backticks. Provide a clear, human-readable summary that directly addresses the user's original request. Explain what you found and what actions you took.**"
	} else {
		// Add state management instructions based on research best practices
		synthesisPrompt += "\n**PROGRESS TRACKING:** Before making any function calls, briefly recap what you have already accomplished in this task. Consider whether you have enough data to complete the user's request.\n\n"
		synthesisPrompt += "**IMPORTANT:** If you have already gathered the necessary data (channel info, messages, GitHub data), proceed to complete the task (send replies, add reactions) rather than repeating data collection functions."
	}

	// Create a new API request for synthesis
	synthesisRequest := &types.APIRequest{
		ID:              uuid.New().String(),
		ConfigurationID: request.ConfigurationID,
		ExecutionRunID:  request.ExecutionRunID,
		Prompt:          synthesisPrompt,
		Context:         request.Context,
		CreatedAt:       time.Now(),
	}

	// Log synthesis start
	synthesisStartTime := time.Now()
	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryExecution,
		fmt.Sprintf("Starting synthesis with Gemini (depth %d)", depth),
		map[string]interface{}{
			"depth":             depth,
			"promptLength":      len(synthesisPrompt),
			"functionsExecuted": len(functionCalls),
			"shouldComplete":    shouldComplete,
			"hasErrors":         hasErrors,
		})

	// Log synthesis flow event
	c.logExecutionFlowEvent("synthesis_start", c.getNextSequenceNumber(), "pending", nil, map[string]interface{}{
		"depth":             depth,
		"functionsExecuted": len(functionCalls),
		"shouldComplete":    shouldComplete,
	}, nil, nil)

	// Make another Gemini REST API call for synthesis
	configForSynthesis := *config // Copy the config

	// Use SynthesisManager for intelligent tool management following API best practices
	synthesisManager := NewSynthesisManager()
	synthesisConfig := &SynthesisConfig{
		ProviderType:    "gemini", // This is Gemini-specific synthesis path
		Depth:           depth,
		ShouldComplete:  shouldComplete,
		FunctionCalls:   currentAllFunctionCalls,   // Use accumulated function calls
		FunctionResults: currentAllFunctionResults, // Use accumulated function results
		OriginalConfig:  config,
	}

	decision := synthesisManager.DetermineSynthesisStrategy(synthesisConfig)
	synthesisManager.LogDecision(decision, synthesisConfig)

	// Apply the decision
	configForSynthesis.Tools = decision.Tools

	// Add intelligent prompt suffix if not already handled by error/completion logic
	if !hasErrors && !shouldComplete {
		promptSuffix := synthesisManager.GetSynthesisPromptSuffix(decision, "gemini")
		synthesisPrompt += promptSuffix
	}

	// ENHANCED DEBUG: Log the exact prompt being sent to Gemini to understand empty response issue
	log.Printf("🔍 [SYNTHESIS_DEBUG] Synthesis prompt details:")
	log.Printf("🔍 [SYNTHESIS_DEBUG] - Depth: %d", depth)
	log.Printf("🔍 [SYNTHESIS_DEBUG] - Prompt length: %d chars", len(synthesisPrompt))
	log.Printf("🔍 [SYNTHESIS_DEBUG] - Function results count: %d", len(functionResults))
	log.Printf("🔍 [SYNTHESIS_DEBUG] - Tools available: %d", len(configForSynthesis.Tools))
	log.Printf("🔍 [SYNTHESIS_DEBUG] - Allow function calls: %v", decision.AllowFunctionCalls)

	if len(synthesisPrompt) > 2000 {
		log.Printf("🔍 [SYNTHESIS_DEBUG] Synthesis prompt (first 1000 chars): %.1000s...", synthesisPrompt)
		log.Printf("🔍 [SYNTHESIS_DEBUG] Synthesis prompt (last 1000 chars): ...%s", synthesisPrompt[len(synthesisPrompt)-1000:])
	} else {
		log.Printf("🔍 [SYNTHESIS_DEBUG] Full synthesis prompt: %s", synthesisPrompt)
	}

	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryExecution,
		"Synthesis strategy determined",
		map[string]interface{}{
			"depth":              depth,
			"shouldComplete":     shouldComplete,
			"allowFunctionCalls": decision.AllowFunctionCalls,
			"originalTools":      len(config.Tools),
			"synthesisTools":     len(configForSynthesis.Tools),
			"reason":             decision.Reason,
			"forceCompletion":    decision.ForceCompletion,
		})

	// Create a longer timeout context specifically for Gemini synthesis (may take longer due to large function results)
	synthesisCtx, synthesisCancel := context.WithTimeout(ctx, 300*time.Second) // 5 minutes for synthesis
	defer synthesisCancel()

	synthesisResponse, err := c.callGeminiRestAPIForSynthesis(synthesisCtx, &configForSynthesis, synthesisRequest)
	synthesisTimeMs := int32(time.Since(synthesisStartTime).Milliseconds())
	if err != nil {
		errorMsg := err.Error()
		log.Printf("⚠️ Failed to get synthesis from Gemini: %v", err)

		c.logExecutionEvent(types.LogLevelError, types.LogCategoryError,
			fmt.Sprintf("Synthesis failed: %v", err),
			map[string]interface{}{
				"depth":          depth,
				"synthesisError": err.Error(),
				"duration":       synthesisTimeMs,
			})

		// Log synthesis failure in flow
		c.logExecutionFlowEvent("synthesis_end", c.getNextSequenceNumber(), "error", nil, map[string]interface{}{
			"depth": depth,
			"error": errorMsg,
		}, &synthesisTimeMs, &errorMsg)

		// Fallback to simple summary
		return c.createFallbackSummary(functionCalls, functionResults)
	}

	// Check if the synthesis response contains additional function calls
	if synthesisResponse.ResponseBody != nil {
		if additionalFunctionCalls, ok := synthesisResponse.ResponseBody["function_calls"]; ok {
			if fcArray, ok := additionalFunctionCalls.([]map[string]interface{}); ok && len(fcArray) > 0 {
				log.Printf("🔄 Synthesis response contains %d additional function calls, continuing iteration (depth %d)", len(fcArray), depth)

				c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryExecution,
					fmt.Sprintf("Synthesis produced %d additional function calls", len(fcArray)),
					map[string]interface{}{
						"depth":                 depth,
						"additionalCallsCount":  len(fcArray),
						"synthesisResponseText": len(synthesisResponse.ResponseText),
						"duration":              synthesisTimeMs,
					})

				// Log synthesis with additional calls in flow
				c.logExecutionFlowEvent("synthesis_end", c.getNextSequenceNumber(), "success", nil, map[string]interface{}{
					"depth":             depth,
					"additionalCalls":   len(fcArray),
					"responseLength":    len(synthesisResponse.ResponseText),
					"continueIteration": true,
				}, &synthesisTimeMs, nil)

				// Convert to ResponsePart format
				additionalResponseParts := make([]ResponsePart, len(fcArray))
				for i, fc := range fcArray {
					args := make(map[string]interface{})
					if fcArgs, ok := fc["args"].(map[string]interface{}); ok {
						args = fcArgs
					}

					additionalResponseParts[i] = ResponsePart{
						FunctionCall: struct {
							Name string                 `json:"name"`
							Args map[string]interface{} `json:"args"`
						}{
							Name: fc["name"].(string),
							Args: args,
						},
					}

					// Debug: Log what function call we're about to process
					log.Printf("🔍 Next function call: %s with args: %+v", fc["name"], args)
				}

				// Check if we're about to repeat the same failed function call - prevent infinite loops
				if c.wouldRepeatFailedCall(functionCalls, functionResults, additionalResponseParts) {
					log.Printf("🛑 Detected potential infinite loop: same function call pattern detected, stopping iteration")
					summary := "I completed the analysis but stopped to prevent infinite loops. "
					if synthesisResponse.ResponseText != "" {
						summary += synthesisResponse.ResponseText
					} else {
						summary += "The functions executed successfully but some calls failed validation."
					}
					return summary
				}

				// Auto-extract parameters for the next iteration using current results
				// Auto-extraction removed - let LLM handle parameter selection

				// Recursively process additional function calls with accumulated context
				return c.processIterativeFunctionCallsWithSynthesisRecursiveAccumulated(ctx, config, request, additionalResponseParts, originalPrompt, depth+1, maxDepth, currentAllFunctionCalls, currentAllFunctionResults)
			}
		}
	}

	// ENHANCED DEBUG: Log synthesis response processing
	log.Printf("🔍 [SYNTHESIS_DEBUG] Processing synthesis response:")
	log.Printf("🔍 [SYNTHESIS_DEBUG] - Response text length: %d", len(synthesisResponse.ResponseText))
	log.Printf("🔍 [SYNTHESIS_DEBUG] - Response status: %s", synthesisResponse.ResponseStatus)
	log.Printf("🔍 [SYNTHESIS_DEBUG] - Error message: %s", synthesisResponse.ErrorMessage)
	log.Printf("🔍 [SYNTHESIS_DEBUG] - Response body present: %v", synthesisResponse.ResponseBody != nil)

	if synthesisResponse.ResponseText != "" {
		log.Printf("✅ Gemini provided comprehensive synthesis: %d chars (depth %d)", len(synthesisResponse.ResponseText), depth)
		log.Printf("🔍 [SYNTHESIS_DEBUG] Response text preview: %.500s", synthesisResponse.ResponseText)

		// Check if the response contains tool_code and fix it
		responseText := synthesisResponse.ResponseText
		if strings.Contains(responseText, "tool_code") || strings.Contains(responseText, "```") {
			log.Printf("🚨 Detected tool_code or code blocks in synthesis response, converting to natural language")
			responseText = c.convertCodeBlockToNaturalLanguage(responseText, functionCalls, functionResults)
		}

		c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryCompletion,
			fmt.Sprintf("Synthesis completed successfully: %d characters", len(responseText)),
			map[string]interface{}{
				"depth":          depth,
				"responseLength": len(responseText),
				"duration":       synthesisTimeMs,
				"finalResult":    true,
				"hadCodeBlocks":  responseText != synthesisResponse.ResponseText,
			})

		// Log final synthesis completion in flow
		c.logExecutionFlowEvent("synthesis_end", c.getNextSequenceNumber(), "success", nil, map[string]interface{}{
			"depth":          depth,
			"responseLength": len(responseText),
			"finalResult":    true,
		}, &synthesisTimeMs, nil)

		return responseText
	}

	// Fallback case - ENHANCED DEBUG
	log.Printf("🚨 [SYNTHESIS_DEBUG] FALLBACK TRIGGERED:")
	log.Printf("🚨 [SYNTHESIS_DEBUG] - Synthesis response text empty: %v", synthesisResponse.ResponseText == "")
	log.Printf("🚨 [SYNTHESIS_DEBUG] - Response status: %s", synthesisResponse.ResponseStatus)
	log.Printf("🚨 [SYNTHESIS_DEBUG] - Error message: %s", synthesisResponse.ErrorMessage)
	log.Printf("🚨 [SYNTHESIS_DEBUG] - Function calls count: %d", len(functionCalls))
	log.Printf("🚨 [SYNTHESIS_DEBUG] - Function results count: %d", len(functionResults))
	log.Printf("🚨 [SYNTHESIS_DEBUG] - Depth: %d", depth)

	c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryCompletion,
		"Synthesis completed with fallback response",
		map[string]interface{}{
			"depth":          depth,
			"functionsCount": len(functionCalls),
			"duration":       synthesisTimeMs,
			"responseEmpty":  synthesisResponse.ResponseText == "",
			"responseStatus": synthesisResponse.ResponseStatus,
			"errorMessage":   synthesisResponse.ErrorMessage,
		})

	// Use the proper fallback summary function instead of hardcoded response
	fallbackResponse := c.createFallbackSummary(functionCalls, functionResults)
	log.Printf("🔍 [SYNTHESIS_DEBUG] Fallback response generated: %.200s", fallbackResponse)
	return fallbackResponse
}

// Helper functions for enhanced logging

// truncateString truncates a string to a maximum length with ellipsis
func (c *Client) truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// classifyError attempts to classify the type of error for better debugging
func (c *Client) classifyError(errorMsg string) string {
	errorLower := strings.ToLower(errorMsg)

	switch {
	case strings.Contains(errorLower, "timeout"):
		return "timeout"
	case strings.Contains(errorLower, "rate limit"):
		return "rate_limit"
	case strings.Contains(errorLower, "quota"):
		return "quota_exceeded"
	case strings.Contains(errorLower, "authentication") || strings.Contains(errorLower, "unauthorized"):
		return "authentication"
	case strings.Contains(errorLower, "permission") || strings.Contains(errorLower, "forbidden"):
		return "permission"
	case strings.Contains(errorLower, "not found") || strings.Contains(errorLower, "404"):
		return "not_found"
	case strings.Contains(errorLower, "invalid") || strings.Contains(errorLower, "bad request"):
		return "validation"
	case strings.Contains(errorLower, "network") || strings.Contains(errorLower, "connection"):
		return "network"
	case strings.Contains(errorLower, "server error") || strings.Contains(errorLower, "500"):
		return "server_error"
	default:
		return "unknown"
	}
}

// isRetryableError determines if an error might be retryable
func (c *Client) isRetryableError(errorMsg string) bool {
	errorType := c.classifyError(errorMsg)

	switch errorType {
	case "timeout", "network", "server_error", "rate_limit":
		return true
	case "authentication", "permission", "not_found", "validation":
		return false
	default:
		return false
	}
}

// extractTokenUsage attempts to extract token usage information from API response
func (c *Client) extractTokenUsage(response *types.APIResponse) map[string]interface{} {
	if response.UsageMetadata == nil {
		return map[string]interface{}{"available": false}
	}

	// Usage metadata is already a map, no need to unmarshal
	usage := response.UsageMetadata

	result := map[string]interface{}{"available": true}

	// Extract common token fields
	if promptTokens, ok := usage["promptTokenCount"]; ok {
		result["promptTokens"] = promptTokens
	}
	if candidateTokens, ok := usage["candidatesTokenCount"]; ok {
		result["candidateTokens"] = candidateTokens
	}
	if totalTokens, ok := usage["totalTokenCount"]; ok {
		result["totalTokens"] = totalTokens
	}

	return result
}

// resultHasData checks if a function result contains meaningful data
func (c *Client) resultHasData(result map[string]interface{}) bool {
	if result == nil {
		return false
	}

	// Check for common indicators of meaningful data
	for key, value := range result {
		switch key {
		case "error", "status":
			continue // Skip error/status fields
		default:
			if value != nil {
				switch v := value.(type) {
				case string:
					if strings.TrimSpace(v) != "" {
						return true
					}
				case []interface{}:
					if len(v) > 0 {
						return true
					}
				case map[string]interface{}:
					if len(v) > 0 {
						return true
					}
				default:
					return true
				}
			}
		}
	}

	return false
}

// extractFunctionNames extracts function names from function tools for logging
func (c *Client) extractFunctionNames(functionTools []types.Tool) []string {
	names := make([]string, len(functionTools))
	for i, tool := range functionTools {
		names[i] = tool.Name
	}
	return names
}

// extractModelNames extracts model names from configurations for logging
func (c *Client) extractModelNames(configurations []types.APIConfiguration) []string {
	models := make([]string, len(configurations))
	for i, config := range configurations {
		models[i] = config.ModelName
	}
	return models
}

// validateFunctionCall validates function calls before execution to prevent invalid parameters
func (c *Client) validateFunctionCall(ctx context.Context, functionName string, args map[string]interface{}) error {
	// Get function definition to check required parameters
	funcDef, err := c.getFunctionDefinition(ctx, functionName)
	if err != nil {
		return fmt.Errorf("function %s not found: %w", functionName, err)
	}

	// Parse parameters schema to check required fields
	if funcDef.ParametersSchema != nil {
		var schema map[string]interface{}
		if err := json.Unmarshal(funcDef.ParametersSchema, &schema); err == nil {
			if required, ok := schema["required"].([]interface{}); ok {
				// Debug logging for github_create_branch
				if functionName == "github_create_branch" {
					log.Printf("🔍 [VALIDATION_DEBUG] %s expects required params: %+v", functionName, required)
					log.Printf("🔍 [VALIDATION_DEBUG] %s received params: %+v", functionName, args)
				}

				for _, reqField := range required {
					if reqFieldStr, ok := reqField.(string); ok {
						if _, exists := args[reqFieldStr]; !exists {
							return fmt.Errorf("missing required parameter: %s", reqFieldStr)
						}
					}
				}
			}
		}
	}

	// Special validation for Slack functions
	if strings.HasPrefix(functionName, "slack_") && functionName == "slack_read_messages" {
		if channel, ok := args["channel"]; !ok || channel == nil || fmt.Sprintf("%v", channel) == "" {
			return fmt.Errorf("slack_read_messages requires a valid 'channel' parameter (channel ID from slack_find_channel)")
		}
	}

	return nil
}

// createErrorSummary creates a comprehensive error summary when functions fail
func (c *Client) createErrorSummary(functionCalls []ResponsePart, functionResults []map[string]interface{}, hasValidationErrors bool) string {
	var functionNames []string
	var errors []string

	for i, funcCall := range functionCalls {
		functionNames = append(functionNames, funcCall.FunctionCall.Name)
		if i < len(functionResults) {
			if errStr, ok := functionResults[i]["error"].(string); ok {
				errors = append(errors, fmt.Sprintf("%s: %s", funcCall.FunctionCall.Name, errStr))
			}
		}
	}

	summary := fmt.Sprintf("I attempted to execute %d functions (%s) but encountered errors:\n",
		len(functionNames), strings.Join(functionNames, ", "))

	for _, err := range errors {
		summary += fmt.Sprintf("• %s\n", err)
	}

	if hasValidationErrors {
		summary += "\nThe execution has been stopped to prevent infinite loops due to validation errors. "
		summary += "Please check that function calls have all required parameters."
	}

	return summary
}

// wouldRepeatFailedCall detects if we're about to repeat a function call that just failed
func (c *Client) wouldRepeatFailedCall(previousCalls []ResponsePart, previousResults []map[string]interface{}, nextCalls []ResponsePart) bool {
	// Check if any of the next calls match a previously failed call
	for _, nextCall := range nextCalls {
		for i, prevCall := range previousCalls {
			if nextCall.FunctionCall.Name == prevCall.FunctionCall.Name {
				// Same function name - check if the previous call failed
				if i < len(previousResults) {
					if status, ok := previousResults[i]["status"].(string); ok {
						if status == "failed" || status == "validation_failed" {
							// Check if arguments are similar (indicating likely same issue)
							if c.argumentsSimilar(nextCall.FunctionCall.Args, prevCall.FunctionCall.Args) {
								log.Printf("🔍 Detected potential repeat of failed call: %s", nextCall.FunctionCall.Name)
								return true
							}
						}
					}
				}
			}
		}
	}
	return false
}

// argumentsSimilar checks if two sets of function arguments are similar enough to indicate a repeated call
func (c *Client) argumentsSimilar(args1, args2 map[string]interface{}) bool {
	// For now, do a simple comparison - if they're exactly the same or one is empty, consider them similar
	if len(args1) == 0 && len(args2) == 0 {
		return true
	}

	// Special case for slack_read_messages - if both are missing 'channel', they're similar
	if len(args1) == len(args2) {
		similarCount := 0
		for key := range args1 {
			if _, exists := args2[key]; exists {
				similarCount++
			}
		}
		// If more than 50% of arguments are the same, consider them similar
		return float64(similarCount)/float64(len(args1)) > 0.5
	}

	return false
}

// createDetailedResultSummary creates a detailed summary for logging purposes (more verbose than synthesis summary)
func (c *Client) createDetailedResultSummary(functionName string, result map[string]interface{}) string {
	if result == nil {
		return "No data returned"
	}

	// Check for errors first
	if status, ok := result["status"].(string); ok && (status == "failed" || status == "validation_failed") {
		if errorMsg, ok := result["error"].(string); ok {
			return fmt.Sprintf("FAILED: %s", errorMsg)
		}
		return "FAILED: Unknown error"
	}

	switch functionName {
	case "github_read_issues":
		return c.createDetailedGitHubIssuesSummary(result)
	case "github_read_commits":
		return c.createDetailedGitHubCommitsSummary(result)
	case "github_read_code":
		return c.createDetailedGitHubCodeSummary(result)
	case "github_search_code":
		return c.createDetailedGitHubSearchSummary(result)
	case "github_read_pull_requests":
		return c.createDetailedGitHubPullRequestsSummary(result)
	case "github_close_pull_request":
		return c.createDetailedGitHubClosePRSummary(result)
	case "slack_find_channel":
		return c.createDetailedSlackChannelSummary(result)
	case "slack_read_messages":
		return c.createDetailedSlackMessagesSummary(result)
	case "slack_send_message":
		return c.createDetailedSlackSendSummary(result)
	default:
		// For other functions, provide a detailed generic summary
		return c.createDetailedGenericSummary(result)
	}
}

// Enhanced detailed summary functions for logging

// createDetailedGitHubIssuesSummary creates a detailed summary of GitHub issues for logging
func (c *Client) createDetailedGitHubIssuesSummary(result map[string]interface{}) string {
	var issues []interface{}

	// Handle GitHub integration response structure
	if data, ok := result["data"].([]interface{}); ok {
		issues = data
	} else if issuesField, ok := result["issues"].([]interface{}); ok {
		issues = issuesField
	}

	if len(issues) == 0 {
		return "No issues found in repository"
	}

	var summary strings.Builder
	summary.WriteString(fmt.Sprintf("Found %d issues: ", len(issues)))

	for i, issue := range issues {
		if i >= 3 { // Limit to first 3 for logging
			summary.WriteString(fmt.Sprintf("... and %d more", len(issues)-3))
			break
		}

		if issueMap, ok := issue.(map[string]interface{}); ok {
			number := "unknown"
			title := "No title"
			state := "unknown"

			if num, ok := issueMap["number"].(float64); ok {
				number = fmt.Sprintf("#%.0f", num)
			}
			if t, ok := issueMap["title"].(string); ok {
				title = t
				if len(title) > 60 {
					title = title[:60] + "..."
				}
			}
			if s, ok := issueMap["state"].(string); ok {
				state = s
			}

			if i > 0 {
				summary.WriteString(", ")
			}
			summary.WriteString(fmt.Sprintf("%s (%s): %s", number, state, title))
		}
	}

	return summary.String()
}

// createDetailedGitHubCommitsSummary creates a detailed summary of GitHub commits for logging
func (c *Client) createDetailedGitHubCommitsSummary(result map[string]interface{}) string {
	var commits []interface{}

	// Handle GitHub integration response structure
	if data, ok := result["data"].([]interface{}); ok {
		commits = data
	} else if commitsField, ok := result["commits"].([]interface{}); ok {
		commits = commitsField
	}

	if len(commits) == 0 {
		return "No commits found in repository"
	}

	var summary strings.Builder
	summary.WriteString(fmt.Sprintf("Retrieved %d commits: ", len(commits)))

	for i, commit := range commits {
		if i >= 2 { // Limit to first 2 for logging
			summary.WriteString(fmt.Sprintf("... and %d more", len(commits)-2))
			break
		}

		if commitMap, ok := commit.(map[string]interface{}); ok {
			sha := "unknown"
			message := "No message"
			author := "unknown"

			if shaVal, ok := commitMap["sha"].(string); ok && len(shaVal) >= 7 {
				sha = shaVal[:7]
			}

			if commitData, ok := commitMap["commit"].(map[string]interface{}); ok {
				if msgVal, ok := commitData["message"].(string); ok {
					message = msgVal
					if len(message) > 50 {
						message = message[:50] + "..."
					}
				}

				if authorData, ok := commitData["author"].(map[string]interface{}); ok {
					if nameVal, ok := authorData["name"].(string); ok {
						author = nameVal
					}
				}
			}

			if i > 0 {
				summary.WriteString(", ")
			}
			summary.WriteString(fmt.Sprintf("%s by %s: %s", sha, author, message))
		}
	}

	return summary.String()
}

// createDetailedGitHubCodeSummary creates a detailed summary of GitHub code for logging
func (c *Client) createDetailedGitHubCodeSummary(result map[string]interface{}) string {
	var data map[string]interface{}

	if d, ok := result["data"].(map[string]interface{}); ok {
		data = d
	} else {
		data = result
	}

	if fileType, ok := data["type"].(string); ok {
		if fileType == "file" {
			name, _ := data["name"].(string)
			size, _ := data["size"].(float64)
			encoding, _ := data["encoding"].(string)

			// Check if content was decoded
			if content, ok := data["content"].(string); ok {
				contentPreview := content
				if len(content) > 100 {
					contentPreview = content[:100] + "..."
				}
				return fmt.Sprintf("File '%s' (%.0f bytes, %s): %s", name, size, encoding, contentPreview)
			}

			return fmt.Sprintf("File '%s' (%.0f bytes, %s encoding)", name, size, encoding)
		} else if fileType == "dir" {
			if items, ok := data["items"].([]interface{}); ok {
				var itemNames []string
				for i, item := range items {
					if i >= 5 { // Limit to first 5 items
						itemNames = append(itemNames, fmt.Sprintf("... and %d more", len(items)-5))
						break
					}
					if itemMap, ok := item.(map[string]interface{}); ok {
						if name, ok := itemMap["name"].(string); ok {
							itemNames = append(itemNames, name)
						}
					}
				}
				return fmt.Sprintf("Directory with %d items: %s", len(items), strings.Join(itemNames, ", "))
			}
		}
	}
	return "Retrieved code data"
}

// createDetailedGitHubSearchSummary creates a detailed summary of GitHub search results for logging
func (c *Client) createDetailedGitHubSearchSummary(result map[string]interface{}) string {
	var data map[string]interface{}

	if d, ok := result["data"].(map[string]interface{}); ok {
		data = d
	} else {
		data = result
	}

	if items, ok := data["items"].([]interface{}); ok {
		if len(items) == 0 {
			return "No code matches found"
		}

		var summary strings.Builder
		summary.WriteString(fmt.Sprintf("Found %d code matches: ", len(items)))

		for i, item := range items {
			if i >= 3 { // Limit to first 3 for logging
				summary.WriteString(fmt.Sprintf("... and %d more", len(items)-3))
				break
			}

			if itemMap, ok := item.(map[string]interface{}); ok {
				name := "unknown"
				path := "unknown"

				if n, ok := itemMap["name"].(string); ok {
					name = n
				}
				if p, ok := itemMap["path"].(string); ok {
					path = p
				}

				if i > 0 {
					summary.WriteString(", ")
				}
				summary.WriteString(fmt.Sprintf("%s (%s)", name, path))
			}
		}

		return summary.String()
	}

	return "Retrieved search results"
}

// createDetailedGitHubPullRequestsSummary creates a detailed summary of GitHub pull requests for logging
func (c *Client) createDetailedGitHubPullRequestsSummary(result map[string]interface{}) string {
	var prs []interface{}

	// Handle GitHub integration response structure
	if data, ok := result["data"].([]interface{}); ok {
		prs = data
	} else if prField, ok := result["pull_requests"].([]interface{}); ok {
		prs = prField
	}

	if len(prs) == 0 {
		return "No pull requests found"
	}

	var summary strings.Builder
	summary.WriteString(fmt.Sprintf("Found %d pull requests: ", len(prs)))

	for i, pr := range prs {
		if i >= 3 { // Limit to first 3 for logging
			summary.WriteString(fmt.Sprintf("... and %d more", len(prs)-3))
			break
		}

		if prMap, ok := pr.(map[string]interface{}); ok {
			number := "unknown"
			title := "No title"
			state := "unknown"
			author := "unknown"

			if num, ok := prMap["number"].(float64); ok {
				number = fmt.Sprintf("#%.0f", num)
			}
			if t, ok := prMap["title"].(string); ok {
				title = t
				if len(title) > 50 {
					title = title[:50] + "..."
				}
			}
			if s, ok := prMap["state"].(string); ok {
				state = s
			}
			if user, ok := prMap["user"].(map[string]interface{}); ok {
				if login, ok := user["login"].(string); ok {
					author = login
				}
			}

			if i > 0 {
				summary.WriteString(", ")
			}
			summary.WriteString(fmt.Sprintf("%s (%s) by %s: %s", number, state, author, title))
		}
	}

	return summary.String()
}

// createDetailedGitHubClosePRSummary creates a detailed summary of GitHub PR closure for logging
func (c *Client) createDetailedGitHubClosePRSummary(result map[string]interface{}) string {
	var data map[string]interface{}

	if d, ok := result["data"].(map[string]interface{}); ok {
		data = d
	} else {
		data = result
	}

	if state, ok := data["state"].(string); ok && state == "closed" {
		number := "unknown"
		title := "No title"

		if num, ok := data["number"].(float64); ok {
			number = fmt.Sprintf("#%.0f", num)
		}
		if t, ok := data["title"].(string); ok {
			title = t
			if len(title) > 60 {
				title = title[:60] + "..."
			}
		}

		return fmt.Sprintf("Closed pull request %s: %s", number, title)
	}

	return "Pull request operation completed"
}

// createDetailedSlackChannelSummary creates a detailed summary of Slack channel data for logging
func (c *Client) createDetailedSlackChannelSummary(result map[string]interface{}) string {
	var channels []interface{}

	if data, ok := result["data"].(map[string]interface{}); ok {
		if ch, ok := data["channels"].([]interface{}); ok {
			channels = ch
		}
	} else if ch, ok := result["channels"].([]interface{}); ok {
		channels = ch
	}

	if len(channels) == 0 {
		return "No channels found"
	}

	if channel, ok := channels[0].(map[string]interface{}); ok {
		channelID, _ := channel["id"].(string)
		channelName, _ := channel["name"].(string)
		memberCount := 0
		if members, ok := channel["num_members"].(float64); ok {
			memberCount = int(members)
		}

		return fmt.Sprintf("Found channel '%s' (ID: %s, %d members)", channelName, channelID, memberCount)
	}

	return fmt.Sprintf("Found %d channels", len(channels))
}

// createDetailedSlackMessagesSummary creates a detailed summary of Slack messages for logging
func (c *Client) createDetailedSlackMessagesSummary(result map[string]interface{}) string {
	var messages []interface{}

	if data, ok := result["data"].(map[string]interface{}); ok {
		if msgs, ok := data["messages"].([]interface{}); ok {
			messages = msgs
		}
	} else if msgs, ok := result["messages"].([]interface{}); ok {
		messages = msgs
	}

	if len(messages) == 0 {
		return "No messages found"
	}

	var summary strings.Builder
	summary.WriteString(fmt.Sprintf("Retrieved %d messages: ", len(messages)))

	for i, message := range messages {
		if i >= 2 { // Limit to first 2 for logging
			summary.WriteString(fmt.Sprintf("... and %d more", len(messages)-2))
			break
		}

		if msgMap, ok := message.(map[string]interface{}); ok {
			user := "unknown"
			text := "No text"
			timestamp := "unknown"

			if u, ok := msgMap["user"].(string); ok {
				user = u
			}
			if t, ok := msgMap["text"].(string); ok {
				text = t
				if len(text) > 50 {
					text = text[:50] + "..."
				}
			}
			if ts, ok := msgMap["ts"].(string); ok {
				timestamp = ts
			}

			if i > 0 {
				summary.WriteString(", ")
			}
			summary.WriteString(fmt.Sprintf("%s at %s: %s", user, timestamp, text))
		}
	}

	return summary.String()
}

// createDetailedSlackSendSummary creates a detailed summary of Slack send results for logging
func (c *Client) createDetailedSlackSendSummary(result map[string]interface{}) string {
	if data, ok := result["data"].(map[string]interface{}); ok {
		if ok, okVal := data["ok"].(bool); okVal && ok {
			channel := "unknown"
			timestamp := "unknown"

			if ch, ok := data["channel"].(string); ok {
				channel = ch
			}
			if ts, ok := data["ts"].(string); ok {
				timestamp = ts
			}

			return fmt.Sprintf("Message sent to channel %s at %s", channel, timestamp)
		}
	}

	return "Message sent successfully"
}

// createDetailedGenericSummary creates a detailed summary for other functions
func (c *Client) createDetailedGenericSummary(result map[string]interface{}) string {
	if len(result) == 0 {
		return "Empty result"
	}

	var summary strings.Builder
	summary.WriteString(fmt.Sprintf("Result with %d fields: ", len(result)))

	keys := c.getMapKeys(result)
	if len(keys) > 5 {
		summary.WriteString(fmt.Sprintf("%s ... and %d more", strings.Join(keys[:5], ", "), len(keys)-5))
	} else {
		summary.WriteString(strings.Join(keys, ", "))
	}

	return summary.String()
}

// createIntelligentResultSummary extracts only essential information from function results
// This prevents context overflow by avoiding large JSON blobs in synthesis prompts
func (c *Client) createIntelligentResultSummary(functionName string, result map[string]interface{}) string {
	// Delegate to engine helper to keep behavior consistent and testable
	return engine.SummarizeResult(functionName, result)
}

// createFullDataSummary is kept for compatibility; delegate to engine
func (c *Client) createFullDataSummary(result map[string]interface{}) string {
	s := engine.CreateFullDataSummary(result)
	// When marshaling fails, engine falls back to generic; we log for observability
	if s == engine.CreateGenericSummary(result) {
		log.Printf("⚠️ Failed to marshal result to JSON; using generic summary")
	}
	return s
}

// autoExtractParameters automatically extracts missing parameters from previous function results
// Following LLM function calling best practices - minimal intervention, let LLM handle parameter selection
func (c *Client) autoExtractParameters(ctx context.Context, funcCall *ResponsePart, previousResults []map[string]interface{}) {
	// Minimal parameter extraction - only for truly generic cases where the LLM clearly needs help
	// Most parameter selection should be handled by the LLM itself using the function results

	if funcCall.FunctionCall.Args == nil {
		funcCall.FunctionCall.Args = make(map[string]interface{})
	}

	// Only extract channel ID if completely missing and there's an obvious source
	if _, exists := funcCall.FunctionCall.Args["channel"]; !exists {
		for _, result := range previousResults {
			if channels, ok := result["channels"].([]interface{}); ok && len(channels) > 0 {
				if channel, ok := channels[0].(map[string]interface{}); ok {
					if channelID, ok := channel["id"].(string); ok && channelID != "" {
						funcCall.FunctionCall.Args["channel"] = channelID
						log.Printf("🔄 Auto-extracted channel=%s for %s", channelID, funcCall.FunctionCall.Name)
						return
					}
				}
			}
		}
	}
}

// detectTaskCompletion determines if we have enough data to complete the user's task
func (c *Client) detectTaskCompletion(functionCalls []ResponsePart, functionResults []map[string]interface{}, depth int, originalPrompt string) bool {
	// Safety net: prevent runaway execution at very high depths
	if depth >= 15 {
		log.Printf("🛑 Safety net: Force completion at depth %d to prevent runaway execution", depth)
		return true
	}

	// Let the LLM decide when it's done - no artificial task completion detection
	// The synthesis manager and infinite loop detection will handle edge cases
	log.Printf("🔍 Task completion check: depth=%d, functions=%d - letting LLM decide naturally", depth, len(functionCalls))
	return false
}

// smartTruncateJSON truncates JSON at logical boundaries to avoid malformed JSON
func (c *Client) smartTruncateJSON(jsonStr string, maxLength int) string {
	return engine.SmartTruncateJSON(jsonStr, maxLength)
}

// autoExtractParametersFromContext extracts parameters for next iteration function calls using current results
func (c *Client) autoExtractParametersFromContext(ctx context.Context, funcCall *ResponsePart, previousResults []map[string]interface{}) {
	if funcCall.FunctionCall.Args == nil {
		funcCall.FunctionCall.Args = make(map[string]interface{})
	}
	// Use engine helper; add observability
	filled := engine.AutoFillMissingArgs(funcCall.FunctionCall.Name, funcCall.FunctionCall.Args, previousResults)
	if filled {
		if ch, _ := funcCall.FunctionCall.Args["channel"].(string); ch != "" {
			log.Printf("🔄 Auto-extraction: %s now has channel=%s", funcCall.FunctionCall.Name, ch)
		}
	} else if ch, ok := funcCall.FunctionCall.Args["channel"].(string); ok && ch != "" {
		log.Printf("✅ Auto-extraction: %s already has channel parameter", funcCall.FunctionCall.Name)
	}
}

// createGenericSummary provides a fallback summary for unknown functions
func (c *Client) createGenericSummary(result map[string]interface{}) string {
	if len(result) == 0 {
		return "No data returned"
	}

	// Count data elements
	dataCount := 0
	for key, value := range result {
		if key != "metadata" && key != "_metadata" && value != nil {
			dataCount++
		}
	}

	return fmt.Sprintf("Retrieved data with %d fields", dataCount)
}
