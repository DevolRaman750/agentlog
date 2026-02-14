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

// OllamaProvider implements the ModelProvider interface for self-hosted Ollama models
type OllamaProvider struct {
	baseURL    string
	httpClient *http.Client
}

// NewOllamaProvider creates a new Ollama provider instance (no API key needed)
func NewOllamaProvider(baseURL string) (*OllamaProvider, error) {
	if baseURL == "" {
		return nil, fmt.Errorf("base URL is required for Ollama provider")
	}

	return &OllamaProvider{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: HTTPClientTimeoutSeconds * time.Second},
	}, nil
}

// GetProviderName returns the provider name
func (p *OllamaProvider) GetProviderName() string {
	return "ollama"
}

// GetSupportedModels returns list of supported Ollama models
func (p *OllamaProvider) GetSupportedModels() []string {
	return []string{
		"llama3.1:latest",
		"llama3.2:latest",
	}
}

// ValidateConfig validates Ollama-specific configuration
func (p *OllamaProvider) ValidateConfig(config *types.APIConfiguration) error {
	if config.ModelName == "" {
		return fmt.Errorf("model name is required")
	}

	supportedModels := p.GetSupportedModels()
	isSupported := false
	for _, model := range supportedModels {
		if config.ModelName == model {
			isSupported = true
			break
		}
	}

	if !isSupported {
		return fmt.Errorf("model %s is not supported by Ollama provider", config.ModelName)
	}

	return nil
}

// GenerateContent generates content using Ollama with function calling support
func (p *OllamaProvider) GenerateContent(
	ctx context.Context,
	config *types.APIConfiguration,
	request *ModelRequest,
) (*ModelResponse, error) {
	startTime := time.Now()

	log.Printf("Ollama request - Model: %s, Tools: %d, Prompt length: %d",
		config.ModelName, len(request.Tools), len(request.Prompt))

	// Build messages in OpenAI format
	messages := p.buildMessages(request, config.SystemPrompt)

	// Build request body
	requestBody := map[string]interface{}{
		"model":    config.ModelName,
		"messages": messages,
	}

	// Add generation parameters
	p.addGenerationConfig(requestBody, config)

	// Add tools if provided (OpenAI format)
	if len(request.Tools) > 0 {
		tools := p.convertToolsToOpenAIFormat(request.Tools)
		requestBody["tools"] = tools
		requestBody["tool_choice"] = "auto"
		log.Printf("Added %d tools for Ollama function calling", len(request.Tools))
	}

	// Make API request
	response, err := p.makeAPIRequest(ctx, requestBody)
	if err != nil {
		return nil, fmt.Errorf("ollama API request failed: %w", err)
	}

	// Parse response (same format as OpenAI/Kimi)
	modelResponse, err := p.parseResponse(response, time.Since(startTime))
	if err != nil {
		return nil, fmt.Errorf("failed to parse Ollama response: %w", err)
	}

	log.Printf("Ollama response - Text: %d chars, Function calls: %d, Time: %dms",
		len(modelResponse.ResponseText), len(modelResponse.FunctionCalls), modelResponse.ResponseTimeMs)

	return modelResponse, nil
}

// buildMessages constructs the messages array for OpenAI-compatible format
func (p *OllamaProvider) buildMessages(request *ModelRequest, systemPrompt string) []map[string]interface{} {
	var messages []map[string]interface{}

	// Add system message if provided
	if systemPrompt != "" {
		messages = append(messages, map[string]interface{}{
			"role":    "system",
			"content": systemPrompt,
		})
	} else {
		messages = append(messages, map[string]interface{}{
			"role":    "system",
			"content": "You are a helpful AI assistant running on a self-hosted GPU. Excel at function calling, code analysis, and providing precise responses.",
		})
	}

	// Add conversation history if available
	for _, msg := range request.ConversationHistory {
		if msg.Role == "assistant" && len(msg.ToolCalls) > 0 {
			// Assistant message with tool calls
			toolCalls := make([]map[string]interface{}, len(msg.ToolCalls))
			for i, tc := range msg.ToolCalls {
				argsJSON, _ := json.Marshal(tc.Function.Args)
				toolCalls[i] = map[string]interface{}{
					"id":   tc.ID,
					"type": "function",
					"function": map[string]interface{}{
						"name":      tc.Function.Name,
						"arguments": string(argsJSON),
					},
				}
			}
			message := map[string]interface{}{
				"role":       "assistant",
				"tool_calls": toolCalls,
			}
			if msg.Content != "" {
				message["content"] = msg.Content
			}
			messages = append(messages, message)
		} else if msg.Role == "tool" && msg.ToolCallID != "" {
			// Tool response message
			messages = append(messages, map[string]interface{}{
				"role":         "tool",
				"tool_call_id": msg.ToolCallID,
				"content":      msg.Content,
			})
		} else {
			message := map[string]interface{}{
				"role":    msg.Role,
				"content": msg.Content,
			}
			messages = append(messages, message)
		}
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

// addGenerationConfig adds generation parameters
func (p *OllamaProvider) addGenerationConfig(requestBody map[string]interface{}, config *types.APIConfiguration) {
	if config.Temperature != nil {
		requestBody["temperature"] = *config.Temperature
	} else {
		requestBody["temperature"] = 0.6
	}

	if config.MaxTokens != nil {
		requestBody["max_tokens"] = *config.MaxTokens
	} else {
		requestBody["max_tokens"] = 4096
	}

	if config.TopP != nil {
		requestBody["top_p"] = *config.TopP
	}
}

// convertToolsToOpenAIFormat converts tools to OpenAI function calling format
func (p *OllamaProvider) convertToolsToOpenAIFormat(tools []types.Tool) []map[string]interface{} {
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

// makeAPIRequest makes the HTTP request to Ollama's OpenAI-compatible endpoint
func (p *OllamaProvider) makeAPIRequest(ctx context.Context, requestBody map[string]interface{}) (map[string]interface{}, error) {
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Ollama's OpenAI-compatible endpoint
	url := fmt.Sprintf("%s/v1/chat/completions", p.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	// No Authorization header needed for Ollama

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(body))
	}

	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse response JSON: %w", err)
	}

	return response, nil
}

// parseResponse parses the OpenAI-compatible response from Ollama
func (p *OllamaProvider) parseResponse(response map[string]interface{}, duration time.Duration) (*ModelResponse, error) {
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
		ResponseTimeMs: duration.Milliseconds(),
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
				log.Printf("Invalid tool call format: %+v", toolCall)
				continue
			}

			function, ok := tc["function"].(map[string]interface{})
			if !ok {
				log.Printf("Invalid function format in tool call: %+v", tc)
				continue
			}

			name, ok := function["name"].(string)
			if !ok {
				log.Printf("Invalid function name: %+v", function)
				continue
			}

			var args map[string]interface{}
			if argsStr, ok := function["arguments"].(string); ok {
				if err := json.Unmarshal([]byte(argsStr), &args); err != nil {
					log.Printf("Failed to parse function arguments for %s: %v", name, err)
					args = make(map[string]interface{})
				}
			}

			toolCallID, _ := tc["id"].(string)

			functionCalls = append(functionCalls, FunctionCall{
				ID:   toolCallID,
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

// Close cleans up the Ollama provider resources
func (p *OllamaProvider) Close() error {
	return nil
}
