package gogent

import (
	"testing"

	"gogent/internal/types"
)

func TestSynthesisManager_GeminiSpecificLimits(t *testing.T) {
	sm := NewSynthesisManager()

	t.Run("Gemini_Excessive_Calls_Limit", func(t *testing.T) {
		// Create 10 function calls for Gemini (should trigger limit)
		functionCalls := make([]ResponsePart, 10)
		for i := 0; i < 10; i++ {
			functionCalls[i] = ResponsePart{
				FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "test_function", Args: nil},
			}
		}

		config := &SynthesisConfig{
			ProviderType:    "gemini",
			Depth:           1,
			ShouldComplete:  false,
			FunctionCalls:   functionCalls,
			FunctionResults: []map[string]interface{}{},
			OriginalConfig:  &types.APIConfiguration{},
		}

		decision := sm.DetermineSynthesisStrategy(config)

		// Gemini should force completion at 10 calls
		if !decision.ForceCompletion {
			t.Error("Gemini should force completion at 10 function calls")
		}

		if decision.AllowFunctionCalls {
			t.Error("Gemini should not allow function calls at 10 calls")
		}
	})

	t.Run("Gemini_Depth_Limit", func(t *testing.T) {
		config := &SynthesisConfig{
			ProviderType:    "gemini",
			Depth:           8, // Should trigger Gemini depth limit
			ShouldComplete:  false,
			FunctionCalls:   []ResponsePart{},
			FunctionResults: []map[string]interface{}{},
			OriginalConfig:  &types.APIConfiguration{},
		}

		decision := sm.DetermineSynthesisStrategy(config)

		// Gemini should force completion at depth 8
		if !decision.ForceCompletion {
			t.Error("Gemini should force completion at depth 8")
		}

		if decision.AllowFunctionCalls {
			t.Error("Gemini should not allow function calls at depth 8")
		}
	})

	t.Run("OpenRouter_Higher_Limits", func(t *testing.T) {
		// Create 14 function calls for OpenRouter (should not trigger limit)
		// Use different function names to avoid triggering identical loop detection
		functionCalls := make([]ResponsePart, 14)
		functionNames := []string{"func1", "func2", "func3", "func4", "func5", "func6", "func7", "func8", "func9", "func10", "func11", "func12", "func13", "func14"}
		for i := 0; i < 14; i++ {
			functionCalls[i] = ResponsePart{
				FunctionCall: struct {
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: functionNames[i], Args: nil},
			}
		}

		config := &SynthesisConfig{
			ProviderType:    "openrouter",
			Depth:           1,
			ShouldComplete:  false,
			FunctionCalls:   functionCalls,
			FunctionResults: []map[string]interface{}{},
			OriginalConfig:  &types.APIConfiguration{},
		}

		decision := sm.DetermineSynthesisStrategy(config)

		// OpenRouter should not force completion at 14 calls (limit is 15)
		if decision.ForceCompletion {
			t.Error("OpenRouter should not force completion at 14 function calls")
		}

		if !decision.AllowFunctionCalls {
			t.Error("OpenRouter should allow function calls at 14 calls")
		}
	})

	t.Run("OpenRouter_Depth_Limit", func(t *testing.T) {
		config := &SynthesisConfig{
			ProviderType:    "openrouter",
			Depth:           10, // Should not trigger OpenRouter depth limit (15)
			ShouldComplete:  false,
			FunctionCalls:   []ResponsePart{},
			FunctionResults: []map[string]interface{}{},
			OriginalConfig:  &types.APIConfiguration{},
		}

		decision := sm.DetermineSynthesisStrategy(config)

		// OpenRouter should not force completion at depth 10
		if decision.ForceCompletion {
			t.Error("OpenRouter should not force completion at depth 10")
		}

		if !decision.AllowFunctionCalls {
			t.Error("OpenRouter should allow function calls at depth 10")
		}
	})
}

func TestSynthesisManager_DetectIdenticalFunctionLoop(t *testing.T) {
	sm := NewSynthesisManager()

	t.Run("Slack_Read_Messages_Loop", func(t *testing.T) {
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

		if !sm.detectIdenticalFunctionLoop(functionCalls) {
			t.Error("Should detect slack_read_messages loop")
		}
	})

	t.Run("Team_Task_List_Loop", func(t *testing.T) {
		functionCalls := []ResponsePart{
			{FunctionCall: struct {
				Name string                 `json:"name"`
				Args map[string]interface{} `json:"args"`
			}{Name: "team_task_list", Args: nil}},
			{FunctionCall: struct {
				Name string                 `json:"name"`
				Args map[string]interface{} `json:"args"`
			}{Name: "team_task_list", Args: nil}},
			{FunctionCall: struct {
				Name string                 `json:"name"`
				Args map[string]interface{} `json:"args"`
			}{Name: "team_task_list", Args: nil}},
		}

		if !sm.detectIdenticalFunctionLoop(functionCalls) {
			t.Error("Should detect team_task_list loop")
		}
	})

	t.Run("Alternating_Pattern_Loop", func(t *testing.T) {
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
		if !sm.detectIdenticalFunctionLoop(functionCalls) {
			t.Error("Should detect alternating pattern loop")
		}
	})

	t.Run("No_Loop_For_Different_Functions", func(t *testing.T) {
		functionCalls := []ResponsePart{
			{FunctionCall: struct {
				Name string                 `json:"name"`
				Args map[string]interface{} `json:"args"`
			}{Name: "slack_read_messages", Args: nil}},
			{FunctionCall: struct {
				Name string                 `json:"name"`
				Args map[string]interface{} `json:"args"`
			}{Name: "github_get_issues", Args: nil}},
			{FunctionCall: struct {
				Name string                 `json:"name"`
				Args map[string]interface{} `json:"args"`
			}{Name: "team_task_list", Args: nil}},
		}

		if sm.detectIdenticalFunctionLoop(functionCalls) {
			t.Error("Should not detect loop for different functions")
		}
	})
}
