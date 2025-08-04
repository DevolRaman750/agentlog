package providers

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

// KimiProvider implements the ModelProvider interface for Kimi K2 models
type KimiProvider struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// NewKimiProvider creates a new Kimi provider instance
func NewKimiProvider(apiKey string, baseURL string) (*KimiProvider, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("API key is required for Kimi provider")
	}

	if baseURL == "" {
		baseURL = "https://openrouter.ai/api/v1" // Default to OpenRouter
	}

	return &KimiProvider{
		apiKey:     apiKey,
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 120 * time.Second}, // Longer timeout for complex function calls
	}, nil
}

// GetProviderName returns the provider name
func (p *KimiProvider) GetProviderName() string {
	return "kimi"
}

// GetSupportedModels returns list of supported Kimi models
func (p *KimiProvider) GetSupportedModels() []string {
	return []string{
		"moonshotai/kimi-k2",
		"moonshotai/kimi-k2-instruct",
		"moonshotai/Kimi-K2-Instruct",
	}
}

// ValidateConfig validates Kimi-specific configuration
func (p *KimiProvider) ValidateConfig(config *types.APIConfiguration) error {
	if config.ModelName == "" {
		return fmt.Errorf("model name is required")
	}

	// Check if model is supported
	supportedModels := p.GetSupportedModels()
	isSupported := false
	for _, model := range supportedModels {
		if config.ModelName == model {
			isSupported = true
			break
		}
	}

	if !isSupported {
		return fmt.Errorf("model %s is not supported by Kimi provider", config.ModelName)
	}

	return nil
}

// GenerateContent generates content using Kimi K2 with function calling support
func (p *KimiProvider) GenerateContent(ctx context.Context, config *types.APIConfiguration, request *ModelRequest) (*ModelResponse, error) {
	startTime := time.Now()

	log.Printf("🤖 Kimi K2 request - Model: %s, Tools: %d, Prompt length: %d",
		config.ModelName, len(request.Tools), len(request.Prompt))

	// Build messages in OpenAI format
	messages := p.buildMessages(request, config.SystemPrompt)

	// Build request body
	requestBody := map[string]interface{}{
		"model":    config.ModelName,
		"messages": messages,
	}

	// Add generation parameters optimized for Kimi K2
	p.addGenerationConfig(requestBody, config)

	// Add tools if provided (OpenAI format)
	if len(request.Tools) > 0 {
		tools := p.convertToolsToOpenAIFormat(request.Tools)
		requestBody["tools"] = tools
		requestBody["tool_choice"] = "auto"
		log.Printf("🔧 Added %d tools for Kimi K2 function calling", len(request.Tools))
	}

	// Make API request
	response, err := p.makeAPIRequest(ctx, requestBody)
	if err != nil {
		return nil, fmt.Errorf("Kimi API request failed: %w", err)
	}

	// Parse response
	modelResponse, err := p.parseKimiResponse(response, time.Since(startTime))
	if err != nil {
		return nil, fmt.Errorf("failed to parse Kimi response: %w", err)
	}

	log.Printf("✅ Kimi K2 response - Text: %d chars, Function calls: %d, Time: %dms",
		len(modelResponse.ResponseText), len(modelResponse.FunctionCalls), modelResponse.ResponseTimeMs)

	return modelResponse, nil
}

// buildMessages constructs the messages array for OpenAI-compatible format
func (p *KimiProvider) buildMessages(request *ModelRequest, systemPrompt string) []map[string]interface{} {
	var messages []map[string]interface{}

	// Add system message if provided (Kimi K2 uses "You are Kimi, an AI assistant created by Moonshot AI" as default)
	if systemPrompt != "" {
		messages = append(messages, map[string]interface{}{
			"role":    "system",
			"content": systemPrompt,
		})
	} else {
		// Use Kimi K2 recommended default system prompt
		messages = append(messages, map[string]interface{}{
			"role":    "system",
			"content": "You are Kimi, an AI assistant created by Moonshot AI.",
		})
	}

	// Add conversation history if available
	for _, msg := range request.ConversationHistory {
		message := map[string]interface{}{
			"role":    msg.Role,
			"content": msg.Content,
		}
		messages = append(messages, message)
	}

	// Build user message with context
	userContent := request.Prompt
	if request.Context != "" {
		userContent = fmt.Sprintf("%s\n\nContext: %s", request.Prompt, request.Context)
	}

	messages = append(messages, map[string]interface{}{
		"role":    "user",
		"content": userContent,
	})

	return messages
}

