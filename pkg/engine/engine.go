package engine

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gogent/internal/types"
)

// Engine orchestrates single/multi variation executions using pluggable interfaces.
type Engine struct {
	Provider Provider
	Store    Store
	Logger   Logger
	Tools    ToolRunner
	Compare  Comparator
	Opts     Options
}

// ExecuteSingle runs a single variation end-to-end: logs request, calls provider, logs response.
func (e *Engine) ExecuteSingle(ctx context.Context, userID string, executionRunID string, cfg *types.APIConfiguration, prompt, ctxText string) (*types.VariationResult, error) {
	start := time.Now()

	req := &types.APIRequest{
		ID:              uuid.New().String(),
		ExecutionRunID:  executionRunID,
		ConfigurationID: cfg.ID,
		RequestType:     types.RequestTypeGenerate,
		Prompt:          prompt,
		Context:         ctxText,
		CreatedAt:       time.Now(),
	}

	if e.Store != nil {
		_ = e.Store.LogAPIRequest(ctx, userID, req)
	}
	if e.Logger != nil {
		e.Logger.FlowEvent("api_request_start", 0, "pending", map[string]interface{}{
			"requestId":       req.ID,
			"configurationId": cfg.ID,
			"promptLength":    len(prompt),
			"contextLength":   len(ctxText),
		})
	}

	resp, err := e.Provider.Generate(ctx, cfg, req)
	durationMs := int32(time.Since(start).Milliseconds())

	if err != nil {
		// Synthesize an error response for consistent logging
		resp = &types.APIResponse{ID: uuid.New().String(), RequestID: req.ID, ResponseStatus: types.ResponseStatusError, ErrorMessage: err.Error(), ResponseTimeMs: durationMs, CreatedAt: time.Now()}
	}

	if e.Store != nil {
		_ = e.Store.LogAPIResponse(ctx, userID, resp)
	}
	if e.Logger != nil {
		status := "success"
		if resp.ResponseStatus == types.ResponseStatusError {
			status = "error"
		}
		e.Logger.FlowEvent("api_request_end", 0, status, map[string]interface{}{
			"requestId":      req.ID,
			"responseTimeMs": resp.ResponseTimeMs,
		})
	}

	vr := &types.VariationResult{
		Configuration: *cfg,
		Request:       *req,
		Response:      *resp,
		ExecutionTime: time.Since(start).Milliseconds(),
	}
	if err != nil {
		return vr, err
	}
	return vr, nil
}

// ExecuteMulti runs multiple variations and optionally performs comparison via Comparator.
func (e *Engine) ExecuteMulti(ctx context.Context, userID string, executionRunID string, configs []types.APIConfiguration, prompt, ctxText string) (*types.ExecutionResult, error) {
	res := &types.ExecutionResult{ExecutionRun: types.ExecutionRun{ID: executionRunID}, Results: []types.VariationResult{}}
	start := time.Now()
	for i := range configs {
		vr, err := e.ExecuteSingle(ctx, userID, executionRunID, &configs[i], prompt, ctxText)
		if err != nil {
			res.ErrorCount++
		} else {
			res.SuccessCount++
		}
		res.Results = append(res.Results, *vr)
		// Optional pacing between calls
		if e.Opts.RateLimitDelayMs > 0 && i < len(configs)-1 {
			d := time.Duration(e.Opts.RateLimitDelayMs) * time.Millisecond
			time.Sleep(d)
		}
	}
	res.TotalTime = time.Since(start).Milliseconds()

	if e.Compare != nil {
		comp, err := e.Compare.Compare(ctx, res)
		if err == nil && comp != nil {
			_ = e.Compare.Store(ctx, userID, comp)
			res.Comparison = comp
		}
	}
	return res, nil
}
