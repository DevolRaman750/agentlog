package gogent

import (
    "context"
    "os"
    "testing"
    "time"

    "github.com/google/uuid"
    "gogent/internal/types"
)

// TestExecuteMultiVariation_ComparisonParity validates that both paths store a comparison result
func TestExecuteMultiVariation_ComparisonParity(t *testing.T) {
    dsn := os.Getenv("TEST_MYSQL_DSN")
    if dsn == "" {
        t.Skip("TEST_MYSQL_DSN not set; skipping DB integration test")
    }

    client, err := NewClient(dsn, &types.GeminiClientConfig{MaxRetries: 1, TimeoutSecs: 5}, nil)
    if err != nil {
        t.Fatalf("failed to create client: %v", err)
    }
    defer client.Close()

    ctx := context.Background()
    userID := "system"

    mkReq := func() *types.MultiExecutionRequest {
        now := time.Now()
        cfg1 := types.APIConfiguration{ID: uuid.New().String(), UserID: userID, VariationName: "cmp-v1", ModelName: "gemini-1.5-pro", CreatedAt: now, UpdatedAt: now}
        cfg2 := types.APIConfiguration{ID: uuid.New().String(), UserID: userID, VariationName: "cmp-v2", ModelName: "gemini-1.5-pro", CreatedAt: now, UpdatedAt: now}
        return &types.MultiExecutionRequest{
            ExecutionRunName:      "comparison-parity",
            BasePrompt:            "check comparison",
            EnableFunctionCalling: false,
            Configurations:        []types.APIConfiguration{cfg1, cfg2},
        }
    }

    runOnce := func(useEngine bool) (string, error) {
        client.SetOptions(ClientOptions{UseNewEngineSingle: useEngine, UseNewEngineMulti: useEngine})
        res, err := client.ExecuteMultiVariation(ctx, userID, mkReq())
        if err != nil {
            return "", err
        }
        return res.ExecutionRun.ID, nil
    }

    legacyRunID, err := runOnce(false)
    if err != nil { t.Fatalf("legacy run failed: %v", err) }
    engineRunID, err := runOnce(true)
    if err != nil { t.Fatalf("engine run failed: %v", err) }

    // Use high-level getters to parse JSON payloads
    legacyCR, err := client.GetComparisonResult(ctx, legacyRunID)
    if err != nil { t.Fatalf("legacy GetComparisonResult failed: %v", err) }
    engineCR, err := client.GetComparisonResult(ctx, engineRunID)
    if err != nil { t.Fatalf("engine GetComparisonResult failed: %v", err) }

    if legacyCR == nil || engineCR == nil {
        t.Fatalf("expected non-nil comparison results")
    }
    // Basic payload checks
    if legacyCR.BestConfigurationID == "" || engineCR.BestConfigurationID == "" {
        t.Fatalf("expected BestConfigurationID to be set for both runs")
    }
    if legacyCR.ConfigurationScores == nil || engineCR.ConfigurationScores == nil {
        t.Fatalf("expected ConfigurationScores for both runs")
    }

    // Verify _summary exists and has reasonable totals
    checkSummary := func(cr *types.ComparisonResult) {
        s, ok := cr.ConfigurationScores["_summary"].(map[string]interface{})
        if !ok {
            t.Fatalf("expected _summary in configuration scores")
        }
        if tv, ok := s["total_variations"]; ok {
            // accept either float64 (from JSON) or int
            switch v := tv.(type) {
            case float64:
                if v < 2 {
                    t.Fatalf("expected total_variations >= 2, got %v", v)
                }
            case int:
                if v < 2 {
                    t.Fatalf("expected total_variations >= 2, got %v", v)
                }
            }
        } else {
            t.Fatalf("expected total_variations in _summary")
        }
    }
    checkSummary(legacyCR)
    checkSummary(engineCR)

    // Verify each has at least 2 configuration entries (excluding _summary)
    countConfigKeys := func(cr *types.ComparisonResult) (int, map[string]struct{}) {
        keys := map[string]struct{}{}
        for k := range cr.ConfigurationScores {
            if k == "_summary" { continue }
            keys[k] = struct{}{}
        }
        return len(keys), keys
    }
    lcount, lkeys := countConfigKeys(legacyCR)
    ecount, ekeys := countConfigKeys(engineCR)
    if lcount < 2 || ecount < 2 {
        t.Fatalf("expected >=2 configuration score entries; legacy=%d engine=%d", lcount, ecount)
    }

    // BestConfigurationID should be among config keys
    if _, ok := lkeys[legacyCR.BestConfigurationID]; !ok {
        t.Fatalf("legacy BestConfigurationID not found in configuration scores")
    }
    if _, ok := ekeys[engineCR.BestConfigurationID]; !ok {
        t.Fatalf("engine BestConfigurationID not found in configuration scores")
    }
}
