package gogent

import (
	"strings"
	"testing"
)

// TestCreateIntelligentResultSummary tests the context preservation mechanism
func TestCreateIntelligentResultSummary(t *testing.T) {
	client := &Client{}

	t.Run("Slack Find Channel Summary", func(t *testing.T) {
		result := map[string]interface{}{
			"status": "success",
			"data": map[string]interface{}{
				"channels": []interface{}{
					map[string]interface{}{
						"id":   "C099KTQE1L5",
						"name": "ai-intern",
					},
				},
			},
		}

		summary := client.createIntelligentResultSummary("slack_find_channel", result)
		expected := "Found channel 'ai-intern' (ID: C099KTQE1L5)"

		if summary != expected {
			t.Errorf("Expected: %s, Got: %s", expected, summary)
		}
	})

	t.Run("Slack Read Messages Summary", func(t *testing.T) {
		result := map[string]interface{}{
			"status": "success",
			"data": map[string]interface{}{
				"messages": []interface{}{
					map[string]interface{}{
						"text": "How many open issues are there in github repo imran31415/agentlog?",
						"ts":   "1755282095.291769",
						"user": "U099SA2UFFS",
					},
					map[string]interface{}{
						"text": "Please read the README file from the repository",
						"ts":   "1755278311.132479",
						"user": "U099SA2UFFS",
					},
				},
			},
		}

		summary := client.createIntelligentResultSummary("slack_read_messages", result)

		// Verify it contains essential information without full JSON
		if !strings.Contains(summary, "Found 2 messages:") {
			t.Errorf("Summary should contain message count, got: %s", summary)
		}
		if !strings.Contains(summary, "How many open issues") {
			t.Errorf("Summary should contain message text, got: %s", summary)
		}
		if !strings.Contains(summary, "1755282095.291769") {
			t.Errorf("Summary should contain timestamp, got: %s", summary)
		}
		// Verify it's much shorter than raw JSON
		if len(summary) > 500 {
			t.Errorf("Summary too long (%d chars), should be concise", len(summary))
		}
	})

	t.Run("GitHub Issues Summary", func(t *testing.T) {
		result := map[string]interface{}{
			"status": "success",
			"data": []interface{}{
				map[string]interface{}{
					"title":  "Fix authentication bug in login system",
					"number": float64(123),
					"state":  "open",
				},
				map[string]interface{}{
					"title":  "Add dark mode support to the frontend interface",
					"number": float64(124),
					"state":  "open",
				},
			},
		}

		summary := client.createIntelligentResultSummary("github_read_issues", result)

		if !strings.Contains(summary, "Found 2 open issues:") {
			t.Errorf("Summary should contain issue count, got: %s", summary)
		}
		if !strings.Contains(summary, "#123") {
			t.Errorf("Summary should contain issue number, got: %s", summary)
		}
		if !strings.Contains(summary, "Fix authentication bug") {
			t.Errorf("Summary should contain issue title, got: %s", summary)
		}
	})

	t.Run("Error Handling", func(t *testing.T) {
		result := map[string]interface{}{
			"status": "failed",
			"error":  "Channel not found",
		}

		summary := client.createIntelligentResultSummary("slack_find_channel", result)
		expected := "FAILED: Channel not found"

		if summary != expected {
			t.Errorf("Expected: %s, Got: %s", expected, summary)
		}
	})

	t.Run("Large Message Truncation", func(t *testing.T) {
		longText := strings.Repeat("This is a very long message that should be truncated. ", 10)
		result := map[string]interface{}{
			"messages": []interface{}{
				map[string]interface{}{
					"text": longText,
					"ts":   "1755282095.291769",
					"user": "U099SA2UFFS",
				},
			},
		}

		summary := client.createIntelligentResultSummary("slack_read_messages", result)

		// Should be truncated to ~100 chars plus metadata
		if len(summary) > 300 {
			t.Errorf("Long message should be truncated, got %d chars: %s", len(summary), summary)
		}
		if !strings.Contains(summary, "...") {
			t.Errorf("Truncated message should contain '...', got: %s", summary)
		}
	})

	t.Run("GitHub List Branches Full Data", func(t *testing.T) {
		result := map[string]interface{}{
			"status": "success",
			"data": []interface{}{
				map[string]interface{}{
					"name": "main",
					"commit": map[string]interface{}{
						"sha": "a1b2c3d4e5f6789012345678901234567890abcd",
					},
				},
			},
		}

		summary := client.createIntelligentResultSummary("github_list_branches", result)

		// Should return full JSON data, not a summary
		if !strings.Contains(summary, `"name":"main"`) {
			t.Errorf("Should contain full JSON data with branch name, got: %s", summary)
		}
		if !strings.Contains(summary, `"sha":"a1b2c3d4e5f6789012345678901234567890abcd"`) {
			t.Errorf("Should contain full SHA in JSON, got: %s", summary)
		}
	})

	t.Run("Multiple Messages Limited to 3", func(t *testing.T) {
		messages := make([]interface{}, 10)
		for i := 0; i < 10; i++ {
			messages[i] = map[string]interface{}{
				"text": "Message " + string(rune(i+'1')),
				"ts":   "1755282095.291769",
				"user": "U099SA2UFFS",
			}
		}

		result := map[string]interface{}{
			"messages": messages,
		}

		summary := client.createIntelligentResultSummary("slack_read_messages", result)

		if !strings.Contains(summary, "Found 10 messages:") {
			t.Errorf("Should show total count, got: %s", summary)
		}
		if !strings.Contains(summary, "[+7 more messages]") {
			t.Errorf("Should show truncation indicator, got: %s", summary)
		}
		// Should only show first 3 messages in detail
		messageCount := strings.Count(summary, "Message ")
		if messageCount > 3 {
			t.Errorf("Should only show 3 messages in detail, showed %d", messageCount)
		}
	})
}

