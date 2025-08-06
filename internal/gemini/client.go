package gemini

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"gogent/internal/types"
)

// GeminiClient wraps the Google Generative AI REST API
type GeminiClient struct {
	apiKey     string
	httpClient *http.Client
}

// NewGeminiClient creates a new Gemini API client using the REST API
func NewGeminiClient(ctx context.Context, apiKey string) (*GeminiClient, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("API key is required")
	}

	return &GeminiClient{
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: 60 * time.Second},
	}, nil
}

// Close closes the Gemini client (no-op for REST API)
func (c *GeminiClient) Close() error {
	return nil
}

// GenerateContent generates content using the Gemini REST API with full function calling support
func (c *GeminiClient) GenerateContent(ctx context.Context, config *types.APIConfiguration, prompt, contextStr string) (*types.APIResponse, error) {
	startTime := time.Now()

	// Build the full prompt with system prompt and context
	fullPrompt := prompt
	if config.SystemPrompt != "" {
		fullPrompt = fmt.Sprintf("System: %s\n\nUser: %s", config.SystemPrompt, prompt)
	}
	if contextStr != "" {
		fullPrompt = fmt.Sprintf("%s\n\nContext: %s", fullPrompt, contextStr)
	}

	log.Printf("Gemini REST API call - Model: %s, Prompt length: %d, Tools: %d", config.ModelName, len(fullPrompt), len(config.Tools))

	// Build the REST API request (following official documentation format)
	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": fullPrompt},
				},
			},
		},
	}

	// Add generation config if specified
	generationConfig := make(map[string]interface{})
	if config.Temperature != nil {
		generationConfig["temperature"] = *config.Temperature
	}
	if config.MaxTokens != nil {
		generationConfig["maxOutputTokens"] = *config.MaxTokens
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

	// Add tools support for function calling
	if len(config.Tools) > 0 {
		// Create function declarations array - ALL functions go in ONE array
		functionDeclarations := make([]map[string]interface{}, len(config.Tools))
		for i, tool := range config.Tools {
			// Sanitize the parameters to remove unsupported fields
			sanitizedParams := c.sanitizeToolParameters(tool.Parameters)

			functionDeclarations[i] = map[string]interface{}{
				"name":        tool.Name,
				"description": tool.Description,
				"parameters":  sanitizedParams,
			}
		}

		// Create the correct tools structure: ONE tools array with ONE functionDeclarations array
		tools := []map[string]interface{}{
			{
				"functionDeclarations": functionDeclarations,
			},
		}
		requestBody["tools"] = tools

		// Use AUTO mode to allow Gemini to choose between function calling or text response
		requestBody["toolConfig"] = map[string]interface{}{
			"functionCallingConfig": map[string]interface{}{
				"mode": "AUTO",
			},
		}

		log.Printf("🔧 Added %d tools to Gemini request", len(config.Tools))
	}

	// Serialize request
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		log.Printf("REST API - Marshal error: %v", err)
		return &types.APIResponse{
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   fmt.Sprintf("Failed to marshal request: %v", err),
			ResponseTimeMs: int32(time.Since(startTime).Milliseconds()),
		}, nil
	}

	// Make HTTP request to Gemini REST API (following official documentation)
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", config.ModelName)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		log.Printf("REST API - Request creation error: %v", err)
		return &types.APIResponse{
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   fmt.Sprintf("Failed to create request: %v", err),
			ResponseTimeMs: int32(time.Since(startTime).Milliseconds()),
		}, nil
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		log.Printf("REST API - HTTP request error: %v", err)
		return &types.APIResponse{
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   fmt.Sprintf("Failed to make request: %v", err),
			ResponseTimeMs: int32(time.Since(startTime).Milliseconds()),
		}, nil
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("REST API - Response read error: %v", err)
		return &types.APIResponse{
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   fmt.Sprintf("Failed to read response: %v", err),
			ResponseTimeMs: int32(time.Since(startTime).Milliseconds()),
		}, nil
	}

	responseTime := time.Since(startTime)
	log.Printf("REST API - Response status: %d, Time: %dms", resp.StatusCode, responseTime.Milliseconds())

	if resp.StatusCode != 200 {
		log.Printf("REST API - Error response: %s", string(body))
		return &types.APIResponse{
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   fmt.Sprintf("API error %d: %s", resp.StatusCode, string(body)),
			ResponseTimeMs: int32(responseTime.Milliseconds()),
		}, nil
	}

	// Parse response with function calling support
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text         string `json:"text,omitempty"`
					FunctionCall *struct {
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
		return &types.APIResponse{
			ResponseStatus: types.ResponseStatusError,
			ErrorMessage:   fmt.Sprintf("Failed to parse response: %v", err),
			ResponseTimeMs: int32(responseTime.Milliseconds()),
		}, nil
	}

	// Extract response text and function calls
	var responseText string
	var finishReason string
	var functionCalls []map[string]interface{}

	if len(geminiResp.Candidates) > 0 {
		candidate := geminiResp.Candidates[0]
		finishReason = candidate.FinishReason

		for _, part := range candidate.Content.Parts {
			if part.Text != "" {
				responseText = part.Text
			}
			if part.FunctionCall != nil {
				functionCalls = append(functionCalls, map[string]interface{}{
					"name": part.FunctionCall.Name,
					"args": part.FunctionCall.Args,
				})
			}
		}
	}

	// Build usage metadata
	usageMetadata := map[string]interface{}{
		"prompt_tokens":     geminiResp.UsageMetadata.PromptTokenCount,
		"completion_tokens": geminiResp.UsageMetadata.CandidatesTokenCount,
		"total_tokens":      geminiResp.UsageMetadata.TotalTokenCount,
	}

	if len(functionCalls) > 0 {
		log.Printf("REST API - Success! Found %d function calls", len(functionCalls))
	} else {
		log.Printf("REST API - Success! Response length: %d chars", len(responseText))
	}

	apiResponse := &types.APIResponse{
		ResponseStatus: types.ResponseStatusSuccess,
		ResponseText:   responseText,
		UsageMetadata:  usageMetadata,
		FinishReason:   finishReason,
		ResponseTimeMs: int32(responseTime.Milliseconds()),
	}

	// Add function calls to response body if present
	if len(functionCalls) > 0 {
		if apiResponse.ResponseBody == nil {
			apiResponse.ResponseBody = make(map[string]interface{})
		}
		apiResponse.ResponseBody["function_calls"] = functionCalls
	}

	return apiResponse, nil
}

