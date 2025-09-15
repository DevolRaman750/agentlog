package engine

import (
	"strconv"
	"strings"

	"gogent/internal/types"
)

// Tuning and scoring constants used across comparison helpers.
const (
	// Response time
	rtScale    = 1000.0
	rtMaxScore = 1.0

	// Creativity
	creativityDefaultBase   = 0.5
	creativityBoostPerMatch = 0.03
	creativityBoostMax      = 0.3

	// Coherence
	coherenceMinLength     = 50
	coherenceBase          = 0.6
	coherenceBoostPerMatch = 0.05
	coherenceBoostMax      = 0.4

	// Token efficiency
	tokenEffDefault  = 0.5
	tokenEffMaxRatio = 8.0

	// Safety
	safetyBase          = 1.0
	safetyPenaltyPerHit = 0.1
	safetyPenaltyMax    = 0.7

	// Cost effectiveness thresholds
	ceThreshLow  = 100
	ceThreshMid  = 500
	ceThreshHigh = 1000
	ceScoreLow   = 1.0
	ceScoreMid   = 0.8
	ceScoreHigh  = 0.6
	ceScoreMax   = 0.3

	// Pricing (USD per million tokens)
	pricePerMTokensPrompt     = 3.50
	pricePerMTokensCompletion = 10.50
	oneMillion                = 1_000_000.0
)

// ResponseTimeScore: lower response time => higher score (cap at 1.0)
func ResponseTimeScore(responseTimeMs int64) float64 {
	if responseTimeMs <= 0 {
		return 0.0
	}
	score := rtScale / float64(responseTimeMs)
	if score > rtMaxScore {
		score = rtMaxScore
	}
	return score
}

// CreativityScore approximates creativity from config temperature and hints in text
func CreativityScore(config types.APIConfiguration, response types.APIResponse) float64 {
	base := creativityDefaultBase
	if config.Temperature != nil {
		base = float64(*config.Temperature)
	}
	text := response.ResponseText
	indicators := []string{"imagine", "creative", "artistic", "vivid", "colorful", "metaphor", "poetry", "story", "narrative"}
	count := 0
	lower := strings.ToLower(text)
	for _, w := range indicators {
		if strings.Contains(lower, w) {
			count++
		}
	}
	boost := float64(count) * creativityBoostPerMatch
	if boost > creativityBoostMax {
		boost = creativityBoostMax
	}
	return base + boost
}

// CoherenceScore approximates coherence from structure markers
func CoherenceScore(responseText string) float64 {
	if len(responseText) < coherenceMinLength {
		return ceScoreMax
	}
	indicators := []string{"first", "second", "third", "however", "therefore", "because", "although", "furthermore", "in conclusion"}
	count := 0
	lower := strings.ToLower(responseText)
	for _, w := range indicators {
		if strings.Contains(lower, w) {
			count++
		}
	}
	base := coherenceBase
	boost := float64(count) * coherenceBoostPerMatch
	if boost > coherenceBoostMax {
		boost = coherenceBoostMax
	}
	return base + boost
}

// TokenEfficiencyScore favors more content per token
func TokenEfficiencyScore(response types.APIResponse) float64 {
	if response.UsageMetadata == nil {
		return tokenEffDefault
	}
	total := GetTokenCount(response.UsageMetadata, "total_tokens")
	if total <= 0 {
		return tokenEffDefault
	}
	length := len(response.ResponseText)
	if length == 0 {
		return 0.0
	}
	ratio := float64(length) / float64(total)
	if ratio > tokenEffMaxRatio {
		ratio = tokenEffMaxRatio
	}
	return ratio / tokenEffMaxRatio
}

// SafetyScore reduces for unsafe indicators
func SafetyScore(responseText string) float64 {
	lower := strings.ToLower(responseText)
	indicators := []string{"harm", "danger", "illegal", "inappropriate", "offensive", "violent"}
	count := 0
	for _, w := range indicators {
		if strings.Contains(lower, w) {
			count++
		}
	}
	base := safetyBase
	penalty := float64(count) * safetyPenaltyPerHit
	if penalty > safetyPenaltyMax {
		penalty = safetyPenaltyMax
	}
	return base - penalty
}

// CostEffectivenessScore: fewer tokens => higher score
func CostEffectivenessScore(response types.APIResponse) float64 {
	if response.UsageMetadata == nil {
		return tokenEffDefault
	}
	total := GetTokenCount(response.UsageMetadata, "total_tokens")
	if total <= 0 {
		return tokenEffDefault
	}
	switch {
	case total <= ceThreshLow:
		return ceScoreLow
	case total <= ceThreshMid:
		return ceScoreMid
	case total <= ceThreshHigh:
		return ceScoreHigh
	default:
		return ceScoreMax
	}
}

// EstimatedCost (USD) based on Gemini 1.5 Pro pricing
func EstimatedCost(response types.APIResponse) float64 {
	if response.UsageMetadata == nil {
		return 0.0
	}
	prompt := GetTokenCount(response.UsageMetadata, "prompt_tokens")
	completion := GetTokenCount(response.UsageMetadata, "completion_tokens")
	return (float64(prompt) * pricePerMTokensPrompt / oneMillion) +
		(float64(completion) * pricePerMTokensCompletion / oneMillion)
}

func GetTokenCount(metadata map[string]interface{}, key string) int {
	if v, ok := metadata[key]; ok {
		switch vv := v.(type) {
		case float64:
			return int(vv)
		case int:
			return vv
		case string:
			if n, err := strconv.Atoi(vv); err == nil {
				return n
			}
		}
	}
	return 0
}

func GetScoreFromMap(scores map[string]interface{}, configName, scoreKey string) float64 {
	if config, ok := scores[configName]; ok {
		if m, ok := config.(map[string]interface{}); ok {
			if v, ok := m[scoreKey]; ok {
				if f, ok := v.(float64); ok {
					return f
				}
			}
		}
	}
	return 0.0
}

func FindFastest(results []types.VariationResult) *types.VariationResult {
	var fastest *types.VariationResult
	for i := range results {
		if fastest == nil || results[i].Response.ResponseTimeMs < fastest.Response.ResponseTimeMs {
			fastest = &results[i]
		}
	}
	return fastest
}

func FindMostCreative(scores map[string]interface{}) string {
	var name string
	highest := -1.0
	for cfg, data := range scores {
		if m, ok := data.(map[string]interface{}); ok {
			if v, ok := m["creativity_score"]; ok {
				if f, ok := v.(float64); ok {
					if f > highest {
						highest = f
						name = cfg
					}
				}
			}
		}
	}
	return name
}
