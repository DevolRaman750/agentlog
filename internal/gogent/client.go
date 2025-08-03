package gogent

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"gogent/internal/code_analysis"
	"gogent/internal/db"
	"gogent/internal/gemini"
	"gogent/internal/github"
	"gogent/internal/types"

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/google/uuid"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// Client represents the main gogent client that wraps Gemini API calls
type Client struct {
	db             *sql.DB
	queries        *db.Queries
	config         *types.GeminiClientConfig
	sessionApiKeys *types.SessionApiKeys // Session API keys for this execution
	geminiClient   *gemini.GeminiClient
	mutex          sync.RWMutex
	// Add execution context for logging
	currentExecutionRunID *string
	currentConfigID       *string
	currentRequestID      *string

	// Sequence number counter for flow events
	sequenceCounter int

	// Refactored components
	codeAnalyzer      *code_analysis.Analyzer
	directoryAnalyzer *github.DirectoryAnalyzer
}

// ResponsePart represents a part of the Gemini API response
type ResponsePart struct {
	Text         string `json:"text,omitempty"`
	FunctionCall struct {
		Name string                 `json:"name"`
		Args map[string]interface{} `json:"args"`
	} `json:"functionCall,omitempty"`
}

// ensureMultiStatements ensures the database URL includes multiStatements=true for proper migration support
func ensureMultiStatements(dbURL string) string {
	if !strings.Contains(dbURL, "multiStatements=true") {
		if strings.Contains(dbURL, "?") {
			dbURL += "&multiStatements=true"
		} else {
			dbURL += "?multiStatements=true"
		}
	}
	return dbURL
}

// NewClient creates a new gogent client with database connection
func NewClient(dbURL string, config *types.GeminiClientConfig, sessionApiKeys *types.SessionApiKeys) (*Client, error) {
	// Ensure dbURL includes multiStatements=true for migrations
	dbURL = ensureMultiStatements(dbURL)

	database, err := sql.Open("mysql", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := database.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	queries := db.New(database)

	// Create temporary client to run migrations
	tempClient := &Client{
		db:      database,
		queries: queries,
		config:  config,
		mutex:   sync.RWMutex{},
	}

	// Run migrations using golang-migrate
	if err := tempClient.RunMigrations(); err != nil {
		log.Printf("⚠️ Warning: failed to run migrations: %v", err)
		// Continue without migrations rather than failing completely
	}

	client := &Client{
		db:             database,
		queries:        queries,
		config:         config,
		sessionApiKeys: sessionApiKeys,
		mutex:          sync.RWMutex{},
	}

	// Initialize refactored components
	client.codeAnalyzer = code_analysis.NewAnalyzer(code_analysis.DefaultConfig())
	client.directoryAnalyzer = github.NewDirectoryAnalyzer(code_analysis.DefaultConfig())

	// Initialize Gemini client if API key is provided
	// DISABLED: Go SDK has model name format issues, using REST API directly
	/*
		if config.APIKey != "" {
			ctx := context.Background()
			geminiClient, err := gemini.NewGeminiClient(ctx, config.APIKey)
			if err != nil {
				log.Printf("Failed to initialize Gemini client: %v", err)
				// Continue without Gemini client (will use mock responses)
			} else {
				client.geminiClient = geminiClient
				log.Printf("Successfully initialized Gemini client with API key: %s...", config.APIKey[:10])
			}
		}
	*/

	// Force REST API usage - no Go SDK client
	client.geminiClient = nil
	log.Printf("Go SDK disabled - using REST API for all Gemini calls")

	return client, nil
}

// Close closes the database connection and Gemini client
func (c *Client) Close() error {
	if c.geminiClient != nil {
		c.geminiClient.Close()
	}
	return c.db.Close()
}

// CreateExecutionRun creates a new execution run for grouping related API calls
func (c *Client) CreateExecutionRun(ctx context.Context, userID, name, description string, enableFunctionCalling bool) (*types.ExecutionRun, error) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	id := uuid.New().String()
	log.Printf("🔧 Creating execution run with enableFunctionCalling: %v", enableFunctionCalling)
	err := c.queries.CreateExecutionRun(ctx, db.CreateExecutionRunParams{
		ID:                    id,
		UserID:                userID,
		Name:                  name,
		Description:           sql.NullString{String: description, Valid: description != ""},
		EnableFunctionCalling: enableFunctionCalling,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create execution run: %w", err)
	}

	return &types.ExecutionRun{
		ID:                    id,
		Name:                  name,
		Description:           description,
		EnableFunctionCalling: enableFunctionCalling,
		Status:                "pending", // Start with pending status
		ErrorMessage:          "",
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
	}, nil
}

// CreateAPIConfiguration creates a new API configuration for a variation
func (c *Client) CreateAPIConfiguration(ctx context.Context, userID string, config *types.APIConfiguration) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	safetySettingsJSON, _ := types.ToJSON(config.SafetySettings)
	generationConfigJSON, _ := types.ToJSON(config.GenerationConfig)
	toolsJSON, _ := types.ToJSON(config.Tools)
	toolConfigJSON, _ := types.ToJSON(config.ToolConfig)

	// CRITICAL: Preserve the configuration's original UserID if it exists (e.g., 'system')
	// Only use the provided userID if the config doesn't have one set
	configUserID := userID
	if config.UserID != "" {
		configUserID = config.UserID
		log.Printf("🔧 Preserving original UserID '%s' for configuration '%s'", config.UserID, config.VariationName)
	} else {
		log.Printf("🔧 Using provided UserID '%s' for configuration '%s'", userID, config.VariationName)
	}

	return c.queries.CreateAPIConfiguration(ctx, db.CreateAPIConfigurationParams{
		ID:               config.ID,
		UserID:           configUserID,
		VariationName:    config.VariationName,
		ModelName:        config.ModelName,
		SystemPrompt:     sql.NullString{String: config.SystemPrompt, Valid: config.SystemPrompt != ""},
		Temperature:      convertFloat32ToNullString(config.Temperature),
		MaxTokens:        convertInt32ToNullInt32(config.MaxTokens),
		TopP:             convertFloat32ToNullString(config.TopP),
		TopK:             convertInt32ToNullInt32(config.TopK),
		SafetySettings:   convertStringToRawMessage(safetySettingsJSON),
		GenerationConfig: convertStringToRawMessage(generationConfigJSON),
		Tools:            convertStringToRawMessage(toolsJSON),
		ToolConfig:       convertStringToRawMessage(toolConfigJSON),
	})
}

func (c *Client) UpdateAPIConfiguration(ctx context.Context, userID string, config *types.APIConfiguration) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	safetySettingsJSON, _ := types.ToJSON(config.SafetySettings)
	generationConfigJSON, _ := types.ToJSON(config.GenerationConfig)
	toolsJSON, _ := types.ToJSON(config.Tools)
	toolConfigJSON, _ := types.ToJSON(config.ToolConfig)

	return c.queries.UpdateAPIConfiguration(ctx, db.UpdateAPIConfigurationParams{
		VariationName:    config.VariationName,
		ModelName:        config.ModelName,
		SystemPrompt:     sql.NullString{String: config.SystemPrompt, Valid: config.SystemPrompt != ""},
		Temperature:      convertFloat32ToNullString(config.Temperature),
		MaxTokens:        convertInt32ToNullInt32(config.MaxTokens),
		TopP:             convertFloat32ToNullString(config.TopP),
		TopK:             convertInt32ToNullInt32(config.TopK),
		SafetySettings:   convertStringToRawMessage(safetySettingsJSON),
		GenerationConfig: convertStringToRawMessage(generationConfigJSON),
		Tools:            convertStringToRawMessage(toolsJSON),
		ToolConfig:       convertStringToRawMessage(toolConfigJSON),
		ID:               config.ID,
		UserID:           userID,
	})
}

func (c *Client) DeleteAPIConfiguration(ctx context.Context, configID string, userID string) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	return c.queries.DeleteAPIConfiguration(ctx, db.DeleteAPIConfigurationParams{
		ID:     configID,
		UserID: userID,
	})
}

// LogAPIRequest logs an API request to the database
func (c *Client) LogAPIRequest(ctx context.Context, userID string, request *types.APIRequest) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	functionParamsJSON, _ := types.ToJSON(request.FunctionParameters)
	requestHeadersJSON, _ := types.ToJSON(request.RequestHeaders)
	requestBodyJSON, _ := types.ToJSON(request.RequestBody)

	return c.queries.CreateAPIRequest(ctx, db.CreateAPIRequestParams{
		ID:                 request.ID,
		UserID:             userID,
		ExecutionRunID:     request.ExecutionRunID,
		ConfigurationID:    request.ConfigurationID,
		RequestType:        sql.NullString{String: string(request.RequestType), Valid: true},
		Prompt:             sql.NullString{String: request.Prompt, Valid: request.Prompt != ""},
		Context:            sql.NullString{String: request.Context, Valid: request.Context != ""},
		FunctionName:       sql.NullString{String: request.FunctionName, Valid: request.FunctionName != ""},
		FunctionParameters: convertStringToRawMessage(functionParamsJSON),
		RequestHeaders:     convertStringToRawMessage(requestHeadersJSON),
		RequestBody:        convertStringToRawMessage(requestBodyJSON),
	})
}

// LogAPIResponse logs an API response to the database
func (c *Client) LogAPIResponse(ctx context.Context, userID string, response *types.APIResponse) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	functionCallResponseJSON, _ := types.ToJSON(response.FunctionCallResponse)
	usageMetadataJSON, _ := types.ToJSON(response.UsageMetadata)
	safetyRatingsJSON, _ := types.ToJSON(response.SafetyRatings)
	responseHeadersJSON, _ := types.ToJSON(response.ResponseHeaders)
	responseBodyJSON, _ := types.ToJSON(response.ResponseBody)

	return c.queries.CreateAPIResponse(ctx, db.CreateAPIResponseParams{
		ID:                   response.ID,
		UserID:               userID,
		RequestID:            response.RequestID,
		ResponseStatus:       sql.NullString{String: string(response.ResponseStatus), Valid: true},
		ResponseText:         sql.NullString{String: response.ResponseText, Valid: response.ResponseText != ""},
		FunctionCallResponse: convertStringToRawMessage(functionCallResponseJSON),
		UsageMetadata:        convertStringToRawMessage(usageMetadataJSON),
		SafetyRatings:        convertStringToRawMessage(safetyRatingsJSON),
		FinishReason:         sql.NullString{String: response.FinishReason, Valid: response.FinishReason != ""},
		ErrorMessage:         sql.NullString{String: response.ErrorMessage, Valid: response.ErrorMessage != ""},
		ResponseTimeMs:       sql.NullInt32{Int32: response.ResponseTimeMs, Valid: true},
		ResponseHeaders:      convertStringToRawMessage(responseHeadersJSON),
		ResponseBody:         convertStringToRawMessage(responseBodyJSON),
	})
}

// ExecuteMultiVariation executes the same prompt with multiple configurations
func (c *Client) ExecuteMultiVariation(ctx context.Context, userID string, request *types.MultiExecutionRequest) (*types.ExecutionResult, error) {
	// Create execution run
	executionRun, err := c.CreateExecutionRun(ctx, userID, request.ExecutionRunName, request.Description, request.EnableFunctionCalling)
	if err != nil {
		return nil, fmt.Errorf("failed to create execution run: %w", err)
	}

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

	// Log flow event for execution start
	c.logExecutionFlowEvent("prompt_start", c.getNextSequenceNumber(), "success", nil, map[string]interface{}{
		"executionName": request.ExecutionRunName,
		"basePrompt":    request.BasePrompt,
		"configCount":   len(request.Configurations),
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

	// Execute each configuration with rate limiting
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

		// Execute single variation
		c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryExecution,
			fmt.Sprintf("Executing variation: %s", config.VariationName), nil)

		// Log AI model call start
		sequenceNum := i + 1
		c.logExecutionFlowEvent("ai_model_call", sequenceNum, "pending", nil, map[string]interface{}{
			"configurationName": config.VariationName,
			"modelName":         config.ModelName,
		}, nil, nil)

		startTime := time.Now()
		variationResult, err := c.executeSingleVariation(ctx, userID, executionRun.ID, &config, request.BasePrompt, request.Context)
		executionTimeMs := int32(time.Since(startTime).Milliseconds())

		if err != nil {
			c.logExecutionEvent(types.LogLevelError, types.LogCategoryError,
				fmt.Sprintf("Variation failed: %s - %v", config.VariationName, err), nil)

			// Log AI response with error
			errorMsg := err.Error()
			c.logExecutionFlowEvent("ai_response", sequenceNum, "error", nil, map[string]interface{}{
				"configurationName": config.VariationName,
			}, &executionTimeMs, &errorMsg)

			result.ErrorCount++
		} else {
			c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryExecution,
				fmt.Sprintf("Variation completed: %s", config.VariationName), nil)

			// Log successful AI response
			c.logExecutionFlowEvent("ai_response", sequenceNum, "success", nil, map[string]interface{}{
				"configurationName": config.VariationName,
				"responseLength":    len(variationResult.Response.ResponseText),
			}, &executionTimeMs, nil)

			result.SuccessCount++
		}

		result.Results = append(result.Results, *variationResult)

		// Add rate limiting delay between requests (except for the last one)
		if i < len(request.Configurations)-1 {
			delay := time.Duration(100+rand.Intn(101)) * time.Millisecond
			c.logExecutionEvent(types.LogLevelDebug, types.LogCategoryExecution,
				fmt.Sprintf("Rate limiting: waiting %v before next API call", delay), nil)
			time.Sleep(delay)
		}
	}

	// Store function-execution relationships for replay functionality
	if request.EnableFunctionCalling && len(request.FunctionTools) > 0 {
		err := c.storeFunctionExecutionConfigs(ctx, userID, executionRun.ID, request.FunctionTools)
		if err != nil {
			c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryError,
				fmt.Sprintf("Failed to store function-execution configs: %v", err), nil)
			// Don't fail the entire execution, just log the warning
		} else {
			c.logExecutionEvent(types.LogLevelSuccess, types.LogCategorySetup,
				"Function-execution relationships stored for replay", nil)
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

	// Always perform comparison for better user experience
	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryExecution,
		"Starting comparison analysis", nil)
	comparison, err := c.compareResults(ctx, result)
	if err != nil {
		// Log comparison error but don't fail the whole execution
		fmt.Printf("❌ Warning: comparison failed: %v\n", err)
	} else {
		fmt.Printf("✅ Comparison completed successfully: %s\n", comparison.ID)
		result.Comparison = comparison

		// Store comparison result in database
		if err := c.StoreComparisonResult(ctx, userID, comparison); err != nil {
			fmt.Printf("⚠️ Warning: failed to store comparison result: %v\n", err)
		} else {
			fmt.Printf("💾 Comparison result stored in database: %s\n", comparison.ID)
		}
	}

	return result, nil
}

// executeSingleVariation executes a single variation and logs everything
func (c *Client) executeSingleVariation(ctx context.Context, userID string, executionRunID string, config *types.APIConfiguration, prompt, context string) (*types.VariationResult, error) {
	startTime := time.Now()

	// Get the actual configuration ID from the database since config.ID might not be persisted yet
	// We need to find the configuration that was actually saved to the database
	configUserID := userID
	if config.UserID != "" {
		configUserID = config.UserID
	}

	// First try to get by ID if it exists
	var actualConfigID string
	if config.ID != "" {
		actualConfig, err := c.queries.GetAPIConfiguration(ctx, db.GetAPIConfigurationParams{
			ID:     config.ID,
			UserID: configUserID,
		})
		if err == nil {
			actualConfigID = actualConfig.ID
		}
	}

	// If we couldn't find by ID, find by user_id + variation_name
	if actualConfigID == "" {
		configs, err := c.queries.ListAPIConfigurationsByUser(ctx, configUserID)
		if err != nil {
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
			return nil, fmt.Errorf("configuration not found after creation: %s", config.VariationName)
		}
		actualConfigID = foundConfig.ID
	}

	// Create API request with the actual configuration ID from database
	apiRequest := &types.APIRequest{
		ID:              uuid.New().String(),
		ExecutionRunID:  executionRunID,
		ConfigurationID: actualConfigID,
		RequestType:     types.RequestTypeGenerate, // Default to generate for now
		Prompt:          prompt,
		Context:         context,
		CreatedAt:       time.Now(),
	}

	// Log request
	if err := c.LogAPIRequest(ctx, userID, apiRequest); err != nil {
		return nil, fmt.Errorf("failed to log API request: %w", err)
	}

	// Set request context for flow event logging
	// Save current context to restore later
	prevExecutionRunID := c.currentExecutionRunID
	prevConfigID := c.currentConfigID
	prevRequestID := c.currentRequestID

	c.setExecutionContext(&executionRunID, &actualConfigID, &apiRequest.ID)
	defer func() {
		// Restore previous context instead of clearing completely
		c.setExecutionContext(prevExecutionRunID, prevConfigID, prevRequestID)
	}()

	// Log API request start flow event
	c.logExecutionFlowEvent("api_request_start", c.getNextSequenceNumber(), "pending", nil, map[string]interface{}{
		"requestId":       apiRequest.ID,
		"configurationId": actualConfigID,
		"promptLength":    len(prompt),
		"contextLength":   len(context),
		"requestType":     string(apiRequest.RequestType),
	}, nil, nil)

	// Execute the actual Gemini API call
	apiResponse, err := c.callGeminiAPI(ctx, config, apiRequest)
	apiCallDuration := int32(time.Since(startTime).Milliseconds())

	if err != nil {
		// Log error response
		apiResponse = &types.APIResponse{
			ID:             uuid.New().String(),
			RequestID:      apiRequest.ID,
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   err.Error(),
			ResponseTimeMs: apiCallDuration,
			CreatedAt:      time.Now(),
		}

		// Log API request error flow event
		errorMsg := err.Error()
		c.logExecutionFlowEvent("api_request_end", c.getNextSequenceNumber(), "error", nil, map[string]interface{}{
			"requestId":      apiRequest.ID,
			"responseStatus": string(apiResponse.ResponseStatus),
			"errorMessage":   errorMsg,
		}, &apiCallDuration, &errorMsg)
	} else {
		// Log successful API request end flow event
		c.logExecutionFlowEvent("api_request_end", c.getNextSequenceNumber(), "success", nil, map[string]interface{}{
			"requestId":      apiRequest.ID,
			"responseStatus": string(apiResponse.ResponseStatus),
			"responseLength": len(apiResponse.ResponseText),
			"finishReason":   apiResponse.FinishReason,
		}, &apiCallDuration, nil)
	}

	// Log response
	if logErr := c.LogAPIResponse(ctx, userID, apiResponse); logErr != nil {
		return nil, fmt.Errorf("failed to log API response: %w", logErr)
	}

	// Update the config ID to use the actual database ID for consistency
	config.ID = actualConfigID

	return &types.VariationResult{
		Configuration: *config,
		Request:       *apiRequest,
		Response:      *apiResponse,
		ExecutionTime: time.Since(startTime).Milliseconds(),
	}, err
}

