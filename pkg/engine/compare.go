package engine

import (
    "strconv"
    "strings"

    "gogent/internal/types"
)

// ResponseTimeScore: lower response time => higher score (cap at 1.0)
func ResponseTimeScore(responseTimeMs int32) float64 {
    if responseTimeMs <= 0 {
        return 0.0
    }
    score := 1000.0 / float64(responseTimeMs)
    if score > 1.0 {
        score = 1.0
    }
    return score
}

// CreativityScore approximates creativity from config temperature and hints in text
func CreativityScore(config types.APIConfiguration, response types.APIResponse) float64 {
    base := 0.5
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
    boost := float64(count) * 0.03
    if boost > 0.3 { boost = 0.3 }
    return base + boost
}

// CoherenceScore approximates coherence from structure markers
func CoherenceScore(responseText string) float64 {
    if len(responseText) < 50 { return 0.3 }
    indicators := []string{"first", "second", "third", "however", "therefore", "because", "although", "furthermore", "in conclusion"}
    count := 0
    lower := strings.ToLower(responseText)
    for _, w := range indicators {
        if strings.Contains(lower, w) { count++ }
    }
    base := 0.6
    boost := float64(count) * 0.05
    if boost > 0.4 { boost = 0.4 }
    return base + boost
}

// TokenEfficiencyScore favors more content per token
func TokenEfficiencyScore(response types.APIResponse) float64 {
    if response.UsageMetadata == nil { return 0.5 }
    total := GetTokenCount(response.UsageMetadata, "total_tokens")
    if total <= 0 { return 0.5 }
    length := len(response.ResponseText)
    if length == 0 { return 0.0 }
    ratio := float64(length) / float64(total)
    if ratio > 8.0 { ratio = 8.0 }
    return ratio / 8.0
}

// SafetyScore reduces for unsafe indicators
func SafetyScore(responseText string) float64 {
    lower := strings.ToLower(responseText)
    indicators := []string{"harm", "danger", "illegal", "inappropriate", "offensive", "violent"}
    count := 0
    for _, w := range indicators { if strings.Contains(lower, w) { count++ } }
    base := 1.0
    penalty := float64(count) * 0.1
    if penalty > 0.7 { penalty = 0.7 }
    return base - penalty
}

// CostEffectivenessScore: fewer tokens => higher score
func CostEffectivenessScore(response types.APIResponse) float64 {
    if response.UsageMetadata == nil { return 0.5 }
    total := GetTokenCount(response.UsageMetadata, "total_tokens")
    if total <= 0 { return 0.5 }
    switch {
    case total <= 100:
        return 1.0
    case total <= 500:
        return 0.8
    case total <= 1000:
        return 0.6
    default:
        return 0.3
    }
}

// EstimatedCost (USD) based on Gemini 1.5 Pro pricing
func EstimatedCost(response types.APIResponse) float64 {
    if response.UsageMetadata == nil { return 0.0 }
    prompt := GetTokenCount(response.UsageMetadata, "prompt_tokens")
    completion := GetTokenCount(response.UsageMetadata, "completion_tokens")
    return (float64(prompt) * 3.50 / 1_000_000) + (float64(completion) * 10.50 / 1_000_000)
}

func GetTokenCount(metadata map[string]interface{}, key string) int {
    if v, ok := metadata[key]; ok {
        switch vv := v.(type) {
        case float64:
            return int(vv)
        case int:
            return vv
        case string:
            if n, err := strconv.Atoi(vv); err == nil { return n }
        }
    }
    return 0
}

func GetScoreFromMap(scores map[string]interface{}, configName, scoreKey string) float64 {
    if config, ok := scores[configName]; ok {
        if m, ok := config.(map[string]interface{}); ok {
            if v, ok := m[scoreKey]; ok {
                if f, ok := v.(float64); ok { return f }
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
                    if f > highest { highest = f; name = cfg }
                }
            }
        }
    }
    return name
}

