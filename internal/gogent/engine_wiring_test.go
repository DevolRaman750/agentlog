package gogent

import (
    "os"
    "testing"
)

func TestNewEngine_WiresToolRunnerAndComparator(t *testing.T) {
    // Ensure env doesn't interfere with comparator selection
    os.Unsetenv("USE_ENGINE_COMPARATOR")
    os.Unsetenv("ENGINE_RATELIMIT_MS")

    c := &Client{}
    // Default: legacy comparator adapter
    e := c.newEngine()
    if e.Tools == nil {
        t.Fatalf("expected tool runner to be wired")
    }
    if _, ok := e.Compare.(*engineComparator); !ok {
        t.Fatalf("expected legacy engine comparator by default")
    }

    // With flag: basic comparator adapter should be used
    c.options.UseEngineComparator = true
    e2 := c.newEngine()
    if _, ok := e2.Compare.(*engineBasicComparatorAdapter); !ok {
        t.Fatalf("expected basic comparator adapter when flag is enabled")
    }
}

