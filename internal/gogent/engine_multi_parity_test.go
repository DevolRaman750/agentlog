package gogent

import (
    "context"
    "os"
    "testing"
    "time"

    "github.com/google/uuid"
    "gogent/internal/db"
    "gogent/internal/types"
)

// TestExecuteMultiVariation_Parity ensures legacy vs engine path both produce
// reasonable flow events and API req/resp rows for multi-variation runs.
func TestExecuteMultiVariation_Parity(t *testing.T) {
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
        cfg1 := types.APIConfiguration{ID: uuid.New().String(), UserID: userID, VariationName: "v1", ModelName: "gemini-1.5-pro", CreatedAt: now, UpdatedAt: now}
        cfg2 := types.APIConfiguration{ID: uuid.New().String(), UserID: userID, VariationName: "v2", ModelName: "gemini-1.5-pro", CreatedAt: now, UpdatedAt: now}
        return &types.MultiExecutionRequest{
            ExecutionRunName:      "multi-parity",
            BasePrompt:            "hello multi",
            EnableFunctionCalling: false,
            Configurations:        []types.APIConfiguration{cfg1, cfg2},
        }
    }

    runOnce := func(useEngine bool) (string, error) {
        client.SetOptions(ClientOptions{UseNewEngineSingle: useEngine, UseNewEngineMulti: useEngine})
        req := mkReq()
        res, err := client.ExecuteMultiVariation(ctx, userID, req)
        if err != nil {
            return "", err
        }
        return res.ExecutionRun.ID, nil
    }

    legacyRunID, err := runOnce(false)
    if err != nil { t.Fatalf("legacy run failed: %v", err) }
    engineRunID, err := runOnce(true)
    if err != nil { t.Fatalf("engine run failed: %v", err) }

    // Flow events existence
    legacyEvents, err := client.queries.GetExecutionFlowEventsByRun(ctx, legacyRunID)
    if err != nil { t.Fatalf("get legacy events: %v", err) }
    engineEvents, err := client.queries.GetExecutionFlowEventsByRun(ctx, engineRunID)
    if err != nil { t.Fatalf("get engine events: %v", err) }
    if len(legacyEvents) == 0 || len(engineEvents) == 0 {
        t.Fatalf("expected flow events for both runs; legacy=%d engine=%d", len(legacyEvents), len(engineEvents))
    }

    // Requests/responses existence
    reqs, err := client.queries.ListAPIRequests(ctx, db.ListAPIRequestsParams{UserID: userID, Limit: 100, Offset: 0})
    if err != nil { t.Fatalf("list api requests: %v", err) }
    countByRun := func(runID string) int {
        n := 0
        for _, r := range reqs { if r.ExecutionRunID == runID { n++ } }
        return n
    }
    if countByRun(legacyRunID) < 2 || countByRun(engineRunID) < 2 {
        t.Fatalf("expected >=2 api requests for both runs; legacy=%d engine=%d", countByRun(legacyRunID), countByRun(engineRunID))
    }

    resps, err := client.queries.ListAPIResponses(ctx, db.ListAPIResponsesParams{UserID: userID, Limit: 100, Offset: 0})
    if err != nil { t.Fatalf("list api responses: %v", err) }
    hasRespForRun := func(runID string) bool {
        // match by request->run
        for _, r := range reqs {
            if r.ExecutionRunID != runID { continue }
            for _, s := range resps { if s.RequestID == r.ID { return true } }
        }
        return false
    }
    if !hasRespForRun(legacyRunID) || !hasRespForRun(engineRunID) {
        t.Fatalf("expected at least one response row for each run")
    }
}

