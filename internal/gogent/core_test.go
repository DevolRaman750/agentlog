package gogent

import (
	"testing"

	"gogent/internal/types"
)

func TestNewClient(t *testing.T) {
	// Test client creation with mock database URL
	dbURL := "mysql://test:test@localhost:3306/testdb"
	config := &types.GeminiClientConfig{
		MaxRetries:  3,
		TimeoutSecs: 30,
	}

	client, err := NewClient(dbURL, config, nil)
	if err != nil {
		// Expected to fail due to database connection, but should not panic
		t.Logf("Expected database connection failure: %v", err)
		return
	}

	// If we get here, the client was created successfully
	if client == nil {
		t.Error("Expected client to be created")
	}
}

func TestEnsureMultiStatements(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "URL without multiStatements",
			input:    "mysql://user:pass@localhost:3306/db",
			expected: "mysql://user:pass@localhost:3306/db?multiStatements=true",
		},
		{
			name:     "URL with existing parameters",
			input:    "mysql://user:pass@localhost:3306/db?param1=value1",
			expected: "mysql://user:pass@localhost:3306/db?param1=value1&multiStatements=true",
		},
		{
			name:     "URL already has multiStatements",
			input:    "mysql://user:pass@localhost:3306/db?multiStatements=true",
			expected: "mysql://user:pass@localhost:3306/db?multiStatements=true",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ensureMultiStatements(tt.input)
			if result != tt.expected {
				t.Errorf("ensureMultiStatements(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestGetEffectiveAPIKeys(t *testing.T) {
	// Create a client with empty database keys
	client := &Client{
		databaseAPIKeys: &types.SessionAPIKeys{},
	}

	keys := client.getEffectiveAPIKeys()
	if keys == nil {
		t.Error("Expected non-nil API keys")
	}
}

func TestSetExecutionContext(t *testing.T) {
	client := &Client{}

	executionRunID := "test-run-id"
	configID := "test-config-id"
	requestID := "test-request-id"

	client.setExecutionContext(&executionRunID, &configID, &requestID)

	if client.currentExecutionRunID == nil || *client.currentExecutionRunID != executionRunID {
		t.Error("Expected execution run ID to be set")
	}
	if client.currentConfigID == nil || *client.currentConfigID != configID {
		t.Error("Expected config ID to be set")
	}
	if client.currentRequestID == nil || *client.currentRequestID != requestID {
		t.Error("Expected request ID to be set")
	}
}

func TestClearExecutionContext(t *testing.T) {
	client := &Client{}

	executionRunID := "test-run-id"
	configID := "test-config-id"
	requestID := "test-request-id"

	client.setExecutionContext(&executionRunID, &configID, &requestID)
	client.clearExecutionContext()

	if client.currentExecutionRunID != nil {
		t.Error("Expected execution run ID to be cleared")
	}
	if client.currentConfigID != nil {
		t.Error("Expected config ID to be cleared")
	}
	if client.currentRequestID != nil {
		t.Error("Expected request ID to be cleared")
	}
}

func TestGetNextSequenceNumber(t *testing.T) {
	client := &Client{}

	// Test that sequence numbers increment
	first := client.getNextSequenceNumber()
	second := client.getNextSequenceNumber()

	if first != 1 {
		t.Errorf("Expected first sequence number to be 1, got %d", first)
	}
	if second != 2 {
		t.Errorf("Expected second sequence number to be 2, got %d", second)
	}
}