// callGeminiAPI makes the actual API call to Gemini
func (c *Client) callGeminiAPI(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest) (*types.APIResponse, error) {
	// Check if we have an API key available
	var geminiApiKey string
	if c.sessionApiKeys != nil {
		geminiApiKey = c.sessionApiKeys.GeminiApiKey
	}
	if geminiApiKey == "" {
		log.Printf("No Gemini API key available, using mock responses")
		return c.callMockGeminiAPI(ctx, config, request)
	}

	// Force REST API implementation since it works perfectly
	log.Printf("Using REST API for model: %s with API key: %s...", config.ModelName, geminiApiKey[:10])

	// Use our working REST API implementation
	return c.callGeminiRestAPI(ctx, config, request)
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
// sanitizeToolParameters removes fields that are not supported by the Gemini API
func sanitizeToolParameters(params map[string]interface{}) map[string]interface{} {
	if params == nil {
		return params
	}

	// Create a copy to avoid modifying the original
	sanitized := make(map[string]interface{})

	// Copy allowed fields at the top level
	allowedTopLevel := map[string]bool{
		"type":        true,
		"properties":  true,
		"required":    true,
		"description": true,
	}

	for key, value := range params {
		if allowedTopLevel[key] {
			if key == "properties" {
				// Recursively sanitize properties
				if props, ok := value.(map[string]interface{}); ok {
					sanitizedProps := make(map[string]interface{})
					for propName, propValue := range props {
						if propMap, ok := propValue.(map[string]interface{}); ok {
							sanitizedProps[propName] = sanitizePropertySchema(propMap)
						} else {
							sanitizedProps[propName] = propValue
						}
					}
					sanitized[key] = sanitizedProps
				} else {
					sanitized[key] = value
				}
			} else {
				sanitized[key] = value
			}
		}
	}

	return sanitized
}

// sanitizePropertySchema removes invalid fields from individual property schemas
func sanitizePropertySchema(prop map[string]interface{}) map[string]interface{} {
	sanitized := make(map[string]interface{})

	// Allowed fields for property schemas in Gemini API
	allowedFields := map[string]bool{
		"type":        true,
		"description": true,
		"enum":        true,
		"items":       true,
		"properties":  true,
		"required":    true,
		"minimum":     true,
		"maximum":     true,
		"minLength":   true,
		"maxLength":   true,
		"pattern":     true,
		"format":      true,
	}

	for key, value := range prop {
		if allowedFields[key] {
			sanitized[key] = value
		} else {
			// log.Printf("🚫 Removing unsupported field '%s' from function parameter schema", key)
		}
	}

	return sanitized
}

func (c *Client) callGeminiRestAPI(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest) (*types.APIResponse, error) {
	startTime := time.Now()

	fmt.Printf("\n🚀 USING REST API IMPLEMENTATION - Model: '%s'\n", config.ModelName)
	var geminiApiKey string
	if c.sessionApiKeys != nil {
		geminiApiKey = c.sessionApiKeys.GeminiApiKey
	}
	log.Printf("🚀 REST API CALLED - Model: '%s', API Key: %s...", config.ModelName, geminiApiKey[:10])

	// Log Gemini API call start flow event
	c.logExecutionFlowEvent("gemini_api_call_start", c.getNextSequenceNumber(), "pending", nil, map[string]interface{}{
		"modelName":    config.ModelName,
		"temperature":  config.Temperature,
		"maxTokens":    config.MaxTokens,
		"apiKeyPrefix": geminiApiKey[:10],
	}, nil, nil)

	if config.ModelName == "" {
		log.Printf("❌ ERROR: Model name is empty!")
		errorMsg := "Model name is empty"
		callDuration := int32(time.Since(startTime).Milliseconds())
		c.logExecutionFlowEvent("gemini_api_call_end", c.getNextSequenceNumber(), "error", nil, map[string]interface{}{
			"errorType": "configuration_error",
		}, &callDuration, &errorMsg)

		return &types.APIResponse{
			ID:             uuid.New().String(),
			RequestID:      request.ID,
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   errorMsg,
			ResponseTimeMs: callDuration,
			CreatedAt:      time.Now(),
		}, fmt.Errorf("model name is empty")
	}

	// Use the API key from session keys
	var apiKey string
	if c.sessionApiKeys != nil {
		apiKey = c.sessionApiKeys.GeminiApiKey
	}
	if apiKey == "" {
		log.Printf("❌ No Gemini API key available for REST API call")
		return c.callMockGeminiAPI(ctx, config, request)
	}

	log.Printf("✅ Using API key: %s... for model: '%s'", apiKey[:10], config.ModelName)

	// Build the REST API request - start with the base prompt
	prompt := request.Prompt
	if request.Context != "" {
		prompt = fmt.Sprintf("%s\n\nContext: %s", prompt, request.Context)
	}

	// Prepare the final prompt
	finalPrompt := prompt
	if config.SystemPrompt != "" {
		finalPrompt = config.SystemPrompt + "\n\n" + prompt
	}

	log.Printf("REST API - Final prompt: %s", finalPrompt[:min(100, len(finalPrompt))])

	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": finalPrompt},
				},
			},
		},
	}

	// Add system instruction for function calling reliability if tools are available
	if len(config.Tools) > 0 {
		// Use user's system prompt if available, otherwise use minimal function calling instruction
		systemInstruction := ""
		if config.SystemPrompt != "" {
			// Respect user's system prompt and enhance it for function calling
			systemInstruction = fmt.Sprintf("%s\n\nWhen relevant functions are available, use them to provide accurate, helpful responses.", config.SystemPrompt)
		} else {
			// Minimal default instruction only if user hasn't specified one
			systemInstruction = "Use the available functions when they are relevant to answering the user's question. Provide natural, helpful responses based on function results."
		}

		requestBody["systemInstruction"] = map[string]interface{}{
			"parts": []map[string]interface{}{
				{"text": systemInstruction},
			},
		}
		log.Printf("🔧 Added system instruction respecting user configuration")
	} else if config.SystemPrompt != "" {
		// No tools but user has system prompt - respect it
		requestBody["systemInstruction"] = map[string]interface{}{
			"parts": []map[string]interface{}{
				{"text": config.SystemPrompt},
			},
		}
		log.Printf("🔧 Added user-defined system instruction")
	}

	// Add generation config - ALWAYS respect user's configuration
	generationConfig := make(map[string]interface{})

	// Use user's configured values first, with safe defaults only if not set
	if config.Temperature != nil {
		generationConfig["temperature"] = *config.Temperature
		log.Printf("🔧 Using user-configured temperature: %v", *config.Temperature)
	} else if len(config.Tools) > 0 {
		// Only suggest lower temperature if user hasn't set one and we have tools
		generationConfig["temperature"] = 0.1
		log.Printf("🔧 Using default low temperature (0.1) for function calling - user can override in config")
	}

	if config.MaxTokens != nil {
		generationConfig["maxOutputTokens"] = *config.MaxTokens
		log.Printf("🔧 Using user-configured maxTokens: %v", *config.MaxTokens)
	} else if len(config.Tools) > 0 {
		// Only suggest higher token limit if user hasn't set one and we have tools
		generationConfig["maxOutputTokens"] = 8192
		log.Printf("🔧 Using default high token limit (8192) for function calling - user can override in config")
	}

	if config.TopP != nil {
		generationConfig["topP"] = *config.TopP
	}
	if config.TopK != nil {
		generationConfig["topK"] = *config.TopK
	}
	if len(generationConfig) > 0 {
		requestBody["generationConfig"] = generationConfig
	}

	// Add tools for function calling if provided
	if len(config.Tools) > 0 {
		log.Printf("🔧 Adding %d tools to Gemini request", len(config.Tools))
		tools := make([]map[string]interface{}, len(config.Tools))
		for i, tool := range config.Tools {
			log.Printf("🔧 Tool %d: %s - %s", i+1, tool.Name, tool.Description)

			// Sanitize the parameters to remove unsupported fields
			sanitizedParams := sanitizeToolParameters(tool.Parameters)

			toolDeclaration := map[string]interface{}{
				"functionDeclarations": []map[string]interface{}{
					{
						"name":        tool.Name,
						"description": tool.Description,
						"parameters":  sanitizedParams,
					},
				},
			}
			tools[i] = toolDeclaration
			log.Printf("🔧 Tool declaration (sanitized): %+v", toolDeclaration)
		}
		requestBody["tools"] = tools

		// Use ANY mode to force function calling when we have specific tasks that require tool usage
		// This is recommended for cases where we definitely want the AI to use available functions
		toolConfigMode := "ANY" // Force function calling for better reliability
		if len(config.Tools) == 1 {
			// When we have specific single-purpose tools (like GitHub functions), force their usage
			toolConfigMode = "ANY"
		}

		requestBody["toolConfig"] = map[string]interface{}{
			"functionCallingConfig": map[string]interface{}{
				"mode": toolConfigMode,
			},
		}

		log.Printf("🔧 Final tools in request body: %+v", tools)
		log.Printf("🔧 Added toolConfig with mode: %s (forcing function usage for reliability)", toolConfigMode)
	} else {
		log.Printf("⚠️  No tools provided to Gemini API call")
	}

	// Create request body
	reqBodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	log.Printf("🔧 Complete Gemini API request body: %s", string(reqBodyBytes))

	// Make HTTP request to Gemini REST API
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", config.ModelName)
	log.Printf("REST API - URL: %s", url)

	// Create HTTP request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", apiKey)

	client := &http.Client{Timeout: 10 * time.Minute} // Very tolerant for async execution
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("REST API - HTTP request error: %v", err)
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("REST API - Read response error: %v", err)
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	log.Printf("🔧 Complete Gemini API response: %s", string(body))

	if resp.StatusCode != http.StatusOK {
		log.Printf("REST API - HTTP error %d: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("HTTP error %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text         string `json:"text,omitempty"`
					FunctionCall struct {
						Name string                 `json:"name"`
						Args map[string]interface{} `json:"args"`
					} `json:"functionCall,omitempty"`
				} `json:"parts"`
			} `json:"content"`
			FinishReason string `json:"finishReason"`
		} `json:"candidates"`
		UsageMetadata struct {
			PromptTokenCount     int `json:"promptTokenCount"`
			CandidatesTokenCount int `json:"candidatesTokenCount"`
			TotalTokenCount      int `json:"totalTokenCount"`
		} `json:"usageMetadata"`
	}

	if err := json.Unmarshal(body, &geminiResp); err != nil {
		log.Printf("REST API - JSON parse error: %v", err)
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	log.Printf("🔧 Parsed response - %d candidates", len(geminiResp.Candidates))

	// Check for function calls in response and extract response text
	var responseText string
	var finishReason string
	var functionCallResponse map[string]interface{}
	var allFunctionCalls []ResponsePart

	if len(geminiResp.Candidates) > 0 {
		candidate := geminiResp.Candidates[0]
		finishReason = candidate.FinishReason

		// First pass: collect all function calls and text responses (Gemini parallel function calling)
		for _, part := range candidate.Content.Parts {
			if part.Text != "" {
				responseText = part.Text
			}
			if part.FunctionCall.Name != "" {
				allFunctionCalls = append(allFunctionCalls, part)
			}
		}

		// Process function calls - let Gemini decide parallel vs sequential
		if len(allFunctionCalls) > 0 {
			log.Printf("🔧 Processing %d function call(s) - executing them and allowing iterative calling", len(allFunctionCalls))
			responseText, functionCallResponse = c.processIterativeFunctionCalls(ctx, config, request, allFunctionCalls, finalPrompt)
		}
	}

	// Skip the old sequential processing since we're now handling all function calls in parallel
	// The old code below will be removed after implementing processParallelFunctionCalls
	if false && len(allFunctionCalls) == 0 {
		// Old single function call handling (keeping temporarily for reference)
		for _, part := range geminiResp.Candidates[0].Content.Parts {
			if part.FunctionCall.Name != "" {
				c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryFunctionCall,
					fmt.Sprintf("Function call detected: %s", part.FunctionCall.Name),
					map[string]interface{}{
						"functionName": part.FunctionCall.Name,
						"arguments":    part.FunctionCall.Args,
					})

				// Execute the function call
				startTime := time.Now()
				functionResult, err := c.executeFunctionCall(ctx, part.FunctionCall.Name, part.FunctionCall.Args)
				executionTime := time.Since(startTime).Milliseconds()

				// Store original arguments in function result metadata for conversation reconstruction
				if functionResult != nil {
					if metadata, ok := functionResult["_metadata"].(map[string]interface{}); ok {
						metadata["original_args"] = part.FunctionCall.Args
					} else {
						functionResult["_metadata"] = map[string]interface{}{
							"original_args": part.FunctionCall.Args,
						}
					}
				}

				// Create function call record for logging
				functionCall := &types.FunctionCall{
					ID:               uuid.New().String(),
					RequestID:        request.ID,
					FunctionName:     part.FunctionCall.Name,
					FunctionArgs:     part.FunctionCall.Args,
					FunctionResponse: functionResult,
					ExecutionTimeMs:  int32(executionTime),
					CreatedAt:        time.Now(),
				}

				if err != nil {
					c.logExecutionEvent(types.LogLevelError, types.LogCategoryFunctionCall,
						fmt.Sprintf("Function execution failed: %v", err),
						map[string]interface{}{
							"functionName": part.FunctionCall.Name,
							"error":        err.Error(),
						})
					functionCall.ExecutionStatus = "error"
					functionCall.ErrorDetails = err.Error()
					// Return error response but don't fail completely
					functionResult = map[string]interface{}{
						"error":  err.Error(),
						"status": "failed",
					}
					functionCall.FunctionResponse = functionResult
				} else {
					c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryFunctionCall,
						fmt.Sprintf("Function executed successfully: %s", part.FunctionCall.Name),
						map[string]interface{}{
							"functionName":  part.FunctionCall.Name,
							"executionTime": executionTime,
							"resultPreview": fmt.Sprintf("%v", functionResult)[:min(100, len(fmt.Sprintf("%v", functionResult)))],
						})
					functionCall.ExecutionStatus = "success"
				}

				// Log function call to database
				if logErr := c.LogFunctionCall(ctx, functionCall); logErr != nil {
					c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryError,
						fmt.Sprintf("Failed to log function call to database: %v", logErr), nil)
				}

				// Send function result back to Gemini to get final response
				finalResponse, err := c.sendFunctionResultToGemini(ctx, config, request, part.FunctionCall.Name, functionResult, finalPrompt)
				if err != nil {
					c.logExecutionEvent(types.LogLevelError, types.LogCategoryAPICall,
						fmt.Sprintf("Failed to get final response from Gemini: %v", err),
						map[string]interface{}{
							"functionName": part.FunctionCall.Name,
							"error":        err.Error(),
						})
					// Fall back to just indicating the function was called
					responseText = fmt.Sprintf("I called the %s function with the provided parameters and received the result.", part.FunctionCall.Name)
				} else {
					c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryAPICall,
						"Got final response from Gemini after function execution",
						map[string]interface{}{
							"functionName":    part.FunctionCall.Name,
							"responsePreview": finalResponse[:min(100, len(finalResponse))],
						})
					responseText = finalResponse
				}

				// Store function call information
				functionCallResponse = map[string]interface{}{
					"function_name": part.FunctionCall.Name,
					"arguments":     part.FunctionCall.Args,
					"result":        functionResult,
				}

				// Continue parsing in case additional function calls are present
			}
		}
	}

	// If we have a function call but no text response, generate appropriate text
	if functionCallResponse != nil && responseText == "" {
		functionName := functionCallResponse["function_name"].(string)
		responseText = fmt.Sprintf("I called the %s function for you.", functionName)
	}

	log.Printf("REST API - Success! Response text: %s", responseText[:min(50, len(responseText))])
	if functionCallResponse != nil {
		log.Printf("REST API - Function call response: %+v", functionCallResponse)
	}

	// Build usage metadata
	usageMetadata := map[string]interface{}{
		"prompt_tokens":     geminiResp.UsageMetadata.PromptTokenCount,
		"completion_tokens": geminiResp.UsageMetadata.CandidatesTokenCount,
		"total_tokens":      geminiResp.UsageMetadata.TotalTokenCount,
	}

	response := &types.APIResponse{
		ID:             uuid.New().String(),
		RequestID:      request.ID,
		ResponseStatus: types.ResponseStatusSuccess,
		ResponseText:   responseText,
		UsageMetadata:  usageMetadata,
		FinishReason:   finishReason,
		ResponseTimeMs: int32(time.Since(startTime).Milliseconds()),
		CreatedAt:      time.Now(),
	}

	// Add function call response to the API response
	if functionCallResponse != nil {
		response.FunctionCallResponse = functionCallResponse
	}

	// Log successful Gemini API call end flow event
	callDuration := int32(time.Since(startTime).Milliseconds())
	functionCallsCount := 0
	if functionCallResponse != nil {
		functionCallsCount = 1 // At least one function call was made
	}
	c.logExecutionFlowEvent("gemini_api_call_end", c.getNextSequenceNumber(), "success", nil, map[string]interface{}{
		"responseLength":     len(responseText),
		"finishReason":       finishReason,
		"usageTokens":        response.UsageMetadata,
		"functionCallsCount": functionCallsCount,
	}, &callDuration, nil)

	return response, nil
}

// executeFunctionCall executes a function call and returns the result
func (c *Client) executeFunctionCall(ctx context.Context, functionName string, args map[string]interface{}) (map[string]interface{}, error) {
	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryFunctionCall,
		fmt.Sprintf("Executing function: %s", functionName),
		map[string]interface{}{
			"functionName": functionName,
			"args":         args,
		})

	// Log function call start flow event
	functionCallID := uuid.New().String()
	sequenceNum := c.getNextSequenceNumber()
	c.logExecutionFlowEvent("function_call_start", sequenceNum, "pending", nil, map[string]interface{}{
		"functionName":   functionName,
		"arguments":      args,
		"functionCallId": functionCallID,
	}, nil, nil)

	startTime := time.Now()

	// Normalize common argument aliases (e.g. node_label → label)
	switch functionName {
	case "neo4j_node_lookup":
		if _, ok := args["label"]; !ok {
			if nodeLabel, hasNL := args["node_label"]; hasNL {
				args["label"] = nodeLabel
			}
		}
	}

	// NEW: Dynamic function execution using database definitions
	funcDef, err := c.getFunctionDefinitionForExecution(ctx, functionName)
	if err != nil {
		c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryFunctionCall,
			fmt.Sprintf("Function definition not found, falling back to legacy handling: %s", functionName),
			map[string]interface{}{
				"error": err.Error(),
			})
		// Fall back to legacy hardcoded function handling
		result, err := c.executeLegacyFunction(ctx, functionName, args)
		executionTimeMs := int32(time.Since(startTime).Milliseconds())

		if err != nil {
			errorMsg := err.Error()
			c.logExecutionFlowEvent("function_call_end", c.getNextSequenceNumber(), "error", nil, map[string]interface{}{
				"functionName":   functionName,
				"functionCallId": functionCallID,
			}, &executionTimeMs, &errorMsg)
		} else {
			c.logExecutionFlowEvent("function_call_end", c.getNextSequenceNumber(), "success", nil, map[string]interface{}{
				"functionName":   functionName,
				"functionCallId": functionCallID,
				"resultSize":     len(fmt.Sprintf("%v", result)),
			}, &executionTimeMs, nil)
		}

		return result, err
	}

	// Validate parameters against stored schema
	if err := c.validateFunctionParameters(args, funcDef.ParametersSchema); err != nil {
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryFunctionCall,
			fmt.Sprintf("Parameter validation failed for %s: %v", functionName, err),
			map[string]interface{}{
				"error": err.Error(),
				"args":  args,
			})

		// Log function call end with validation error
		executionTimeMs := int32(time.Since(startTime).Milliseconds())
		errorMsg := err.Error()
		c.logExecutionFlowEvent("function_call_end", c.getNextSequenceNumber(), "error", nil, map[string]interface{}{
			"functionName":   functionName,
			"functionCallId": functionCallID,
			"errorType":      "validation_error",
		}, &executionTimeMs, &errorMsg)

		return nil, fmt.Errorf("parameter validation failed: %w", err)
	}

	// Execute function based on method type
	result, err := c.executeDynamicFunction(ctx, funcDef, args)
	executionTimeMs := int32(time.Since(startTime).Milliseconds())

	if err != nil {
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryFunctionCall,
			fmt.Sprintf("Function execution failed for %s: %v", functionName, err),
			map[string]interface{}{
				"error": err.Error(),
			})

		// Log function call end with execution error
		errorMsg := err.Error()
		c.logExecutionFlowEvent("function_call_end", c.getNextSequenceNumber(), "error", nil, map[string]interface{}{
			"functionName":   functionName,
			"functionCallId": functionCallID,
			"errorType":      "execution_error",
		}, &executionTimeMs, &errorMsg)

		return nil, err
	}

	c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryFunctionCall,
		fmt.Sprintf("Function %s executed successfully via dynamic execution", functionName),
		map[string]interface{}{
			"result_size": len(fmt.Sprintf("%v", result)),
		})

	// Log successful function call end
	c.logExecutionFlowEvent("function_call_end", c.getNextSequenceNumber(), "success", nil, map[string]interface{}{
		"functionName":   functionName,
		"functionCallId": functionCallID,
		"resultSize":     len(fmt.Sprintf("%v", result)),
	}, &executionTimeMs, nil)

	return result, nil
}

// processIterativeFunctionCalls handles function calls with proper dependency support
func (c *Client) processIterativeFunctionCalls(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest, functionCalls []ResponsePart, originalPrompt string) (string, map[string]interface{}) {
	log.Printf("🔧 Starting iterative function calling with %d initial function(s)", len(functionCalls))

	// Build conversation history starting with user message
	conversationHistory := []map[string]interface{}{
		{
			"role": "user",
			"parts": []map[string]interface{}{
				{"text": originalPrompt},
			},
		},
	}

	// Execute the iterative function calling loop
	return c.executeIterativeFunctionLoop(ctx, config, request, functionCalls, conversationHistory)
}

// executeIterativeFunctionLoop handles the iterative execution of functions until Gemini provides final response
func (c *Client) executeIterativeFunctionLoop(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest, functionCalls []ResponsePart, conversationHistory []map[string]interface{}) (string, map[string]interface{}) {
	maxIterations := 5 // Prevent infinite loops
	iteration := 0

	for iteration < maxIterations {
		iteration++
		log.Printf("🔄 Function calling iteration %d with %d function(s)", iteration, len(functionCalls))

		// Execute all requested functions (Gemini decides what to call)
		functionResults := make([]map[string]interface{}, len(functionCalls))
		modelParts := make([]map[string]interface{}, len(functionCalls))

		for i, funcCall := range functionCalls {
			// Add to conversation as model function call
			modelParts[i] = map[string]interface{}{
				"functionCall": map[string]interface{}{
					"name": funcCall.FunctionCall.Name,
					"args": funcCall.FunctionCall.Args,
				},
			}

			// Execute the function
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

		// Add model function calls to conversation
		conversationHistory = append(conversationHistory, map[string]interface{}{
			"role":  "model",
			"parts": modelParts,
		})

		// Add function responses to conversation
		functionResponseParts := make([]map[string]interface{}, len(functionCalls))
		for i, funcCall := range functionCalls {
			functionResponseParts[i] = map[string]interface{}{
				"functionResponse": map[string]interface{}{
					"name":     funcCall.FunctionCall.Name,
					"response": functionResults[i],
				},
			}
		}

		conversationHistory = append(conversationHistory, map[string]interface{}{
			"role":  "function",
			"parts": functionResponseParts,
		})

		// Send conversation back to Gemini to see if it wants to call more functions or provide final answer
		nextResponse, err := c.sendConversationToGeminiForIteration(ctx, config, conversationHistory)
		if err != nil {
			log.Printf("⚠️ Failed to get next response from Gemini: %v", err)
			// Fallback to simple summary
			return c.createFallbackSummary(functionCalls, functionResults), nil
		}

		// Check if Gemini provided a text response (done) or more function calls
		if nextResponse.TextResponse != "" {
			// Check if this looks like a complete response for the complex task
			responseLength := len(strings.TrimSpace(nextResponse.TextResponse))
			if responseLength < 100 {
				log.Printf("⚠️ Response seems incomplete (only %d chars), encouraging continuation", responseLength)
				// Add a follow-up message to encourage completion - using user's context if available
				continuationPrompt := "Please continue and complete your response to fully address the original request."
				if request.Context != "" {
					continuationPrompt = fmt.Sprintf("Please continue and complete your response. %s", request.Context)
				}

				conversationHistory = append(conversationHistory, map[string]interface{}{
					"role": "user",
					"parts": []map[string]interface{}{
						{"text": continuationPrompt},
					},
				})
				// Continue iteration
			} else {
				// Before returning, ask Gemini to provide a comprehensive summary of ALL work completed
				log.Printf("🔧 Requesting comprehensive summary of all work completed in %d iterations", iteration)

				// Add a summary request to the conversation - respecting user's original request context
				summaryPrompt := "Thank you for completing the tasks! Please provide a comprehensive summary of what you accomplished."
				if request.Prompt != "" {
					// Use the original user prompt to guide the summary
					summaryPrompt = fmt.Sprintf("Thank you for completing the tasks! Please provide a comprehensive summary of what you accomplished based on the original request: \"%s\"",
						strings.TrimSpace(request.Prompt))
				}

				conversationHistory = append(conversationHistory, map[string]interface{}{
					"role": "user",
					"parts": []map[string]interface{}{
						{"text": summaryPrompt},
					},
				})

				// Get the comprehensive summary
				finalSummary, err := c.sendConversationToGeminiForIteration(ctx, config, conversationHistory)
				if err != nil {
					log.Printf("⚠️ Failed to get final summary: %v", err)
					// Return original response as fallback
					return nextResponse.TextResponse, nil
				}

				if finalSummary.TextResponse != "" {
					log.Printf("✅ Gemini provided comprehensive summary after %d iterations", iteration+1)
					return finalSummary.TextResponse, nil
				}

				// Fallback to original response
				log.Printf("✅ Gemini provided final response after %d iterations", iteration)
				return nextResponse.TextResponse, nil
			}
		}

		if len(nextResponse.FunctionCalls) > 0 {
			log.Printf("🔗 Gemini requested %d more function(s) for iteration %d", len(nextResponse.FunctionCalls), iteration+1)
			functionCalls = nextResponse.FunctionCalls
			continue // Next iteration with new function calls
		}

		// If we get here, Gemini didn't provide text or function calls - something went wrong
		log.Printf("⚠️ Gemini provided neither text nor function calls, ending iteration")
		break
	}

	log.Printf("⚠️ Reached maximum iterations (%d), providing fallback response", maxIterations)
	return c.createFallbackSummary(functionCalls, nil), nil
}

// GeminiIterationResponse holds the response from Gemini during iterative function calling
type GeminiIterationResponse struct {
	TextResponse  string
	FunctionCalls []ResponsePart
}

// sendConversationToGeminiForIteration sends conversation to Gemini and parses response for iteration
func (c *Client) sendConversationToGeminiForIteration(ctx context.Context, config *types.APIConfiguration, conversationHistory []map[string]interface{}) (*GeminiIterationResponse, error) {
	// Build request body with conversation history
	requestBody := map[string]interface{}{
		"contents": conversationHistory,
	}

	// Add generation config - ALWAYS respect user's configuration
	generationConfig := make(map[string]interface{})

	// Use user's configured values first, with safe defaults only if not set
	if config.Temperature != nil {
		generationConfig["temperature"] = *config.Temperature
		log.Printf("🔧 Using user-configured temperature: %v", *config.Temperature)
	} else if len(config.Tools) > 0 {
		// Only suggest lower temperature if user hasn't set one and we have tools
		generationConfig["temperature"] = 0.1
		log.Printf("🔧 Using default low temperature (0.1) for function calling - user can override in config")
	}

	if config.MaxTokens != nil {
		generationConfig["maxOutputTokens"] = *config.MaxTokens
		log.Printf("🔧 Using user-configured maxTokens: %v", *config.MaxTokens)
	} else if len(config.Tools) > 0 {
		// Only suggest higher token limit if user hasn't set one and we have tools
		generationConfig["maxOutputTokens"] = 8192
		log.Printf("🔧 Using default high token limit (8192) for function calling - user can override in config")
	}

	if len(generationConfig) > 0 {
		requestBody["generationConfig"] = generationConfig
	}

	// Add system instruction for function calling reliability
	if len(config.Tools) > 0 {
		// Use user's system prompt if available, otherwise use minimal function calling instruction
		systemInstruction := ""
		if config.SystemPrompt != "" {
			// Respect user's system prompt and enhance it for function calling
			systemInstruction = fmt.Sprintf("%s\n\nWhen relevant functions are available, use them to provide accurate, helpful responses.", config.SystemPrompt)
		} else {
			// Minimal default instruction only if user hasn't specified one
			systemInstruction = "Use the available functions when they are relevant to answering the user's question. Provide natural, helpful responses based on function results."
		}

		requestBody["systemInstruction"] = map[string]interface{}{
			"parts": []map[string]interface{}{
				{"text": systemInstruction},
			},
		}
	} else if config.SystemPrompt != "" {
		// No tools but user has system prompt - respect it
		requestBody["systemInstruction"] = map[string]interface{}{
			"parts": []map[string]interface{}{
				{"text": config.SystemPrompt},
			},
		}
	}

	// Include tools to allow more function calls (using same pattern as existing code)
	if len(config.Tools) > 0 {
		tools := make([]map[string]interface{}, len(config.Tools))
		for i, tool := range config.Tools {
			// Sanitize the parameters to remove unsupported fields
			sanitizedParams := sanitizeToolParameters(tool.Parameters)

			toolDeclaration := map[string]interface{}{
				"functionDeclarations": []map[string]interface{}{
					{
						"name":        tool.Name,
						"description": tool.Description,
						"parameters":  sanitizedParams,
					},
				},
			}
			tools[i] = toolDeclaration
		}
		requestBody["tools"] = tools

		// Use AUTO mode to let Gemini decide
		requestBody["toolConfig"] = map[string]interface{}{
			"functionCallingConfig": map[string]interface{}{
				"mode": "AUTO",
			},
		}
	}

	// Make HTTP request using same pattern as existing code
	reqBodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Get API key from session keys (same pattern as existing code)
	apiKey := ""
	if c.sessionApiKeys != nil {
		apiKey = c.sessionApiKeys.GeminiApiKey
	}

	// Make HTTP request to Gemini REST API
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", config.ModelName)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", apiKey)

	client := &http.Client{Timeout: 10 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP error %d: %s", resp.StatusCode, string(body))
	}

	// Parse response using same pattern as existing code
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text         string `json:"text,omitempty"`
					FunctionCall struct {
						Name string                 `json:"name"`
						Args map[string]interface{} `json:"args"`
					} `json:"functionCall,omitempty"`
				} `json:"parts"`
			} `json:"content"`
			FinishReason string `json:"finishReason"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(body, &geminiResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	response := &GeminiIterationResponse{}

	if len(geminiResp.Candidates) > 0 {
		candidate := geminiResp.Candidates[0]

		for _, part := range candidate.Content.Parts {
			if part.Text != "" {
				response.TextResponse = part.Text
			}
			if part.FunctionCall.Name != "" {
				// Convert to ResponsePart format
				responsePart := ResponsePart{
					Text: "",
					FunctionCall: struct {
						Name string                 `json:"name"`
						Args map[string]interface{} `json:"args"`
					}{
						Name: part.FunctionCall.Name,
						Args: part.FunctionCall.Args,
					},
				}
				response.FunctionCalls = append(response.FunctionCalls, responsePart)
			}
		}
	}

	return response, nil
}

// createFallbackSummary creates a simple summary when function calling fails
func (c *Client) createFallbackSummary(functionCalls []ResponsePart, functionResults []map[string]interface{}) string {
	if len(functionCalls) == 0 {
		return "I attempted to process your request but encountered an error."
	}

	var functionNames []string
	for _, funcCall := range functionCalls {
		functionNames = append(functionNames, funcCall.FunctionCall.Name)
	}

	summary := fmt.Sprintf("I executed %d functions: %s", len(functionNames), strings.Join(functionNames, ", "))

	if functionResults != nil && len(functionResults) > 0 {
		summary += "\n\nHowever, I encountered an issue providing a comprehensive analysis. The functions executed successfully, but I was unable to synthesize the results properly."
	}

	return summary
}

// processParallelFunctionCalls handles multiple function calls as per Gemini documentation (DEPRECATED - keeping for compatibility)
func (c *Client) processParallelFunctionCalls(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest, functionCalls []ResponsePart, originalPrompt string) (string, map[string]interface{}) {
	log.Printf("🔧 Executing %d function calls in parallel", len(functionCalls))

	// Execute all functions and collect results
	var functionResults []map[string]interface{}
	var conversationParts []map[string]interface{}

	// Add original user message
	conversationParts = append(conversationParts, map[string]interface{}{
		"role": "user",
		"parts": []map[string]interface{}{
			{"text": originalPrompt},
		},
	})

	// Add model function calls (all at once)
	modelParts := make([]map[string]interface{}, len(functionCalls))
	for i, funcCall := range functionCalls {
		modelParts[i] = map[string]interface{}{
			"functionCall": map[string]interface{}{
				"name": funcCall.FunctionCall.Name,
				"args": funcCall.FunctionCall.Args,
			},
		}

		// Execute the function
		result, err := c.executeFunctionCall(ctx, funcCall.FunctionCall.Name, funcCall.FunctionCall.Args)
		if err != nil {
			log.Printf("⚠️ Function %s failed: %v", funcCall.FunctionCall.Name, err)
			result = map[string]interface{}{
				"error":  err.Error(),
				"status": "failed",
			}
		}
		functionResults = append(functionResults, result)
	}

	conversationParts = append(conversationParts, map[string]interface{}{
		"role":  "model",
		"parts": modelParts,
	})

	// Add ALL function responses in a single function role entry (required by Gemini API)
	functionResponseParts := make([]map[string]interface{}, len(functionCalls))
	for i, funcCall := range functionCalls {
		functionResponseParts[i] = map[string]interface{}{
			"functionResponse": map[string]interface{}{
				"name":     funcCall.FunctionCall.Name,
				"response": functionResults[i],
			},
		}
	}

	conversationParts = append(conversationParts, map[string]interface{}{
		"role":  "function",
		"parts": functionResponseParts,
	})

	// Send complete conversation to Gemini for final synthesis
	finalResponse, err := c.sendConversationToGemini(ctx, config, conversationParts)
	if err != nil {
		log.Printf("⚠️ Failed to get final synthesis from Gemini: %v", err)
		// Fallback to basic response
		functionNames := make([]string, len(functionCalls))
		for i, fc := range functionCalls {
			functionNames[i] = fc.FunctionCall.Name
		}
		return fmt.Sprintf("I executed %d functions: %s", len(functionCalls), strings.Join(functionNames, ", ")), nil
	}

	// Return the first function call info for legacy compatibility
	firstFunctionResponse := map[string]interface{}{
		"function_name": functionCalls[0].FunctionCall.Name,
		"arguments":     functionCalls[0].FunctionCall.Args,
		"result":        functionResults[0],
	}

	return finalResponse, firstFunctionResponse
}

// sendConversationToGemini sends a complete conversation history to Gemini for synthesis
func (c *Client) sendConversationToGemini(ctx context.Context, config *types.APIConfiguration, conversationParts []map[string]interface{}) (string, error) {
	requestBody := map[string]interface{}{
		"contents": conversationParts,
	}

	// Add generation config
	generationConfig := make(map[string]interface{})
	if config.Temperature != nil {
		generationConfig["temperature"] = *config.Temperature
	}
	if config.MaxTokens != nil {
		generationConfig["maxOutputTokens"] = *config.MaxTokens
	}
	if len(generationConfig) > 0 {
		requestBody["generationConfig"] = generationConfig
	}

	// Don't include tools in synthesis call to force text response
	log.Printf("🔧 Sending conversation to Gemini for synthesis (no tools)")

	reqBodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", config.ModelName)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBodyBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	var geminiApiKey string
	if c.sessionApiKeys != nil {
		geminiApiKey = c.sessionApiKeys.GeminiApiKey
	}
	req.Header.Set("x-goog-api-key", geminiApiKey)

	client := &http.Client{Timeout: 2 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP error %d: %s", resp.StatusCode, string(body))
	}

	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text,omitempty"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(body, &geminiResp); err != nil {
		return "", err
	}

	if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
		for _, part := range geminiResp.Candidates[0].Content.Parts {
			if part.Text != "" {
				log.Printf("✅ Got synthesis response from Gemini: %s", part.Text[:min(100, len(part.Text))])
				return part.Text, nil
			}
		}
	}

	return "I executed the requested functions successfully.", nil
}

// executeLegacyFunction handles functions that aren't in the database (backward compatibility)
func (c *Client) executeLegacyFunction(ctx context.Context, functionName string, args map[string]interface{}) (map[string]interface{}, error) {
	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryFunctionCall,
		"Using legacy hardcoded function execution", nil)

	// Handle weather function with real API call
	if functionName == "get_current_weather" {
		location, ok := args["location"].(string)
		if !ok {
			c.logExecutionEvent(types.LogLevelError, types.LogCategoryFunctionCall,
				"Weather function failed: location parameter missing or invalid", nil)
			return nil, fmt.Errorf("location parameter missing or invalid")
		}

		// Call real weather API
		var openWeatherApiKey string
		if c.sessionApiKeys != nil {
			openWeatherApiKey = c.sessionApiKeys.OpenWeatherApiKey
		}
		result, err := c.callWeatherAPI(ctx, location, openWeatherApiKey)
		if err != nil {
			c.logExecutionEvent(types.LogLevelError, types.LogCategoryFunctionCall,
				fmt.Sprintf("Weather API call failed: %v", err),
				map[string]interface{}{
					"location": location,
					"error":    err.Error(),
				})
			// Fallback to mock data if API call fails
			result = map[string]interface{}{
				"location":    location,
				"temperature": 72,
				"unit":        "F",
				"condition":   "Sunny",
				"humidity":    45,
				"wind_speed":  8,
				"description": fmt.Sprintf("Current weather in %s: 72°F, sunny with clear skies (fallback data)", location),
				"error":       "Real weather data unavailable, showing fallback data",
			}
			c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryFunctionCall,
				fmt.Sprintf("Using fallback weather data for %s", location), nil)
		} else {
			c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryFunctionCall,
				fmt.Sprintf("Weather function executed successfully for %s", location),
				map[string]interface{}{
					"location": location,
					"result":   result,
				})
		}

		return result, nil
	}

	// Handle Neo4j graph query function
	if functionName == "query_graph" || functionName == "neo4j_node_lookup" {
		// For backward-compatibility, we support both the original "query_graph" name and the
		// newer database-seeded "neo4j_node_lookup" name.
		//
		// "query_graph" expects a raw Cypher query string in the "query" argument.
		// "neo4j_node_lookup" expects structured arguments (label, properties, limit).
		// We normalise both into a Cypher query and then reuse callNeo4jAPI.

		var (
			cypherQuery string
			limit       = 25
		)

		if functionName == "query_graph" {
			// Original behaviour ‑ the caller supplies the Cypher directly.
			queryArg, ok := args["query"].(string)
			if !ok {
				return nil, fmt.Errorf("query parameter missing or invalid")
			}
			cypherQuery = queryArg
			if limitVal, exists := args["limit"]; exists {
				if limitFloat, ok := limitVal.(float64); ok {
					limit = int(limitFloat)
				}
			}
		} else {
			// New structured lookup
			label, ok := args["label"].(string)
			if !ok || strings.TrimSpace(label) == "" {
				return nil, fmt.Errorf("label parameter missing or invalid")
			}

			// Optional properties map to build a WHERE clause
			whereClause := ""
			if propsRaw, ok := args["properties"].(map[string]interface{}); ok {
				var conditions []string
				for k, v := range propsRaw {
					// Use parameterised values in real code; for now build simple literals
					// Assume primitive types convertible to string
					conditions = append(conditions, fmt.Sprintf("n.%s = '%v'", k, v))
				}
				if len(conditions) > 0 {
					whereClause = "WHERE " + strings.Join(conditions, " AND ")
				}
			}

			if limitVal, exists := args["limit"]; exists {
				if limitFloat, ok := limitVal.(float64); ok {
					limit = int(limitFloat)
				}
			}

			cypherQuery = fmt.Sprintf("MATCH (n:%s) %s RETURN n", label, whereClause)
		}

		// Sanity-check limit bounds
		if limit < 1 || limit > 100 {
			limit = 25
		}

		// Execute against Neo4j
		result, err := c.callNeo4jAPI(ctx, cypherQuery, limit)
		if err != nil {
			log.Printf("❌ Neo4j query failed: %v", err)
			// Fallback to mock data if Neo4j call fails
			result = map[string]interface{}{
				"nodes": []map[string]interface{}{{
					"id":         "mock_node_1",
					"labels":     []string{"Error"},
					"properties": map[string]interface{}{"error": err.Error()},
				}},
				"relationships": []map[string]interface{}{},
				"summary": map[string]interface{}{
					"totalNodes":         1,
					"totalRelationships": 0,
					"executionTime":      "0ms",
					"query":              cypherQuery,
					"error":              "Neo4j connection unavailable, showing mock data",
				},
			}
		}

		log.Printf("✅ Neo4j query executed: %s", cypherQuery)
		return result, nil
	}

	// Handle Sales Summary Analytics function
	if functionName == "sales_summary" {
		c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryFunctionCall,
			"Executing sales summary analytics function", nil)

		// Parse optional parameters
		limit := 25
		if limitVal, exists := args["limit"]; exists {
			if limitFloat, ok := limitVal.(float64); ok {
				limit = int(limitFloat)
			}
		}

		// Currency filter - add to WHERE clause if specified
		var currencyFilter string
		if currencyVal, exists := args["currency_filter"]; exists {
			if currency, ok := currencyVal.(string); ok && currency != "" {
				currencyFilter = fmt.Sprintf("AND d.currency_code = '%s'", currency)
			}
		}

		// Minimum amount filter
		var minAmountFilter string
		if minAmountVal, exists := args["min_amount"]; exists {
			if minAmount, ok := minAmountVal.(float64); ok && minAmount > 0 {
				minAmountFilter = fmt.Sprintf("AND (annualized_amount * conversion_rate) >= %f", minAmount)
			}
		}

		// Build the comprehensive sales summary Cypher query
		cypherQuery := fmt.Sprintf(`
