package providers

import (
	"context"
	"fmt"
	"log"
	"strings"

	"gogent/internal/gemini"
	"gogent/internal/types"
)

// GeminiProvider implements the ModelProvider interface for Google Gemini models
type GeminiProvider struct {
	client *gemini.Client
}

// NewGeminiProvider creates a new Gemini provider instance
func NewGeminiProvider(ctx context.Context, apiKey string) (*GeminiProvider, error) {
	client, err := gemini.NewGeminiClient(ctx, apiKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	return &GeminiProvider{
		client: client,
	}, nil
}

// GetProviderName returns the provider name
func (p *GeminiProvider) GetProviderName() string {
	return "gemini"
}

// GetSupportedModels returns list of supported Gemini models
func (p *GeminiProvider) GetSupportedModels() []string {
	return []string{
		"gemini-1.5-flash",
		"gemini-1.5-pro",
		"gemini-1.0-pro",
		"gemini-1.5-flash-8b",
		"gemini-pro",
		"gemini-pro-vision",
		"gemini-1.5-pro-latest",
	}
}

// ValidateConfig validates Gemini-specific configuration
func (p *GeminiProvider) ValidateConfig(config *types.APIConfiguration) error {
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
		return fmt.Errorf("model %s is not supported by Gemini provider", config.ModelName)
	}

	return nil
}

// GenerateContent generates content using Gemini with function calling support
func (p *GeminiProvider) GenerateContent(ctx context.Context, config *types.APIConfiguration, request *ModelRequest) (*ModelResponse, error) {
	log.Printf("🤖 Gemini request - Model: %s, Tools: %d, Prompt length: %d",
		config.ModelName, len(request.Tools), len(request.Prompt))

	// For simple content generation without tools, use the existing Gemini client
	if len(request.Tools) == 0 {
		response, err := p.generateSimpleContent(ctx, config, request)
		if err != nil {
			return nil, fmt.Errorf("Gemini simple generation failed: %w", err)
		}
		return response, nil
	}

	// For function calling, we need to integrate with the existing complex logic
	// This is where we would hook into your existing function calling implementation
	return p.generateWithFunctionCalling(ctx, config, request)
}

// generateSimpleContent handles simple content generation without function calling
func (p *GeminiProvider) generateSimpleContent(ctx context.Context, config *types.APIConfiguration, request *ModelRequest) (*ModelResponse, error) {
	// Build full prompt with context
	fullPrompt := request.Prompt
	if request.Context != "" {
		fullPrompt = fmt.Sprintf("%s\n\nContext: %s", request.Prompt, request.Context)
	}

	// Use existing Gemini client
	response, err := p.client.GenerateContent(ctx, config, fullPrompt, "")
	if err != nil {
		return nil, err
	}

	// Convert to standardized format
	return &ModelResponse{
		ResponseText:   response.ResponseText,
		FunctionCalls:  []FunctionCall{}, // No function calls for simple generation
		UsageMetadata:  response.UsageMetadata,
		FinishReason:   response.FinishReason,
		ResponseTimeMs: response.ResponseTimeMs,
	}, nil
}

// generateWithFunctionCalling handles function calling for Gemini
// This integrates with your existing complex function calling logic
func (p *GeminiProvider) generateWithFunctionCalling(ctx context.Context, config *types.APIConfiguration, request *ModelRequest) (*ModelResponse, error) {
	// Convert tools to Gemini format and add to config
	configWithTools := *config
	configWithTools.Tools = request.Tools

	// For now, we'll use a simplified approach that calls the existing Gemini client
	// In a full implementation, this would integrate with your existing function calling logic
	// from internal/gogent/client.go

	// Build conversation history for Gemini format if available
	conversationHistory := p.buildGeminiConversationHistory(request)

	// Use existing Gemini client for function calling
	response, err := p.callGeminiWithTools(ctx, &configWithTools, request, conversationHistory)
	if err != nil {
		return nil, fmt.Errorf("Gemini function calling failed: %w", err)
	}

	return response, nil
}

// buildGeminiConversationHistory converts standard format to Gemini format
func (p *GeminiProvider) buildGeminiConversationHistory(request *ModelRequest) []map[string]interface{} {
	var history []map[string]interface{}

	// Add conversation history if available
	for _, msg := range request.ConversationHistory {
		geminiMsg := map[string]interface{}{
			"role": msg.Role,
		}

		if msg.Content != "" {
			geminiMsg["parts"] = []map[string]interface{}{
				{"text": msg.Content},
			}
		} else if len(msg.Parts) > 0 {
			geminiMsg["parts"] = msg.Parts
		}

		history = append(history, geminiMsg)
	}

	return history
}

// callGeminiWithTools makes API calls with function calling support using the existing sophisticated logic
func (p *GeminiProvider) callGeminiWithTools(ctx context.Context, config *types.APIConfiguration, request *ModelRequest, _ []map[string]interface{}) (*ModelResponse, error) {
	// Build full prompt with system prompt and context
	fullPrompt := request.Prompt
	if config.SystemPrompt != "" {
		fullPrompt = fmt.Sprintf("System: %s\n\nUser: %s", config.SystemPrompt, request.Prompt)
	}
	if request.Context != "" {
		fullPrompt = fmt.Sprintf("%s\n\nContext: %s", fullPrompt, request.Context)
	}

	// For now, use the simple Gemini client
	// TODO: Integrate with your existing complex function calling logic from internal/gogent/client.go
	response, err := p.client.GenerateContent(ctx, config, fullPrompt, "")
	if err != nil {
		return nil, err
	}

	// Parse response for potential function calls
	functionCalls := p.parseFunctionCallsFromResponse(response.ResponseText)

	log.Printf("✅ Gemini response - Text: %d chars, Function calls: %d, Time: %dms",
		len(response.ResponseText), len(functionCalls), response.ResponseTimeMs)

	return &ModelResponse{
		ResponseText:   response.ResponseText,
		FunctionCalls:  functionCalls,
		UsageMetadata:  response.UsageMetadata,
		FinishReason:   response.FinishReason,
		ResponseTimeMs: response.ResponseTimeMs,
	}, nil
}

// parseFunctionCallsFromResponse extracts function calls from Gemini response
// This is a simplified parser - in full implementation, this would integrate
// with your existing sophisticated function calling logic
func (p *GeminiProvider) parseFunctionCallsFromResponse(responseText string) []FunctionCall {
	// Simple detection for function calls in text
	// Your existing implementation in internal/gogent/client.go has much more sophisticated parsing
	if strings.Contains(responseText, "function_call") || strings.Contains(responseText, "tool_call") {
		log.Printf("🔧 Function call detected in Gemini response, would parse with existing logic")
		// TODO: Integrate with existing function call parsing from internal/gogent/client.go
	}

	// Return empty slice - this is intentional for the placeholder implementation
	return []FunctionCall{}
}

// Close cleans up the Gemini provider resources
func (p *GeminiProvider) Close() error {
	if p.client != nil {
		return p.client.Close()
	}
	return nil
}
