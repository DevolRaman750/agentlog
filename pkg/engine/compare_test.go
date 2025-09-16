package engine

import (
	"gogent/internal/types"
	"testing"
)

func TestResponseTimeScore(t *testing.T) {
	if ResponseTimeScore(0) != 0 {
		t.Fatalf("zero time => 0")
	}
	if ResponseTimeScore(500) <= 0 {
		t.Fatalf("expected positive score")
	}
	if ResponseTimeScore(1) > 1 {
		t.Fatalf("capped at 1.0")
	}
}

func TestCreativityScore_IncreasesWithIndicators(t *testing.T) {
	cfg := types.APIConfiguration{}
	base := CreativityScore(cfg, types.APIResponse{ResponseText: "plain"})
	boosted := CreativityScore(cfg, types.APIResponse{ResponseText: "a creative vivid story"})
	if boosted <= base {
		t.Fatalf("expected boosted > base: %f <= %f", boosted, base)
	}
}

func TestFindFastest(t *testing.T) {
	a := types.VariationResult{Response: types.APIResponse{ResponseTimeMs: 50}}
	b := types.VariationResult{Response: types.APIResponse{ResponseTimeMs: 10}}
	fastest := FindFastest([]types.VariationResult{a, b})
	if fastest == nil || fastest.Response.ResponseTimeMs != 10 {
		t.Fatalf("expected 10ms fastest")
	}
}

func TestTokenEfficiencyScore(t *testing.T) {
	resp := types.APIResponse{ResponseText: "hello world", UsageMetadata: map[string]interface{}{"total_tokens": 2}}
	s := TokenEfficiencyScore(resp)
	if s <= 0 {
		t.Fatalf("expected positive efficiency score")
	}
}

func TestCoherenceScore(t *testing.T) {
	low := CoherenceScore("short text with little structure and no clear markers present")
	hi := CoherenceScore("First, we explain. However, therefore, in conclusion this has structure.")
	if hi <= low {
		t.Fatalf("expected coherence with markers > low: hi=%f low=%f", hi, low)
	}
}

func TestEstimatedCost(t *testing.T) {
	resp := types.APIResponse{UsageMetadata: map[string]interface{}{"prompt_tokens": 1000, "completion_tokens": 1000}}
	cost := EstimatedCost(resp)
	if cost <= 0 {
		t.Fatalf("expected positive cost, got %f", cost)
	}
}

func TestGetTokenCount(t *testing.T) {
	meta := map[string]interface{}{"a": 10, "b": 20.0, "c": "30", "d": "x"}
	if GetTokenCount(meta, "a") != 10 {
		t.Fatalf("expected 10")
	}
	if GetTokenCount(meta, "b") != 20 {
		t.Fatalf("expected 20")
	}
	if GetTokenCount(meta, "c") != 30 {
		t.Fatalf("expected 30")
	}
	if GetTokenCount(meta, "d") != 0 {
		t.Fatalf("expected 0 for invalid string")
	}
}

func TestFindMostCreative(t *testing.T) {
	scores := map[string]interface{}{
		"A": map[string]interface{}{"creativity_score": 0.6},
		"B": map[string]interface{}{"creativity_score": 0.9},
		"C": map[string]interface{}{"creativity_score": 0.7},
	}
	if FindMostCreative(scores) != "B" {
		t.Fatalf("expected B as most creative")
	}
}