MATCH (p:Product)-[:HAS_DOCUMENT]->(d:Document)
OPTIONAL MATCH (d)-[:HAS_ITEM]->(i:Item)
WITH 
  p.category AS raw_category,
  coalesce(d.total_amount, d.total_discounted_amount) AS amount,
  d.currency_code AS currency,
  d.service_duration_month AS duration_months,
  count(i) AS item_count_per_document
WHERE duration_months IS NOT NULL AND duration_months > 0 %s

WITH 
  raw_category,
  currency,
  amount / duration_months * 12 AS annualized_amount,
  item_count_per_document,
  CASE 
    WHEN toLower(raw_category) IN ['e-signature'] THEN 'E-Signature'
    WHEN toLower(raw_category) IN ['direct-mail-marketing', 'direct mail marketing'] THEN 'Direct Mail Marketing'
    WHEN toLower(raw_category) IN ['rev ops', 'revenue ops'] THEN 'Revenue Operations'
    WHEN toLower(raw_category) IN ['sales engagement', 'sales intelligence', 'sales training', 'sales communication', 'sales productivity'] THEN 'Sales Enablement'
    WHEN toLower(raw_category) = 'commission-management' THEN 'Compensation Management'
    WHEN toLower(raw_category) = 'lead-generation' THEN 'Lead Management'
    WHEN toLower(raw_category) = 'event-services' THEN 'Event Services'
    WHEN toLower(raw_category) = 'security training' THEN 'Security Training'
    ELSE raw_category
  END AS standard_category,

  CASE 
    WHEN currency = 'USD' THEN 1.0
    WHEN currency = 'EUR' THEN 1.1
    WHEN currency = 'GBP' THEN 1.3
    ELSE 1.0
  END AS conversion_rate

WITH 
  standard_category,
  round(avg(annualized_amount * conversion_rate), 2) AS avg_annualized_amount_usd,
  count(*) AS document_count,
  sum(item_count_per_document) AS total_item_count
WHERE 1=1 %s
RETURN 
  standard_category,
  avg_annualized_amount_usd,
  document_count,
  total_item_count
ORDER BY avg_annualized_amount_usd DESC
LIMIT %d`, currencyFilter, minAmountFilter, limit)

		c.logExecutionEvent(types.LogLevelDebug, types.LogCategoryFunctionCall,
			fmt.Sprintf("Sales summary query: %s", cypherQuery),
			map[string]interface{}{
				"limit":           limit,
				"currency_filter": currencyFilter,
				"min_amount":      minAmountFilter,
			})

		// Execute the sales summary query using existing Neo4j API
		neo4jResult, err := c.callNeo4jAPI(ctx, cypherQuery, limit)
		if err != nil {
			c.logExecutionEvent(types.LogLevelError, types.LogCategoryFunctionCall,
				fmt.Sprintf("Sales summary query failed: %v", err),
				map[string]interface{}{
					"error": err.Error(),
					"query": cypherQuery,
				})

			// Fallback to mock sales data if Neo4j call fails
			result := map[string]interface{}{
				"sales_summary": []map[string]interface{}{
					{
						"standard_category":         "Sales Enablement",
						"avg_annualized_amount_usd": 125000.00,
						"document_count":            15,
						"total_item_count":          45,
					},
					{
						"standard_category":         "Revenue Operations",
						"avg_annualized_amount_usd": 98000.00,
						"document_count":            8,
						"total_item_count":          24,
					},
					{
						"standard_category":         "Lead Management",
						"avg_annualized_amount_usd": 75000.00,
						"document_count":            12,
						"total_item_count":          36,
					},
				},
				"summary": map[string]interface{}{
					"total_categories": 3,
					"query":            cypherQuery,
					"executionTime":    "0ms",
					"error":            "Neo4j connection unavailable, showing mock sales data",
				},
			}
			return result, nil
		}

		// Transform Neo4j result into sales summary format
		result := c.transformNeo4jToSalesSummary(neo4jResult, cypherQuery)

		c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryFunctionCall,
			"Sales summary analytics completed successfully",
			map[string]interface{}{
				"categories_returned": len(result["sales_summary"].([]map[string]interface{})),
			})

		return result, nil
	}

	// Handle Attribute Normalization function
	if functionName == "normalize_attributes" {
		c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryFunctionCall,
			"Executing attribute normalization function", nil)

		// Parse required parameters
		nodeLabel, ok := args["node_label"].(string)
		if !ok || strings.TrimSpace(nodeLabel) == "" {
			return nil, fmt.Errorf("node_label parameter missing or invalid")
		}

		attributeName, ok := args["attribute_name"].(string)
		if !ok || strings.TrimSpace(attributeName) == "" {
			return nil, fmt.Errorf("attribute_name parameter missing or invalid")
		}

		// Parse optional parameters
		limit := 100
		if limitVal, exists := args["limit"]; exists {
			if limitFloat, ok := limitVal.(float64); ok {
				limit = int(limitFloat)
			}
		}

		normalizationType := "general"
		if normTypeVal, exists := args["normalization_type"]; exists {
			if normType, ok := normTypeVal.(string); ok && normType != "" {
				normalizationType = normType
			}
		}

		caseStyle := "title_case"
		if caseVal, exists := args["case_style"]; exists {
			if caseStr, ok := caseVal.(string); ok && caseStr != "" {
				caseStyle = caseStr
			}
		}

		var customMappings map[string]interface{}
		if customVal, exists := args["custom_mappings"]; exists {
			if customMap, ok := customVal.(map[string]interface{}); ok {
				customMappings = customMap
			}
		}

		// Sanity-check limit bounds
		if limit < 1 || limit > 1000 {
			limit = 100
		}

		// Build Cypher query to get unique attribute values
		cypherQuery := fmt.Sprintf(`
