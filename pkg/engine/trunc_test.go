package engine

import (
    "strings"
    "testing"
)

func TestSmartTruncateJSON_NoTruncate(t *testing.T) {
    s := `{"a":1}`
    if got := SmartTruncateJSON(s, len(s)); got != s {
        t.Fatalf("expected unchanged string")
    }
}

func TestSmartTruncateJSON_Truncate(t *testing.T) {
    s := `{"a":1,"b":[1,2,3],"c":{"x":1}}`
    got := SmartTruncateJSON(s, 10)
    if got == s {
        t.Fatalf("expected truncation")
    }
    if !strings.HasSuffix(got, "... [truncated]") {
        t.Fatalf("expected truncation suffix, got: %s", got)
    }
}
