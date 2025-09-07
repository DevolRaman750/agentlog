package gogent

import (
    "context"
    "os"
    "testing"
    "time"

    "github.com/google/uuid"
    "gogent/internal/types"
)

// TestEngineMultiResultsParity ensures both legacy and engine multi paths return results for all configurations
func TestEngineMultiResultsParity(t *testing.T) {
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
        cfg1 := types.APIConfiguration{ID: uuid.New().String(), UserID: userID, VariationName: "res-v1", ModelName: "gemini-1.5-pro", CreatedAt: now, UpdatedAt: now}
        cfg2 := types.APIConfiguration{ID: uuid.New().String(), UserID: userID, VariationName: "res-v2", ModelName: "gemini-1.5-pro", CreatedAt: now, UpdatedAt: now}
        return &types.MultiExecutionRequest{ExecutionRunName: "results-parity", BasePrompt: "hello", Configurations: []types.APIConfiguration{cfg1, cfg2}}
    }

    // legacy
    client.SetOptions(ClientOptions{UseNewEngineMulti: false})
    rLegacy, err := client.ExecuteMultiVariation(ctx, userID, mkReq())
    if err != nil { t.Fatalf("legacy multi failed: %v", err) }
    if len(rLegacy.Results) != 2 { t.Fatalf("expected 2 results (legacy), got %d", len(rLegacy.Results)) }

    // engine multi
    client.SetOptions(ClientOptions{UseNewEngineMulti: true})
    rEngine, err := client.ExecuteMultiVariation(ctx, userID, mkReq())
    if err != nil { t.Fatalf("engine multi failed: %v", err) }
    if len(rEngine.Results) != 2 { t.Fatalf("expected 2 results (engine), got %d", len(rEngine.Results)) }
}