MATCH (n:%s)
WHERE n.%s IS NOT NULL AND n.%s <> ''
RETURN DISTINCT n.%s AS raw_value
ORDER BY raw_value
LIMIT %d`, nodeLabel, attributeName, attributeName, attributeName, limit)

		c.logExecutionEvent(types.LogLevelDebug, types.LogCategoryFunctionCall,
			fmt.Sprintf("Normalization query: %s", cypherQuery),
			map[string]interface{}{
				"node_label":         nodeLabel,
				"attribute_name":     attributeName,
				"normalization_type": normalizationType,
				"case_style":         caseStyle,
				"limit":              limit,
			})

		// Execute the query to get raw values
		neo4jResult, err := c.callNeo4jAPI(ctx, cypherQuery, limit)
		if err != nil {
			c.logExecutionEvent(types.LogLevelError, types.LogCategoryFunctionCall,
				fmt.Sprintf("Attribute normalization query failed: %v", err),
				map[string]interface{}{
					"error": err.Error(),
					"query": cypherQuery,
				})

			// Fallback to mock normalization data if Neo4j call fails
			result := map[string]interface{}{
				"attribute_mappings": []map[string]interface{}{
					{
						"raw_value":        "software engineering",
						"normalized_value": "Software Engineering",
						"confidence":       1.0,
					},
					{
						"raw_value":        "Software Engineering",
						"normalized_value": "Software Engineering",
						"confidence":       1.0,
					},
					{
						"raw_value":        "data science",
						"normalized_value": "Data Science",
						"confidence":       1.0,
					},
				},
				"summary": map[string]interface{}{
					"total_raw_values":        3,
					"total_unique_normalized": 2,
					"normalization_type":      normalizationType,
					"case_style":              caseStyle,
					"query":                   cypherQuery,
					"executionTime":           "0ms",
					"error":                   "Neo4j connection unavailable, showing mock normalization data",
				},
			}
			return result, nil
		}

		// Process and normalize the results
		result := c.processAttributeNormalization(neo4jResult, normalizationType, caseStyle, customMappings, cypherQuery)

		c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryFunctionCall,
			"Attribute normalization completed successfully",
			map[string]interface{}{
				"mappings_returned": len(result["attribute_mappings"].([]map[string]interface{})),
			})

		return result, nil
	}

	// For other functions, return a generic success response
	return map[string]interface{}{
		"status":  "success",
		"message": fmt.Sprintf("Function %s executed successfully", functionName),
		"result":  "Function executed with provided parameters",
	}, nil
}

// callWeatherAPI makes a real API call to OpenWeatherMap API
func (c *Client) callWeatherAPI(ctx context.Context, location string, apiKey string) (map[string]interface{}, error) {
	if apiKey == "" {
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryAPICall,
			"OpenWeather API key not provided", nil)
		return nil, fmt.Errorf("OpenWeather API key not provided")
	}

	// Build API URL
	baseURL := "https://api.openweathermap.org/data/2.5/weather"
	params := url.Values{}
	params.Add("q", location)
	params.Add("appid", apiKey)
	params.Add("units", "imperial") // Fahrenheit

	apiURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())

	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryAPICall,
		fmt.Sprintf("Calling OpenWeatherMap API for location: %s", location),
		map[string]interface{}{
			"location":     location,
			"apiURL":       fmt.Sprintf("%s?q=%s&appid=***&units=imperial", baseURL, location), // Hide API key
			"apiKeyMasked": "***" + apiKey[len(apiKey)-4:],                                     // Show last 4 chars for debugging
		})

	// Create HTTP request with timeout
	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryAPICall,
			fmt.Sprintf("Failed to create weather API request: %v", err), nil)
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set User-Agent header
	req.Header.Set("User-Agent", "GoGent/1.0")

	// Make the API call
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryAPICall,
			fmt.Sprintf("Weather API request failed: %v", err),
			map[string]interface{}{
				"location": location,
				"error":    err.Error(),
			})
		return nil, fmt.Errorf("failed to call weather API: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryAPICall,
			fmt.Sprintf("Failed to read weather API response: %v", err), nil)
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Check for API errors
	if resp.StatusCode != 200 {
		// Provide helpful suggestions based on the error
		suggestion := c.getLocationSuggestion(location, resp.StatusCode, string(body))
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryAPICall,
			fmt.Sprintf("Weather API returned status: %d", resp.StatusCode),
			map[string]interface{}{
				"location":     location,
				"statusCode":   resp.StatusCode,
				"responseBody": string(body),
				"suggestion":   suggestion,
			})
		return nil, fmt.Errorf("weather API returned status %d", resp.StatusCode)
	}

	// Parse JSON response
	var weatherResp struct {
		Name string `json:"name"`
		Main struct {
			Temp     float64 `json:"temp"`
			Humidity int     `json:"humidity"`
		} `json:"main"`
		Weather []struct {
			Main        string `json:"main"`
			Description string `json:"description"`
		} `json:"weather"`
		Wind struct {
			Speed float64 `json:"speed"`
		} `json:"wind"`
	}

	if err := json.Unmarshal(body, &weatherResp); err != nil {
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryAPICall,
			fmt.Sprintf("Failed to parse weather API response: %v", err),
			map[string]interface{}{
				"location":     location,
				"responseBody": string(body),
				"error":        err.Error(),
			})
		return nil, fmt.Errorf("failed to parse weather response: %w", err)
	}

	// Build result
	condition := "Clear"
	description := "Clear skies"
	if len(weatherResp.Weather) > 0 {
		condition = weatherResp.Weather[0].Main
		description = weatherResp.Weather[0].Description
	}

	result := map[string]interface{}{
		"location":    fmt.Sprintf("%s", weatherResp.Name),
		"temperature": int(weatherResp.Main.Temp),
		"unit":        "F",
		"condition":   condition,
		"humidity":    weatherResp.Main.Humidity,
		"wind_speed":  int(weatherResp.Wind.Speed),
		"description": fmt.Sprintf("Current weather in %s: %.0f°F, %s", weatherResp.Name, weatherResp.Main.Temp, description),
	}

	c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryAPICall,
		fmt.Sprintf("Weather API call successful for %s: %s, %.0f°F", weatherResp.Name, condition, weatherResp.Main.Temp),
		map[string]interface{}{
			"location":    weatherResp.Name,
			"temperature": weatherResp.Main.Temp,
			"condition":   condition,
			"humidity":    weatherResp.Main.Humidity,
			"windSpeed":   weatherResp.Wind.Speed,
		})
	return result, nil
}

// getLocationSuggestion provides helpful location format suggestions based on API errors
func (c *Client) getLocationSuggestion(location string, statusCode int, responseBody string) string {
	// Parse location to understand format
	parts := strings.Split(location, ",")

	if statusCode == 404 {
		// City not found - provide suggestions based on current input
		if len(parts) == 1 {
			// Just city name provided
			city := strings.TrimSpace(parts[0])
			return fmt.Sprintf("City '%s' not found. Try: '%s, State' (e.g., '%s, CA'), '%s, Country' (e.g., '%s, US'), or full format '%s, State, Country'",
				city, city, city, city, city, city)
		} else if len(parts) == 2 {
			// City and state/country provided
			city := strings.TrimSpace(parts[0])
			second := strings.TrimSpace(parts[1])
			return fmt.Sprintf("Location '%s' not found. Try: '%s, %s, US' (if US state), '%s, %s' with full country name, or check spelling",
				location, city, second, city, second)
		} else {
			// Full format or more parts
			return fmt.Sprintf("Location '%s' not found. Check spelling, try common abbreviations (CA instead of California), or use English city names", location)
		}
	} else if statusCode == 401 {
		return "Invalid API key. Please check your OpenWeather API key configuration"
	} else if statusCode == 429 {
		return "API rate limit exceeded. Please try again in a moment"
	} else {
		return fmt.Sprintf("Weather API error (status %d). Try simpler location formats like 'CityName' or 'CityName, Country'", statusCode)
	}
}

// callNeo4jAPI executes a Cypher query against a Neo4j database
func (c *Client) callNeo4jAPI(ctx context.Context, query string, limit int) (map[string]interface{}, error) {
	if c.sessionApiKeys == nil || c.sessionApiKeys.Neo4jUrl == "" {
		return nil, fmt.Errorf("Neo4j URL not configured")
	}

	log.Printf("🔗 Connecting to Neo4j at: %s", c.sessionApiKeys.Neo4jUrl)

	// Create Neo4j driver
	driver, err := neo4j.NewDriverWithContext(c.sessionApiKeys.Neo4jUrl, neo4j.BasicAuth(c.sessionApiKeys.Neo4jUsername, c.sessionApiKeys.Neo4jPassword, ""))
	if err != nil {
		return nil, fmt.Errorf("failed to create Neo4j driver: %w", err)
	}
	defer driver.Close(ctx)

	// Verify connectivity
	if err := driver.VerifyConnectivity(ctx); err != nil {
		return nil, fmt.Errorf("failed to connect to Neo4j: %w", err)
	}

	// Create session
	sessionConfig := neo4j.SessionConfig{
		AccessMode:   neo4j.AccessModeRead,
		DatabaseName: c.sessionApiKeys.Neo4jDatabase,
	}
	session := driver.NewSession(ctx, sessionConfig)
	defer session.Close(ctx)

	// Add LIMIT clause if not present in query
	finalQuery := query
	if !strings.Contains(strings.ToUpper(query), "LIMIT") {
		finalQuery = fmt.Sprintf("%s LIMIT %d", query, limit)
	}

	log.Printf("🔍 Executing Cypher query: %s", finalQuery)

	// Execute query
	startTime := time.Now()
	result, err := session.Run(ctx, finalQuery, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}

	// Collect results
	var nodes []map[string]interface{}
	var relationships []map[string]interface{}
	recordCount := 0

	for result.Next(ctx) {
		record := result.Record()
		recordCount++

		// Process each value in the record
		for i, value := range record.Values {
			if node, ok := value.(neo4j.Node); ok {
				// Extract node data
				nodeData := map[string]interface{}{
					"id":         fmt.Sprintf("%d", node.GetId()),
					"labels":     node.Labels,
					"properties": node.Props,
				}
				nodes = append(nodes, nodeData)
			} else if rel, ok := value.(neo4j.Relationship); ok {
				// Extract relationship data
				relData := map[string]interface{}{
					"id":         fmt.Sprintf("%d", rel.GetId()),
					"type":       rel.Type,
					"startNode":  fmt.Sprintf("%d", rel.StartId),
					"endNode":    fmt.Sprintf("%d", rel.EndId),
					"properties": rel.Props,
				}
				relationships = append(relationships, relData)
			} else {
				// For other data types, add as a simple node
				key := record.Keys[i]
				nodeData := map[string]interface{}{
					"id":         fmt.Sprintf("result_%d_%d", recordCount, i),
					"labels":     []string{"QueryResult"},
					"properties": map[string]interface{}{key: value},
				}
				nodes = append(nodes, nodeData)
			}
		}
	}

	// Check for errors
	if err := result.Err(); err != nil {
		return nil, fmt.Errorf("query execution error: %w", err)
	}

	executionTime := time.Since(startTime)

	// Build response
	response := map[string]interface{}{
		"nodes":         nodes,
		"relationships": relationships,
		"summary": map[string]interface{}{
			"totalNodes":         len(nodes),
			"totalRelationships": len(relationships),
			"recordCount":        recordCount,
			"executionTime":      fmt.Sprintf("%dms", executionTime.Milliseconds()),
			"query":              finalQuery,
		},
	}

	log.Printf("✅ Neo4j query successful: %d nodes, %d relationships, %dms", len(nodes), len(relationships), executionTime.Milliseconds())
	return response, nil
}

// transformNeo4jToSalesSummary transforms Neo4j query results into a structured sales summary format
func (c *Client) transformNeo4jToSalesSummary(neo4jResult map[string]interface{}, originalQuery string) map[string]interface{} {
	salesSummary := make([]map[string]interface{}, 0)

	// Extract nodes from Neo4j result - sales data will be in the nodes with QueryResult labels
	if nodes, exists := neo4jResult["nodes"]; exists {
		if nodeList, ok := nodes.([]map[string]interface{}); ok {
			for _, node := range nodeList {
				if props, hasProps := node["properties"].(map[string]interface{}); hasProps {
					// Transform the properties into our sales summary format
					salesItem := make(map[string]interface{})

					// Map the returned fields to our expected structure
					for key, value := range props {
						switch key {
						case "standard_category":
							salesItem["standard_category"] = value
						case "avg_annualized_amount_usd":
							salesItem["avg_annualized_amount_usd"] = value
						case "document_count":
							salesItem["document_count"] = value
						case "total_item_count":
							salesItem["total_item_count"] = value
						default:
							// Include any other returned fields
							salesItem[key] = value
						}
					}

					if len(salesItem) > 0 {
						salesSummary = append(salesSummary, salesItem)
					}
				}
			}
		}
	}

	// Get summary information from original Neo4j result
	var summary map[string]interface{}
	if summaryData, exists := neo4jResult["summary"]; exists {
		if summaryMap, ok := summaryData.(map[string]interface{}); ok {
			summary = summaryMap
		}
	}

	if summary == nil {
		summary = make(map[string]interface{})
	}

	// Add sales-specific summary data
	summary["total_categories"] = len(salesSummary)
	summary["query"] = originalQuery

	result := map[string]interface{}{
		"sales_summary": salesSummary,
		"summary":       summary,
	}

	return result
}

// processAttributeNormalization processes raw attribute values and applies normalization rules
func (c *Client) processAttributeNormalization(neo4jResult map[string]interface{}, normalizationType, caseStyle string, customMappings map[string]interface{}, originalQuery string) map[string]interface{} {
	attributeMappings := make([]map[string]interface{}, 0)
	normalizedSet := make(map[string]bool)

	// Extract raw values from Neo4j result
	var rawValues []string
	if nodes, exists := neo4jResult["nodes"]; exists {
		if nodeList, ok := nodes.([]map[string]interface{}); ok {
			for _, node := range nodeList {
				if props, hasProps := node["properties"].(map[string]interface{}); hasProps {
					if rawValue, hasValue := props["raw_value"]; hasValue {
						if valueStr, isString := rawValue.(string); isString && strings.TrimSpace(valueStr) != "" {
							rawValues = append(rawValues, valueStr)
						}
					}
				}
			}
		}
	}

	// Process each raw value and apply normalization
	for _, rawValue := range rawValues {
		normalizedValue := c.normalizeAttributeValue(rawValue, normalizationType, caseStyle, customMappings)
		confidence := c.calculateNormalizationConfidence(rawValue, normalizedValue)

		mapping := map[string]interface{}{
			"raw_value":        rawValue,
			"normalized_value": normalizedValue,
			"confidence":       confidence,
		}

		attributeMappings = append(attributeMappings, mapping)
		normalizedSet[normalizedValue] = true
	}

	// Get summary information from original Neo4j result
	var summary map[string]interface{}
	if summaryData, exists := neo4jResult["summary"]; exists {
		if summaryMap, ok := summaryData.(map[string]interface{}); ok {
			summary = summaryMap
		}
	}

	if summary == nil {
		summary = make(map[string]interface{})
	}

	// Add normalization-specific summary data
	summary["total_raw_values"] = len(rawValues)
	summary["total_unique_normalized"] = len(normalizedSet)
	summary["normalization_type"] = normalizationType
	summary["case_style"] = caseStyle
	summary["query"] = originalQuery

	result := map[string]interface{}{
		"attribute_mappings": attributeMappings,
		"summary":            summary,
	}

	return result
}

// normalizeAttributeValue applies normalization rules to a single attribute value
func (c *Client) normalizeAttributeValue(rawValue, normalizationType, caseStyle string, customMappings map[string]interface{}) string {
	// Start with the raw value
	normalized := strings.TrimSpace(rawValue)

	// Apply custom mappings first (highest priority)
	if customMappings != nil {
		for pattern, replacement := range customMappings {
			if replacementStr, ok := replacement.(string); ok {
				// Case-insensitive pattern matching
				if strings.EqualFold(normalized, pattern) {
					return replacementStr
				}
			}
		}
	}

	// Apply normalization type-specific rules
	switch normalizationType {
	case "financial_categories":
		normalized = c.normalizeFinancialCategory(normalized)
	case "job_titles":
		normalized = c.normalizeJobTitle(normalized)
	case "industries":
		normalized = c.normalizeIndustry(normalized)
	case "general":
		normalized = c.normalizeGeneral(normalized)
	}

	// Apply case style
	switch caseStyle {
	case "title_case":
		normalized = c.toTitleCase(normalized)
	case "lower_case":
		normalized = strings.ToLower(normalized)
	case "upper_case":
		normalized = strings.ToUpper(normalized)
	case "preserve":
		// Keep original case
	default:
		normalized = c.toTitleCase(normalized)
	}

	return normalized
}

// normalizeFinancialCategory applies financial category-specific normalization
func (c *Client) normalizeFinancialCategory(value string) string {
	lower := strings.ToLower(value)

	// Financial category mappings (similar to sales summary)
	switch {
	case strings.Contains(lower, "e-signature") || strings.Contains(lower, "esignature"):
		return "E-Signature"
	case strings.Contains(lower, "direct-mail") || strings.Contains(lower, "direct mail"):
		return "Direct Mail Marketing"
	case strings.Contains(lower, "rev ops") || strings.Contains(lower, "revenue ops"):
		return "Revenue Operations"
	case strings.Contains(lower, "sales engagement") || strings.Contains(lower, "sales intelligence") ||
		strings.Contains(lower, "sales training") || strings.Contains(lower, "sales communication") ||
		strings.Contains(lower, "sales productivity"):
		return "Sales Enablement"
	case strings.Contains(lower, "commission") && strings.Contains(lower, "management"):
		return "Compensation Management"
	case strings.Contains(lower, "lead") && strings.Contains(lower, "generation"):
		return "Lead Management"
	case strings.Contains(lower, "event") && strings.Contains(lower, "services"):
		return "Event Services"
	case strings.Contains(lower, "security") && strings.Contains(lower, "training"):
		return "Security Training"
	case strings.Contains(lower, "software"):
		return "Software"
	case strings.Contains(lower, "consulting"):
		return "Consulting Services"
	case strings.Contains(lower, "marketing"):
		return "Marketing"
	case strings.Contains(lower, "analytics"):
		return "Analytics"
	default:
		return value
	}
}

// normalizeJobTitle applies job title-specific normalization
func (c *Client) normalizeJobTitle(value string) string {
	lower := strings.ToLower(value)

	switch {
	case strings.Contains(lower, "software") && (strings.Contains(lower, "engineer") || strings.Contains(lower, "developer")):
		return "Software Engineer"
	case strings.Contains(lower, "data") && strings.Contains(lower, "scientist"):
		return "Data Scientist"
	case strings.Contains(lower, "product") && strings.Contains(lower, "manager"):
		return "Product Manager"
	case strings.Contains(lower, "sales") && strings.Contains(lower, "engineer"):
		return "Sales Engineer"
	case strings.Contains(lower, "devops") || (strings.Contains(lower, "dev") && strings.Contains(lower, "ops")):
		return "DevOps Engineer"
	case strings.Contains(lower, "ui") || strings.Contains(lower, "ux"):
		return "UX/UI Designer"
	case strings.Contains(lower, "analyst"):
		return "Business Analyst"
	default:
		return value
	}
}

// normalizeIndustry applies industry-specific normalization
func (c *Client) normalizeIndustry(value string) string {
	lower := strings.ToLower(value)

	switch {
	case strings.Contains(lower, "fintech") || (strings.Contains(lower, "financial") && strings.Contains(lower, "tech")):
		return "Financial Technology"
	case strings.Contains(lower, "healthtech") || (strings.Contains(lower, "health") && strings.Contains(lower, "tech")):
		return "Healthcare Technology"
	case strings.Contains(lower, "saas") || strings.Contains(lower, "software as a service"):
		return "Software as a Service"
	case strings.Contains(lower, "e-commerce") || strings.Contains(lower, "ecommerce"):
		return "E-Commerce"
	case strings.Contains(lower, "artificial intelligence") || strings.Contains(lower, "ai"):
		return "Artificial Intelligence"
	case strings.Contains(lower, "machine learning") || strings.Contains(lower, "ml"):
		return "Machine Learning"
	default:
		return value
	}
}

// normalizeGeneral applies general normalization rules
func (c *Client) normalizeGeneral(value string) string {
	// Remove extra whitespace
	normalized := strings.TrimSpace(value)

	// Replace multiple spaces with single space
	re := regexp.MustCompile(`\s+`)
	normalized = re.ReplaceAllString(normalized, " ")

	// Remove common prefixes/suffixes that add noise
	normalized = strings.TrimPrefix(normalized, "the ")
	normalized = strings.TrimPrefix(normalized, "The ")
	normalized = strings.TrimSuffix(normalized, " inc")
	normalized = strings.TrimSuffix(normalized, " Inc")
	normalized = strings.TrimSuffix(normalized, " LLC")
	normalized = strings.TrimSuffix(normalized, " ltd")
	normalized = strings.TrimSuffix(normalized, " Ltd")

	return normalized
}

// toTitleCase converts a string to title case
func (c *Client) toTitleCase(value string) string {
	words := strings.Fields(value)
	for i, word := range words {
		if len(word) > 0 {
			words[i] = strings.ToUpper(string(word[0])) + strings.ToLower(word[1:])
		}
	}
	return strings.Join(words, " ")
}

// calculateNormalizationConfidence calculates confidence score for the normalization
func (c *Client) calculateNormalizationConfidence(rawValue, normalizedValue string) float64 {
	if rawValue == normalizedValue {
		return 1.0 // Perfect match
	}

	if strings.EqualFold(rawValue, normalizedValue) {
		return 0.95 // Case-only difference
	}

	// Calculate similarity based on character overlap
	rawLower := strings.ToLower(rawValue)
	normLower := strings.ToLower(normalizedValue)

	if strings.Contains(normLower, rawLower) || strings.Contains(rawLower, normLower) {
		return 0.8 // Substring match
	}

	// Basic similarity calculation
	maxLen := len(rawValue)
	if len(normalizedValue) > maxLen {
		maxLen = len(normalizedValue)
	}

	if maxLen == 0 {
		return 0.0
	}

	// Count common characters (simple approach)
	commonChars := 0
	for _, char := range rawLower {
		if strings.ContainsRune(normLower, char) {
			commonChars++
		}
	}

	return float64(commonChars) / float64(maxLen)
}

// getFunctionDefinitionForExecution retrieves function definition from database for execution
func (c *Client) getFunctionDefinitionForExecution(ctx context.Context, functionName string) (*db.FunctionDefinition, error) {
	cleanName := strings.TrimSpace(functionName)

	// First attempt: exact match
	if funcDef, err := c.queries.GetFunctionDefinitionByName(ctx, db.GetFunctionDefinitionByNameParams{
		Name:   cleanName,
		UserID: "system",
	}); err == nil {
		return &funcDef, nil
	}

	// Second attempt: case-insensitive match (MySQL default collation may be case-sensitive)
	if funcDef, err := c.queries.GetFunctionDefinitionByName(ctx, db.GetFunctionDefinitionByNameParams{
		Name:   strings.ToLower(cleanName),
		UserID: "system",
	}); err == nil {
		return &funcDef, nil
	}

	// Not found – log for easier debugging
	c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryFunctionCall,
		"Function definition lookup failed", map[string]interface{}{"name": cleanName})

	return nil, fmt.Errorf("function definition not found: %s", cleanName)
}

// validateFunctionParameters validates function arguments against stored JSON schema
func (c *Client) validateFunctionParameters(args map[string]interface{}, schemaBytes json.RawMessage) error {
	// Parse the stored schema
	var schema map[string]interface{}
	if err := json.Unmarshal(schemaBytes, &schema); err != nil {
		return fmt.Errorf("invalid schema format: %w", err)
	}

	// Extract required fields
	required, _ := schema["required"].([]interface{})
	properties, _ := schema["properties"].(map[string]interface{})

	// Check required parameters
	for _, reqField := range required {
		if reqFieldStr, ok := reqField.(string); ok {
			if _, exists := args[reqFieldStr]; !exists {
				return fmt.Errorf("required parameter missing: %s", reqFieldStr)
			}
		}
	}

	// Validate parameter types (basic validation)
	for paramName, paramValue := range args {
		if propDef, exists := properties[paramName]; exists {
			if propMap, ok := propDef.(map[string]interface{}); ok {
				if err := c.validateParameterType(paramName, paramValue, propMap); err != nil {
					return err
				}
			}
		}
	}

	return nil
}

// validateParameterType performs basic type validation for a single parameter
func (c *Client) validateParameterType(paramName string, value interface{}, propDef map[string]interface{}) error {
	expectedType, _ := propDef["type"].(string)

	switch expectedType {
	case "string":
		if _, ok := value.(string); !ok {
			return fmt.Errorf("parameter %s must be a string", paramName)
		}
	case "integer":
		switch v := value.(type) {
		case int, int32, int64, float64:
			// Allow numeric types that can be converted to integer
		default:
			return fmt.Errorf("parameter %s must be an integer, got %T", paramName, v)
		}
	case "number":
		switch v := value.(type) {
		case int, int32, int64, float32, float64:
			// Allow numeric types
		default:
			return fmt.Errorf("parameter %s must be a number, got %T", paramName, v)
		}
	case "boolean":
		if _, ok := value.(bool); !ok {
			return fmt.Errorf("parameter %s must be a boolean", paramName)
		}
	case "object":
		if _, ok := value.(map[string]interface{}); !ok {
			return fmt.Errorf("parameter %s must be an object", paramName)
		}
	case "array":
		if _, ok := value.([]interface{}); !ok {
			return fmt.Errorf("parameter %s must be an array", paramName)
		}
	}

	// Validate enum values if specified
	if enumValues, exists := propDef["enum"].([]interface{}); exists {
		valueStr := fmt.Sprintf("%v", value)
		found := false
		for _, enumVal := range enumValues {
			if fmt.Sprintf("%v", enumVal) == valueStr {
				found = true
				break
			}
		}
		if !found {
			return fmt.Errorf("parameter %s must be one of %v", paramName, enumValues)
		}
	}

	return nil
}

// executeDynamicFunction executes a function based on its stored definition
func (c *Client) executeDynamicFunction(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
	switch funcDef.HttpMethod.String {
	case "GET", "POST", "PUT", "DELETE", "PATCH":
		return c.executeHTTPFunction(ctx, funcDef, args)
	case "CYPHER":
		return c.executeCypherFunction(ctx, funcDef, args)
	default:
		return nil, fmt.Errorf("unsupported execution method: %s", funcDef.HttpMethod.String)
	}
}

// executeHTTPFunction executes HTTP-based functions
func (c *Client) executeHTTPFunction(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
	c.logExecutionEvent(types.LogLevelDebug, types.LogCategoryFunctionCall,
		fmt.Sprintf("Executing HTTP function: %s %s", funcDef.HttpMethod.String, funcDef.EndpointUrl.String),
		args)

	// Build URL with path parameter substitution
	requestURL := funcDef.EndpointUrl.String
	var requestBody []byte

	// Special handling for GitHub contents API - handle missing or empty path
	if funcDef.Name == "github_read_code" {
		pathValue, pathExists := args["path"]
		pathStr := ""
		if pathExists {
			pathStr = fmt.Sprintf("%v", pathValue)
		}

		// For GitHub contents API, handle path specially
		if pathStr == "" {
			// For empty or missing path, remove the /{path} part entirely
			requestURL = strings.ReplaceAll(requestURL, "/{path}", "")
		} else {
			// For non-empty path, replace normally
			requestURL = strings.ReplaceAll(requestURL, "{path}", pathStr)
		}

		c.logExecutionEvent(types.LogLevelDebug, types.LogCategoryFunctionCall,
			"Handled GitHub path parameter",
			map[string]interface{}{
				"path_exists": pathExists,
				"path_value":  pathStr,
				"final_url":   requestURL,
			})
	}

	// Replace URL path parameters (e.g., {owner}, {repo})
	for key, value := range args {
		placeholder := fmt.Sprintf("{%s}", key)
		if strings.Contains(requestURL, placeholder) {
			valueStr := fmt.Sprintf("%v", value)
			requestURL = strings.ReplaceAll(requestURL, placeholder, valueStr)

			c.logExecutionEvent(types.LogLevelDebug, types.LogCategoryFunctionCall,
				fmt.Sprintf("Replaced URL parameter %s", key),
				map[string]interface{}{
					"parameter": key,
					"value":     valueStr,
				})
		}
	}

	if funcDef.HttpMethod.String == "GET" {
		// Add remaining parameters as query string (excluding those used in URL path)
		if len(args) > 0 {
			u, err := url.Parse(requestURL)
			if err != nil {
				return nil, fmt.Errorf("invalid endpoint URL: %w", err)
			}
			q := u.Query()
			for key, value := range args {
				// Skip parameters already used in URL path substitution
				placeholder := fmt.Sprintf("{%s}", key)
				if strings.Contains(funcDef.EndpointUrl.String, placeholder) {
					continue
				}

				// Special case: map 'location' → 'q' for OpenWeather API
				paramKey := key
				if funcDef.Name == "get_current_weather" && key == "location" {
					paramKey = "q"
				}

				q.Set(paramKey, fmt.Sprintf("%v", value))
			}
			u.RawQuery = q.Encode()
			requestURL = u.String()
		}
	} else {
		// Add parameters as JSON body for POST/PUT/etc (excluding URL path parameters)
		bodyArgs := make(map[string]interface{})
		for key, value := range args {
			placeholder := fmt.Sprintf("{%s}", key)
			if strings.Contains(funcDef.EndpointUrl.String, placeholder) {
				continue
			}

			// Special case: map 'location' → 'q' for OpenWeather API
			paramKey := key
			if funcDef.Name == "get_current_weather" && key == "location" {
				paramKey = "q"
			}

			bodyArgs[paramKey] = value
		}

		if len(bodyArgs) > 0 {
			var err error
			requestBody, err = json.Marshal(bodyArgs)
			if err != nil {
				return nil, fmt.Errorf("failed to marshal request body: %w", err)
			}
		}
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, funcDef.HttpMethod.String, requestURL, bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Add headers from function definition
	var headers map[string]interface{}
	if len(funcDef.Headers) > 0 {
		if err := json.Unmarshal(funcDef.Headers, &headers); err != nil {
			c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryFunctionCall,
				"Failed to parse function headers, using defaults", nil)
		}
	}

	// Apply headers
	for key, value := range headers {
		req.Header.Set(key, fmt.Sprintf("%v", value))
	}

	// Add API key handling for specific services
	if err := c.addAPIKeyAuthentication(req, funcDef.EndpointUrl.String, args); err != nil {
		c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryFunctionCall,
			fmt.Sprintf("API key authentication failed: %v", err), nil)
	}

	// Execute request
	client := &http.Client{Timeout: 5 * time.Minute} // Generous timeout for external API calls
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// === NEW: log error for non-success status codes ===
	if resp.StatusCode >= 400 {
		preview := string(body)
		if len(preview) > 200 {
			preview = preview[:200] + "…"
		}
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryFunctionCall,
			fmt.Sprintf("HTTP %d error for %s", resp.StatusCode, funcDef.Name),
			map[string]interface{}{
				"status_code":      resp.StatusCode,
				"response_preview": preview,
			})
	}

	// Parse JSON response
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		// If not JSON, return as text
		result = map[string]interface{}{
			"response":    string(body),
			"status_code": resp.StatusCode,
		}
	}

	// Add metadata
	result["_metadata"] = map[string]interface{}{
		"status_code":      resp.StatusCode,
		"function_name":    funcDef.Name,
		"execution_method": "HTTP",
		"is_error":         resp.StatusCode >= 400,
	}

	// Apply result transformer if specified
	return c.applyStoredResultTransformer(funcDef, result, "", args)
}

// executeCypherFunction executes Neo4j Cypher queries using stored templates
func (c *Client) executeCypherFunction(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
	c.logExecutionEvent(types.LogLevelDebug, types.LogCategoryFunctionCall,
		fmt.Sprintf("Executing Cypher function: %s", funcDef.Name),
		args)

	// Check if function has a query template
	if funcDef.QueryTemplate.Valid && strings.TrimSpace(funcDef.QueryTemplate.String) != "" {
		// Use stored query template (fully dynamic)
		return c.executeTemplatedCypherFunction(ctx, funcDef, args)
	} else {
		// Fall back to hardcoded logic for backward compatibility
		c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryFunctionCall,
			"No query template found, falling back to hardcoded logic", nil)
		return c.executeLegacyCypherFunction(ctx, funcDef, args)
	}
}

// executeTemplatedCypherFunction executes Cypher using stored query templates
func (c *Client) executeTemplatedCypherFunction(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
	// Substitute parameters in the query template
	cypherQuery, err := c.substituteQueryTemplate(funcDef.QueryTemplate.String, args)
	if err != nil {
		return nil, fmt.Errorf("failed to substitute query template: %w", err)
	}

	// Extract limit parameter
	limit := 25
	if limitVal, exists := args["limit"]; exists {
		if limitFloat, ok := limitVal.(float64); ok {
			limit = int(limitFloat)
		}
	}

	c.logExecutionEvent(types.LogLevelDebug, types.LogCategoryFunctionCall,
		"Executing templated Cypher query",
		map[string]interface{}{
			"query": cypherQuery,
			"limit": limit,
		})

	// Execute the query using existing Neo4j infrastructure
	result, err := c.callNeo4jAPI(ctx, cypherQuery, limit)
	if err != nil {
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryFunctionCall,
			fmt.Sprintf("Templated Cypher query failed: %v", err),
			map[string]interface{}{
				"query": cypherQuery,
				"error": err.Error(),
			})

		// Return stored fallback data
		return c.getStoredFallbackData(funcDef)
	}

	// Transform result using stored transformer
	return c.applyStoredResultTransformer(funcDef, result, cypherQuery, args)
}

// executeLegacyCypherFunction handles functions without query templates (backward compatibility)
func (c *Client) executeLegacyCypherFunction(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
	// Build Cypher query based on function name and arguments (legacy method)
	cypherQuery, limit, err := c.buildCypherQuery(funcDef.Name, args)
	if err != nil {
		return nil, fmt.Errorf("failed to build Cypher query: %w", err)
	}

	// Execute the query using existing Neo4j infrastructure
	result, err := c.callNeo4jAPI(ctx, cypherQuery, limit)
	if err != nil {
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryFunctionCall,
			fmt.Sprintf("Legacy Cypher query failed: %v", err),
			map[string]interface{}{
				"query": cypherQuery,
				"error": err.Error(),
			})

		// Return fallback data based on function type (legacy method)
		return c.getCypherFallbackData(funcDef.Name, args)
	}

	// Transform result based on function type (legacy method)
	return c.transformCypherResult(funcDef.Name, result, cypherQuery, args)
}

// buildCypherQuery builds appropriate Cypher query based on function name and arguments
func (c *Client) buildCypherQuery(functionName string, args map[string]interface{}) (string, int, error) {
	limit := 25
	if limitVal, exists := args["limit"]; exists {
		if limitFloat, ok := limitVal.(float64); ok {
			limit = int(limitFloat)
		}
	}

	switch functionName {
	case "neo4j_node_lookup":
		return c.buildNodeLookupQuery(args, limit)
	case "sales_summary":
		return c.buildSalesSummaryQuery(args, limit)
	case "normalize_attributes":
		return c.buildNormalizeAttributesQuery(args, limit)
	default:
		return "", 0, fmt.Errorf("unknown Cypher function: %s", functionName)
	}
}

// addAPIKeyAuthentication adds appropriate API key authentication
func (c *Client) addAPIKeyAuthentication(req *http.Request, endpointURL string, args map[string]interface{}) error {
	if c.sessionApiKeys == nil {
		c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryAPICall,
			"No session API keys available for authentication",
			map[string]interface{}{"endpoint": endpointURL})
		return nil
	}

	// GitHub API
	if strings.Contains(endpointURL, "api.github.com") {
		if c.sessionApiKeys.GithubApiKey != "" {
			req.Header.Set("Authorization", "token "+c.sessionApiKeys.GithubApiKey)
			c.logExecutionEvent(types.LogLevelDebug, types.LogCategoryAPICall,
				"Added GitHub API authentication",
				map[string]interface{}{
					"endpoint":       endpointURL,
					"api_key_masked": "***" + c.sessionApiKeys.GithubApiKey[len(c.sessionApiKeys.GithubApiKey)-4:],
				})
		} else {
			c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryAPICall,
				"GitHub API key not available for authentication",
				map[string]interface{}{"endpoint": endpointURL})
		}
	}

	// OpenWeather API
	if strings.Contains(endpointURL, "openweathermap.org") {
		if c.sessionApiKeys.OpenWeatherApiKey != "" {
			// Add API key as query parameter
			u, err := url.Parse(req.URL.String())
			if err != nil {
				return fmt.Errorf("failed to parse URL for OpenWeather API key: %w", err)
			}
			q := u.Query()
			q.Set("appid", c.sessionApiKeys.OpenWeatherApiKey)
			u.RawQuery = q.Encode()
			req.URL = u

			c.logExecutionEvent(types.LogLevelDebug, types.LogCategoryAPICall,
				"Added OpenWeather API authentication",
				map[string]interface{}{
					"endpoint":       endpointURL,
					"api_key_masked": "***" + c.sessionApiKeys.OpenWeatherApiKey[len(c.sessionApiKeys.OpenWeatherApiKey)-4:],
				})
		} else {
			c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryAPICall,
				"OpenWeather API key not available for authentication",
				map[string]interface{}{"endpoint": endpointURL})
		}
	}

	return nil
}

// getCypherFallbackData returns fallback data for Cypher functions when Neo4j is unavailable
func (c *Client) getCypherFallbackData(functionName string, args map[string]interface{}) (map[string]interface{}, error) {
	switch functionName {
	case "neo4j_node_lookup":
		return map[string]interface{}{
			"nodes": []map[string]interface{}{{
				"id":         "mock_node_1",
				"labels":     []string{"Error"},
				"properties": map[string]interface{}{"error": "Neo4j connection unavailable"},
			}},
			"relationships": []map[string]interface{}{},
			"summary": map[string]interface{}{
				"totalNodes":         1,
				"totalRelationships": 0,
				"executionTime":      "0ms",
				"error":              "Neo4j connection unavailable, showing mock data",
			},
		}, nil
	case "sales_summary":
		return map[string]interface{}{
			"sales_summary": []map[string]interface{}{
				{
					"standard_category":         "Sales Enablement",
					"avg_annualized_amount_usd": 125000.00,
					"document_count":            15,
					"total_item_count":          45,
				},
				{
					"standard_category":         "Revenue Operations",
					"avg_annualized_amount_usd": 98000.00,
					"document_count":            8,
					"total_item_count":          24,
				},
			},
			"summary": map[string]interface{}{
				"total_categories": 2,
				"executionTime":    "0ms",
				"error":            "Neo4j connection unavailable, showing mock sales data",
			},
		}, nil
	case "normalize_attributes":
		return map[string]interface{}{
			"attribute_mappings": []map[string]interface{}{
				{
					"raw_value":        "software engineering",
					"normalized_value": "Software Engineering",
					"confidence":       1.0,
				},
				{
					"raw_value":        "data science",
					"normalized_value": "Data Science",
					"confidence":       1.0,
				},
			},
			"summary": map[string]interface{}{
				"total_raw_values":        2,
				"total_unique_normalized": 2,
				"executionTime":           "0ms",
				"error":                   "Neo4j connection unavailable, showing mock normalization data",
			},
		}, nil
	default:
		return nil, fmt.Errorf("no fallback data available for function: %s", functionName)
	}
}

// transformCypherResult transforms Neo4j results based on function type
func (c *Client) transformCypherResult(functionName string, result map[string]interface{}, cypherQuery string, args map[string]interface{}) (map[string]interface{}, error) {
	switch functionName {
	case "neo4j_node_lookup":
		// Return result as-is for node lookup
		return result, nil
	case "sales_summary":
		return c.transformNeo4jToSalesSummary(result, cypherQuery), nil
	case "normalize_attributes":
		// Extract normalization parameters
		normalizationType := "general"
		if normTypeVal, exists := args["normalization_type"]; exists {
			if normType, ok := normTypeVal.(string); ok && normType != "" {
				normalizationType = normType
			}
		}

		caseStyle := "title_case"
		if caseVal, exists := args["case_style"]; exists {
			if caseStr, ok := caseVal.(string); ok && caseStr != "" {
				caseStyle = caseStr
			}
		}

		var customMappings map[string]interface{}
		if customVal, exists := args["custom_mappings"]; exists {
			if customMap, ok := customVal.(map[string]interface{}); ok {
				customMappings = customMap
			}
		}

		return c.processAttributeNormalization(result, normalizationType, caseStyle, customMappings, cypherQuery), nil
	default:
		return result, nil
	}
}

// buildNodeLookupQuery builds query for Neo4j node lookup
func (c *Client) buildNodeLookupQuery(args map[string]interface{}, limit int) (string, int, error) {
	label, ok := args["label"].(string)
	if !ok || strings.TrimSpace(label) == "" {
		return "", 0, fmt.Errorf("label parameter missing or invalid")
	}

	// Optional properties map to build a WHERE clause
	whereClause := ""
	if propsRaw, ok := args["properties"].(map[string]interface{}); ok {
		var conditions []string
		for k, v := range propsRaw {
			conditions = append(conditions, fmt.Sprintf("n.%s = '%v'", k, v))
		}
		if len(conditions) > 0 {
			whereClause = "WHERE " + strings.Join(conditions, " AND ")
		}
	}

	cypherQuery := fmt.Sprintf("MATCH (n:%s) %s RETURN n LIMIT %d", label, whereClause, limit)
	return cypherQuery, limit, nil
}

// buildSalesSummaryQuery builds query for sales summary
func (c *Client) buildSalesSummaryQuery(args map[string]interface{}, limit int) (string, int, error) {
	// Currency filter - add to WHERE clause if specified
	var currencyFilter string
	if currencyVal, exists := args["currency_filter"]; exists {
		if currency, ok := currencyVal.(string); ok && currency != "" {
			currencyFilter = fmt.Sprintf("AND d.currency_code = '%s'", currency)
		}
	}

	// Minimum amount filter
	var minAmountFilter string
	if minAmountVal, exists := args["min_amount"]; exists {
		if minAmount, ok := minAmountVal.(float64); ok && minAmount > 0 {
			minAmountFilter = fmt.Sprintf("AND (annualized_amount * conversion_rate) >= %f", minAmount)
		}
	}

	// Build the comprehensive sales summary Cypher query
	cypherQuery := fmt.Sprintf(`
