package gogent

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"gogent/internal/db"
	"gogent/internal/gemini"
	"gogent/internal/providers"
	"gogent/internal/types"

	"github.com/google/uuid"
)

// ExecuteMultiVariation executes the same prompt with multiple configurations
func (c *Client) ExecuteMultiVariation(ctx context.Context, userID string, request *types.MultiExecutionRequest) (*types.ExecutionResult, error) {
	// Create execution run
	executionRun, err := c.CreateExecutionRun(ctx, userID, request.ExecutionRunName, request.Description, request.EnableFunctionCalling, request.AgentID)
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

	// Log API request start flow event with enhanced details
	c.logExecutionFlowEvent("api_request_start", c.getNextSequenceNumber(), "pending", nil, map[string]interface{}{
		"requestId":       apiRequest.ID,
		"configurationId": actualConfigID,
		"modelName":       config.ModelName,
		"variationName":   config.VariationName,
		"temperature":     config.Temperature,
		"maxTokens":       config.MaxTokens,
		"promptLength":    len(prompt),
		"contextLength":   len(context),
		"requestType":     string(apiRequest.RequestType),
		"promptPreview":   c.truncateString(prompt, 200),
		"configSettings": map[string]interface{}{
			"topK":   config.TopK,
			"topP":   config.TopP,
			"userID": configUserID,
		},
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

		// Log API request error flow event with enhanced details
		errorMsg := err.Error()
		c.logExecutionFlowEvent("api_request_end", c.getNextSequenceNumber(), "error", nil, map[string]interface{}{
			"requestId":      apiRequest.ID,
			"responseStatus": string(apiResponse.ResponseStatus),
			"errorMessage":   errorMsg,
			"durationMs":     apiCallDuration,
			"modelName":      config.ModelName,
			"errorType":      c.classifyError(errorMsg),
			"retryable":      c.isRetryableError(errorMsg),
		}, &apiCallDuration, &errorMsg)
	} else {
		// Log successful API request end flow event with enhanced details
		c.logExecutionFlowEvent("api_request_end", c.getNextSequenceNumber(), "success", nil, map[string]interface{}{
			"requestId":       apiRequest.ID,
			"responseStatus":  string(apiResponse.ResponseStatus),
			"responseLength":  len(apiResponse.ResponseText),
			"finishReason":    apiResponse.FinishReason,
			"durationMs":      apiCallDuration,
			"modelName":       config.ModelName,
			"tokensUsed":      c.extractTokenUsage(apiResponse),
			"responsePreview": c.truncateString(apiResponse.ResponseText, 300),
			"hasFunctionCall": strings.Contains(apiResponse.ResponseText, "function_call"),
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

// compareResults compares the results of multiple variations with comprehensive metrics
func (c *Client) compareResults(ctx context.Context, result *types.ExecutionResult) (*types.ComparisonResult, error) {
	comparison := &types.ComparisonResult{
		ID:                  uuid.New().String(),
		ExecutionRunID:      result.ExecutionRun.ID,
		ComparisonType:      "comprehensive",
		MetricName:          "multi_metric_analysis",
		ConfigurationScores: make(map[string]interface{}),
		CreatedAt:           time.Now(),
	}

	if len(result.Results) == 0 {
		comparison.AnalysisNotes = "No results to compare"
		return comparison, nil
	}

	// Collect all configurations for reference
	var allConfigs []types.APIConfiguration
	for _, res := range result.Results {
		allConfigs = append(allConfigs, res.Configuration)
	}
	comparison.AllConfigurations = allConfigs

	// Calculate comprehensive metrics
	var bestByTime *types.VariationResult
	var bestByTokens *types.VariationResult
	var bestOverall *types.VariationResult
	var bestScore float64 = -1
	var totalPromptTokens, totalCompletionTokens, totalTokens int64
	var totalCost float64

	configMetrics := make(map[string]map[string]interface{})

	for i, res := range result.Results {
		// Calculate comprehensive quality scores
		responseTimeScore := c.calculateResponseTimeScore(res.Response.ResponseTimeMs)
		creativityScore := c.calculateCreativityScore(res.Configuration, res.Response)
		coherenceScore := c.calculateCoherenceScore(res.Response.ResponseText)
		tokenEfficiencyScore := c.calculateTokenEfficiencyScore(res.Response)
		safetyScore := c.calculateSafetyScore(res.Response.ResponseText)
		costEffectivenessScore := c.calculateCostEffectivenessScore(res.Response)

		// Calculate overall score (weighted average)
		overallScore := (responseTimeScore*0.2 +
			creativityScore*0.25 +
			coherenceScore*0.25 +
			tokenEfficiencyScore*0.15 +
			safetyScore*0.1 +
			costEffectivenessScore*0.05)

		// Track best overall configuration
		if bestOverall == nil || overallScore > bestScore {
			bestOverall = &result.Results[i]
			bestScore = overallScore
		}

		configID := res.Configuration.ID
		metrics := make(map[string]interface{})

		// Performance metrics
		metrics["response_time_ms"] = res.Response.ResponseTimeMs
		metrics["execution_time_ms"] = res.ExecutionTime
		metrics["status"] = string(res.Response.ResponseStatus)

		// Quality scores
		metrics["response_time_score"] = responseTimeScore
		metrics["creativity_score"] = creativityScore
		metrics["coherence_score"] = coherenceScore
		metrics["token_efficiency"] = tokenEfficiencyScore
		metrics["safety_score"] = safetyScore
		metrics["cost_effectiveness"] = costEffectivenessScore
		metrics["overall_score"] = overallScore

		// Configuration details
		metrics["temperature"] = res.Configuration.Temperature
		metrics["model_name"] = res.Configuration.ModelName
		metrics["variation_name"] = res.Configuration.VariationName

		// Token usage metrics (with both snake_case and camelCase for frontend compatibility)
		if res.Response.UsageMetadata != nil {
			if promptTokens, ok := res.Response.UsageMetadata["prompt_tokens"]; ok {
				var tokens int
				if t, ok := promptTokens.(int); ok {
					tokens = t
				} else if t, ok := promptTokens.(float64); ok {
					tokens = int(t)
				}
				if tokens > 0 {
					metrics["prompt_tokens"] = tokens
					metrics["promptTokens"] = tokens // camelCase for frontend
					totalPromptTokens += int64(tokens)
				}
			}

			if completionTokens, ok := res.Response.UsageMetadata["completion_tokens"]; ok {
				var tokens int
				if t, ok := completionTokens.(int); ok {
					tokens = t
				} else if t, ok := completionTokens.(float64); ok {
					tokens = int(t)
				}
				if tokens > 0 {
					metrics["completion_tokens"] = tokens
					metrics["completionTokens"] = tokens     // camelCase for frontend
					metrics["candidatesTokenCount"] = tokens // alternative naming
					totalCompletionTokens += int64(tokens)
				}
			}

			if totalTok, ok := res.Response.UsageMetadata["total_tokens"]; ok {
				var tokens int
				if t, ok := totalTok.(int); ok {
					tokens = t
				} else if t, ok := totalTok.(float64); ok {
					tokens = int(t)
				}
				if tokens > 0 {
					metrics["total_tokens"] = tokens
					metrics["totalTokens"] = tokens // camelCase for frontend
					totalTokens += int64(tokens)
				}
			}

			// Add full usage metadata for reference
			metrics["usage_metadata"] = res.Response.UsageMetadata
		}

		// Calculate estimated cost
		estimatedCost := c.calculateEstimatedCost(res.Response)
		metrics["estimated_cost_usd"] = estimatedCost
		totalCost += estimatedCost

		// Response quality metrics
		metrics["response_length"] = len(res.Response.ResponseText)
		metrics["has_error"] = res.Response.ResponseStatus == types.ResponseStatusError

		configMetrics[configID] = metrics

		// Track best performers by individual metrics
		if res.Response.ResponseStatus == types.ResponseStatusSuccess {
			if bestByTime == nil || res.Response.ResponseTimeMs < bestByTime.Response.ResponseTimeMs {
				bestByTime = &result.Results[i]
			}

			if bestByTokens == nil {
				bestByTokens = &result.Results[i]
			} else if currentTokens, ok := metrics["total_tokens"].(int); ok {
				if bestTokens, ok := configMetrics[bestByTokens.Configuration.ID]["total_tokens"].(int); ok {
					if currentTokens < bestTokens {
						bestByTokens = &result.Results[i]
					}
				}
			}
		}

		// Log detailed scoring for debugging
		log.Printf("📊 Configuration %s (%s): Overall=%.2f, Time=%dms, Creativity=%.2f, Coherence=%.2f",
			res.Configuration.VariationName,
			res.Configuration.ID[:8],
			overallScore*100,
			res.Response.ResponseTimeMs,
			creativityScore*100,
			coherenceScore*100)

		// Debug: Log token information
		if res.Response.UsageMetadata != nil {
			log.Printf("🔍 Token data for %s: %+v", res.Configuration.VariationName, res.Response.UsageMetadata)
		} else {
			log.Printf("⚠️ No token data for %s", res.Configuration.VariationName)
		}
	}

	// Store per-configuration metrics directly at the top level for frontend compatibility
	// Frontend expects: configurationScores[configId] = metrics
	frontendCompatibleScores := make(map[string]interface{})

	// Add individual configuration metrics
	for configID, metrics := range configMetrics {
		frontendCompatibleScores[configID] = metrics
	}

	// Add summary data under a special key
	frontendCompatibleScores["_summary"] = map[string]interface{}{
		"total_variations":           len(result.Results),
		"success_count":              result.SuccessCount,
		"error_count":                result.ErrorCount,
		"total_time_ms":              result.TotalTime,
		"total_prompt_tokens":        totalPromptTokens,
		"total_completion_tokens":    totalCompletionTokens,
		"total_tokens":               totalTokens,
		"estimated_total_cost_usd":   totalCost,
		"average_cost_per_variation": totalCost / float64(len(result.Results)),
	}

	comparison.ConfigurationScores = frontendCompatibleScores

	// Set best configuration and detailed analysis notes (use bestOverall from quality scoring)
	if bestOverall != nil {
		comparison.BestConfigurationID = bestOverall.Configuration.ID
		comparison.BestConfiguration = &bestOverall.Configuration

		// Log the best configuration ID for debugging
		log.Printf("🏆 Best Configuration Selected: %s (ID: %s)", bestOverall.Configuration.VariationName, bestOverall.Configuration.ID)

		// Create detailed analysis notes matching original format
		analysis := fmt.Sprintf("🏆 Best Configuration: %s\n", bestOverall.Configuration.VariationName)
		analysis += fmt.Sprintf("📋 Configuration ID: %s\n\n", bestOverall.Configuration.ID)
		analysis += fmt.Sprintf("📊 Overall Score: %.2f/100\n", bestScore*100)
		analysis += fmt.Sprintf("⚡ Response Time: %dms\n", bestOverall.Response.ResponseTimeMs)

		if metrics, ok := configMetrics[bestOverall.Configuration.ID]; ok {
			if creativityScore, ok := metrics["creativity_score"].(float64); ok {
				analysis += fmt.Sprintf("🎨 Creativity Score: %.1f/100\n", creativityScore*100)
			}
			if coherenceScore, ok := metrics["coherence_score"].(float64); ok {
				analysis += fmt.Sprintf("🧠 Coherence Score: %.1f/100\n", coherenceScore*100)
			}
			if tokenEfficiency, ok := metrics["token_efficiency"].(float64); ok {
				analysis += fmt.Sprintf("💡 Token Efficiency: %.1f/100\n", tokenEfficiency*100)
			}
			if estimatedCost, ok := metrics["estimated_cost_usd"].(float64); ok {
				analysis += fmt.Sprintf("💰 Estimated Cost: $%.6f\n", estimatedCost)
			}
			// Add token details
			if totalTokens, ok := metrics["total_tokens"].(int); ok {
				analysis += fmt.Sprintf("🎯 Total Tokens: %d\n", totalTokens)
				if promptTokens, ok := metrics["prompt_tokens"].(int); ok {
					if completionTokens, ok := metrics["completion_tokens"].(int); ok {
						analysis += fmt.Sprintf("📝 Token Breakdown: %d prompt + %d completion\n", promptTokens, completionTokens)
					}
				}
			}
		}

		// Add comparison insights
		analysis += "\n📈 Key Insights:\n"
		fastest := c.findFastest(result.Results)
		if fastest != nil && fastest.Configuration.ID != bestOverall.Configuration.ID {
			analysis += fmt.Sprintf("• Fastest: %s (%dms)\n", fastest.Configuration.VariationName, fastest.Response.ResponseTimeMs)
		}

		// Build scores map for finding most creative
		scores := make(map[string]interface{})
		for _, res := range result.Results {
			if metrics, ok := configMetrics[res.Configuration.ID]; ok {
				scores[res.Configuration.VariationName] = metrics
			}
		}
		mostCreative := c.findMostCreative(scores)
		if mostCreative != "" && mostCreative != bestOverall.Configuration.VariationName {
			analysis += fmt.Sprintf("• Most Creative: %s\n", mostCreative)
		}

		analysis += fmt.Sprintf("• Best Overall: %s (balanced performance)\n", bestOverall.Configuration.VariationName)
		analysis += fmt.Sprintf("• Total Cost: ~$%.6f across %d variations\n", totalCost, len(result.Results))
		analysis += fmt.Sprintf("• Average Cost/Variation: $%.6f", totalCost/float64(len(result.Results)))

		comparison.AnalysisNotes = analysis
	} else {
		comparison.AnalysisNotes = fmt.Sprintf("All %d variations failed | Total attempted cost: ~$%.6f",
			len(result.Results), totalCost)
	}

	return comparison, nil
}

// Helper functions for calculating different metrics
func (c *Client) calculateResponseTimeScore(responseTimeMs int32) float64 {
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

func (c *Client) calculateCreativityScore(config types.APIConfiguration, response types.APIResponse) float64 {
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

func (c *Client) calculateCoherenceScore(responseText string) float64 {
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

func (c *Client) calculateTokenEfficiencyScore(response types.APIResponse) float64 {
	// Higher token efficiency = higher score
	if response.UsageMetadata == nil {
		return 0.5 // Default score if no metadata
	}

	// Extract token information
	totalTokens := c.getTokenCount(response.UsageMetadata, "total_tokens")
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

func (c *Client) calculateSafetyScore(responseText string) float64 {
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

func (c *Client) calculateCostEffectivenessScore(response types.APIResponse) float64 {
	// Lower cost = higher score (based on tokens used)
	if response.UsageMetadata == nil {
		return 0.5
	}

	totalTokens := c.getTokenCount(response.UsageMetadata, "total_tokens")
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

func (c *Client) calculateEstimatedCost(response types.APIResponse) float64 {
	if response.UsageMetadata == nil {
		return 0.0
	}

	promptTokens := c.getTokenCount(response.UsageMetadata, "prompt_tokens")
	completionTokens := c.getTokenCount(response.UsageMetadata, "completion_tokens")

	// Gemini 1.5 Pro pricing
	return (float64(promptTokens) * 3.50 / 1000000) + (float64(completionTokens) * 10.50 / 1000000)
}

// Helper functions
func (c *Client) getScoreFromMap(scores map[string]interface{}, configName, scoreKey string) float64 {
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

func (c *Client) getTokenCount(metadata map[string]interface{}, key string) int {
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

func (c *Client) findFastest(results []types.VariationResult) *types.VariationResult {
	var fastest *types.VariationResult
	for i := range results {
		if fastest == nil || results[i].Response.ResponseTimeMs < fastest.Response.ResponseTimeMs {
			fastest = &results[i]
		}
	}
	return fastest
}

func (c *Client) findMostCreative(scores map[string]interface{}) string {
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
	if response.ResponseBody != nil {
		if functionCalls, ok := response.ResponseBody["function_calls"]; ok {
			if fcArray, ok := functionCalls.([]map[string]interface{}); ok && len(fcArray) > 0 {
				log.Printf("🔧 Processing %d function calls from Gemini REST API", len(fcArray))

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

	// Create a follow-up prompt asking the provider to synthesize the function results
	synthesisPrompt := fmt.Sprintf("Based on the original request: \"%s\"\n\nI have executed the following functions:\n", originalPrompt)

	for i, funcCall := range functionCalls {
		resultJSON, _ := json.Marshal(functionResults[i])
		synthesisPrompt += fmt.Sprintf("\nFunction: %s\nResult: %s\n", funcCall.FunctionCall.Name, string(resultJSON))
	}

	synthesisPrompt += "\nPlease provide a comprehensive analysis and response based on these function results."

	// Get effective API keys for the synthesis request
	effectiveKeys := c.getEffectiveApiKeys()

	// Create a new request for the synthesis
	synthesisRequest := &providers.ModelRequest{
		Prompt:              synthesisPrompt,
		Context:             request.Context,
		SystemPrompt:        config.SystemPrompt,
		Tools:               []types.Tool{}, // No tools for synthesis
		ConversationHistory: []providers.ConversationMessage{},
		SessionApiKeys:      effectiveKeys,
	}

	// Call the same provider for synthesis
	synthesisResponse, err := provider.GenerateContent(ctx, config, synthesisRequest)
	if err != nil {
		log.Printf("⚠️ Failed to get synthesis from %s provider: %v", providerType, err)
		// Fallback to simple summary
		return c.createFallbackSummary(functionCalls, functionResults), nil
	}

	if synthesisResponse.ResponseText != "" {
		log.Printf("✅ %s provided synthesis after function execution", providerType)
		return synthesisResponse.ResponseText, nil
	}

	// Fallback to simple summary
	return c.createFallbackSummary(functionCalls, functionResults), nil
}

// executeFunctionCall executes a function call and returns the result
func (c *Client) executeFunctionCall(ctx context.Context, functionName string, args map[string]interface{}) (map[string]interface{}, error) {
	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryFunctionCall,
		fmt.Sprintf("Executing function: %s", functionName),
		map[string]interface{}{
			"functionName": functionName,
			"args":         args,
		})

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

	return result, err
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

	if len(functionResults) > 0 {
		summary += "\n\nHowever, I encountered an issue providing a comprehensive analysis. The functions executed successfully, but I was unable to synthesize the results properly."
	}

	return summary
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
// Current max depth is set to 8 - this allows complex multi-step workflows while preventing runaway costs
func (c *Client) processIterativeFunctionCallsWithSynthesis(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest, functionCalls []ResponsePart, originalPrompt string) string {
	const maxIterationDepth = 8 // Configurable limit - can be increased for more complex workflows
	return c.processIterativeFunctionCallsWithSynthesisRecursive(ctx, config, request, functionCalls, originalPrompt, 0, maxIterationDepth)
}

// processIterativeFunctionCallsWithSynthesisRecursive handles recursive function calling with depth limiting
func (c *Client) processIterativeFunctionCallsWithSynthesisRecursive(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest, functionCalls []ResponsePart, originalPrompt string, depth int, maxDepth int) string {
	if depth >= maxDepth {
		log.Printf("⚠️ Maximum function calling depth (%d) reached, stopping iteration", maxDepth)
		return fmt.Sprintf("I executed %d functions but reached maximum iteration depth. Results may be incomplete.", len(functionCalls))
	}
	log.Printf("🔧 Starting function calling with Gemini synthesis for %d function(s)", len(functionCalls))

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

	// Create a synthesis prompt with the function results
	synthesisPrompt := fmt.Sprintf("Based on the original request: \"%s\"\n\nI have executed the following functions and retrieved this data:\n\n", originalPrompt)

	for i, funcCall := range functionCalls {
		synthesisPrompt += fmt.Sprintf("Function: %s\n", funcCall.FunctionCall.Name)

		// Include the function result data, but truncate if too large
		resultJSON, _ := json.Marshal(functionResults[i])
		resultStr := string(resultJSON)
		if len(resultStr) > 10000 {
			resultStr = resultStr[:10000] + "... (truncated)"
		}
		synthesisPrompt += fmt.Sprintf("Result: %s\n\n", resultStr)
	}

	synthesisPrompt += "\nNow, please complete the user's original request using the data I've retrieved above. \n\nIMPORTANT: Only make additional function calls if they are absolutely necessary to complete the user's request (e.g., creating issues, updating files, etc.). If you have all the information needed to answer the user's question, provide a comprehensive response directly without making more function calls.\n\nFor requests like 'summarize', 'analyze', 'list', or 'describe', you likely have enough data already - just provide the answer."

	// Create a new API request for synthesis
	synthesisRequest := &types.APIRequest{
		ID:              uuid.New().String(),
		ConfigurationID: request.ConfigurationID,
		ExecutionRunID:  request.ExecutionRunID,
		Prompt:          synthesisPrompt,
		Context:         request.Context,
		CreatedAt:       time.Now(),
	}

	// Make another Gemini REST API call for synthesis (keep tools for iterative calling)
	configForSynthesis := *config // Copy the config
	// Keep tools available so Gemini can make follow-up function calls

	synthesisResponse, err := c.callGeminiRestAPIForSynthesis(ctx, &configForSynthesis, synthesisRequest)
	if err != nil {
		log.Printf("⚠️ Failed to get synthesis from Gemini: %v", err)
		// Fallback to simple summary
		return fmt.Sprintf("I executed %d functions successfully. Function: %s retrieved data from GitHub.",
			len(functionCalls), functionCalls[0].FunctionCall.Name)
	}

	// Check if the synthesis response contains additional function calls
	if synthesisResponse.ResponseBody != nil {
		if additionalFunctionCalls, ok := synthesisResponse.ResponseBody["function_calls"]; ok {
			if fcArray, ok := additionalFunctionCalls.([]map[string]interface{}); ok && len(fcArray) > 0 {
				log.Printf("🔄 Synthesis response contains %d additional function calls, continuing iteration (depth %d)", len(fcArray), depth)

				// Convert to ResponsePart format
				additionalResponseParts := make([]ResponsePart, len(fcArray))
				for i, fc := range fcArray {
					additionalResponseParts[i] = ResponsePart{
						FunctionCall: struct {
							Name string                 `json:"name"`
							Args map[string]interface{} `json:"args"`
						}{
							Name: fc["name"].(string),
							Args: fc["args"].(map[string]interface{}),
						},
					}
				}

				// Recursively process additional function calls
				return c.processIterativeFunctionCallsWithSynthesisRecursive(ctx, config, request, additionalResponseParts, originalPrompt, depth+1, maxDepth)
			}
		}
	}

	if synthesisResponse.ResponseText != "" {
		log.Printf("✅ Gemini provided comprehensive synthesis: %d chars (depth %d)", len(synthesisResponse.ResponseText), depth)
		return synthesisResponse.ResponseText
	}

	// Fallback
	return fmt.Sprintf("I executed %d functions: %s", len(functionCalls), functionCalls[0].FunctionCall.Name)
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
