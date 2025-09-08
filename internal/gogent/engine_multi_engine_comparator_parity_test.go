package gogent

import (
    "context"
    "os"
    "testing"
    "time"

    "github.com/google/uuid"
    "gogent/internal/types"
)

// TestEngineMultiEngineComparatorParity ensures engine multi + engine comparator produces a single stored comparison with expected structure
func TestEngineMultiEngineComparatorParity(t *testing.T) {
    dsn := os.Getenv("TEST_MYSQL_DSN")
    if dsn == "" {
        t.Skip("TEST_MYSQL_DSN not set; skipping DB integration test")
    }

    client, err := NewClient(dsn, &types.GeminiClientConfig{MaxRetries: 1, TimeoutSecs: 5}, nil)
    if err != nil { t.Fatalf("failed to create client: %v", err) }
    defer client.Close()

    ctx := context.Background()
    userID := "system"
    now := time.Now()
    req := &types.MultiExecutionRequest{
        ExecutionRunName: "engine-engine-compare",
        BasePrompt:       "hello",
        Configurations: []types.APIConfiguration{
            {ID: uuid.New().String(), UserID: userID, VariationName: "ee-v1", ModelName: "gemini-1.5-pro", CreatedAt: now, UpdatedAt: now},
            {ID: uuid.New().String(), UserID: userID, VariationName: "ee-v2", ModelName: "gemini-1.5-pro", CreatedAt: now, UpdatedAt: now},
        },
    }

    // Engine multi + engine comparator are default; no flags needed
    res, err := client.ExecuteMultiVariation(ctx, userID, req)
    if err != nil { t.Fatalf("engine multi+comparator failed: %v", err) }
    if len(res.Results) != 2 { t.Fatalf("expected 2 results, got %d", len(res.Results)) }

    comps, err := client.queries.GetComparisonResultsByExecutionRun(ctx, res.ExecutionRun.ID)
    if err != nil { t.Fatalf("list comparisons failed: %v", err) }
    if len(comps) != 1 { t.Fatalf("expected exactly 1 comparison stored, got %d", len(comps)) }

    // Fetch parsed comparison
    cr, err := client.GetComparisonResult(ctx, res.ExecutionRun.ID)
    if err != nil { t.Fatalf("get comparison failed: %v", err) }
    if cr.BestConfigurationID == "" { t.Fatalf("expected best configuration id") }
    if cr.ConfigurationScores == nil { t.Fatalf("expected configuration scores") }
    if _, ok := cr.ConfigurationScores["_summary"]; !ok { t.Fatalf("expected _summary in configuration scores") }

    // Check at least one config entry contains overall_score
    hasOverall := false
    for k, v := range cr.ConfigurationScores {
        if k == "_summary" { continue }
        if m, ok := v.(map[string]interface{}); ok {
            if _, ok := m["overall_score"]; ok { hasOverall = true; break }
        }
    }
    if !hasOverall { t.Fatalf("expected at least one per-config overall_score") }
}
