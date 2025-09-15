package engine

import (
	"context"
	"time"

	"github.com/google/uuid"

	"gogent/internal/types"
)

// BasicComparator implements Comparator using engine helper scores.
// Note: Storage is left to the caller; this comparator returns a comparison result only.
type BasicComparator struct{}

func (bc *BasicComparator) Compare(_ context.Context, result *types.ExecutionResult) (*types.ComparisonResult, error) {
	comp := &types.ComparisonResult{
		ID:                  uuid.New().String(),
		ExecutionRunID:      result.ExecutionRun.ID,
		ComparisonType:      "quality_balance",
		MetricName:          "overall_score",
		ConfigurationScores: map[string]interface{}{},
		CreatedAt:           time.Now(),
	}

	var bestID string
	var bestCfg *types.APIConfiguration
	bestScore := -1.0

	totalPrompt, totalCompletion, totalTokens := 0, 0, 0
	totalCost := 0.0

	for _, vr := range result.Results {
		cfg := vr.Configuration
		resp := vr.Response

		rts := ResponseTimeScore(resp.ResponseTimeMs)
		crs := CreativityScore(cfg, resp)
		chs := CoherenceScore(resp.ResponseText)
		tes := TokenEfficiencyScore(resp)
		sfs := SafetyScore(resp.ResponseText)
		ces := CostEffectivenessScore(resp)
		est := EstimatedCost(resp)

		pt := GetTokenCount(resp.UsageMetadata, "prompt_tokens")
		ct := GetTokenCount(resp.UsageMetadata, "completion_tokens")
		tt := GetTokenCount(resp.UsageMetadata, "total_tokens")

		totalPrompt += pt
		totalCompletion += ct
		totalTokens += tt
		totalCost += est

		// Weighted overall score aligned with legacy implementation
		// Legacy weights: RT 0.20, Creativity 0.25, Coherence 0.25, TokenEff 0.15, Safety 0.10, CostEff 0.05
		overall := 0.20*rts + 0.25*crs + 0.25*chs + 0.15*tes + 0.10*sfs + 0.05*ces

		comp.ConfigurationScores[cfg.ID] = map[string]interface{}{
			"response_time_score": rts,
			"creativity_score":    crs,
			"coherence_score":     chs,
			"token_efficiency":    tes,
			"safety_score":        sfs,
			"cost_effectiveness":  ces,
			"estimated_cost_usd":  est,
			"prompt_tokens":       pt,
			"completion_tokens":   ct,
			"total_tokens":        tt,
			"overall_score":       overall,
			"configuration_name":  cfg.VariationName,
		}

		if overall > bestScore {
			bestScore = overall
			bestID = cfg.ID
			c := cfg // copy
			bestCfg = &c
		}
	}

	comp.BestConfigurationID = bestID
	comp.BestConfiguration = bestCfg
	comp.AllConfigurations = make([]types.APIConfiguration, 0, len(result.Results))
	for _, vr := range result.Results {
		comp.AllConfigurations = append(comp.AllConfigurations, vr.Configuration)
	}
	comp.ConfigurationScores["_summary"] = map[string]interface{}{
		"total_variations":         len(result.Results),
		"success_count":            result.SuccessCount,
		"error_count":              result.ErrorCount,
		"total_time_ms":            result.TotalTime,
		"total_prompt_tokens":      totalPrompt,
		"total_completion_tokens":  totalCompletion,
		"total_tokens":             totalTokens,
		"estimated_total_cost_usd": totalCost,
		"average_cost_per_variation": func() float64 {
			if len(result.Results) == 0 {
				return 0
			}
			return totalCost / float64(len(result.Results))
		}(),
	}

	if bestCfg != nil {
		comp.AnalysisNotes = "Best Overall: " + bestCfg.VariationName
	}

	return comp, nil
}

func (bc *BasicComparator) Store(_ context.Context, userID string, comp *types.ComparisonResult) error {
	// Intentionally not implemented; storage should be handled by adapter or caller.
	return nil
}
