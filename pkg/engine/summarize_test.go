package engine

import (
    "encoding/json"
    "testing"
)

func TestSummarizeResult_ErrorAndNil(t *testing.T) {
    if got := SummarizeResult("func", nil); got != "No data returned" {
        t.Fatalf("expected No data returned, got %q", got)
    }

    res := map[string]interface{}{"status": "failed", "error": "boom"}
    if got := SummarizeResult("func", res); got != "FAILED: boom" {
        t.Fatalf("expected FAILED: boom, got %q", got)
    }

    res2 := map[string]interface{}{"status": "validation_failed"}
    if got := SummarizeResult("func", res2); got != "FAILED: Unknown error" {
        t.Fatalf("unexpected: %q", got)
    }
}

func TestSummarizeResult_FullJSON(t *testing.T) {
    res := map[string]interface{}{
        "status": "success",
        "data": map[string]interface{}{"k": "v"},
    }
    got := SummarizeResult("func", res)
    // should be valid JSON and contain keys
    var m map[string]interface{}
    if err := json.Unmarshal([]byte(got), &m); err != nil {
        t.Fatalf("expected valid json, got error: %v", err)
    }
    if _, ok := m["data"]; !ok {
        t.Fatalf("expected data field in json: %s", got)
    }
}

func TestCreateGenericSummary(t *testing.T) {
    if got := CreateGenericSummary(map[string]interface{}{}); got != "No data returned" {
        t.Fatalf("unexpected: %q", got)
    }
    res := map[string]interface{}{"a": 1, "b": 2, "metadata": map[string]interface{}{"x": 1}}
    got := CreateGenericSummary(res)
    if got != "Retrieved data with 2 fields" {
        t.Fatalf("unexpected generic summary: %q", got)
    }
}

