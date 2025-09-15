package heartbeat

import (
	"testing"
	"time"

	"gogent/internal/types"
)

func TestCalculateTokenUsage(t *testing.T) {
	// Create a basic Executor for testing
	config := DefaultConfig()
	executor := &Executor{
		config:  config,
		metrics: &ExecutorMetrics{},
	}

	tests := []struct {
		name     string
		result   *types.ExecutionResult
		expected int32
	}{
		{
			name: "With token metadata",
			result: &types.ExecutionResult{
				Results: []types.VariationResult{
					{
						Response: types.APIResponse{
							UsageMetadata: map[string]interface{}{
								"totalTokenCount": 100,
							},
						},
					},
					{
						Response: types.APIResponse{
							UsageMetadata: map[string]interface{}{
								"totalTokenCount": 50,
							},
						},
					},
				},
			},
			expected: 150,
		},
		{
			name: "With token metadata as int32",
			result: &types.ExecutionResult{
				Results: []types.VariationResult{
					{
						Response: types.APIResponse{
							UsageMetadata: map[string]interface{}{
								"totalTokenCount": int32(75),
							},
						},
					},
				},
			},
			expected: 75,
		},
		{
			name: "With token metadata as float64",
			result: &types.ExecutionResult{
				Results: []types.VariationResult{
					{
						Response: types.APIResponse{
							UsageMetadata: map[string]interface{}{
								"totalTokenCount": 125.5,
							},
						},
					},
				},
			},
			expected: 125,
		},
		{
			name: "Without metadata - estimate from response length",
			result: &types.ExecutionResult{
				Results: []types.VariationResult{
					{
						Response: types.APIResponse{
							ResponseText: "This is a test response with about 20 tokens",
						},
					},
				},
			},
			expected: 11, // ~44 characters / 4 = 11 tokens
		},
		{
			name: "No results",
			result: &types.ExecutionResult{
				Results: []types.VariationResult{},
			},
			expected: 0,
		},
		{
			name: "Empty metadata",
			result: &types.ExecutionResult{
				Results: []types.VariationResult{
					{
						Response: types.APIResponse{
							UsageMetadata: map[string]interface{}{},
							ResponseText:  "Test response",
						},
					},
				},
			},
			expected: 3, // ~13 characters / 4 = 3 tokens
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tokens := executor.calculateTokenUsage(tt.result)
			if tokens != tt.expected {
				t.Errorf("Expected %d tokens, got %d", tt.expected, tokens)
			}
		})
	}
}

func TestIncrementMetrics(t *testing.T) {
	config := DefaultConfig()
	executor := &Executor{
		config:  config,
		metrics: &ExecutorMetrics{},
	}

	// Initial state
	if executor.metrics.TotalExecutions != 0 {
		t.Error("Expected TotalExecutions to start at 0")
	}
	if executor.metrics.SuccessfulExecutions != 0 {
		t.Error("Expected SuccessfulExecutions to start at 0")
	}
	if executor.metrics.FailedExecutions != 0 {
		t.Error("Expected FailedExecutions to start at 0")
	}

	// Increment successful executions
	executor.incrementSuccessfulExecutions()
	if executor.metrics.SuccessfulExecutions != 1 {
		t.Errorf("Expected SuccessfulExecutions to be 1, got %d", executor.metrics.SuccessfulExecutions)
	}

	// Increment failed executions
	executor.incrementFailedExecutions()
	if executor.metrics.FailedExecutions != 1 {
		t.Errorf("Expected FailedExecutions to be 1, got %d", executor.metrics.FailedExecutions)
	}

	// Check total
	if executor.metrics.TotalExecutions != 2 {
		t.Errorf("Expected TotalExecutions to be 2, got %d", executor.metrics.TotalExecutions)
	}
}

func TestGetSuccessRate(t *testing.T) {
	config := DefaultConfig()
	executor := &Executor{
		config:  config,
		metrics: &ExecutorMetrics{},
	}

	// No executions yet
	rate := executor.getSuccessRate()
	if rate != 0.0 {
		t.Errorf("Expected success rate to be 0.0, got %f", rate)
	}

	// Add some executions
	executor.metrics.TotalExecutions = 10
	executor.metrics.SuccessfulExecutions = 8

	rate = executor.getSuccessRate()
	if rate != 80.0 {
		t.Errorf("Expected success rate to be 80.0, got %f", rate)
	}

	// 100% success rate
	executor.metrics.TotalExecutions = 5
	executor.metrics.SuccessfulExecutions = 5

	rate = executor.getSuccessRate()
	if rate != 100.0 {
		t.Errorf("Expected success rate to be 100.0, got %f", rate)
	}
}

func TestGetMetrics(t *testing.T) {
	config := DefaultConfig()
	executor := &Executor{
		config: config,
		metrics: &ExecutorMetrics{
			TotalExecutions:      10,
			SuccessfulExecutions: 8,
			FailedExecutions:     2,
			LastCheckTime:        time.Now(),
			LastExecutionTime:    time.Now(),
			ActiveExecutions:     1,
			AgentsProcessed:      15,
		},
	}

	metrics := executor.GetMetrics()

	// Check required fields
	requiredFields := []string{
		"total_executions", "successful_executions", "failed_executions",
		"last_check_time", "last_execution_time", "active_executions",
		"agents_processed", "success_rate", "config",
	}

	for _, field := range requiredFields {
		if _, exists := metrics[field]; !exists {
			t.Errorf("Expected metrics to contain field %s", field)
		}
	}

	// Check specific values
	if metrics["total_executions"] != int64(10) {
		t.Errorf("Expected total_executions to be 10, got %v", metrics["total_executions"])
	}

	if metrics["successful_executions"] != int64(8) {
		t.Errorf("Expected successful_executions to be 8, got %v", metrics["successful_executions"])
	}

	if metrics["failed_executions"] != int64(2) {
		t.Errorf("Expected failed_executions to be 2, got %v", metrics["failed_executions"])
	}

	if metrics["success_rate"] != 80.0 {
		t.Errorf("Expected success_rate to be 80.0, got %v", metrics["success_rate"])
	}

	// Check config field
	configMetrics, ok := metrics["config"].(map[string]interface{})
	if !ok {
		t.Error("Expected config to be a map")
	} else {
		if configMetrics["enabled"] != true {
			t.Errorf("Expected config.enabled to be true, got %v", configMetrics["enabled"])
		}
	}
}

func TestOverdueAgent(t *testing.T) {
	// Test OverdueAgent struct
	agent := &OverdueAgent{
		ID:               "test-agent",
		UserID:           "test-user",
		FirstName:        "Test",
		LastName:         "Agent",
		TemplateID:       "test-template",
		HeartbeatMinutes: 5,
		MaxTokensPerDay:  1000,
		TokensUsedToday:  100,
		TokensResetDate:  "2025-01-01",
		TotalExecutions:  10,
	}

	if agent.ID != "test-agent" {
		t.Errorf("Expected ID to be 'test-agent', got %s", agent.ID)
	}

	if agent.HeartbeatMinutes != 5 {
		t.Errorf("Expected HeartbeatMinutes to be 5, got %d", agent.HeartbeatMinutes)
	}

	// Test with LastExecutionAt set
	now := time.Now()
	agent.LastExecutionAt = &now

	if agent.LastExecutionAt == nil {
		t.Error("Expected LastExecutionAt to be set")
	}

	if !agent.LastExecutionAt.Equal(now) {
		t.Error("Expected LastExecutionAt to equal the set time")
	}
}
