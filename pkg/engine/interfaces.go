package engine

import (
	"context"
	"gogent/internal/types"
)

// Provider abstracts the underlying model provider (e.g., Gemini)
type Provider interface {
	Generate(ctx context.Context, cfg *types.APIConfiguration, req *types.APIRequest) (*types.APIResponse, error)
}

// Store persists requests/responses and related execution artifacts
type Store interface {
	LogAPIRequest(ctx context.Context, userID string, req *types.APIRequest) error
	LogAPIResponse(ctx context.Context, userID string, resp *types.APIResponse) error
}

// Logger emits execution events and flow events for observability
type Logger interface {
	FlowEvent(name string, seq int, status string, payload map[string]interface{})
}

// ToolRunner executes function/tool calls when needed by the provider
// (not used in ExecuteSingle baseline, reserved for later stages)
type ToolRunner interface {
	Execute(ctx context.Context, functionName string, args map[string]interface{}) (map[string]interface{}, error)
}

// Options control engine behavior
type Options struct {
	EnableFunctionCalling bool
	// Optional delay between variations in ExecuteMulti (milliseconds)
	RateLimitDelayMs int
}

// Comparator computes and persists comparison results
type Comparator interface {
	Compare(ctx context.Context, result *types.ExecutionResult) (*types.ComparisonResult, error)
	Store(ctx context.Context, userID string, comp *types.ComparisonResult) error
}
