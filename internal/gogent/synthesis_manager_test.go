package gogent

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestSynthesisManager_DetectIdenticalFunctionLoop tests the loop detection logic
func TestSynthesisManager_DetectIdenticalFunctionLoop(t *testing.T) {
	sm := NewSynthesisManager()

	tests := []struct {
		name          string
		functionCalls []ResponsePart
		expectLoop    bool
	}{
		{
			name: "No loop - insufficient calls",
			functionCalls: []ResponsePart{
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_issues", Args: map[string]interface{}{"owner": "test", "repo": "repo"}}},
			},
			expectLoop: false,
		},
		{
			name: "Loop detected - same function, identical params, 3 times",
			functionCalls: []ResponsePart{
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_issues", Args: map[string]interface{}{"owner": "test", "repo": "repo"}}},
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_issues", Args: map[string]interface{}{"owner": "test", "repo": "repo"}}},
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_issues", Args: map[string]interface{}{"owner": "test", "repo": "repo"}}},
			},
			expectLoop: true,
		},
		{
			name: "No loop - same function but pagination changed",
			functionCalls: []ResponsePart{
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_issues", Args: map[string]interface{}{"owner": "test", "repo": "repo", "limit": 10}}},
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_issues", Args: map[string]interface{}{"owner": "test", "repo": "repo", "limit": 20}}},
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_issues", Args: map[string]interface{}{"owner": "test", "repo": "repo", "limit": 30}}},
			},
			expectLoop: false, // Current implementation uses string comparison, so different limits = no loop
		},
		{
			name: "No loop - different functions",
			functionCalls: []ResponsePart{
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_issues", Args: map[string]interface{}{"owner": "test", "repo": "repo"}}},
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_code", Args: map[string]interface{}{"owner": "test", "repo": "repo"}}},
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_commits", Args: map[string]interface{}{"owner": "test", "repo": "repo"}}},
			},
			expectLoop: false,
		},
		{
			name: "No loop - same function but very different params",
			functionCalls: []ResponsePart{
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_issues", Args: map[string]interface{}{"owner": "owner1", "repo": "repo1", "state": "open"}}},
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_issues", Args: map[string]interface{}{"owner": "owner2", "repo": "repo2", "state": "closed"}}},
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "github_read_issues", Args: map[string]interface{}{"owner": "owner3", "repo": "repo3", "state": "all"}}},
			},
			expectLoop: false,
		},
		{
			name: "Loop detected - alternating team_task_list and slack_find_channel",
			functionCalls: []ResponsePart{
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "team_task_list", Args: map[string]interface{}{}}},
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "slack_find_channel", Args: map[string]interface{}{"channel_name": "test"}}},
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "team_task_list", Args: map[string]interface{}{}}},
				{FunctionCall: struct {
					ID   string                 `json:"id,omitempty"`
					Name string                 `json:"name"`
					Args map[string]interface{} `json:"args"`
				}{Name: "slack_find_channel", Args: map[string]interface{}{"channel_name": "test"}}},
			},
			expectLoop: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sm.detectIdenticalFunctionLoop(tt.functionCalls)
			assert.Equal(t, tt.expectLoop, result,
				"Expected loop detection to be %v, got %v", tt.expectLoop, result)
		})
	}
}

// TestSynthesisManager_GetChannelFromArgs tests channel parameter extraction
func TestSynthesisManager_GetChannelFromArgs(t *testing.T) {
	sm := NewSynthesisManager()

	tests := []struct {
		name            string
		args            map[string]interface{}
		expectedChannel string
	}{
		{
			name:            "Channel present",
			args:            map[string]interface{}{"channel": "C12345"},
			expectedChannel: "C12345",
		},
		{
			name:            "Channel missing",
			args:            map[string]interface{}{"other_param": "value"},
			expectedChannel: "",
		},
		{
			name:            "Empty args",
			args:            map[string]interface{}{},
			expectedChannel: "",
		},
		{
			name:            "Channel is wrong type",
			args:            map[string]interface{}{"channel": 12345},
			expectedChannel: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sm.getChannelFromArgs(tt.args)
			assert.Equal(t, tt.expectedChannel, result)
		})
	}
}

// TestSynthesisManager_GetChannelNameFromArgs tests channel_name parameter extraction
func TestSynthesisManager_GetChannelNameFromArgs(t *testing.T) {
	sm := NewSynthesisManager()

	tests := []struct {
		name                string
		args                map[string]interface{}
		expectedChannelName string
	}{
		{
			name:                "Channel name present",
			args:                map[string]interface{}{"channel_name": "ai-intern"},
			expectedChannelName: "ai-intern",
		},
		{
			name:                "Channel name missing",
			args:                map[string]interface{}{"other_param": "value"},
			expectedChannelName: "",
		},
		{
			name:                "Empty args",
			args:                map[string]interface{}{},
			expectedChannelName: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sm.getChannelNameFromArgs(tt.args)
			assert.Equal(t, tt.expectedChannelName, result)
		})
	}
}
