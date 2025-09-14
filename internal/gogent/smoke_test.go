package gogent

import (
	"testing"

	"gogent/internal/types"
)

// TestSmokeAPI tests that our current API integration patterns work
// This gives us confidence the refactor doesn't break existing behavior
func TestSmokeAPI(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping smoke tests in short mode")
	}

	t.Run("GitHub URL Construction Patterns", func(t *testing.T) {
		client := &Client{}

		// Test all the GitHub functions we support
		githubTests := []struct {
			functionName string
			args         map[string]interface{}
			expectedPath string
		}{
			{
				functionName: "github_read_issues",
				args:         map[string]interface{}{"owner": "microsoft", "repo": "vscode"},
				expectedPath: "/repos/microsoft/vscode/issues",
			},
			{
				functionName: "github_read_code",
				args:         map[string]interface{}{"owner": "microsoft", "repo": "vscode", "path": "package.json"},
				expectedPath: "/repos/microsoft/vscode/contents/package.json",
			},
			{
				functionName: "github_read_commits",
				args:         map[string]interface{}{"owner": "microsoft", "repo": "vscode"},
				expectedPath: "/repos/microsoft/vscode/commits",
			},
		}

		for _, test := range githubTests {
			t.Run(test.functionName, func(t *testing.T) {
				url, err := client.buildGitHubAPIURL(test.functionName, test.args)
				if err != nil {
					t.Fatalf("Failed to build URL for %s: %v", test.functionName, err)
				}

				if !containsSubstring(url, test.expectedPath) {
					t.Errorf("URL %s should contain path %s", url, test.expectedPath)
				}

				if !containsSubstring(url, "github.com") {
					t.Errorf("URL should contain github.com: %s", url)
				}
			})
		}
	})

	t.Run("Function Call Response Structure", func(t *testing.T) {
		// Test that our ResponsePart structure works as expected
		responsePart := ResponsePart{
			FunctionCall: struct {
				Name string                 `json:"name"`
				Args map[string]interface{} `json:"args"`
			}{
				Name: "slack_find_channel",
				Args: map[string]interface{}{
					"channel_name": "ai-intern",
				},
			},
		}

		if responsePart.FunctionCall.Name != "slack_find_channel" {
			t.Error("ResponsePart function name not set correctly")
		}

		if responsePart.FunctionCall.Args["channel_name"] != "ai-intern" {
			t.Error("ResponsePart function args not set correctly")
		}
	})

	t.Run("Execution Context Management", func(t *testing.T) {
		client := &Client{}

		// Test execution context setting/clearing
		executionID := "test-exec-123"
		configID := "test-config-456"
		requestID := "test-request-789"

		client.setExecutionContext(&executionID, &configID, &requestID)

		if client.currentExecutionRunID == nil || *client.currentExecutionRunID != executionID {
			t.Error("Execution context not set correctly")
		}

		// Test sequence number increments
		seq1 := client.getNextSequenceNumber()
		seq2 := client.getNextSequenceNumber()

		if seq2 != seq1+1 {
			t.Error("Sequence numbers should increment")
		}

		client.clearExecutionContext()

		if client.currentExecutionRunID != nil {
			t.Error("Execution context should be cleared")
		}
	})
}

// TestExecutionFlow tests the basic execution flow without external dependencies
func TestExecutionFlow(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping execution flow tests in short mode")
	}

	client := &Client{}

	t.Run("Basic Request Validation", func(t *testing.T) {
		// Test MultiExecutionRequest validation
		validRequest := &types.MultiExecutionRequest{
			ExecutionRunName: "Test Execution",
			BasePrompt:       "Test prompt",
			Configurations: []types.APIConfiguration{
				{
					VariationName: "Test Config",
					ModelName:     "gemini-1.5-pro",
				},
			},
		}

		// Basic validation - should not panic
		if validRequest.ExecutionRunName == "" {
			t.Error("Execution run name should be set")
		}

		if len(validRequest.Configurations) == 0 {
			t.Error("Should have at least one configuration")
		}
	})

	t.Run("Task Completion Detection Logic", func(t *testing.T) {
		// Test the completion detection logic we added
		functionCalls := []ResponsePart{
			{FunctionCall: struct {
				Name string                 `json:"name"`
				Args map[string]interface{} `json:"args"`
			}{Name: "slack_find_channel", Args: nil}},
			{FunctionCall: struct {
				Name string                 `json:"name"`
				Args map[string]interface{} `json:"args"`
			}{Name: "slack_read_messages", Args: nil}},
		}

		functionResults := []map[string]interface{}{
			{"status": "success", "channels": []interface{}{}},
			{"status": "success", "messages": []interface{}{}},
		}

		// Test completion detection with new aggressive limits
		shouldComplete := client.detectTaskCompletion(functionCalls, functionResults, 3, "test prompt")

		// At depth 3 with successful calls, should not force completion
		if shouldComplete {
			t.Error("Should not force completion at depth 3 with only 2 successful calls")
		}

		// Test force completion at new max depth (6)
		shouldComplete = client.detectTaskCompletion(functionCalls, functionResults, 6, "test prompt")
		if !shouldComplete {
			t.Error("Should force completion at depth 6 (new aggressive limit)")
		}
	})

	t.Run("Gemini_Loop_Prevention", func(t *testing.T) {
		client := &Client{}

		// Test detectGeminiLoopPattern function
		t.Run("Consecutive_Function_Loop_Detection", func(t *testing.T) {
			functionCalls := []ResponsePart{
				{FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "slack_read_messages", Args: map[string]interface{}{"channel": "C123"}}},
				{FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "slack_read_messages", Args: map[string]interface{}{"channel": "C123"}}},
				{FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "slack_read_messages", Args: map[string]interface{}{"channel": "C123"}}},
			}

			// Should detect loop after 3 consecutive calls
			if !client.detectGeminiLoopPattern(functionCalls, 1) {
				t.Error("Should detect consecutive function loop")
			}
		})

		t.Run("Alternating_Pattern_Loop_Detection", func(t *testing.T) {
			functionCalls := []ResponsePart{
				{FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "team_task_list", Args: nil}},
				{FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "slack_find_channel", Args: nil}},
				{FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "team_task_list", Args: nil}},
				{FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "slack_find_channel", Args: nil}},
			}

			// Should detect alternating pattern loop
			if !client.detectGeminiLoopPattern(functionCalls, 1) {
				t.Error("Should detect alternating pattern loop")
			}
		})

		t.Run("Excessive_Calls_Detection", func(t *testing.T) {
			// Create 10 function calls
			functionCalls := make([]ResponsePart, 10)
			for i := 0; i < 10; i++ {
				functionCalls[i] = ResponsePart{
					FunctionCall: struct {
						Name string                 `json:"name"`
						Args map[string]interface{} `json:"args"`
					}{Name: "test_function", Args: nil},
				}
			}

			// Should detect excessive calls at depth 4
			if !client.detectGeminiLoopPattern(functionCalls, 4) {
				t.Error("Should detect excessive calls at depth 4")
			}
		})

		t.Run("No_Loop_Detection_For_Normal_Usage", func(t *testing.T) {
			functionCalls := []ResponsePart{
				{FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "slack_read_messages", Args: nil}},
				{FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_get_issues", Args: nil}},
			}

			// Should not detect loop for normal usage
			if client.detectGeminiLoopPattern(functionCalls, 1) {
				t.Error("Should not detect loop for normal function usage")
			}
		})
	})
}
