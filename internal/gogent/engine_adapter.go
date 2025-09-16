package gogent

import (
	"context"
	"os"
	"strconv"

	"gogent/internal/types"
	eng "gogent/pkg/engine"
)

// engineProvider adapts Client.callGeminiAPI to engine.Provider
type engineProvider struct{ c *Client }

func (p *engineProvider) Generate(ctx context.Context, cfg *types.APIConfiguration, req *types.APIRequest) (*types.APIResponse, error) {
	return p.c.callGeminiAPI(ctx, cfg, req)
}

// engineStore adapts request/response logging
type engineStore struct{ c *Client }

func (s *engineStore) LogAPIRequest(ctx context.Context, userID string, req *types.APIRequest) error {
	return s.c.LogAPIRequest(ctx, userID, req)
}
func (s *engineStore) LogAPIResponse(ctx context.Context, userID string, resp *types.APIResponse) error {
	return s.c.LogAPIResponse(ctx, userID, resp)
}

// engineLogger adapts flow event logging
type engineLogger struct{ c *Client }

func (l *engineLogger) FlowEvent(name string, _ int, status string, payload map[string]interface{}) {
	// Reuse client's flow event logger; sequence numbers are managed by client
	l.c.logExecutionFlowEvent(name, l.c.getNextSequenceNumber(), status, nil, payload, nil, nil)
}

// engineToolRunnerAdapter routes tool/function execution via client's routing
type engineToolRunnerAdapter struct{ c *Client }

func (tr *engineToolRunnerAdapter) Execute(ctx context.Context, functionName string, args map[string]interface{}) (map[string]interface{}, error) {
	return tr.c.executeFunctionCall(ctx, functionName, args)
}

// engineBasicComparatorAdapter uses engine.BasicComparator for assembly and client for storage
type engineBasicComparatorAdapter struct{ c *Client }

func (cmp *engineBasicComparatorAdapter) Compare(ctx context.Context, result *types.ExecutionResult) (*types.ComparisonResult, error) {
	bc := &eng.BasicComparator{}
	return bc.Compare(ctx, result)
}

func (cmp *engineBasicComparatorAdapter) Store(ctx context.Context, userID string, comp *types.ComparisonResult) error {
	return cmp.c.StoreComparisonResult(ctx, userID, comp)
}

// newEngine constructs an engine with adapters bound to this client
func (c *Client) newEngine() *eng.Engine {
	// Optional pacing from env
	delayMs := 0
	if v := os.Getenv("ENGINE_RATELIMIT_MS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			delayMs = n
		}
	}
	e := &eng.Engine{
		Provider: &engineProvider{c},
		Store:    &engineStore{c},
		Logger:   &engineLogger{c},
		Tools:    &engineToolRunnerAdapter{c},
		Opts:     eng.Options{EnableFunctionCalling: false, RateLimitDelayMs: delayMs},
	}
	// Always use the engine's BasicComparator for comparison assembly and client for storage
	e.Compare = &engineBasicComparatorAdapter{c}
	return e
}
