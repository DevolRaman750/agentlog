package engine

import (
	"context"
	"gogent/internal/types"
	"testing"
	"time"
)

type fakeComparator struct {
	compared bool
	stored   bool
}

func (f *fakeComparator) Compare(ctx context.Context, res *types.ExecutionResult) (*types.ComparisonResult, error) {
	f.compared = true
	return &types.ComparisonResult{ID: "cmp1", ExecutionRunID: res.ExecutionRun.ID}, nil
}
func (f *fakeComparator) Store(ctx context.Context, userID string, comp *types.ComparisonResult) error {
	f.stored = true
	return nil
}

func TestEngine_ExecuteMulti_Basic(t *testing.T) {
	fp := &fakeProvider{resp: &types.APIResponse{ResponseStatus: types.ResponseStatusSuccess, ResponseText: "ok", ResponseTimeMs: 2, CreatedAt: time.Now()}}
	fs := &fakeStore{}
	fl := &fakeLogger{}
	fc := &fakeComparator{}
	eng := &Engine{Provider: fp, Store: fs, Logger: fl, Compare: fc}

	cfgs := []types.APIConfiguration{{ID: "c1", VariationName: "v1", ModelName: "m"}, {ID: "c2", VariationName: "v2", ModelName: "m"}}
	res, err := eng.ExecuteMulti(context.Background(), "u", "runX", cfgs, "p", "ctx")
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if len(res.Results) != 2 {
		t.Fatalf("expected 2 results")
	}
	if res.Comparison == nil || res.Comparison.ID == "" {
		t.Fatalf("expected comparison")
	}
	if !fc.compared || !fc.stored {
		t.Fatalf("expected comparator used")
	}
}
