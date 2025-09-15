package gogent

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"gogent/internal/db"
	"gogent/internal/types"

	"github.com/google/uuid"
)

const (
	DefaultTimeoutSeconds = 30
	DefaultMaxRetries     = 3

	// Status constants
	StatusPending = "pending"
)

// CreateExecutionRun creates a new execution run for grouping related API calls
func (c *Client) CreateExecutionRun(ctx context.Context, userID, name, description string,
	enableFunctionCalling bool, agentID *string) (*types.ExecutionRun, error) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	id := uuid.New().String()
	if agentID != nil {
		log.Printf("🔧 Creating execution run with enableFunctionCalling: %v, agentID: %s", enableFunctionCalling, *agentID)
	} else {
		log.Printf("🔧 Creating execution run with enableFunctionCalling: %v, agentID: <nil>", enableFunctionCalling)
	}

	// Truncate name to fit database column limit (255 characters)
	truncatedName := name
	if len(name) > 255 {
		truncatedName = name[:252] + "..."
		log.Printf("⚠️ Execution run name truncated from %d to %d characters", len(name), len(truncatedName))
	}

	// Convert agentID pointer to sql.NullString
	var agentIDNull sql.NullString
	if agentID != nil && *agentID != "" {
		agentIDNull = sql.NullString{String: *agentID, Valid: true}
	}

	err := c.queries.CreateExecutionRun(ctx, db.CreateExecutionRunParams{
		ID:                    id,
		UserID:                userID,
		Name:                  truncatedName,
		Description:           sql.NullString{String: description, Valid: description != ""},
		EnableFunctionCalling: enableFunctionCalling,
		AgentID:               agentIDNull,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create execution run: %w", err)
	}

	return &types.ExecutionRun{
		ID:                    id,
		Name:                  truncatedName,
		Description:           description,
		EnableFunctionCalling: enableFunctionCalling,
		Status:                "pending", // Start with pending status
		ErrorMessage:          "",
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
	}, nil
}

// UpdateExecutionRunStatus updates the status of an execution run
func (c *Client) UpdateExecutionRunStatus(ctx context.Context, userID, executionID, status, errorMessage string) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	var errorMsg sql.NullString
	if errorMessage != "" {
		errorMsg = sql.NullString{String: errorMessage, Valid: true}
	}

	var statusEnum db.ExecutionRunsStatus
	switch status {
	case StatusPending:
		statusEnum = db.ExecutionRunsStatusPending
	case "running":
		statusEnum = db.ExecutionRunsStatusRunning
	case "completed":
		statusEnum = db.ExecutionRunsStatusCompleted
	case "failed":
		statusEnum = db.ExecutionRunsStatusFailed
	default:
		return fmt.Errorf("invalid status: %s", status)
	}

	err := c.queries.UpdateExecutionRunStatus(ctx, db.UpdateExecutionRunStatusParams{
		ID:           executionID,
		UserID:       userID,
		Status:       db.NullExecutionRunsStatus{ExecutionRunsStatus: statusEnum, Valid: true},
		ErrorMessage: errorMsg,
	})
	if err != nil {
		return fmt.Errorf("failed to update execution run status: %w", err)
	}

	return nil
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

// UpdateAPIConfiguration updates an existing API configuration
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

// DeleteAPIConfiguration deletes an API configuration
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
		ResponseTimeMs:       sql.NullInt64{Int64: response.ResponseTimeMs, Valid: true},
		ResponseHeaders:      convertStringToRawMessage(responseHeadersJSON),
		ResponseBody:         convertStringToRawMessage(responseBodyJSON),
	})
}

// LogFunctionCall logs a function call to the database
func (c *Client) LogFunctionCall(ctx context.Context, call *types.FunctionCall) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	argsJSON, _ := types.ToJSON(call.FunctionArgs)
	resultJSON, _ := types.ToJSON(call.FunctionResponse)

	return c.queries.CreateFunctionCall(ctx, db.CreateFunctionCallParams{
		ID:                call.ID,
		RequestID:         call.RequestID,
		FunctionName:      call.FunctionName,
		FunctionArguments: convertStringToRawMessage(argsJSON),
		FunctionResponse:  convertStringToRawMessage(resultJSON),
		ExecutionStatus:   sql.NullString{String: call.ExecutionStatus, Valid: true},
		ExecutionTimeMs:   sql.NullInt32{Int32: call.ExecutionTimeMs, Valid: true},
		ErrorDetails:      sql.NullString{String: call.ErrorDetails, Valid: call.ErrorDetails != ""},
	})
}

