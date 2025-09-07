package gogent

import (
    "context"
    "os"
    "testing"
    "time"

    "github.com/google/uuid"
    "gogent/internal/types"
)

// TestEngineComparatorParity ensures comparison assembly parity between legacy and engine comparator
func TestEngineComparatorParity(t *testing.T) {
    dsn := os.Getenv("TEST_MYSQL_DSN")
    if dsn == "" {
        t.Skip("TEST_MYSQL_DSN not set; skipping DB integration test")
    }

    client, err := NewClient(dsn, &types.GeminiClientConfig{MaxRetries: 1, TimeoutSecs: 5}, nil)
    if err != nil { t.Fatalf("failed to create client: %v", err) }
    defer client.Close()

    ctx := context.Background()
    userID := "system"

    mkReq := func() *types.MultiExecutionRequest {
        now := time.Now()
        cfg1 := types.APIConfiguration{ID: uuid.New().String(), UserID: userID, VariationName: "cmp2-v1", ModelName: "gemini-1.5-pro", CreatedAt: now, UpdatedAt: now}
        cfg2 := types.APIConfiguration{ID: uuid.New().String(), UserID: userID, VariationName: "cmp2-v2", ModelName: "gemini-1.5-pro", CreatedAt: now, UpdatedAt: now}
        return &types.MultiExecutionRequest{
            ExecutionRunName:      "comparator-parity",
            BasePrompt:            "check comparator parity",
            EnableFunctionCalling: false,
            Configurations:        []types.APIConfiguration{cfg1, cfg2},
        }
    }

    runOnce := func(useEngineComparator bool) (string, error) {
        client.SetOptions(ClientOptions{UseEngineComparator: useEngineComparator})
        res, err := client.ExecuteMultiVariation(ctx, userID, mkReq())
        if err != nil { return "", err }
        return res.ExecutionRun.ID, nil
    }

    legacyRun, err := runOnce(false)
    if err != nil { t.Fatalf("legacy comparator run failed: %v", err) }
    engineRun, err := runOnce(true)
    if err != nil { t.Fatalf("engine comparator run failed: %v", err) }

    // Compare presence + minimal structure
    lcr, err := client.GetComparisonResult(ctx, legacyRun)
    if err != nil { t.Fatalf("legacy get comparison: %v", err) }
    ecr, err := client.GetComparisonResult(ctx, engineRun)
    if err != nil { t.Fatalf("engine get comparison: %v", err) }

    if lcr == nil || ecr == nil { t.Fatalf("expected non-nil comparison results") }
    if lcr.BestConfigurationID == "" || ecr.BestConfigurationID == "" {
        t.Fatalf("expected non-empty BestConfigurationID for both")
    }
    if lcr.ConfigurationScores == nil || ecr.ConfigurationScores == nil {
        t.Fatalf("expected ConfigurationScores for both")
    }
    // _summary present in both
    if _, ok := lcr.ConfigurationScores["_summary"]; !ok { t.Fatalf("legacy missing _summary") }
    if _, ok := ecr.ConfigurationScores["_summary"]; !ok { t.Fatalf("engine missing _summary") }

    // Ensure each has at least one config entry with overall_score
    hasOverall := func(cr *types.ComparisonResult) bool {
        for k, v := range cr.ConfigurationScores {
            if k == "_summary" { continue }
            if m, ok := v.(map[string]interface{}); ok {
                if _, ok := m["overall_score"]; ok {
                    return true
                }
            }
        }
        return false
    }
    if !hasOverall(lcr) || !hasOverall(ecr) {
        t.Fatalf("expected at least one configuration entry with overall_score in both paths")
    }

    // Check a minimal set of per-config metric keys exist in both paths
    requiredKeys := []string{"response_time_score", "creativity_score", "coherence_score", "token_efficiency"}
    checkKeys := func(cr *types.ComparisonResult) bool {
        for cfgID, v := range cr.ConfigurationScores {
            if cfgID == "_summary" { continue }
            if m, ok := v.(map[string]interface{}); ok {
                missing := false
                for _, k := range requiredKeys {
                    if _, ok := m[k]; !ok {
                        missing = true
                        break
                    }
                }
                if !missing { return true }
            }
        }
        return false
    }
    if !checkKeys(lcr) || !checkKeys(ecr) {
        t.Fatalf("expected required per-config metric keys in both paths")
    }
}
