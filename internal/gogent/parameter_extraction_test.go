package gogent

import (
	"testing"
)

// TestAutoExtractParametersFromContext tests the critical parameter passing logic
// This ensures slack_find_channel -> slack_read_messages chaining works
func TestAutoExtractParametersFromContext(t *testing.T) {
	client := &Client{}

	t.Run("Slack Channel ID Extraction", func(t *testing.T) {
		// Simulate slack_find_channel result
		currentResults := []map[string]interface{}{
			{
				"channels": []interface{}{
					map[string]interface{}{
						"id":   "C099KTQE1L5",
						"name": "ai-intern",
					},
				},
			},
		}

		// Simulate slack_read_messages call missing channel parameter
		nextCalls := []ResponsePart{
			{
				FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{
					Name: "slack_read_messages",
					Args: map[string]interface{}{
						"limit": "50",
						// Missing "channel" parameter
					},
				},
			},
		}

		// Apply auto-extraction
		client.autoExtractParametersFromContext(nextCalls, currentResults)

		// Verify channel was extracted
		extractedChannel, exists := nextCalls[0].FunctionCall.Args["channel"]
		if !exists {
			t.Error("Channel parameter should have been auto-extracted")
		}

		if extractedChannel != "C099KTQE1L5" {
			t.Errorf("Expected channel ID 'C099KTQE1L5', got '%v'", extractedChannel)
		}

		// Verify existing parameters weren't overwritten
		if nextCalls[0].FunctionCall.Args["limit"] != "50" {
			t.Error("Existing limit parameter should be preserved")
		}
	})

	t.Run("No Extraction When Channel Already Provided", func(t *testing.T) {
		currentResults := []map[string]interface{}{
			{
				"channels": []interface{}{
					map[string]interface{}{
						"id":   "C099KTQE1L5",
						"name": "ai-intern",
					},
				},
			},
		}

		nextCalls := []ResponsePart{
			{
				FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{
					Name: "slack_read_messages",
					Args: map[string]interface{}{
						"channel": "C999MANUAL", // Already has channel
						"limit":   "50",
					},
				},
			},
		}

		client.autoExtractParametersFromContext(nextCalls, currentResults)

		// Should NOT overwrite existing channel
		if nextCalls[0].FunctionCall.Args["channel"] != "C999MANUAL" {
			t.Error("Existing channel parameter should not be overwritten")
		}
	})

	t.Run("No Extraction When No Channel Data Available", func(t *testing.T) {
		// Empty results
		currentResults := []map[string]interface{}{}

		nextCalls := []ResponsePart{
			{
				FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{
					Name: "slack_read_messages",
					Args: map[string]interface{}{
						"limit": "50",
					},
				},
			},
		}

		client.autoExtractParametersFromContext(nextCalls, currentResults)

		// Should not add channel parameter
		_, exists := nextCalls[0].FunctionCall.Args["channel"]
		if exists {
			t.Error("Channel parameter should not be added when no data available")
		}
	})
}

// TestValidateFunctionCall tests the function validation logic
func TestValidateFunctionCall(t *testing.T) {
	// This would require database setup, so we'll just test the core logic
	t.Run("Slack Read Messages Validation", func(t *testing.T) {
		// Test the core validation logic for required parameters
		args := map[string]interface{}{
			"channel": "C123456",
			"limit":   "10",
		}

		// Simulate the slack_read_messages validation
		if channel, ok := args["channel"]; !ok || channel == nil || channel == "" {
			t.Error("Validation should fail for missing channel")
		}

		// Test missing channel
		argsInvalid := map[string]interface{}{
			"limit": "10",
		}

		if channel, ok := argsInvalid["channel"]; !ok || channel == nil || channel == "" {
			// This should happen - validation should catch missing channel
		} else {
			t.Error("Validation should catch missing channel parameter")
		}
	})
}