// ListAPIConfigurationsByUser lists API configurations for a user
func (c *Client) ListAPIConfigurationsByUser(ctx context.Context, userID string, _ int32, _ int32) ([]types.APIConfiguration, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	configs, err := c.queries.ListAPIConfigurationsByUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list API configurations: %w", err)
	}

	// Convert database configs to types
	var result []types.APIConfiguration
	for _, config := range configs {
		apiConfig := types.APIConfiguration{
			ID:            config.ID,
			UserID:        config.UserID,
			VariationName: config.VariationName,
			ModelName:     config.ModelName,
			SystemPrompt:  config.SystemPrompt.String,
		}

		// Parse optional fields
		if config.Temperature.Valid {
			if temp, err := parseFloat32(config.Temperature.String); err == nil {
				apiConfig.Temperature = &temp
			}
		}
		if config.MaxTokens.Valid {
			maxTokens := config.MaxTokens.Int32
			apiConfig.MaxTokens = &maxTokens
		}
		if config.TopP.Valid {
			if topP, err := parseFloat32(config.TopP.String); err == nil {
				apiConfig.TopP = &topP
			}
		}
		if config.TopK.Valid {
			topK := config.TopK.Int32
			apiConfig.TopK = &topK
		}

		// Parse JSON fields
		if config.SafetySettings != nil {
			apiConfig.SafetySettings = parseJSONToMap(config.SafetySettings)
		}
		if config.GenerationConfig != nil {
			apiConfig.GenerationConfig = parseJSONToMap(config.GenerationConfig)
		}
		if config.Tools != nil {
			apiConfig.Tools = parseJSONToTools(config.Tools)
		}
		if config.ToolConfig != nil {
			apiConfig.ToolConfig = parseJSONToMap(config.ToolConfig)
		}

		result = append(result, apiConfig)
	}

	return result, nil
}

// GetSystemConfigurations gets system-level API configurations
func (c *Client) GetSystemConfigurations(ctx context.Context) ([]types.APIConfiguration, error) {
	return c.ListAPIConfigurationsByUser(ctx, SystemUserID, DefaultLimit, DefaultOffset)
}

// storeFunctionExecutionConfigs stores function tools for replay functionality
func (c *Client) storeFunctionExecutionConfigs(_ context.Context, userID string, executionRunID string, functionTools []types.Tool) error {
	// TODO: Implement function execution config storage
	// This would require a new database table and corresponding queries
	log.Printf("🔧 Storing %d function tools for execution run %s", len(functionTools), executionRunID)
	return nil
}

// Helper functions for data conversion
func convertFloat32ToNullString(f *float32) sql.NullString {
	if f == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: fmt.Sprintf("%f", *f), Valid: true}
}

func convertInt32ToNullInt32(i *int32) sql.NullInt32 {
	if i == nil {
		return sql.NullInt32{Valid: false}
	}
	return sql.NullInt32{Int32: *i, Valid: true}
}

func convertStringToRawMessage(jsonStr string) json.RawMessage {
	if jsonStr == "" {
		return nil
	}
	return json.RawMessage(jsonStr)
}

func parseFloat32(s string) (float32, error) {
	var f float32
	_, err := fmt.Sscanf(s, "%f", &f)
	return f, err
}

func parseJSONToMap(data json.RawMessage) map[string]interface{} {
	if data == nil {
		return nil
	}
	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil
	}
	return result
}

func parseJSONToTools(data json.RawMessage) []types.Tool {
	if data == nil {
		return nil
	}
	var result []types.Tool
	if err := json.Unmarshal(data, &result); err != nil {
		return nil
	}
	return result
}