// addGenerationConfig adds Kimi K2 optimized generation parameters
func (p *KimiProvider) addGenerationConfig(requestBody map[string]interface{}, config *types.APIConfiguration) {
	// Temperature: Kimi K2 recommends ≈ 0.6
	if config.Temperature != nil {
		requestBody["temperature"] = *config.Temperature
	} else {
		requestBody["temperature"] = 0.6
	}

	// Max tokens
	if config.MaxTokens != nil {
		requestBody["max_tokens"] = *config.MaxTokens
	} else {
		requestBody["max_tokens"] = 8192 // Good default for function calling
	}

	// Top-p
	if config.TopP != nil {
		requestBody["top_p"] = *config.TopP
	}

	// Note: Kimi K2 doesn't use TopK in OpenAI format
}

// convertToolsToOpenAIFormat converts tools to OpenAI function calling format
func (p *KimiProvider) convertToolsToOpenAIFormat(tools []types.Tool) []map[string]interface{} {
	openaiTools := make([]map[string]interface{}, len(tools))

	for i, tool := range tools {
		openaiTools[i] = map[string]interface{}{
			"type": "function",
			"function": map[string]interface{}{
				"name":        tool.Name,
				"description": tool.Description,
				"parameters":  tool.Parameters,
			},
		}
	}

	return openaiTools
}

// makeAPIRequest makes the HTTP request to Kimi API
func (p *KimiProvider) makeAPIRequest(ctx context.Context, requestBody map[string]interface{}) (map[string]interface{}, error) {
	// Serialize request
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	url := fmt.Sprintf("%s/chat/completions", p.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.apiKey))
	req.Header.Set("HTTP-Referer", "https://agentlog.com") // Required by OpenRouter
	req.Header.Set("X-Title", "AgentLog")                  // Optional app identification

	// Make request
	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Check for errors
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(body))
	}

	// Parse JSON response
	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse response JSON: %w", err)
	}

	return response, nil
}

// parseKimiResponse parses the OpenAI-compatible response from Kimi
func (p *KimiProvider) parseKimiResponse(response map[string]interface{}, duration time.Duration) (*ModelResponse, error) {
	// Check for choices
	choices, ok := response["choices"].([]interface{})
	if !ok || len(choices) == 0 {
		return nil, fmt.Errorf("no choices in response")
	}

	choice, ok := choices[0].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid choice format")
	}

	message, ok := choice["message"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid message format")
	}

	result := &ModelResponse{
		ResponseTimeMs: int32(duration.Milliseconds()),
		FunctionCalls:  []FunctionCall{},
	}

	// Extract text content
	if content, ok := message["content"].(string); ok && content != "" {
		result.ResponseText = content
	}

	// Extract function calls if present
	if toolCalls, ok := message["tool_calls"].([]interface{}); ok {
		functionCalls := make([]FunctionCall, 0, len(toolCalls))

		for _, toolCall := range toolCalls {
			tc, ok := toolCall.(map[string]interface{})
			if !ok {
				log.Printf("⚠️ Invalid tool call format: %+v", toolCall)
				continue
			}

			function, ok := tc["function"].(map[string]interface{})
			if !ok {
				log.Printf("⚠️ Invalid function format in tool call: %+v", tc)
				continue
			}

			name, ok := function["name"].(string)
			if !ok {
				log.Printf("⚠️ Invalid function name: %+v", function)
				continue
			}

			var args map[string]interface{}
			if argsStr, ok := function["arguments"].(string); ok {
				if err := json.Unmarshal([]byte(argsStr), &args); err != nil {
					log.Printf("⚠️ Failed to parse function arguments for %s: %v", name, err)
					args = make(map[string]interface{})
				}
			}

			functionCalls = append(functionCalls, FunctionCall{
				Name: name,
				Args: args,
			})
		}

		result.FunctionCalls = functionCalls
	}

	// Extract usage metadata
	if usage, ok := response["usage"].(map[string]interface{}); ok {
		result.UsageMetadata = usage
	}

	// Extract finish reason
	if finishReason, ok := choice["finish_reason"].(string); ok {
		result.FinishReason = finishReason
	}

	return result, nil
}

// Close cleans up the Kimi provider resources
func (p *KimiProvider) Close() error {
	// HTTP client doesn't need explicit cleanup
	return nil
}
