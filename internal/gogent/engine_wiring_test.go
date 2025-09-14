package gogent

import (
	"os"
	"testing"
)

func TestNewEngine_WiresToolRunnerAndComparator(t *testing.T) {
	// Ensure env doesn't interfere with ratelimit selection
	os.Unsetenv("ENGINE_RATELIMIT_MS")

	c := &Client{}
	e := c.newEngine()
	if e.Tools == nil {
		t.Fatalf("expected tool runner to be wired")
	}
	// Comparator should always be the basic comparator adapter now
	if _, ok := e.Compare.(*engineBasicComparatorAdapter); !ok {
		t.Fatalf("expected basic comparator adapter to be wired by default")
	}
}
