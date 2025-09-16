package engine

import (
	"context"
	"gogent/internal/types"
	"testing"
	"time"
)

func TestBasicComparator_Compare(t *testing.T) {
	bc := &BasicComparator{}
	now := time.Now()

	res := &types.ExecutionResult{
		ExecutionRun: types.ExecutionRun{ID: "run-test"},
		Results: []types.VariationResult{
			{
				Configuration: types.APIConfiguration{ID: "cfg1", VariationName: "v1", ModelName: "m", CreatedAt: now, UpdatedAt: now},
				Response:      types.APIResponse{ResponseStatus: types.ResponseStatusSuccess, ResponseText: "plain", ResponseTimeMs: 200, UsageMetadata: map[string]interface{}{"total_tokens": 10, "prompt_tokens": 5, "completion_tokens": 5}},
			},
			{
				Configuration: types.APIConfiguration{ID: "cfg2", VariationName: "v2", ModelName: "m", CreatedAt: now, UpdatedAt: now},
				Response:      types.APIResponse{ResponseStatus: types.ResponseStatusSuccess, ResponseText: "a creative vivid story", ResponseTimeMs: 50, UsageMetadata: map[string]interface{}{"total_tokens": 10, "prompt_tokens": 5, "completion_tokens": 5}},
			},
		},
	}

	cr, err := bc.Compare(context.Background(), res)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if cr == nil {
		t.Fatalf("expected non-nil comparison result")
	}
	if cr.ExecutionRunID != "run-test" {
		t.Fatalf("wrong run id")
	}
	if cr.BestConfigurationID == "" {
		t.Fatalf("expected best configuration id")
	}
	if cr.ConfigurationScores == nil {
		t.Fatalf("expected configuration scores")
	}
	if _, ok := cr.ConfigurationScores["_summary"]; !ok {
		t.Fatalf("expected _summary")
	}
	// Expect cfg2 to win (faster and creative text)
	if cr.BestConfigurationID != "cfg2" {
		t.Fatalf("expected cfg2 as best, got %s", cr.BestConfigurationID)
	}
}