// sanitizeToolParameters removes fields that are not supported by the Gemini API
func (c *GeminiClient) sanitizeToolParameters(params map[string]interface{}) map[string]interface{} {
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
							sanitizedProps[propName] = c.sanitizePropertySchema(propMap)
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

// sanitizePropertySchema removes unsupported fields from individual property schemas
func (c *GeminiClient) sanitizePropertySchema(propSchema map[string]interface{}) map[string]interface{} {
	sanitized := make(map[string]interface{})

	// Allow these fields for property definitions
	allowedFields := map[string]bool{
		"type":        true,
		"description": true,
		"enum":        true,
		"format":      true,
		"items":       true,
		"properties":  true,
		"required":    true,
	}

	for key, value := range propSchema {
		if allowedFields[key] {
			if key == "properties" && value != nil {
				// Recursively sanitize nested properties
				if nestedProps, ok := value.(map[string]interface{}); ok {
					sanitizedNested := make(map[string]interface{})
					for nestedName, nestedValue := range nestedProps {
						if nestedMap, ok := nestedValue.(map[string]interface{}); ok {
							sanitizedNested[nestedName] = c.sanitizePropertySchema(nestedMap)
						} else {
							sanitizedNested[nestedName] = nestedValue
						}
					}
					sanitized[key] = sanitizedNested
				} else {
					sanitized[key] = value
				}
			} else if key == "items" && value != nil {
				// Sanitize array item schema
				if itemSchema, ok := value.(map[string]interface{}); ok {
					sanitized[key] = c.sanitizePropertySchema(itemSchema)
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
