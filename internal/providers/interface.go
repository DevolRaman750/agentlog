package providers

import (
	"context"

	"gogent/internal/types"
)

// ModelProvider defines the interface all model providers must implement
type ModelProvider interface {
	// GenerateContent generates content with function calling support
	GenerateContent(ctx context.Context, config *types.APIConfiguration, request *ModelRequest) (*ModelResponse, error)

	// GetProviderName returns the name of the provider (e.g., "gemini", "kimi")
	GetProviderName() string

	// GetSupportedModels returns list of models this provider supports
	GetSupportedModels() []string

	// ValidateConfig validates provider-specific configuration
	ValidateConfig(config *types.APIConfiguration) error

	// Close cleans up any resources
	Close() error
}

// ModelRequest represents a standardized request format
type ModelRequest struct {
	Prompt              string                `json:"prompt"`
	Context             string                `json:"context,omitempty"`
	SystemPrompt        string                `json:"systemPrompt,omitempty"`
	Tools               []types.Tool          `json:"tools,omitempty"`
	ConversationHistory []ConversationMessage `json:"conversationHistory,omitempty"`
	SessionAPIKeys      *types.SessionAPIKeys `json:"sessionAPIKeys,omitempty"`
}

// ModelResponse represents a standardized response format
type ModelResponse struct {
	ResponseText      string                 `json:"responseText"`
	FunctionCalls     []FunctionCall         `json:"functionCalls,omitempty"`
	UsageMetadata     map[string]interface{} `json:"usageMetadata,omitempty"`
	FinishReason      string                 `json:"finishReason,omitempty"`
	ResponseTimeMs    int64                  `json:"responseTimeMs"`
	ConversationState []ConversationMessage  `json:"conversationState,omitempty"` // For iterative calling
}

// ConversationMessage represents a message in conversation history
type ConversationMessage struct {
	Role       string        `json:"role"` // "user", "assistant", "tool"
	Content    string        `json:"content,omitempty"`
	Parts      []interface{} `json:"parts,omitempty"`        // For complex content
	ToolCalls  []ToolCall    `json:"tool_calls,omitempty"`   // For assistant messages with tool calls (OpenAI format)
	ToolCallID string        `json:"tool_call_id,omitempty"` // For tool response messages (OpenAI format)
}

// ToolCall represents a tool call in an assistant message (OpenAI format)
type ToolCall struct {
	ID       string       `json:"id"`
	Type     string       `json:"type"` // "function"
	Function FunctionCall `json:"function"`
}

// FunctionCall represents a function call request from the model
type FunctionCall struct {
	ID   string                 `json:"id,omitempty"` // tool_call_id from OpenAI-compatible APIs
	Name string                 `json:"name"`
	Args map[string]interface{} `json:"args"`
}

// ProviderConfig holds provider-specific configuration
type ProviderConfig struct {
	ProviderType string                 `json:"providerType"` // "gemini", "kimi", etc.
	APIKey       string                 `json:"apiKey"`
	BaseURL      string                 `json:"baseUrl,omitempty"`
	ExtraConfig  map[string]interface{} `json:"extraConfig,omitempty"`
}