// TestContextPreservation tests that the new approach preserves essential context
func TestContextPreservation(t *testing.T) {
	client := &Client{}

	// Simulate a typical Slack bot workflow
	functionCalls := []ResponsePart{
		{FunctionCall: struct {
			Name string                 `json:"name"`
			Args map[string]interface{} `json:"args"`
		}{Name: "slack_find_channel", Args: map[string]interface{}{"channel_name": "ai-intern"}}},
		{FunctionCall: struct {
			Name string                 `json:"name"`
			Args map[string]interface{} `json:"args"`
		}{Name: "slack_read_messages", Args: map[string]interface{}{"channel": "C099KTQE1L5", "limit": 5}}},
		{FunctionCall: struct {
			Name string                 `json:"name"`
			Args map[string]interface{} `json:"args"`
		}{Name: "github_read_issues", Args: map[string]interface{}{"owner": "imran31415", "repo": "agentlog"}}},
	}

	functionResults := []map[string]interface{}{
		{
			"status": "success",
			"data": map[string]interface{}{
				"channels": []interface{}{
					map[string]interface{}{"id": "C099KTQE1L5", "name": "ai-intern"},
				},
			},
		},
		{
			"status": "success",
			"data": map[string]interface{}{
				"messages": []interface{}{
					map[string]interface{}{
						"text": "How many open issues are there?",
						"ts":   "1755282095.291769",
						"user": "U099SA2UFFS",
					},
				},
			},
		},
		{
			"status": "success",
			"data": []interface{}{
				map[string]interface{}{
					"title":  "Fix bug",
					"number": float64(123),
					"state":  "open",
				},
			},
		},
	}

	// Build synthesis prompt using new approach
	var synthesisPrompt strings.Builder
	synthesisPrompt.WriteString("**Function Results:**\n")

	for i, result := range functionResults {
		if i < len(functionCalls) {
			functionName := functionCalls[i].FunctionCall.Name
			summary := client.createIntelligentResultSummary(functionName, result)
			synthesisPrompt.WriteString("- " + functionName + ": " + summary + "\n")
		}
	}

	prompt := synthesisPrompt.String()

	// Verify the prompt contains essential information
	if !strings.Contains(prompt, "Found channel 'ai-intern' (ID: C099KTQE1L5)") {
		t.Error("Should contain channel information")
	}
	if !strings.Contains(prompt, "Found 1 messages:") {
		t.Error("Should contain message count")
	}
	if !strings.Contains(prompt, "How many open issues") {
		t.Error("Should contain message text")
	}
	if !strings.Contains(prompt, "Found 1 open issues:") {
		t.Error("Should contain issue count")
	}

	// Verify the prompt is much more concise than raw JSON
	if len(prompt) > 1000 {
		t.Errorf("Prompt should be concise, got %d characters", len(prompt))
	}

	// Verify it doesn't contain raw JSON structures
	if strings.Contains(prompt, `"channels":`) || strings.Contains(prompt, `"messages":`) {
		t.Error("Should not contain raw JSON structures")
	}
}