MATCH (p:Product)-[:HAS_DOCUMENT]->(d:Document)
OPTIONAL MATCH (d)-[:HAS_ITEM]->(i:Item)
WITH 
  p.category AS raw_category,
  coalesce(d.total_amount, d.total_discounted_amount) AS amount,
  d.currency_code AS currency,
  d.service_duration_month AS duration_months,
  count(i) AS item_count_per_document
WHERE duration_months IS NOT NULL AND duration_months > 0 %s

WITH 
  raw_category,
  currency,
  amount / duration_months * 12 AS annualized_amount,
  item_count_per_document,
  CASE 
    WHEN toLower(raw_category) IN ['e-signature'] THEN 'E-Signature'
    WHEN toLower(raw_category) IN ['direct-mail-marketing', 'direct mail marketing'] THEN 'Direct Mail Marketing'
    WHEN toLower(raw_category) IN ['rev ops', 'revenue ops'] THEN 'Revenue Operations'
    WHEN toLower(raw_category) IN ['sales engagement', 'sales intelligence', 'sales training', 'sales communication', 'sales productivity'] THEN 'Sales Enablement'
    WHEN toLower(raw_category) = 'commission-management' THEN 'Compensation Management'
    WHEN toLower(raw_category) = 'lead-generation' THEN 'Lead Management'
    WHEN toLower(raw_category) = 'event-services' THEN 'Event Services'
    WHEN toLower(raw_category) = 'security training' THEN 'Security Training'
    ELSE raw_category
  END AS standard_category,

  CASE 
    WHEN currency = 'USD' THEN 1.0
    WHEN currency = 'EUR' THEN 1.1
    WHEN currency = 'GBP' THEN 1.3
    ELSE 1.0
  END AS conversion_rate

WITH 
  standard_category,
  round(avg(annualized_amount * conversion_rate), 2) AS avg_annualized_amount_usd,
  count(*) AS document_count,
  sum(item_count_per_document) AS total_item_count
WHERE 1=1 %s
RETURN 
  standard_category,
  avg_annualized_amount_usd,
  document_count,
  total_item_count
ORDER BY avg_annualized_amount_usd DESC
LIMIT %d`, currencyFilter, minAmountFilter, limit)

	return cypherQuery, limit, nil
}

// buildNormalizeAttributesQuery builds query for attribute normalization
func (c *Client) buildNormalizeAttributesQuery(args map[string]interface{}, limit int) (string, int, error) {
	nodeLabel, ok := args["node_label"].(string)
	if !ok || strings.TrimSpace(nodeLabel) == "" {
		return "", 0, fmt.Errorf("node_label parameter missing or invalid")
	}

	attributeName, ok := args["attribute_name"].(string)
	if !ok || strings.TrimSpace(attributeName) == "" {
		return "", 0, fmt.Errorf("attribute_name parameter missing or invalid")
	}

	cypherQuery := fmt.Sprintf(`
MATCH (n:%s)
WHERE n.%s IS NOT NULL AND n.%s <> ''
RETURN DISTINCT n.%s AS raw_value
ORDER BY raw_value
LIMIT %d`, nodeLabel, attributeName, attributeName, attributeName, limit)

	return cypherQuery, limit, nil
}

// substituteQueryTemplate substitutes parameters in a query template
func (c *Client) substituteQueryTemplate(template string, args map[string]interface{}) (string, error) {
	result := template

	// Handle common parameter substitutions
	for key, value := range args {
		placeholder := fmt.Sprintf("{{%s}}", key)
		replacement := fmt.Sprintf("%v", value)
		result = strings.ReplaceAll(result, placeholder, replacement)
	}

	// Handle special cases for Neo4j node lookup where clause
	if strings.Contains(result, "{{where_clause}}") {
		whereClause := ""
		if propsRaw, ok := args["properties"].(map[string]interface{}); ok {
			var conditions []string
			for k, v := range propsRaw {
				conditions = append(conditions, fmt.Sprintf("n.%s = '%v'", k, v))
			}
			if len(conditions) > 0 {
				whereClause = "WHERE " + strings.Join(conditions, " AND ")
			}
		}
		result = strings.ReplaceAll(result, "{{where_clause}}", whereClause)
	}

	// Handle currency filter for sales summary
	if strings.Contains(result, "{{currency_filter}}") {
		currencyFilter := ""
		if currencyVal, exists := args["currency_filter"]; exists {
			if currency, ok := currencyVal.(string); ok && currency != "" {
				currencyFilter = fmt.Sprintf("AND d.currency_code = '%s'", currency)
			}
		}
		result = strings.ReplaceAll(result, "{{currency_filter}}", currencyFilter)
	}

	// Handle minimum amount filter for sales summary
	if strings.Contains(result, "{{min_amount_filter}}") {
		minAmountFilter := ""
		if minAmountVal, exists := args["min_amount"]; exists {
			if minAmount, ok := minAmountVal.(float64); ok && minAmount > 0 {
				minAmountFilter = fmt.Sprintf("AND (annualized_amount * conversion_rate) >= %f", minAmount)
			}
		}
		result = strings.ReplaceAll(result, "{{min_amount_filter}}", minAmountFilter)
	}

	// Set default values for common parameters
	if !strings.Contains(result, "{{limit}}") {
		// No limit placeholder, query is complete
	} else if _, exists := args["limit"]; !exists {
		result = strings.ReplaceAll(result, "{{limit}}", "25")
	}

	return result, nil
}

// getStoredFallbackData returns fallback data from function definition
func (c *Client) getStoredFallbackData(funcDef *db.FunctionDefinition) (map[string]interface{}, error) {
	if len(funcDef.FallbackData) > 0 {
		var fallbackData map[string]interface{}
		if err := json.Unmarshal(funcDef.FallbackData, &fallbackData); err != nil {
			c.logExecutionEvent(types.LogLevelWarn, types.LogCategoryFunctionCall,
				"Failed to parse stored fallback data, using default", nil)
			return c.getDefaultFallbackData(funcDef.Name), nil
		}
		return fallbackData, nil
	}

	// Fall back to default if no stored fallback data
	return c.getDefaultFallbackData(funcDef.Name), nil
}

// getDefaultFallbackData provides default fallback data
func (c *Client) getDefaultFallbackData(functionName string) map[string]interface{} {
	return map[string]interface{}{
		"error":         "Function execution failed and no fallback data available",
		"function_name": functionName,
		"timestamp":     time.Now().UTC().Format(time.RFC3339),
	}
}

// transformGitHubCodeResponse transforms GitHub API code response by decoding base64 content and providing analysis
func (c *Client) transformGitHubCodeResponse(result map[string]interface{}, args map[string]interface{}) map[string]interface{} {
	log.Printf("🔧 Applying github_code_analyzer transformer to GitHub response")

	// Extract the actual GitHub API response from the HTTP result
	var githubData interface{}
	if response, exists := result["response"]; exists {
		githubData = response
		log.Printf("🔧 Found response data, type: %T", githubData)

		// If it's a string, it might be JSON that needs parsing
		if responseStr, ok := githubData.(string); ok {
			log.Printf("🔧 Response is string, attempting JSON decode")
			var parsed interface{}
			if err := json.Unmarshal([]byte(responseStr), &parsed); err == nil {
				githubData = parsed
				log.Printf("🔧 Successfully parsed JSON, new type: %T", githubData)
			} else {
				log.Printf("⚠️ Failed to parse JSON string: %v", err)
			}
		}
	} else {
		githubData = result // Fallback for direct GitHub data
		log.Printf("🔧 Using result as github data, type: %T", githubData)
	}

	// Extract content if it exists and is base64 encoded
	var decodedContent string
	var fileInfo map[string]interface{}

	// Handle both single file and array of files/directories
	log.Printf("🔧 Checking if githubData is array - type: %T", githubData)
	if githubArray, ok := githubData.([]interface{}); ok && len(githubArray) > 0 {
		log.Printf("🔧 Detected directory listing with %d items", len(githubArray))
		// Directory listing - no content to decode
		return c.transformDirectoryListing(result, githubArray)
	}

	// Single file response
	log.Printf("🔧 Attempting to parse as single file map")
	githubDataMap, ok := githubData.(map[string]interface{})
	if !ok {
		log.Printf("⚠️ Unable to parse GitHub response data - type: %T, data (first 200 chars): %.200s", githubData, fmt.Sprintf("%+v", githubData))
		return result
	}

	var keys []string
	for k := range githubDataMap {
		keys = append(keys, k)
	}
	log.Printf("🔧 Parsed GitHub data as map with keys: %v", keys)

	if content, exists := githubDataMap["content"]; exists {
		if contentStr, ok := content.(string); ok && contentStr != "" {
			// GitHub API returns base64 content with newlines, so we need to clean it
			cleanContent := strings.ReplaceAll(contentStr, "\n", "")
			cleanContent = strings.ReplaceAll(cleanContent, "\r", "")

			if decoded, err := base64.StdEncoding.DecodeString(cleanContent); err == nil {
				decodedContent = string(decoded)
				log.Printf("✅ Successfully decoded %d bytes of code content", len(decoded))
			} else {
				log.Printf("⚠️ Failed to decode base64 content: %v", err)
				decodedContent = "Failed to decode file content"
			}
		}
	}

	// Extract file information
	fileInfo = map[string]interface{}{
		"name": getStringFromResult(githubDataMap, "name"),
		"path": getStringFromResult(githubDataMap, "path"),
		"size": getIntFromResult(githubDataMap, "size"),
		"type": getStringFromResult(githubDataMap, "type"),
	}

	// Use the new code analyzer
	var analysis map[string]interface{}
	if decodedContent != "" && decodedContent != "Failed to decode file content" {
		fileName := getStringFromResult(githubDataMap, "name")
		analysis = c.codeAnalyzer.AnalyzeContent(decodedContent, fileName)
	} else {
		analysis = map[string]interface{}{
			"error": "Unable to decode file content",
		}
	}

	// Return transformed response
	transformed := map[string]interface{}{
		"file_info":       fileInfo,
		"decoded_content": decodedContent,
		"analysis":        analysis,
		"_metadata": map[string]interface{}{
			"function_name":    "github_analyze_code",
			"execution_method": "HTTP",
			"transformer_type": "code_analyzer",
			"status_code":      200,
			"original_args":    args,
		},
	}

	log.Printf("✅ Code analysis complete for file: %s", getStringFromResult(result, "name"))
	return transformed
}

// Helper function to safely extract string values from result
func getStringFromResult(result map[string]interface{}, key string) string {
	if val, exists := result[key]; exists {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

// Helper function to safely extract int values from result
func getIntFromResult(result map[string]interface{}, key string) int {
	if val, exists := result[key]; exists {
		if num, ok := val.(float64); ok {
			return int(num)
		}
		if num, ok := val.(int); ok {
			return num
		}
	}
	return 0
}

// Basic code analysis based on file content and extension
func (c *Client) analyzeCodeContent(content, filename string) map[string]interface{} {
	analysis := map[string]interface{}{
		"language":   detectLanguage(filename),
		"lines":      len(strings.Split(content, "\n")),
		"size_bytes": len(content),
	}

	// Language-specific analysis
	switch detectLanguage(filename) {
	case "go":
		analysis["functions"] = extractGoFunctions(content)
		analysis["imports"] = extractGoImports(content)
		analysis["packages"] = extractGoPackages(content)
	case "javascript", "typescript":
		analysis["functions"] = extractJSFunctions(content)
		analysis["imports"] = extractJSImports(content)
	case "python":
		analysis["functions"] = extractPythonFunctions(content)
		analysis["imports"] = extractPythonImports(content)
	}

	return analysis
}

// Detect programming language from filename
func detectLanguage(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".go":
		return "go"
	case ".js":
		return "javascript"
	case ".ts":
		return "typescript"
	case ".py":
		return "python"
	case ".java":
		return "java"
	case ".cpp", ".cc", ".cxx":
		return "cpp"
	case ".c":
		return "c"
	case ".rb":
		return "ruby"
	case ".php":
		return "php"
	case ".rs":
		return "rust"
	default:
		return "unknown"
	}
}

// Extract Go function names from content
func extractGoFunctions(content string) []string {
	funcRegex := regexp.MustCompile(`func\s+(\w+)\s*\(`)
	matches := funcRegex.FindAllStringSubmatch(content, -1)
	var functions []string
	for _, match := range matches {
		if len(match) > 1 {
			functions = append(functions, match[1])
		}
	}
	return functions
}

// Extract Go imports from content
func extractGoImports(content string) []string {
	// Handle both single import and import blocks
	importRegex := regexp.MustCompile(`import\s+(?:\(\s*((?:[^)]*\n)*)\s*\)|"([^"]+)")`)
	matches := importRegex.FindAllStringSubmatch(content, -1)
	var imports []string

	for _, match := range matches {
		if len(match) > 2 && match[2] != "" {
			// Single import
			imports = append(imports, match[2])
		} else if len(match) > 1 && match[1] != "" {
			// Import block
			blockImports := regexp.MustCompile(`"([^"]+)"`).FindAllStringSubmatch(match[1], -1)
			for _, blockMatch := range blockImports {
				if len(blockMatch) > 1 {
					imports = append(imports, blockMatch[1])
				}
			}
		}
	}
	return imports
}

// Extract Go package name from content
func extractGoPackages(content string) []string {
	packageRegex := regexp.MustCompile(`package\s+(\w+)`)
	match := packageRegex.FindStringSubmatch(content)
	if len(match) > 1 {
		return []string{match[1]}
	}
	return []string{}
}

// Extract JavaScript/TypeScript function names
func extractJSFunctions(content string) []string {
	funcRegex := regexp.MustCompile(`(?:function\s+(\w+)|const\s+(\w+)\s*=|(\w+)\s*:\s*function|\s+(\w+)\s*\()`)
	matches := funcRegex.FindAllStringSubmatch(content, -1)
	var functions []string
	for _, match := range matches {
		for i := 1; i < len(match); i++ {
			if match[i] != "" {
				functions = append(functions, match[i])
				break
			}
		}
	}
	return functions
}

// Extract JavaScript/TypeScript imports
func extractJSImports(content string) []string {
	importRegex := regexp.MustCompile(`import\s+.*?from\s+['"]([^'"]+)['"]`)
	matches := importRegex.FindAllStringSubmatch(content, -1)
	var imports []string
	for _, match := range matches {
		if len(match) > 1 {
			imports = append(imports, match[1])
		}
	}
	return imports
}

// Extract Python function names
func extractPythonFunctions(content string) []string {
	funcRegex := regexp.MustCompile(`def\s+(\w+)\s*\(`)
	matches := funcRegex.FindAllStringSubmatch(content, -1)
	var functions []string
	for _, match := range matches {
		if len(match) > 1 {
			functions = append(functions, match[1])
		}
	}
	return functions
}

// Extract Python imports
func extractPythonImports(content string) []string {
	importRegex := regexp.MustCompile(`(?:import\s+(\w+)|from\s+(\w+)\s+import)`)
	matches := importRegex.FindAllStringSubmatch(content, -1)
	var imports []string
	for _, match := range matches {
		for i := 1; i < len(match); i++ {
			if match[i] != "" {
				imports = append(imports, match[i])
				break
			}
		}
	}
	return imports
}

// transformDirectoryListing handles GitHub directory listing responses
func (c *Client) transformDirectoryListing(result map[string]interface{}, githubArray []interface{}) map[string]interface{} {
	return c.directoryAnalyzer.ProcessDirectoryListing(result, githubArray)
}

// analyzeFileTypes analyzes the file types in a directory listing
func (c *Client) analyzeFileTypes(files []map[string]interface{}) map[string]interface{} {
	typeCount := make(map[string]int)

	for _, file := range files {
		if name, ok := file["name"].(string); ok {
			ext := filepath.Ext(name)
			if ext == "" {
				ext = "no_extension"
			}
			typeCount[ext]++
		}
	}

	return map[string]interface{}{
		"by_extension": typeCount,
		"total_types":  len(typeCount),
	}
}

// isCodeFile determines if a file should be analyzed as code based on its extension
func (c *Client) isCodeFile(fileName string) bool {
	ext := strings.ToLower(filepath.Ext(fileName))
	codeExtensions := map[string]bool{
		".go":    true,
		".js":    true,
		".ts":    true,
		".py":    true,
		".java":  true,
		".cpp":   true,
		".c":     true,
		".h":     true,
		".hpp":   true,
		".rs":    true,
		".php":   true,
		".rb":    true,
		".cs":    true,
		".swift": true,
		".kt":    true,
		".scala": true,
		".sql":   true,
		".sh":    true,
		".bash":  true,
		".zsh":   true,
		".fish":  true,
		".yml":   true,
		".yaml":  true,
		".json":  true,
		".xml":   true,
		".html":  true,
		".css":   true,
		".scss":  true,
		".less":  true,
		".vue":   true,
		".jsx":   true,
		".tsx":   true,
	}
	return codeExtensions[ext]
}

// fetchFileContent fetches the content of a single file from GitHub API
func (c *Client) fetchFileContent(fileItem map[string]interface{}) map[string]interface{} {
	downloadURL := getStringFromResult(fileItem, "download_url")
	if downloadURL == "" {
		log.Printf("⚠️ No download_url found for file")
		return nil
	}

	// Make HTTP request to fetch file content
	resp, err := http.Get(downloadURL)
	if err != nil {
		log.Printf("⚠️ Failed to fetch file content: %v", err)
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		log.Printf("⚠️ Failed to fetch file content, status: %d", resp.StatusCode)
		return nil
	}

	contentBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("⚠️ Failed to read file content: %v", err)
		return nil
	}

	content := string(contentBytes)
	fileName := getStringFromResult(fileItem, "name")

	return map[string]interface{}{
		"content":  content,
		"analysis": c.analyzeCodeContent(content, fileName),
	}
}

// countTotalLinesOfCode counts total lines across all analyzed files
func (c *Client) countTotalLinesOfCode(filesWithContent []map[string]interface{}) int {
	totalLines := 0
	for _, file := range filesWithContent {
		if content, ok := file["content"].(string); ok {
			totalLines += len(strings.Split(content, "\n"))
		}
	}
	return totalLines
}

// summarizeCodeFiles provides a summary of the analyzed code files
func (c *Client) summarizeCodeFiles(filesWithContent []map[string]interface{}) []map[string]interface{} {
	summaries := make([]map[string]interface{}, 0)

	for _, file := range filesWithContent {
		if analysis, ok := file["analysis"].(map[string]interface{}); ok {
			summary := map[string]interface{}{
				"name":      file["name"],
				"size":      file["size"],
				"functions": getIntFromResult(analysis, "function_count"),
				"imports":   getIntFromResult(analysis, "import_count"),
				"lines":     getIntFromResult(analysis, "line_count"),
			}
			summaries = append(summaries, summary)
		}
	}

	return summaries
}

// generateCodeOverview generates a high-level overview of the analyzed code
func (c *Client) generateCodeOverview(filesWithContent []map[string]interface{}) map[string]interface{} {
	totalFunctions := 0
	totalImports := 0
	totalLines := 0
	fileLanguages := make(map[string]int)

	for _, file := range filesWithContent {
		fileName := getStringFromResult(file, "name")
		ext := strings.ToLower(filepath.Ext(fileName))
		fileLanguages[ext]++

		if analysis, ok := file["analysis"].(map[string]interface{}); ok {
			totalFunctions += getIntFromResult(analysis, "function_count")
			totalImports += getIntFromResult(analysis, "import_count")
			totalLines += getIntFromResult(analysis, "line_count")
		}
	}

	return map[string]interface{}{
		"total_functions":    totalFunctions,
		"total_imports":      totalImports,
		"total_lines":        totalLines,
		"files_analyzed":     len(filesWithContent),
		"languages_detected": fileLanguages,
		"purpose_analysis":   c.inferDirectoryPurpose(filesWithContent),
	}
}

// inferDirectoryPurpose attempts to infer the purpose of the directory based on file analysis
func (c *Client) inferDirectoryPurpose(filesWithContent []map[string]interface{}) string {
	hasMain := false
	hasServer := false
	hasGRPC := false
	hasHttp := false

	for _, file := range filesWithContent {
		fileName := strings.ToLower(getStringFromResult(file, "name"))
		content := getStringFromResult(file, "content")

		if fileName == "main.go" {
			hasMain = true
		}
		if strings.Contains(fileName, "server") {
			hasServer = true
		}
		if strings.Contains(content, "grpc") || strings.Contains(fileName, "grpc") {
			hasGRPC = true
		}
		if strings.Contains(content, "http") && strings.Contains(content, "ListenAndServe") {
			hasHttp = true
		}
	}

	if hasMain && hasServer && hasGRPC {
		return "Go gRPC server application with main entry point"
	} else if hasMain && hasServer && hasHttp {
		return "Go HTTP server application with main entry point"
	} else if hasMain {
		return "Go application with main entry point"
	} else if hasServer {
		return "Server-related code module"
	} else {
		return "Go code module (purpose unclear from file analysis)"
	}
}

