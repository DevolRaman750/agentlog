package engine

import "testing"

func TestAutoFillMissingArgs_ChannelExtraction(t *testing.T) {
    args := map[string]interface{}{"limit": 50}
    prev := []map[string]interface{}{
        {"channels": []interface{}{map[string]interface{}{"id": "C123", "name": "general"}}},
    }
    changed := AutoFillMissingArgs("slack_read_messages", args, prev)
    if !changed {
        t.Fatalf("expected args to be changed")
    }
    if got := args["channel"]; got != "C123" {
        t.Fatalf("expected channel C123, got %v", got)
    }
    // not overwrite
    args2 := map[string]interface{}{"channel": "C999", "limit": 10}
    changed = AutoFillMissingArgs("slack_read_messages", args2, prev)
    if changed {
        t.Fatalf("expected no change when channel present")
    }
}

func TestAutoFillMissingArgs_NoData(t *testing.T) {
    args := map[string]interface{}{"limit": 5}
    changed := AutoFillMissingArgs("slack_read_messages", args, nil)
    if changed {
        t.Fatalf("expected no change when no previous results")
    }
    if _, ok := args["channel"]; ok {
        t.Fatalf("channel should not be added")
    }
}

