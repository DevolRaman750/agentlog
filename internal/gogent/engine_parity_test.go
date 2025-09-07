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

// TestExecuteSingleVariation_Parity ensures legacy path and new engine path emit comparable flow events
func TestExecuteSingleVariation_Parity(t *testing.T) {
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

    // helper to run a single variation and return run id and flow events
    runOnce := func(useEngine bool) (string, []db.ExecutionFlowEvent, error) {
        client.SetOptions(ClientOptions{UseNewEngineSingle: useEngine})

        run, err := client.CreateExecutionRun(ctx, userID, "parity-run", "", false, nil)
        if err != nil { return "", nil, err }

        cfg := &types.APIConfiguration{
            ID:            uuid.New().String(),
            UserID:        userID,
            VariationName: "parity-variation",
            ModelName:     "gemini-1.5-pro", // any model; may fall back to mock
            CreatedAt:     time.Now(),
            UpdatedAt:     time.Now(),
        }
        if err := client.CreateAPIConfiguration(ctx, userID, cfg); err != nil { return "", nil, err }

        // Execute
        _, _ = client.executeSingleVariation(ctx, userID, run.ID, cfg, "hello parity", "ctx")

        // Read flow events for this run
        events, err := client.queries.GetExecutionFlowEventsByRun(ctx, run.ID)
        if err != nil { return "", nil, err }
        return run.ID, events, nil
    }

    legacyRunID, legacyEvents, err := runOnce(false)
    if err != nil { t.Fatalf("legacy path failed: %v", err) }

    engineRunID, engineEvents, err := runOnce(true)
    if err != nil { t.Fatalf("engine path failed: %v", err) }

    if len(legacyEvents) == 0 || len(engineEvents) == 0 {
        t.Fatalf("expected flow events in both paths; got legacy=%d engine=%d", len(legacyEvents), len(engineEvents))
    }

    // Compare basic shape: first event type and statuses count
    if legacyEvents[0].EventType != engineEvents[0].EventType {
        t.Fatalf("first event type mismatch: legacy=%s engine=%s", legacyEvents[0].EventType, engineEvents[0].EventType)
    }

    // Count success/error/pending
    countStatuses := func(evts []db.ExecutionFlowEvent) (int, int, int) {
        var pend, succ, errc int
        for _, e := range evts {
            if e.Status.Valid {
                switch e.Status.ExecutionFlowEventsStatus {
                case db.ExecutionFlowEventsStatusPending:
                    pend++
                case db.ExecutionFlowEventsStatusSuccess:
                    succ++
                case db.ExecutionFlowEventsStatusError:
                    errc++
                }
            }
        }
        return pend, succ, errc
    }

    lp, ls, le := countStatuses(legacyEvents)
    ep, es, ee := countStatuses(engineEvents)

    if ls == 0 && le == 0 {
        t.Fatalf("legacy path produced no terminal statuses (success/error)")
    }
    if es == 0 && ee == 0 {
        t.Fatalf("engine path produced no terminal statuses (success/error)")
    }
    // pending count should be at least comparable (allow small differences)
    if (lp == 0) != (ep == 0) {
        t.Fatalf("pending count disparity: legacy=%d engine=%d", lp, ep)
    }

    // Parity on API requests/responses existence scoped by execution run
    reqs, err := client.queries.ListAPIRequests(ctx, db.ListAPIRequestsParams{UserID: userID, Limit: 50, Offset: 0})
    if err != nil { t.Fatalf("list api requests failed: %v", err) }
    var legacyReqIDs, engineReqIDs []string
    for _, r := range reqs {
        if r.ExecutionRunID == legacyRunID {
            legacyReqIDs = append(legacyReqIDs, r.ID)
        } else if r.ExecutionRunID == engineRunID {
            engineReqIDs = append(engineReqIDs, r.ID)
        }
    }
    if len(legacyReqIDs) == 0 || len(engineReqIDs) == 0 {
        t.Fatalf("expected at least one API request for both runs; legacy=%d engine=%d", len(legacyReqIDs), len(engineReqIDs))
    }

    resps, err := client.queries.ListAPIResponses(ctx, db.ListAPIResponsesParams{UserID: userID, Limit: 50, Offset: 0})
    if err != nil { t.Fatalf("list api responses failed: %v", err) }
    hasRespFor := func(ids []string) bool {
        idset := map[string]struct{}{}
        for _, id := range ids { idset[id] = struct{}{} }
        for _, resp := range resps {
            if _, ok := idset[resp.RequestID]; ok {
                return true
            }
        }
        return false
    }
    if !hasRespFor(legacyReqIDs) || !hasRespFor(engineReqIDs) {
        t.Fatalf("expected at least one response row for each run")
    }
}