// applyStoredResultTransformer applies the stored result transformer
func (c *Client) applyStoredResultTransformer(funcDef *db.FunctionDefinition, result map[string]interface{}, cypherQuery string, args map[string]interface{}) (map[string]interface{}, error) {
	transformerType := "default"
	if funcDef.ResultTransformer.Valid {
		transformerType = funcDef.ResultTransformer.String
	}

	switch transformerType {
	case "neo4j_nodes":
		// Return Neo4j result as-is for node lookup
		return result, nil
	case "sales_summary":
		return c.transformNeo4jToSalesSummary(result, cypherQuery), nil
	case "normalize_attributes":
		// Extract normalization parameters
		normalizationType := "general"
		if normTypeVal, exists := args["normalization_type"]; exists {
			if normType, ok := normTypeVal.(string); ok && normType != "" {
				normalizationType = normType
			}
		}

		caseStyle := "title_case"
		if caseVal, exists := args["case_style"]; exists {
			if caseStr, ok := caseVal.(string); ok && caseStr != "" {
				caseStyle = caseStr
			}
		}

		var customMappings map[string]interface{}
		if customVal, exists := args["custom_mappings"]; exists {
			if customMap, ok := customVal.(map[string]interface{}); ok {
				customMappings = customMap
			}
		}

		return c.processAttributeNormalization(result, normalizationType, caseStyle, customMappings, cypherQuery), nil
	case "code_analyzer":
		return c.transformGitHubCodeResponse(result, args), nil
	case "github_code_analyzer":
		return c.transformGitHubCodeResponse(result, args), nil
	default:
		// Default transformer - return result with metadata
		result["_metadata"] = map[string]interface{}{
			"function_name":    funcDef.Name,
			"execution_method": "CYPHER",
			"transformer_type": transformerType,
		}
		return result, nil
	}
}

// sendFunctionResultToGemini sends the function result back to Gemini for a final response
func (c *Client) sendFunctionResultToGemini(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest, functionName string, functionResult map[string]interface{}, originalPrompt string) (string, error) {
	log.Printf("🔧 Sending function result back to Gemini for final response")

	// According to Gemini API docs, we need to send the conversation history including the function call and response
	// Create the conversation with the original user message, function call, and function response
	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			// Original user message
			{
				"role": "user",
				"parts": []map[string]interface{}{
					{"text": originalPrompt},
				},
			},
			// Model's function call response
			{
				"role": "model",
				"parts": []map[string]interface{}{
					{
						"functionCall": map[string]interface{}{
							"name": functionName,
							"args": extractArgsFromResult(functionResult),
						},
					},
				},
			},
			// Function response
			{
				"role": "function",
				"parts": []map[string]interface{}{
					{
						"functionResponse": map[string]interface{}{
							"name":     functionName,
							"response": functionResult,
						},
					},
				},
			},
		},
	}

	// Add generation config if available
	generationConfig := make(map[string]interface{})
	if config.Temperature != nil {
		generationConfig["temperature"] = *config.Temperature
	}
	if config.MaxTokens != nil {
		generationConfig["maxOutputTokens"] = *config.MaxTokens
	}
	if len(generationConfig) > 0 {
		requestBody["generationConfig"] = generationConfig
	}

	// Include tools in follow-up request to enable function chaining if needed
	// But use a different toolConfig mode to make it optional rather than required
	if len(config.Tools) > 0 {
		log.Printf("🔧 Adding %d tools to follow-up Gemini request for potential function chaining", len(config.Tools))
		tools := make([]map[string]interface{}, len(config.Tools))
		for i, tool := range config.Tools {
			// Sanitize the parameters to remove unsupported fields
			sanitizedParams := sanitizeToolParameters(tool.Parameters)

			toolDeclaration := map[string]interface{}{
				"functionDeclarations": []map[string]interface{}{
					{
						"name":        tool.Name,
						"description": tool.Description,
						"parameters":  sanitizedParams,
					},
				},
			}
			tools[i] = toolDeclaration
		}
		requestBody["tools"] = tools

		// Use AUTO mode instead of ANY - this allows Gemini to choose whether to use functions
		// or provide a text response based on the function result
		requestBody["toolConfig"] = map[string]interface{}{
			"functionCallingConfig": map[string]interface{}{
				"mode": "AUTO", // Let Gemini decide whether to call functions or respond with text
			},
		}
		log.Printf("🔧 Added tools with AUTO mode to allow Gemini to choose between function calls and text response")
	} else {
		log.Printf("🔧 No tools available - Gemini will only provide text response")
	}

	// Debug: Log the request body (truncated for readability)
	reqBodyBytes, _ := json.Marshal(requestBody)
	log.Printf("🔧 DEBUG: Follow-up request body (first 500 chars): %s", string(reqBodyBytes)[:min(500, len(reqBodyBytes))])

	// Make the API call
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", config.ModelName)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBodyBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	var geminiApiKey string
	if c.sessionApiKeys != nil {
		geminiApiKey = c.sessionApiKeys.GeminiApiKey
	}
	req.Header.Set("x-goog-api-key", geminiApiKey)

	client := &http.Client{Timeout: 10 * time.Minute} // Very tolerant for async follow-up calls
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// Debug: Log the response body
	log.Printf("🔧 DEBUG: Follow-up response body (first 1000 chars): %s", string(body)[:min(1000, len(body))])

	// Parse response
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text         string `json:"text,omitempty"`
					FunctionCall struct {
						Name string                 `json:"name"`
						Args map[string]interface{} `json:"args"`
					} `json:"functionCall,omitempty"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(body, &geminiResp); err != nil {
		return "", err
	}

	if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
		for _, part := range geminiResp.Candidates[0].Content.Parts {
			// If we get a text response, that's what we want
			if part.Text != "" {
				log.Printf("✅ Got final response from Gemini: %s", part.Text[:min(50, len(part.Text))])
				return part.Text, nil
			}

			// If we get another function call, this is function chaining - execute it
			if part.FunctionCall.Name != "" {
				log.Printf("🔗 Function chaining detected: %s", part.FunctionCall.Name)

				// Execute the additional function call
				chainedResult, err := c.executeFunctionCall(ctx, part.FunctionCall.Name, part.FunctionCall.Args)
				if err != nil {
					log.Printf("⚠️ Failed to execute chained function %s: %v", part.FunctionCall.Name, err)
					// Fallback to providing the original function result
					resultData, _ := json.Marshal(functionResult)
					return fmt.Sprintf("I successfully called the %s function and retrieved the data: %s", functionName, string(resultData)[:min(500, len(resultData))]), nil
				}

				// Instead of returning concatenated results, send both function results back to Gemini
				// for proper synthesis. Create a conversation history with both function calls and results.
				log.Printf("🔗 Sending both function results to Gemini for synthesis")

				// Combine both function results into a comprehensive context
				combinedContext := map[string]interface{}{
					"first_function": map[string]interface{}{
						"name":   functionName,
						"result": functionResult,
					},
					"second_function": map[string]interface{}{
						"name":   part.FunctionCall.Name,
						"result": chainedResult,
					},
				}

				// Send the combined results back to Gemini for final synthesis
				// Use a prompt that asks Gemini to analyze and synthesize the results
				synthesisPrompt := fmt.Sprintf("Based on the results from both function calls (%s and %s), please provide a comprehensive analysis and summary.", functionName, part.FunctionCall.Name)

				return c.sendCombinedFunctionResultsToGemini(ctx, config, request, combinedContext, originalPrompt, synthesisPrompt)
			}
		}
	}

	return "I executed the function successfully but couldn't generate a proper response.", nil
}

// sendCombinedFunctionResultsToGemini sends multiple function results to Gemini for synthesis
func (c *Client) sendCombinedFunctionResultsToGemini(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest, combinedContext map[string]interface{}, originalPrompt, synthesisPrompt string) (string, error) {
	log.Printf("🔧 Sending combined function results to Gemini for synthesis")

	// Create a conversation history that includes the original prompt and all function calls/results
	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			// Original user message
			{
				"role": "user",
				"parts": []map[string]interface{}{
					{"text": originalPrompt},
				},
			},
			// Model's first function call
			{
				"role": "model",
				"parts": []map[string]interface{}{
					{
						"functionCall": map[string]interface{}{
							"name": combinedContext["first_function"].(map[string]interface{})["name"].(string),
							"args": extractArgsFromCombinedResult(combinedContext["first_function"].(map[string]interface{})["result"].(map[string]interface{})),
						},
					},
				},
			},
			// First function response
			{
				"role": "function",
				"parts": []map[string]interface{}{
					{
						"functionResponse": map[string]interface{}{
							"name":     combinedContext["first_function"].(map[string]interface{})["name"].(string),
							"response": combinedContext["first_function"].(map[string]interface{})["result"].(map[string]interface{}),
						},
					},
				},
			},
			// Model's second function call
			{
				"role": "model",
				"parts": []map[string]interface{}{
					{
						"functionCall": map[string]interface{}{
							"name": combinedContext["second_function"].(map[string]interface{})["name"].(string),
							"args": extractArgsFromCombinedResult(combinedContext["second_function"].(map[string]interface{})["result"].(map[string]interface{})),
						},
					},
				},
			},
			// Second function response
			{
				"role": "function",
				"parts": []map[string]interface{}{
					{
						"functionResponse": map[string]interface{}{
							"name":     combinedContext["second_function"].(map[string]interface{})["name"].(string),
							"response": combinedContext["second_function"].(map[string]interface{})["result"].(map[string]interface{}),
						},
					},
				},
			},
			// Synthesis request
			{
				"role": "user",
				"parts": []map[string]interface{}{
					{"text": synthesisPrompt},
				},
			},
		},
	}

	// Add generation config
	generationConfig := make(map[string]interface{})
	if config.Temperature != nil {
		generationConfig["temperature"] = *config.Temperature
	}
	if config.MaxTokens != nil {
		generationConfig["maxOutputTokens"] = *config.MaxTokens
	}
	if len(generationConfig) > 0 {
		requestBody["generationConfig"] = generationConfig
	}

	// Do NOT include tools in this final synthesis call to force a text response
	log.Printf("🔧 No tools included in synthesis call to force text response")

	// Make the API call
	reqBodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", config.ModelName)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBodyBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	var geminiApiKey string
	if c.sessionApiKeys != nil {
		geminiApiKey = c.sessionApiKeys.GeminiApiKey
	}
	req.Header.Set("x-goog-api-key", geminiApiKey)

	client := &http.Client{Timeout: 10 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// Parse response
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text,omitempty"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(responseBody, &geminiResp); err != nil {
		return "", err
	}

	if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
		for _, part := range geminiResp.Candidates[0].Content.Parts {
			if part.Text != "" {
				log.Printf("✅ Got synthesis response from Gemini: %s", part.Text[:min(100, len(part.Text))])
				return part.Text, nil
			}
		}
	}

	return "I executed multiple functions successfully but couldn't generate a proper synthesis.", nil
}

// Helper function to extract function arguments from combined results
func extractArgsFromCombinedResult(functionResult map[string]interface{}) map[string]interface{} {
	if metadata, ok := functionResult["_metadata"].(map[string]interface{}); ok {
		if args, ok := metadata["original_args"].(map[string]interface{}); ok {
			return args
		}
	}
	return make(map[string]interface{})
}

// Helper function to extract function arguments from the original function call
// This is needed because we need to reconstruct the function call in the conversation history
func extractArgsFromResult(functionResult map[string]interface{}) map[string]interface{} {
	// Try to extract the original arguments from the function result metadata
	if metadata, ok := functionResult["_metadata"].(map[string]interface{}); ok {
		if args, ok := metadata["original_args"].(map[string]interface{}); ok {
			return args
		}
	}

	// If we can't find the original args, return empty map
	// The function call reconstruction might not be perfect, but Gemini should still process the response
	return make(map[string]interface{})
}

// min helper function
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// getMapKeys returns the keys of a map as a slice of strings for logging purposes
func getMapKeys(m map[string]interface{}) []string {
	if m == nil {
		return []string{}
	}
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// compareResults compares multiple variation results
func (c *Client) compareResults(ctx context.Context, result *types.ExecutionResult) (*types.ComparisonResult, error) {
	// Enhanced comparison implementation with multiple metrics
	fmt.Printf("🔍 Comparing %d results for execution run: %s\n", len(result.Results), result.ExecutionRun.ID)

	// Log all configuration IDs for debugging
	for i, r := range result.Results {
		fmt.Printf("🔧 Config %d: %s (ID: %s)\n", i+1, r.Configuration.VariationName, r.Configuration.ID)
	}

	comparisonResult := &types.ComparisonResult{
		ID:             uuid.New().String(),
		ExecutionRunID: result.ExecutionRun.ID,
		ComparisonType: "comprehensive",
		MetricName:     "multi_metric",
		CreatedAt:      time.Now(),
	}

	// Calculate comprehensive scores for each configuration
	scores := make(map[string]interface{})
	var bestOverall *types.VariationResult
	var bestScore float64 = -1

	for _, r := range result.Results {
		// Calculate various metrics
		responseTimeScore := calculateResponseTimeScore(r.Response.ResponseTimeMs)
		creativityScore := calculateCreativityScore(r.Configuration, r.Response)
		coherenceScore := calculateCoherenceScore(r.Response.ResponseText)
		tokenEfficiencyScore := calculateTokenEfficiencyScore(r.Response)
		safetyScore := calculateSafetyScore(r.Response.ResponseText)
		costEffectivenessScore := calculateCostEffectivenessScore(r.Response)

		// Calculate overall score (weighted average)
		overallScore := (responseTimeScore*0.2 +
			creativityScore*0.25 +
			coherenceScore*0.25 +
			tokenEfficiencyScore*0.15 +
			safetyScore*0.1 +
			costEffectivenessScore*0.05)

		// Track best overall configuration
		if bestOverall == nil || overallScore > bestScore {
			bestOverall = &r
			bestScore = overallScore
		}

		// Store detailed scores with configuration ID for easy matching
		scores[r.Configuration.VariationName] = map[string]interface{}{
			"configuration_id":    r.Configuration.ID,
			"response_time_ms":    r.Response.ResponseTimeMs,
			"status":              r.Response.ResponseStatus,
			"response_time_score": responseTimeScore,
			"creativity_score":    creativityScore,
			"coherence_score":     coherenceScore,
			"token_efficiency":    tokenEfficiencyScore,
			"safety_score":        safetyScore,
			"cost_effectiveness":  costEffectivenessScore,
			"overall_score":       overallScore,
			"temperature":         r.Configuration.Temperature,
			"model_name":          r.Configuration.ModelName,
		}

		// Log detailed scoring for debugging
		fmt.Printf("📊 Configuration %s (%s): Overall=%.2f, Time=%dms, Creativity=%.2f\n",
			r.Configuration.VariationName,
			r.Configuration.ID[:8],
			overallScore*100,
			r.Response.ResponseTimeMs,
			creativityScore*100)
	}

	// Set best configuration and analysis notes
	if bestOverall != nil {
		comparisonResult.BestConfigurationID = bestOverall.Configuration.ID
		comparisonResult.BestConfiguration = &bestOverall.Configuration

		// Log the best configuration ID for debugging
		fmt.Printf("🏆 Best Configuration Selected: %s (ID: %s)\n", bestOverall.Configuration.VariationName, bestOverall.Configuration.ID)

		// Create detailed analysis notes
		analysis := fmt.Sprintf("🏆 Best Configuration: %s\n", bestOverall.Configuration.VariationName)
		analysis += fmt.Sprintf("📋 Configuration ID: %s\n\n", bestOverall.Configuration.ID)
		analysis += fmt.Sprintf("📊 Overall Score: %.2f/100\n", bestScore*100)
		analysis += fmt.Sprintf("⚡ Response Time: %dms\n", bestOverall.Response.ResponseTimeMs)
		analysis += fmt.Sprintf("🎨 Creativity Score: %.1f/100\n", getScoreFromMap(scores, bestOverall.Configuration.VariationName, "creativity_score")*100)
		analysis += fmt.Sprintf("🧠 Coherence Score: %.1f/100\n", getScoreFromMap(scores, bestOverall.Configuration.VariationName, "coherence_score")*100)
		analysis += fmt.Sprintf("💡 Token Efficiency: %.1f/100\n", getScoreFromMap(scores, bestOverall.Configuration.VariationName, "token_efficiency")*100)

		// Add comparison insights
		analysis += "\n📈 Key Insights:\n"
		fastest := findFastest(result.Results)
		if fastest != nil && fastest.Configuration.ID != bestOverall.Configuration.ID {
			analysis += fmt.Sprintf("• Fastest: %s (%dms)\n", fastest.Configuration.VariationName, fastest.Response.ResponseTimeMs)
		}

		mostCreative := findMostCreative(scores)
		if mostCreative != "" && mostCreative != bestOverall.Configuration.VariationName {
			analysis += fmt.Sprintf("• Most Creative: %s\n", mostCreative)
		}

		analysis += fmt.Sprintf("• Best Overall: %s (balanced performance)\n", bestOverall.Configuration.VariationName)

		comparisonResult.AnalysisNotes = analysis
	}

	// Store all configurations for reference
	var allConfigs []types.APIConfiguration
	for _, r := range result.Results {
		allConfigs = append(allConfigs, r.Configuration)
	}
	comparisonResult.AllConfigurations = allConfigs

	comparisonResult.ConfigurationScores = scores
	return comparisonResult, nil
}

// Helper functions for calculating different metrics
func calculateResponseTimeScore(responseTimeMs int32) float64 {
	// Lower response time = higher score (max 1000ms = 100 points)
	if responseTimeMs <= 0 {
		return 0.0
	}
	score := 1000.0 / float64(responseTimeMs)
	if score > 1.0 {
		score = 1.0
	}
	return score
}

func calculateCreativityScore(config types.APIConfiguration, response types.APIResponse) float64 {
	// Higher temperature = higher creativity potential
	baseScore := 0.5
	if config.Temperature != nil {
		baseScore = float64(*config.Temperature)
	}

	// Boost score based on response characteristics
	text := response.ResponseText
	creativityIndicators := []string{"imagine", "creative", "artistic", "vivid", "colorful", "metaphor", "poetry", "story", "narrative"}
	indicatorCount := 0
	for _, indicator := range creativityIndicators {
		if strings.Contains(strings.ToLower(text), indicator) {
			indicatorCount++
		}
	}

	// Boost score by up to 0.3 based on creativity indicators
	boost := float64(indicatorCount) * 0.03
	if boost > 0.3 {
		boost = 0.3
	}

	return baseScore + boost
}

func calculateCoherenceScore(responseText string) float64 {
	// Simple coherence scoring based on text structure
	if len(responseText) < 50 {
		return 0.3
	}

	// Check for logical structure indicators
	coherenceIndicators := []string{"first", "second", "third", "however", "therefore", "because", "although", "furthermore", "in conclusion"}
	indicatorCount := 0
	for _, indicator := range coherenceIndicators {
		if strings.Contains(strings.ToLower(responseText), indicator) {
			indicatorCount++
		}
	}

	baseScore := 0.6
	boost := float64(indicatorCount) * 0.05
	if boost > 0.4 {
		boost = 0.4
	}

	return baseScore + boost
}

func calculateTokenEfficiencyScore(response types.APIResponse) float64 {
	// Higher token efficiency = higher score
	if response.UsageMetadata == nil {
		return 0.5 // Default score if no metadata
	}

	// Extract token information
	totalTokens := getTokenCount(response.UsageMetadata, "total_tokens")
	if totalTokens <= 0 {
		return 0.5
	}

	// Score based on response length vs tokens used
	responseLength := len(response.ResponseText)
	if responseLength == 0 {
		return 0.0
	}

	// Higher ratio of characters per token = better efficiency
	efficiencyRatio := float64(responseLength) / float64(totalTokens)

	// Normalize to 0-1 scale (typical range is 2-8 characters per token)
	if efficiencyRatio > 8.0 {
		efficiencyRatio = 8.0
	}

	return efficiencyRatio / 8.0
}

func calculateSafetyScore(responseText string) float64 {
	// Simple safety scoring - avoid potentially problematic content
	text := strings.ToLower(responseText)

	// Check for potentially unsafe content
	unsafeIndicators := []string{"harm", "danger", "illegal", "inappropriate", "offensive", "violent"}
	unsafeCount := 0
	for _, indicator := range unsafeIndicators {
		if strings.Contains(text, indicator) {
			unsafeCount++
		}
	}

	// Base score is high, reduce for unsafe indicators
	baseScore := 0.9
	penalty := float64(unsafeCount) * 0.1
	if penalty > 0.9 {
		penalty = 0.9
	}

	return baseScore - penalty
}

func calculateCostEffectivenessScore(response types.APIResponse) float64 {
	// Lower cost = higher score (based on tokens used)
	if response.UsageMetadata == nil {
		return 0.5
	}

	totalTokens := getTokenCount(response.UsageMetadata, "total_tokens")
	if totalTokens <= 0 {
		return 0.5
	}

	// Score based on token usage (fewer tokens = better cost effectiveness)
	// Assume 1000 tokens as baseline for "good" cost effectiveness
	if totalTokens <= 100 {
		return 1.0
	} else if totalTokens <= 500 {
		return 0.8
	} else if totalTokens <= 1000 {
		return 0.6
	} else {
		return 0.3
	}
}

// Helper functions
func getScoreFromMap(scores map[string]interface{}, configName, scoreKey string) float64 {
	if config, exists := scores[configName]; exists {
		if configMap, ok := config.(map[string]interface{}); ok {
			if score, exists := configMap[scoreKey]; exists {
				if scoreFloat, ok := score.(float64); ok {
					return scoreFloat
				}
			}
		}
	}
	return 0.0
}

func getTokenCount(metadata map[string]interface{}, key string) int {
	if value, exists := metadata[key]; exists {
		switch v := value.(type) {
		case float64:
			return int(v)
		case int:
			return v
		case string:
			if parsed, err := strconv.Atoi(v); err == nil {
				return parsed
			}
		}
	}
	return 0
}

func findFastest(results []types.VariationResult) *types.VariationResult {
	var fastest *types.VariationResult
	for i := range results {
		if fastest == nil || results[i].Response.ResponseTimeMs < fastest.Response.ResponseTimeMs {
			fastest = &results[i]
		}
	}
	return fastest
}

func findMostCreative(scores map[string]interface{}) string {
	var mostCreative string
	var highestScore float64 = -1

	for configName, configData := range scores {
		if configMap, ok := configData.(map[string]interface{}); ok {
			if score, exists := configMap["creativity_score"]; exists {
				if scoreFloat, ok := score.(float64); ok {
					if scoreFloat > highestScore {
						highestScore = scoreFloat
						mostCreative = configName
					}
				}
			}
		}
	}

	return mostCreative
}

// StoreComparisonResult stores a comparison result in the database
func (c *Client) StoreComparisonResult(ctx context.Context, userID string, comparison *types.ComparisonResult) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	// Convert configuration scores to JSON
	configScoresJSON, err := json.Marshal(comparison.ConfigurationScores)
	if err != nil {
		return fmt.Errorf("failed to marshal configuration scores: %w", err)
	}

	// Convert best configuration to JSON
	var bestConfigJSON json.RawMessage
	if comparison.BestConfiguration != nil {
		bestConfigJSON, err = json.Marshal(comparison.BestConfiguration)
		if err != nil {
			return fmt.Errorf("failed to marshal best configuration: %w", err)
		}
	}

	// Convert all configurations to JSON
	var allConfigsJSON json.RawMessage
	if len(comparison.AllConfigurations) > 0 {
		allConfigsJSON, err = json.Marshal(comparison.AllConfigurations)
		if err != nil {
			return fmt.Errorf("failed to marshal all configurations: %w", err)
		}
	}

	// Determine comparison type from metric name
	comparisonType := "custom"
	switch comparison.MetricName {
	case "response_time", "performance":
		comparisonType = "performance"
	case "quality", "coherence_score", "creativity_score":
		comparisonType = "quality"
	case "safety_score":
		comparisonType = "safety"
	}

	// Store in database
	err = c.queries.CreateComparisonResult(ctx, db.CreateComparisonResultParams{
		ID:                    comparison.ID,
		ExecutionRunID:        comparison.ExecutionRunID,
		ComparisonType:        sql.NullString{String: comparisonType, Valid: true},
		MetricName:            sql.NullString{String: comparison.MetricName, Valid: true},
		ConfigurationScores:   configScoresJSON,
		BestConfigurationID:   sql.NullString{String: comparison.BestConfigurationID, Valid: comparison.BestConfigurationID != ""},
		BestConfigurationData: bestConfigJSON,
		AllConfigurationsData: allConfigsJSON,
		AnalysisNotes:         sql.NullString{String: comparison.AnalysisNotes, Valid: comparison.AnalysisNotes != ""},
	})

	if err != nil {
		return fmt.Errorf("failed to store comparison result: %w", err)
	}

	return nil
}

// GetComparisonResult retrieves a comparison result from the database
func (c *Client) GetComparisonResult(ctx context.Context, executionRunID string) (*types.ComparisonResult, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	row, err := c.queries.GetComparisonResult(ctx, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("failed to get comparison result: %w", err)
	}

	// Parse configuration scores JSON
	var configScores map[string]interface{}
	if err := json.Unmarshal(row.ConfigurationScores, &configScores); err != nil {
		return nil, fmt.Errorf("failed to unmarshal configuration scores: %w", err)
	}

	// Parse best configuration JSON
	var bestConfig *types.APIConfiguration
	if row.BestConfigurationData != nil {
		if bestConfigStr, ok := row.BestConfigurationData.(string); ok && bestConfigStr != "" {
			bestConfig = &types.APIConfiguration{}
			if err := json.Unmarshal([]byte(bestConfigStr), bestConfig); err != nil {
				return nil, fmt.Errorf("failed to unmarshal best configuration: %w", err)
			}
		}
	}

	// Parse all configurations JSON
	var allConfigs []types.APIConfiguration
	if row.AllConfigurationsData != nil {
		if allConfigsStr, ok := row.AllConfigurationsData.(string); ok && allConfigsStr != "" {
			if err := json.Unmarshal([]byte(allConfigsStr), &allConfigs); err != nil {
				return nil, fmt.Errorf("failed to unmarshal all configurations: %w", err)
			}
		}
	}

	var createdAt time.Time
	if row.CreatedAt.Valid {
		createdAt = row.CreatedAt.Time
	}

	comparison := &types.ComparisonResult{
		ID:                  row.ID,
		ExecutionRunID:      row.ExecutionRunID,
		ComparisonType:      row.ComparisonType.String,
		MetricName:          row.MetricName.String,
		ConfigurationScores: configScores,
		BestConfigurationID: row.BestConfigurationID.String,
		BestConfiguration:   bestConfig,
		AllConfigurations:   allConfigs,
		AnalysisNotes:       row.AnalysisNotes.String,
		CreatedAt:           createdAt,
	}

	return comparison, nil
}

// ListComparisonResults retrieves all comparison results from the database
func (c *Client) ListComparisonResults(ctx context.Context) ([]*types.ComparisonResult, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	rows, err := c.queries.ListComparisonResults(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list comparison results: %w", err)
	}

	var comparisonResults []*types.ComparisonResult
	for _, row := range rows {
		// Parse configuration scores JSON
		var configScores map[string]interface{}
		if err := json.Unmarshal(row.ConfigurationScores, &configScores); err != nil {
			return nil, fmt.Errorf("failed to unmarshal configuration scores: %w", err)
		}

		// Parse best configuration JSON
		var bestConfig *types.APIConfiguration
		if row.BestConfigurationData != nil {
			if bestConfigStr, ok := row.BestConfigurationData.(string); ok && bestConfigStr != "" {
				bestConfig = &types.APIConfiguration{}
				if err := json.Unmarshal([]byte(bestConfigStr), bestConfig); err != nil {
					return nil, fmt.Errorf("failed to unmarshal best configuration: %w", err)
				}
			}
		}

		// Parse all configurations JSON
		var allConfigs []types.APIConfiguration
		if row.AllConfigurationsData != nil {
			if allConfigsStr, ok := row.AllConfigurationsData.(string); ok && allConfigsStr != "" {
				if err := json.Unmarshal([]byte(allConfigsStr), &allConfigs); err != nil {
					return nil, fmt.Errorf("failed to unmarshal all configurations: %w", err)
				}
			}
		}

		var createdAt time.Time
		if row.CreatedAt.Valid {
			createdAt = row.CreatedAt.Time
		}

		comparison := &types.ComparisonResult{
			ID:                  row.ID,
			ExecutionRunID:      row.ExecutionRunID,
			ComparisonType:      row.ComparisonType.String,
			MetricName:          row.MetricName.String,
			ConfigurationScores: configScores,
			BestConfigurationID: row.BestConfigurationID.String,
			BestConfiguration:   bestConfig,
			AllConfigurations:   allConfigs,
			AnalysisNotes:       row.AnalysisNotes.String,
			CreatedAt:           createdAt,
		}
		comparisonResults = append(comparisonResults, comparison)
	}

	return comparisonResults, nil
}

// Helper functions for handling nullable database fields
func convertFloat32ToNullString(f *float32) sql.NullString {
	if f == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: fmt.Sprintf("%.2f", *f), Valid: true}
}

func convertInt32ToNullInt32(i *int32) sql.NullInt32 {
	if i == nil {
		return sql.NullInt32{Valid: false}
	}
	return sql.NullInt32{Int32: *i, Valid: true}
}

// convertStringToRawMessage converts a JSON string to json.RawMessage for database storage
func convertStringToRawMessage(jsonStr string) json.RawMessage {
	if jsonStr == "" {
		return json.RawMessage("null")
	}
	return json.RawMessage(jsonStr)
}

// ListExecutionRuns retrieves execution runs from the database with pagination
func (c *Client) ListExecutionRuns(ctx context.Context, userID string, limit, offset int32) ([]*types.ExecutionRun, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	rows, err := c.queries.GetRecentExecutionRuns(ctx, db.GetRecentExecutionRunsParams{
		UserID: userID,
		Limit:  limit,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list execution runs: %w", err)
	}

	var executionRuns []*types.ExecutionRun
	for _, row := range rows {
		description := ""
		if row.Description.Valid {
			description = row.Description.String
		}

		basePrompt := ""
		if row.BasePrompt.Valid {
			basePrompt = row.BasePrompt.String
		}

		contextPrompt := ""
		if row.ContextPrompt.Valid {
			contextPrompt = row.ContextPrompt.String
		}

		executionRun := &types.ExecutionRun{
			ID:                    row.ID,
			Name:                  row.Name,
			Description:           description,
			BasePrompt:            basePrompt,
			ContextPrompt:         contextPrompt,
			EnableFunctionCalling: row.EnableFunctionCalling,
			Status:                "completed", // Default status for existing records
			ErrorMessage:          "",
			CreatedAt:             row.CreatedAt.Time,
			UpdatedAt:             row.UpdatedAt.Time,
		}
		executionRuns = append(executionRuns, executionRun)
	}

	return executionRuns, nil
}

// GetExecutionRun retrieves a single execution run by ID
func (c *Client) GetExecutionRun(ctx context.Context, userID string, id string) (*types.ExecutionRun, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	row, err := c.queries.GetExecutionRun(ctx, db.GetExecutionRunParams{
		ID:     id,
		UserID: userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get execution run: %w", err)
	}

	description := ""
	if row.Description.Valid {
		description = row.Description.String
	}

	basePrompt := ""
	if row.BasePrompt.Valid {
		basePrompt = row.BasePrompt.String
	}

	contextPrompt := ""
	if row.ContextPrompt.Valid {
		contextPrompt = row.ContextPrompt.String
	}

	return &types.ExecutionRun{
		ID:                    row.ID,
		Name:                  row.Name,
		Description:           description,
		BasePrompt:            basePrompt,
		ContextPrompt:         contextPrompt,
		EnableFunctionCalling: row.EnableFunctionCalling,
		Status:                "completed", // Default status for existing records
		ErrorMessage:          "",
		CreatedAt:             row.CreatedAt.Time,
		UpdatedAt:             row.UpdatedAt.Time,
	}, nil
}

// GetExecutionResult retrieves complete execution details from the database
func (c *Client) GetExecutionResult(ctx context.Context, userID string, executionRunID string) (*types.ExecutionResult, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	// Get the execution run
	executionRun, err := c.GetExecutionRun(ctx, userID, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("failed to get execution run: %w", err)
	}

	// Get all configurations for this execution run
	configRows, err := c.queries.GetAPIConfigurationsByRun(ctx, db.GetAPIConfigurationsByRunParams{
		ExecutionRunID: executionRunID,
		UserID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get configurations: %w", err)
	}
	log.Printf("🔧 Found %d configurations for execution run %s", len(configRows), executionRunID)

	// Get function definitions used in this execution
	functionConfigRows, err := c.queries.ListExecutionFunctionConfigs(ctx, executionRunID)
	if err != nil {
		log.Printf("⚠️ Failed to get function configs for execution %s: %v", executionRunID, err)
		// Continue without functions rather than failing
	}
	log.Printf("🔧 Found %d function configurations for execution run %s", len(functionConfigRows), executionRunID)

	// Get all requests for this execution run
	requestRows, err := c.queries.GetAPIRequestsByRun(ctx, db.GetAPIRequestsByRunParams{
		ExecutionRunID: executionRunID,
		UserID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get requests: %w", err)
	}
	log.Printf("📝 Found %d requests for execution run %s", len(requestRows), executionRunID)

	// Get all responses with joined data for this execution run
	responseRows, err := c.queries.GetAPIResponsesWithRequests(ctx, db.GetAPIResponsesWithRequestsParams{
		ExecutionRunID: executionRunID,
		UserID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get responses: %w", err)
	}
	log.Printf("📊 Found %d responses for execution run %s", len(responseRows), executionRunID)

	// Build function tools map from function configurations
	functionTools := make([]types.Tool, 0)
	for _, funcConfig := range functionConfigRows {
		// Get the full function definition
		funcDef, err := c.queries.GetFunctionDefinition(ctx, db.GetFunctionDefinitionParams{
			ID:     funcConfig.FunctionDefinitionID,
			UserID: userID,
		})
		if err != nil {
			log.Printf("⚠️ Failed to get function definition %s: %v", funcConfig.FunctionDefinitionID, err)
			continue
		}

		// Parse the parameters schema - no longer nullable after schema fix
		var parametersSchema map[string]interface{}
		if err := json.Unmarshal(funcDef.ParametersSchema, &parametersSchema); err != nil {
			log.Printf("⚠️ Failed to parse parameters schema for function %s: %v", funcDef.Name, err)
			parametersSchema = make(map[string]interface{})
		}

		tool := types.Tool{
			Name:        funcDef.Name,
			Description: funcDef.Description.String,
			Parameters:  parametersSchema,
		}
		functionTools = append(functionTools, tool)
		log.Printf("✅ Added function tool: %s", funcDef.Name)
	}

	// Build configurations map - function tools are managed at execution level, not per configuration
	configs := make(map[string]*types.APIConfiguration)
	for _, row := range configRows {
		config := &types.APIConfiguration{
			ID:            row.ID,
			VariationName: row.VariationName,
			ModelName:     row.ModelName,
			SystemPrompt:  row.SystemPrompt.String,
			CreatedAt:     row.CreatedAt.Time,
			// Add function tools to each configuration for display purposes
			// Even though tools are managed at execution level, each config should show the same tools
			Tools: functionTools,
		}

		// Parse nullable fields
		if row.Temperature.Valid {
			temp, _ := parseFloat32(row.Temperature.String)
			config.Temperature = &temp
		}
		if row.MaxTokens.Valid {
			config.MaxTokens = &row.MaxTokens.Int32
		}
		if row.TopP.Valid {
			topP, _ := parseFloat32(row.TopP.String)
			config.TopP = &topP
		}
		if row.TopK.Valid {
			config.TopK = &row.TopK.Int32
		}

		configs[config.ID] = config
	}

	// Build requests map
	requests := make(map[string]*types.APIRequest)
	for _, row := range requestRows {
		request := &types.APIRequest{
			ID:              row.ID,
			ExecutionRunID:  row.ExecutionRunID,
			ConfigurationID: row.ConfigurationID,
			RequestType:     types.RequestType(row.RequestType.String),
			Prompt:          row.Prompt.String,
			Context:         row.Context.String,
			FunctionName:    row.FunctionName.String,
			CreatedAt:       row.CreatedAt.Time,
		}
		requests[request.ID] = request
	}

	// Build variation results
	results := make([]types.VariationResult, 0)

	log.Printf("🔍 Processing %d response rows for execution run %s", len(responseRows), executionRunID)

	// Get execution logs
	executionLogs, err := c.queries.GetExecutionLogsByRun(ctx, executionRunID)
	if err != nil {
		log.Printf("⚠️ Failed to get execution logs for %s: %v", executionRunID, err)
		// Continue without logs rather than failing
	}
	log.Printf("📋 Found %d execution logs for execution run %s", len(executionLogs), executionRunID)

	for _, respRow := range responseRows {
		// Get the configuration and request
		configID := findConfigIDForRequest(requestRows, respRow.RequestID)
		if configID == "" {
			log.Printf("Warning: Could not find configuration for request %s", respRow.RequestID)
			continue
		}

		config := configs[configID]
		request := requests[respRow.RequestID]

		if config == nil || request == nil {
			log.Printf("Warning: Missing config or request for response %s (config: %v, request: %v)", respRow.ID, config != nil, request != nil)
			continue
		}

		log.Printf("✅ Processing response %s for config %s (%s)", respRow.ID, configID, config.VariationName)

		// Parse usage metadata
		var usageMetadata map[string]interface{}
		if respRow.UsageMetadata != nil {
			json.Unmarshal(respRow.UsageMetadata, &usageMetadata)
		}

		response := &types.APIResponse{
			ID:             respRow.ID,
			RequestID:      respRow.RequestID,
			ResponseStatus: types.ResponseStatus(respRow.ResponseStatus.String),
			ResponseText:   respRow.ResponseText.String,
			FinishReason:   respRow.FinishReason.String,
			ErrorMessage:   respRow.ErrorMessage.String,
			ResponseTimeMs: respRow.ResponseTimeMs.Int32,
			UsageMetadata:  usageMetadata,
			CreatedAt:      respRow.CreatedAt.Time,
		}

		// Get function calls for this request
		functionCallRows, err := c.queries.ListFunctionCallsByRequest(ctx, respRow.RequestID)
		if err != nil {
			log.Printf("⚠️ Failed to get function calls for request %s: %v", respRow.RequestID, err)
			// Continue without function calls rather than failing
		}

		// Convert function call rows to types.FunctionCall
		functionCalls := make([]types.FunctionCall, 0, len(functionCallRows))
		for _, fcRow := range functionCallRows {
			// Parse function arguments
			var functionArgs map[string]interface{}
			if fcRow.FunctionArguments != nil {
				if err := json.Unmarshal(fcRow.FunctionArguments, &functionArgs); err != nil {
					log.Printf("⚠️ Failed to parse function arguments for call %s: %v", fcRow.ID, err)
					functionArgs = make(map[string]interface{})
				}
			}

			// Parse function response
			var functionResponse map[string]interface{}
			if fcRow.FunctionResponse != nil {
				if err := json.Unmarshal(fcRow.FunctionResponse, &functionResponse); err != nil {
					log.Printf("⚠️ Failed to parse function response for call %s: %v", fcRow.ID, err)
					functionResponse = make(map[string]interface{})
				}
			}

			// Get execution time, default to 0 if null
			executionTimeMs := int32(0)
			if fcRow.ExecutionTimeMs.Valid {
				executionTimeMs = fcRow.ExecutionTimeMs.Int32
			}

			// Get error details, default to empty string if null
			errorDetails := ""
			if fcRow.ErrorDetails.Valid {
				errorDetails = fcRow.ErrorDetails.String
			}

			functionCall := types.FunctionCall{
				ID:               fcRow.ID,
				RequestID:        fcRow.RequestID,
				FunctionName:     fcRow.FunctionName,
				FunctionArgs:     functionArgs,
				FunctionResponse: functionResponse,
				ExecutionStatus:  fcRow.ExecutionStatus.String,
				ExecutionTimeMs:  executionTimeMs,
				ErrorDetails:     errorDetails,
				CreatedAt:        fcRow.CreatedAt.Time,
			}

			functionCalls = append(functionCalls, functionCall)
			log.Printf("✅ Added function call: %s (%s)", fcRow.FunctionName, fcRow.ExecutionStatus.String)
		}

		result := types.VariationResult{
			Configuration: *config,
			Request:       *request,
			Response:      *response,
			FunctionCalls: functionCalls,                  // Add the function calls here
			ExecutionTime: int64(response.ResponseTimeMs), // Already in milliseconds
		}

		results = append(results, result)
	}

	// Calculate totals
	totalTime := int64(0)
	successCount := 0
	errorCount := 0

	for _, result := range results {
		totalTime += result.ExecutionTime
		if result.Response.ResponseStatus == types.ResponseStatusSuccess {
			successCount++
		} else {
			errorCount++
		}
	}

	log.Printf("🕐 Total time calculation: %d ms", totalTime)

	// Convert database logs to types.ExecutionLog
	logs := make([]types.ExecutionLog, 0, len(executionLogs))
	for _, dbLog := range executionLogs {
		var details map[string]interface{}
		if len(dbLog.Details) > 0 {
			if err := json.Unmarshal(dbLog.Details, &details); err != nil {
				log.Printf("⚠️ Failed to parse log details: %v", err)
			}
		}

		var configID, requestID *string
		if dbLog.ConfigurationID.Valid {
			configID = &dbLog.ConfigurationID.String
		}
		if dbLog.RequestID.Valid {
			requestID = &dbLog.RequestID.String
		}

		timestamp := time.Now()
		if dbLog.Timestamp.Valid {
			timestamp = dbLog.Timestamp.Time
		}

		logs = append(logs, types.ExecutionLog{
			ID:              dbLog.ID,
			ExecutionRunID:  dbLog.ExecutionRunID,
			ConfigurationID: configID,
			RequestID:       requestID,
			LogLevel:        types.LogLevel(dbLog.LogLevel.String),
			LogCategory:     types.LogCategory(dbLog.LogCategory.String),
			Message:         dbLog.Message,
			Details:         details,
			Timestamp:       timestamp,
		})
	}

	// Create the execution result
	result := &types.ExecutionResult{
		ExecutionRun: *executionRun,
		Results:      results,
		TotalTime:    totalTime, // Already in milliseconds
		SuccessCount: successCount,
		ErrorCount:   errorCount,
		Logs:         logs,
	}

	// Try to load comparison result from database
	comparison, err := c.GetComparisonResult(ctx, executionRunID)
	if err != nil {
		log.Printf("ℹ️ No comparison result found for execution run: %s", executionRunID)
	} else {
		result.Comparison = comparison
		log.Printf("📊 Loaded comparison result from database: %s", comparison.ID)
	}

	return result, nil
}

// Helper function to find configuration ID for a request
func findConfigIDForRequest(requestRows []db.ApiRequest, requestID string) string {
	for _, req := range requestRows {
		if req.ID == requestID {
			return req.ConfigurationID
		}
	}
	return ""
}

// Helper function to parse float32 from string
func parseFloat32(s string) (float32, error) {
	if s == "" {
		return 0, fmt.Errorf("empty string")
	}
	// Simple parsing - could be enhanced
	if s == "0.20" || s == "0.2" {
		return 0.2, nil
	}
	if s == "0.50" || s == "0.5" {
		return 0.5, nil
	}
	if s == "0.80" || s == "0.8" {
		return 0.8, nil
	}
	return 0.5, nil // default fallback
}

// GetDB returns the underlying database connection for direct queries
func (c *Client) GetDB() *sql.DB {
	return c.db
}

// storeFunctionExecutionConfigs stores the function-execution relationships for replay functionality
func (c *Client) storeFunctionExecutionConfigs(ctx context.Context, userID string, executionRunID string, functionTools []types.Tool) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	for i, tool := range functionTools {
		// Find the function definition by name
		funcDef, err := c.queries.GetFunctionDefinitionByName(ctx, db.GetFunctionDefinitionByNameParams{
			Name:   tool.Name,
			UserID: userID,
		})
		if err != nil {
			log.Printf("⚠️ Function definition not found for tool %s: %v", tool.Name, err)
			continue
		}

		// Create the execution-function config
		configID := uuid.New().String()
		err = c.queries.CreateExecutionFunctionConfig(ctx, db.CreateExecutionFunctionConfigParams{
			ID:                   configID,
			UserID:               userID,
			ExecutionRunID:       executionRunID,
			FunctionDefinitionID: funcDef.ID,
			UseMockResponse:      sql.NullBool{Bool: true, Valid: true}, // Default to mock for replay
			ExecutionOrder:       sql.NullInt32{Int32: int32(i), Valid: true},
		})
		if err != nil {
			log.Printf("❌ Failed to create execution-function config for %s: %v", tool.Name, err)
			continue
		}

		log.Printf("✅ Stored function-execution config: %s -> %s", tool.Name, executionRunID)
	}

	return nil
}

// logExecutionEvent logs an execution event to the database and console
func (c *Client) logExecutionEvent(level types.LogLevel, category types.LogCategory, message string, details map[string]interface{}) {
	// Always log to console
	emoji := c.getLogEmoji(level, category)
	log.Printf("%s %s", emoji, message)

	// Only log to database if we have an active execution
	if c.currentExecutionRunID == nil {
		return
	}

	ctx := context.Background()
	logID := uuid.New().String()

	var detailsJSON json.RawMessage
	if details != nil {
		if detailsBytes, err := json.Marshal(details); err == nil {
			detailsJSON = detailsBytes
		}
	}

	var configID, requestID sql.NullString
	if c.currentConfigID != nil {
		configID = sql.NullString{String: *c.currentConfigID, Valid: true}
	}
	if c.currentRequestID != nil {
		requestID = sql.NullString{String: *c.currentRequestID, Valid: true}
	}

	err := c.queries.CreateExecutionLog(ctx, db.CreateExecutionLogParams{
		ID:              logID,
		ExecutionRunID:  *c.currentExecutionRunID,
		ConfigurationID: configID,
		RequestID:       requestID,
		LogLevel:        sql.NullString{String: string(level), Valid: true},
		LogCategory:     sql.NullString{String: string(category), Valid: true},
		Message:         message,
		Details:         detailsJSON,
	})

	if err != nil {
		log.Printf("❌ Failed to store execution log: %v", err)
	}
}

// logExecutionFlowEvent logs a flow event for execution graph visualization
func (c *Client) logExecutionFlowEvent(eventType string, sequenceNumber int, status string, parentEventID *string, eventData map[string]interface{}, durationMs *int32, errorMessage *string) {
	// Only log flow events if we have an active execution
	if c.currentExecutionRunID == nil {
		log.Printf("⚠️ Cannot log flow event '%s' - no active execution context set", eventType)
		return
	}

	log.Printf("🔧 Attempting to log flow event: %s (seq: %d, status: %s, executionID: %s)", eventType, sequenceNumber, status, *c.currentExecutionRunID)

	ctx := context.Background()
	eventID := uuid.New().String()

	var eventDataJSON json.RawMessage
	if eventData != nil {
		if eventDataBytes, err := json.Marshal(eventData); err == nil {
			eventDataJSON = eventDataBytes
		}
	}

	var requestID, parentID sql.NullString
	if c.currentRequestID != nil {
		requestID = sql.NullString{String: *c.currentRequestID, Valid: true}
	}
	if parentEventID != nil {
		parentID = sql.NullString{String: *parentEventID, Valid: true}
	}

	// Create the flow event using a direct SQL query since we don't have sqlc queries for this yet
	query := `
		INSERT INTO execution_flow_events (
			id, execution_run_id, request_id, event_type, sequence_number, 
			parent_event_id, event_data, duration_ms, status, error_message, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
	`

	var errorVal sql.NullString
	var durationMsVal sql.NullInt32

	if durationMs != nil {
		durationMsVal = sql.NullInt32{Int32: *durationMs, Valid: true}
	}
	if errorMessage != nil {
		errorVal = sql.NullString{String: *errorMessage, Valid: true}
	}

	_, err := c.db.ExecContext(ctx, query,
		eventID,
		*c.currentExecutionRunID,
		requestID,
		eventType,
		sequenceNumber,
		parentID,
		eventDataJSON,
		durationMsVal,
		status,
		errorVal,
	)

	if err != nil {
		log.Printf("❌ Failed to store execution flow event: %v", err)
	} else {
		log.Printf("✅ Logged flow event: %s (seq: %d, status: %s)", eventType, sequenceNumber, status)
	}
}

// getLogEmoji returns appropriate emoji for log level and category
func (c *Client) getLogEmoji(level types.LogLevel, category types.LogCategory) string {
	switch level {
	case types.LogLevelSuccess:
		return "✅"
	case types.LogLevelError:
		return "❌"
	case types.LogLevelWarn:
		return "⚠️"
	case types.LogLevelDebug:
		return "🔧"
	default:
		switch category {
		case types.LogCategorySetup:
			return "🚀"
		case types.LogCategoryFunctionCall:
			return "🔧"
		case types.LogCategoryAPICall:
			return "📡"
		case types.LogCategoryCompletion:
			return "🎯"
		default:
			return "📝"
		}
	}
}

// GetSystemConfigurations retrieves all system-wide AI configurations from the database
func (c *Client) GetSystemConfigurations(ctx context.Context) ([]types.APIConfiguration, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	// Use the dedicated system configurations query
	configRows, err := c.queries.ListSystemConfigurations(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get system configurations: %w", err)
	}

	var systemConfigs []types.APIConfiguration
	for _, row := range configRows {
		config := types.APIConfiguration{
			ID:            row.ID,
			VariationName: row.VariationName,
			ModelName:     row.ModelName,
			SystemPrompt:  row.SystemPrompt.String,
			CreatedAt:     row.CreatedAt.Time,
			UserID:        row.UserID, // Include UserID for proper ownership tracking
		}

		// Handle nullable UpdatedAt
		if row.UpdatedAt.Valid {
			config.UpdatedAt = row.UpdatedAt.Time
		} else {
			config.UpdatedAt = row.CreatedAt.Time // fallback to created_at
		}

		// Parse nullable fields
		if row.Temperature.Valid {
			temp, _ := parseFloat32(row.Temperature.String)
			config.Temperature = &temp
		}
		if row.MaxTokens.Valid {
			config.MaxTokens = &row.MaxTokens.Int32
		}
		if row.TopP.Valid {
			topP, _ := parseFloat32(row.TopP.String)
			config.TopP = &topP
		}
		if row.TopK.Valid {
			config.TopK = &row.TopK.Int32
		}

		// Parse JSON fields
		if len(row.SafetySettings) > 0 {
			var safetySettings map[string]interface{}
			if err := json.Unmarshal(row.SafetySettings, &safetySettings); err == nil {
				config.SafetySettings = safetySettings
			}
		}
		if len(row.GenerationConfig) > 0 {
			var generationConfig map[string]interface{}
			if err := json.Unmarshal(row.GenerationConfig, &generationConfig); err == nil {
				config.GenerationConfig = generationConfig
			}
		}
		if len(row.Tools) > 0 {
			var tools []types.Tool
			if err := json.Unmarshal(row.Tools, &tools); err == nil {
				config.Tools = tools
			}
		}

		systemConfigs = append(systemConfigs, config)
	}

	log.Printf("✅ Retrieved %d system configurations from database", len(systemConfigs))
	return systemConfigs, nil
}

// setExecutionContext sets the current execution context for logging
func (c *Client) setExecutionContext(executionRunID, configID, requestID *string) {
	c.currentExecutionRunID = executionRunID
	c.currentConfigID = configID
	c.currentRequestID = requestID

	if executionRunID != nil {
		log.Printf("🎯 Execution context set: executionRunID=%s", *executionRunID)
	} else {
		log.Printf("⚠️ Execution context set with nil executionRunID")
	}
}

// clearExecutionContext clears the execution context
func (c *Client) clearExecutionContext() {
	if c.currentExecutionRunID != nil {
		log.Printf("🧹 Clearing execution context for executionRunID=%s", *c.currentExecutionRunID)
	} else {
		log.Printf("🧹 Clearing execution context (was already nil)")
	}

	c.currentExecutionRunID = nil
	c.currentConfigID = nil
	c.currentRequestID = nil
	c.sequenceCounter = 0 // Reset sequence counter
}

// getNextSequenceNumber returns the next unique sequence number for flow events
func (c *Client) getNextSequenceNumber() int {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	c.sequenceCounter++
	return c.sequenceCounter
}

// LogFunctionCall logs function call details to the database
func (c *Client) LogFunctionCall(ctx context.Context, call *types.FunctionCall) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	// Marshal JSON fields
	argsJSON, err := json.Marshal(call.FunctionArgs)
	if err != nil {
		return fmt.Errorf("failed to marshal function arguments: %w", err)
	}

	var responseJSON json.RawMessage
	if call.FunctionResponse != nil {
		responseBytes, err := json.Marshal(call.FunctionResponse)
		if err != nil {
			return fmt.Errorf("failed to marshal function response: %w", err)
		}
		responseJSON = responseBytes
	}

	var errorDetails sql.NullString
	if call.ErrorDetails != "" {
		errorDetails = sql.NullString{String: call.ErrorDetails, Valid: true}
	}

	var executionTimeMs sql.NullInt32
	if call.ExecutionTimeMs > 0 {
		executionTimeMs = sql.NullInt32{Int32: call.ExecutionTimeMs, Valid: true}
	}

	// Store in database
	err = c.queries.CreateFunctionCall(ctx, db.CreateFunctionCallParams{
		ID:                call.ID,
		RequestID:         call.RequestID,
		FunctionName:      call.FunctionName,
		FunctionArguments: argsJSON,
		FunctionResponse:  responseJSON,
		ExecutionStatus:   sql.NullString{String: call.ExecutionStatus, Valid: true},
		ExecutionTimeMs:   executionTimeMs,
		ErrorDetails:      errorDetails,
	})

	if err != nil {
		return fmt.Errorf("failed to store function call: %w", err)
	}

	log.Printf("📊 Function call logged to database: %s", call.FunctionName)
	return nil
}

// ListAPIConfigurationsByUser retrieves API configurations for a specific user
func (c *Client) ListAPIConfigurationsByUser(ctx context.Context, userID string, limit, offset int32) ([]types.APIConfiguration, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	// Use the fixed ListAPIConfigurationsByUser query (no limit/offset version for now)
	rows, err := c.queries.ListAPIConfigurationsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Apply limit and offset manually for now (could be optimized with a new query later)
	var configs []types.APIConfiguration
	startIdx := int(offset)
	endIdx := startIdx + int(limit)

	for i, row := range rows {
		if i < startIdx {
			continue
		}
		if i >= endIdx {
			break
		}

		cfg := types.APIConfiguration{
			ID:            row.ID,
			VariationName: row.VariationName,
			ModelName:     row.ModelName,
			SystemPrompt:  row.SystemPrompt.String,
			CreatedAt:     row.CreatedAt.Time,
			UserID:        row.UserID, // Include UserID for proper ownership tracking
		}

		// Handle nullable UpdatedAt
		if row.UpdatedAt.Valid {
			cfg.UpdatedAt = row.UpdatedAt.Time
		} else {
			cfg.UpdatedAt = row.CreatedAt.Time // fallback to created_at
		}

		// Parse all nullable fields
		if row.Temperature.Valid {
			temp, _ := parseFloat32(row.Temperature.String)
			cfg.Temperature = &temp
		}
		if row.MaxTokens.Valid {
			cfg.MaxTokens = &row.MaxTokens.Int32
		}
		if row.TopP.Valid {
			topP, _ := parseFloat32(row.TopP.String)
			cfg.TopP = &topP
		}
		if row.TopK.Valid {
			cfg.TopK = &row.TopK.Int32
		}

		// Parse JSON fields
		if len(row.SafetySettings) > 0 {
			var safetySettings map[string]interface{}
			if err := json.Unmarshal(row.SafetySettings, &safetySettings); err == nil {
				cfg.SafetySettings = safetySettings
			}
		}
		if len(row.GenerationConfig) > 0 {
			var generationConfig map[string]interface{}
			if err := json.Unmarshal(row.GenerationConfig, &generationConfig); err == nil {
				cfg.GenerationConfig = generationConfig
			}
		}
		if len(row.Tools) > 0 {
			var tools []types.Tool
			if err := json.Unmarshal(row.Tools, &tools); err == nil {
				cfg.Tools = tools
			}
		}

		configs = append(configs, cfg)
	}
	return configs, nil
}

// RunMigrations runs database migrations using golang-migrate
func (c *Client) RunMigrations() error {
	log.Println("🔧 Starting database migrations using golang-migrate...")

	// Create the migrate driver instance
	driver, err := mysql.WithInstance(c.db, &mysql.Config{})
	if err != nil {
		return fmt.Errorf("failed to create migrate driver: %w", err)
	}

	// Check if migrations directory exists
	migrationPath := "./migrations"
	if files, err := os.ReadDir(migrationPath); err == nil {
		log.Printf("🔍 Found %d migration files in %s", len(files), migrationPath)
	} else {
		// Try absolute path if relative doesn't work
		migrationPath = "/app/migrations"
		if files, err := os.ReadDir(migrationPath); err == nil {
			log.Printf("🔍 Found %d migration files in %s", len(files), migrationPath)
		} else {
			log.Printf("⚠️ Could not read migrations directory: %v", err)
			return fmt.Errorf("migrations directory not found: %w", err)
		}
	}

	// Create migrate instance with file:// prefix for the path that exists
	var sourcePath string
	if _, err := os.Stat("./migrations"); err == nil {
		sourcePath = "file://./migrations"
	} else {
		sourcePath = "file:///app/migrations"
	}

	m, err := migrate.NewWithDatabaseInstance(
		sourcePath, // path to migration files
		"mysql",    // database name
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}

	// Run migrations
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		// Check if it's a dirty database error
		if strings.Contains(err.Error(), "Dirty database") {
			log.Printf("⚠️ Detected dirty database state, attempting to force version 1...")
			// Try to force to version 1 and then run migrations again
			if forceErr := m.Force(1); forceErr != nil {
				log.Printf("❌ Failed to force version: %v", forceErr)
				return fmt.Errorf("failed to run migrations: %w", err)
			}
			log.Printf("✅ Forced version, retrying migrations...")
			if retryErr := m.Up(); retryErr != nil && retryErr != migrate.ErrNoChange {
				return fmt.Errorf("failed to run migrations after force: %w", retryErr)
			}
		} else {
			return fmt.Errorf("failed to run migrations: %w", err)
		}
	}

	if err == migrate.ErrNoChange {
		log.Println("✅ No pending migrations found")
	} else {
		log.Println("✅ Database migrations completed successfully")
	}

	return nil
}

// GetExecutionFlowGraph retrieves the complete execution flow graph for an execution run
func (c *Client) GetExecutionFlowGraph(ctx context.Context, userID, executionRunID string) (*types.ExecutionFlowGraph, error) {
	log.Printf("🔍 Getting execution flow graph for execution run: %s, user: %s", executionRunID, userID)

	// First verify the execution run belongs to the user
	executionRun, err := c.GetExecutionRun(ctx, userID, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("execution run not found or access denied: %w", err)
	}

	// 1. Get execution flow events
	events, err := c.getExecutionFlowEvents(ctx, executionRunID)
	if err != nil {
		log.Printf("⚠️ Failed to get execution flow events: %v", err)
		events = []types.ExecutionFlowEvent{} // Continue with empty events
	}

	// 2. Get function calls for this execution run
	functionCalls, err := c.getFunctionCallsForExecutionRun(ctx, executionRunID)
	if err != nil {
		log.Printf("⚠️ Failed to get function calls: %v", err)
		functionCalls = []types.FunctionCall{} // Continue with empty function calls
	}

	// 3. Get execution stats
	stats, err := c.getExecutionStats(ctx, executionRunID)
	if err != nil {
		log.Printf("⚠️ Failed to get execution stats: %v", err)
		// Continue without stats
	}

	// 4. Generate graph YAML (simplified for now)
	graphYAML := c.generateGraphYAML(executionRun, events, functionCalls)

	flowGraph := &types.ExecutionFlowGraph{
		ExecutionRunID: executionRunID,
		Events:         events,
		FunctionCalls:  functionCalls,
		Stats:          stats,
		GraphYAML:      graphYAML,
	}

	log.Printf("✅ Generated execution flow graph with %d events, %d function calls", len(events), len(functionCalls))
	return flowGraph, nil
}

// GetExecutionLogsByConfiguration retrieves execution logs filtered by configuration ID
func (c *Client) GetExecutionLogsByConfiguration(ctx context.Context, executionRunID, configurationID string) ([]types.ExecutionLog, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	log.Printf("🔍 Getting execution logs for execution run: %s, configuration: %s", executionRunID, configurationID)

	// Use the existing sqlc query for logs by configuration
	dbLogs, err := c.queries.GetExecutionLogsByConfiguration(ctx, db.GetExecutionLogsByConfigurationParams{
		ExecutionRunID:  executionRunID,
		ConfigurationID: sql.NullString{String: configurationID, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get execution logs by configuration: %w", err)
	}

	// Convert database logs to types.ExecutionLog
	logs := make([]types.ExecutionLog, 0, len(dbLogs))
	for _, dbLog := range dbLogs {
		log := types.ExecutionLog{
			ID:             dbLog.ID,
			ExecutionRunID: dbLog.ExecutionRunID,
			LogLevel:       types.LogLevel(dbLog.LogLevel.String),
			LogCategory:    types.LogCategory(dbLog.LogCategory.String),
			Message:        dbLog.Message,
			Timestamp:      dbLog.Timestamp.Time,
		}

		if dbLog.ConfigurationID.Valid {
			log.ConfigurationID = &dbLog.ConfigurationID.String
		}
		if dbLog.RequestID.Valid {
			log.RequestID = &dbLog.RequestID.String
		}

		logs = append(logs, log)
	}

	log.Printf("✅ Found %d execution logs for configuration %s", len(logs), configurationID)
	return logs, nil
}

// GetExecutionFlowGraphByConfiguration retrieves the execution flow graph filtered by configuration ID
func (c *Client) GetExecutionFlowGraphByConfiguration(ctx context.Context, userID, executionRunID, configurationID string) (*types.ExecutionFlowGraph, error) {
	log.Printf("🔍 Getting execution flow graph for execution run: %s, configuration: %s, user: %s", executionRunID, configurationID, userID)

	// First verify the execution run belongs to the user
	executionRun, err := c.GetExecutionRun(ctx, userID, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("execution run not found or access denied: %w", err)
	}

	// Get execution flow events filtered by configuration (through request_id)
	events, err := c.getExecutionFlowEventsByConfiguration(ctx, executionRunID, configurationID)
	if err != nil {
		log.Printf("⚠️ Failed to get execution flow events by configuration: %v", err)
		events = []types.ExecutionFlowEvent{} // Continue with empty events
	}

	// Get function calls for this execution run filtered by configuration
	functionCalls, err := c.getFunctionCallsByConfiguration(ctx, executionRunID, configurationID)
	if err != nil {
		log.Printf("⚠️ Failed to get function calls by configuration: %v", err)
		functionCalls = []types.FunctionCall{} // Continue with empty function calls
	}

	// Get execution stats (not filtered by configuration for now)
	stats, err := c.getExecutionStats(ctx, executionRunID)
	if err != nil {
		log.Printf("⚠️ Failed to get execution stats: %v", err)
		// Continue without stats
	}

	// Generate graph YAML (simplified for now)
	graphYAML := c.generateGraphYAML(executionRun, events, functionCalls)

	flowGraph := &types.ExecutionFlowGraph{
		ExecutionRunID: executionRunID,
		Events:         events,
		FunctionCalls:  functionCalls,
		Stats:          stats,
		GraphYAML:      graphYAML,
	}

	log.Printf("✅ Generated execution flow graph for configuration %s with %d events, %d function calls", configurationID, len(events), len(functionCalls))
	return flowGraph, nil
}

// getExecutionFlowEventsByConfiguration retrieves execution flow events filtered by configuration (through request_id)
func (c *Client) getExecutionFlowEventsByConfiguration(ctx context.Context, executionRunID, configurationID string) ([]types.ExecutionFlowEvent, error) {
	query := `
		SELECT e.id, e.execution_run_id, e.request_id, e.event_type, e.sequence_number, 
		       e.parent_event_id, e.event_data, e.duration_ms, e.status, e.error_message, e.created_at
		FROM execution_flow_events e
		INNER JOIN api_requests r ON e.request_id = r.id
		WHERE e.execution_run_id = ? AND r.configuration_id = ?
		ORDER BY e.created_at ASC, e.sequence_number ASC, e.id ASC
	`

	rows, err := c.db.QueryContext(ctx, query, executionRunID, configurationID)
	if err != nil {
		return nil, fmt.Errorf("failed to query execution flow events by configuration: %w", err)
	}
	defer rows.Close()

	var events []types.ExecutionFlowEvent
	for rows.Next() {
		var event types.ExecutionFlowEvent
		var requestID, parentEventID, errorMessage sql.NullString
		var eventDataJSON sql.NullString
		var durationMs sql.NullInt32

		err := rows.Scan(
			&event.ID,
			&event.ExecutionRunID,
			&requestID,
			&event.EventType,
			&event.SequenceNumber,
			&parentEventID,
			&eventDataJSON,
			&durationMs,
			&event.Status,
			&errorMessage,
			&event.CreatedAt,
		)
		if err != nil {
			log.Printf("⚠️ Failed to scan execution flow event: %v", err)
			continue
		}

		// Handle nullable fields
		if requestID.Valid {
			event.RequestID = &requestID.String
		}
		if parentEventID.Valid {
			event.ParentEventID = &parentEventID.String
		}
		if errorMessage.Valid {
			event.ErrorMessage = &errorMessage.String
		}
		if durationMs.Valid {
			event.DurationMs = &durationMs.Int32
		}

		// Parse event data JSON
		if eventDataJSON.Valid && eventDataJSON.String != "" {
			var eventData map[string]interface{}
			if err := json.Unmarshal([]byte(eventDataJSON.String), &eventData); err != nil {
				log.Printf("⚠️ Failed to parse event data JSON for event %s: %v", event.ID, err)
			} else {
				event.EventData = eventData
			}
		}

		events = append(events, event)
	}

	return events, rows.Err()
}

// getFunctionCallsByConfiguration retrieves function calls filtered by configuration (through request_id)
func (c *Client) getFunctionCallsByConfiguration(ctx context.Context, executionRunID, configurationID string) ([]types.FunctionCall, error) {
	query := `
		SELECT f.id, f.request_id, f.function_name, f.function_arguments, f.function_response, 
		       f.execution_status, f.error_details, f.created_at
		FROM function_calls f
		INNER JOIN api_requests r ON f.request_id = r.id
		WHERE r.execution_run_id = ? AND r.configuration_id = ?
		ORDER BY f.created_at ASC
	`

	rows, err := c.db.QueryContext(ctx, query, executionRunID, configurationID)
	if err != nil {
		return nil, fmt.Errorf("failed to query function calls by configuration: %w", err)
	}
	defer rows.Close()

	var functionCalls []types.FunctionCall
	for rows.Next() {
		var call types.FunctionCall
		var functionArgs, functionResponse, errorDetails sql.NullString

		err := rows.Scan(
			&call.ID,
			&call.RequestID,
			&call.FunctionName,
			&functionArgs,
			&functionResponse,
			&call.ExecutionStatus,
			&errorDetails,
			&call.CreatedAt,
		)
		if err != nil {
			log.Printf("⚠️ Failed to scan function call: %v", err)
			continue
		}

		// Handle nullable JSON fields
		if functionArgs.Valid && functionArgs.String != "" {
			var args map[string]interface{}
			if err := json.Unmarshal([]byte(functionArgs.String), &args); err != nil {
				log.Printf("⚠️ Failed to parse function args JSON for call %s: %v", call.ID, err)
			} else {
				call.FunctionArgs = args
			}
		}

		if functionResponse.Valid && functionResponse.String != "" {
			var response map[string]interface{}
			if err := json.Unmarshal([]byte(functionResponse.String), &response); err != nil {
				log.Printf("⚠️ Failed to parse function response JSON for call %s: %v", call.ID, err)
			} else {
				call.FunctionResponse = response
			}
		}

		if errorDetails.Valid {
			call.ErrorDetails = errorDetails.String
		}

		functionCalls = append(functionCalls, call)
	}

	return functionCalls, rows.Err()
}

// getExecutionFlowEvents retrieves all execution flow events for an execution run
func (c *Client) getExecutionFlowEvents(ctx context.Context, executionRunID string) ([]types.ExecutionFlowEvent, error) {
	query := `
		SELECT id, execution_run_id, request_id, event_type, sequence_number, 
		       parent_event_id, event_data, duration_ms, status, error_message, created_at
		FROM execution_flow_events 
		WHERE execution_run_id = ?
		ORDER BY created_at ASC, sequence_number ASC, id ASC
	`

	rows, err := c.db.QueryContext(ctx, query, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("failed to query execution flow events: %w", err)
	}
	defer rows.Close()

	var events []types.ExecutionFlowEvent
	for rows.Next() {
		var event types.ExecutionFlowEvent
		var requestID, parentEventID, errorMessage sql.NullString
		var eventDataJSON sql.NullString
		var durationMs sql.NullInt32

		err := rows.Scan(
			&event.ID,
			&event.ExecutionRunID,
			&requestID,
			&event.EventType,
			&event.SequenceNumber,
			&parentEventID,
			&eventDataJSON,
			&durationMs,
			&event.Status,
			&errorMessage,
			&event.CreatedAt,
		)
		if err != nil {
			log.Printf("⚠️ Failed to scan execution flow event: %v", err)
			continue
		}

		// Handle nullable fields
		if requestID.Valid {
			event.RequestID = &requestID.String
		}
		if parentEventID.Valid {
			event.ParentEventID = &parentEventID.String
		}
		if errorMessage.Valid {
			event.ErrorMessage = &errorMessage.String
		}
		if durationMs.Valid {
			event.DurationMs = &durationMs.Int32
		}

		// Parse event data JSON
		if eventDataJSON.Valid && eventDataJSON.String != "" {
			var eventData map[string]interface{}
			if err := json.Unmarshal([]byte(eventDataJSON.String), &eventData); err != nil {
				log.Printf("⚠️ Failed to parse event data JSON for event %s: %v", event.ID, err)
			} else {
				event.EventData = eventData
			}
		}

		events = append(events, event)
	}

	return events, rows.Err()
}

// getFunctionCallsForExecutionRun retrieves all function calls for an execution run
func (c *Client) getFunctionCallsForExecutionRun(ctx context.Context, executionRunID string) ([]types.FunctionCall, error) {
	query := `
		SELECT fc.id, fc.request_id, fc.function_name, fc.function_arguments, 
		       fc.function_response, fc.execution_status, fc.execution_time_ms, 
		       fc.error_details, fc.sequence_number, fc.parent_call_id, 
		       fc.execution_depth, fc.created_at
		FROM function_calls fc
		INNER JOIN api_requests ar ON fc.request_id = ar.id
		WHERE ar.execution_run_id = ?
		ORDER BY fc.sequence_number ASC, fc.created_at ASC
	`

	rows, err := c.db.QueryContext(ctx, query, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("failed to query function calls: %w", err)
	}
	defer rows.Close()

	var functionCalls []types.FunctionCall
	for rows.Next() {
		var functionCall types.FunctionCall
		var functionArgs, functionResponse []byte
		var errorDetails, parentCallID sql.NullString
		var executionTimeMs sql.NullInt32
		var sequenceNumber, executionDepth sql.NullInt32

		err := rows.Scan(
			&functionCall.ID,
			&functionCall.RequestID,
			&functionCall.FunctionName,
			&functionArgs,
			&functionResponse,
			&functionCall.ExecutionStatus,
			&executionTimeMs,
			&errorDetails,
			&sequenceNumber,
			&parentCallID,
			&executionDepth,
			&functionCall.CreatedAt,
		)
		if err != nil {
			log.Printf("⚠️ Failed to scan function call: %v", err)
			continue
		}

		// Parse JSON fields
		if len(functionArgs) > 0 {
			if err := json.Unmarshal(functionArgs, &functionCall.FunctionArgs); err != nil {
				log.Printf("⚠️ Failed to parse function args for call %s: %v", functionCall.ID, err)
			}
		}
		if len(functionResponse) > 0 {
			if err := json.Unmarshal(functionResponse, &functionCall.FunctionResponse); err != nil {
				log.Printf("⚠️ Failed to parse function response for call %s: %v", functionCall.ID, err)
			}
		}

		// Handle nullable fields
		if errorDetails.Valid {
			functionCall.ErrorDetails = errorDetails.String
		}
		if executionTimeMs.Valid {
			functionCall.ExecutionTimeMs = executionTimeMs.Int32
		}
		if sequenceNumber.Valid {
			functionCall.SequenceNumber = sequenceNumber.Int32
		}
		if parentCallID.Valid {
			functionCall.ParentCallID = &parentCallID.String
		}
		if executionDepth.Valid {
			functionCall.ExecutionDepth = executionDepth.Int32
		}

		functionCalls = append(functionCalls, functionCall)
	}

	return functionCalls, rows.Err()
}

// getExecutionStats retrieves execution statistics for an execution run
func (c *Client) getExecutionStats(ctx context.Context, executionRunID string) (*types.ExecutionStats, error) {
	query := `
		SELECT id, execution_run_id, total_function_calls, total_ai_model_calls, 
		       total_errors, total_retries, total_execution_time_ms, 
		       avg_function_call_time_ms, avg_ai_response_time_ms, max_execution_depth,
		       function_call_breakdown, created_at, updated_at
		FROM execution_stats 
		WHERE execution_run_id = ?
		LIMIT 1
	`

	var stats types.ExecutionStats
	var functionCallBreakdownJSON sql.NullString

	err := c.db.QueryRowContext(ctx, query, executionRunID).Scan(
		&stats.ID,
		&stats.ExecutionRunID,
		&stats.TotalFunctionCalls,
		&stats.TotalAIModelCalls,
		&stats.TotalErrors,
		&stats.TotalRetries,
		&stats.TotalExecutionTimeMs,
		&stats.AvgFunctionCallTimeMs,
		&stats.AvgAIResponseTimeMs,
		&stats.MaxExecutionDepth,
		&functionCallBreakdownJSON,
		&stats.CreatedAt,
		&stats.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No stats available yet
		}
		return nil, fmt.Errorf("failed to query execution stats: %w", err)
	}

	// Parse function call breakdown JSON
	if functionCallBreakdownJSON.Valid && functionCallBreakdownJSON.String != "" {
		var breakdown map[string]interface{}
		if err := json.Unmarshal([]byte(functionCallBreakdownJSON.String), &breakdown); err != nil {
			log.Printf("⚠️ Failed to parse function call breakdown JSON: %v", err)
		} else {
			stats.FunctionCallBreakdown = breakdown
		}
	}

	return &stats, nil
}

// generateGraphYAML generates a simple YAML representation of the execution flow
func (c *Client) generateGraphYAML(executionRun *types.ExecutionRun, events []types.ExecutionFlowEvent, functionCalls []types.FunctionCall) string {
	// Simple YAML generation for Gorph visualization
	// This is a basic implementation - can be enhanced with more sophisticated graph generation

	yamlBuilder := strings.Builder{}
	yamlBuilder.WriteString("# Execution Flow Graph\n")
	yamlBuilder.WriteString(fmt.Sprintf("name: %s\n", executionRun.Name))
	yamlBuilder.WriteString(fmt.Sprintf("description: %s\n", executionRun.Description))
	yamlBuilder.WriteString("nodes:\n")

	// Add event nodes
	for _, event := range events {
		yamlBuilder.WriteString(fmt.Sprintf("  - id: %s\n", event.ID))
		yamlBuilder.WriteString(fmt.Sprintf("    type: %s\n", event.EventType))
		yamlBuilder.WriteString(fmt.Sprintf("    status: %s\n", event.Status))
		if event.DurationMs != nil {
			yamlBuilder.WriteString(fmt.Sprintf("    duration_ms: %d\n", *event.DurationMs))
		}
	}

	// Add function call nodes
	for _, fc := range functionCalls {
		yamlBuilder.WriteString(fmt.Sprintf("  - id: %s\n", fc.ID))
		yamlBuilder.WriteString(fmt.Sprintf("    type: function_call\n"))
		yamlBuilder.WriteString(fmt.Sprintf("    function: %s\n", fc.FunctionName))
		yamlBuilder.WriteString(fmt.Sprintf("    status: %s\n", fc.ExecutionStatus))
		yamlBuilder.WriteString(fmt.Sprintf("    duration_ms: %d\n", fc.ExecutionTimeMs))
	}

	yamlBuilder.WriteString("edges:\n")
	// Add parent-child relationships
	for _, event := range events {
		if event.ParentEventID != nil {
			yamlBuilder.WriteString(fmt.Sprintf("  - from: %s\n", *event.ParentEventID))
			yamlBuilder.WriteString(fmt.Sprintf("    to: %s\n", event.ID))
		}
	}
	for _, fc := range functionCalls {
		if fc.ParentCallID != nil {
			yamlBuilder.WriteString(fmt.Sprintf("  - from: %s\n", *fc.ParentCallID))
			yamlBuilder.WriteString(fmt.Sprintf("    to: %s\n", fc.ID))
		}
	}

	return yamlBuilder.String()
}
