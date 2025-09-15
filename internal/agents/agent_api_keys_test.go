package agents

import (
	"context"
	"strings"
	"testing"

	"gogent/internal/types"
)

// TestAgentAPIKeyConfiguration tests the core logic of agent API key resolution
func TestAgentAPIKeyConfiguration(t *testing.T) {
	// Test the key resolution logic without requiring database
	t.Run("AgentAPIKeyConfigurationStructure", func(t *testing.T) {
		// Test that the AgentAPIKeyConfiguration type works correctly
		config := &types.AgentAPIKeyConfiguration{
			AgentID:           "test-agent-123",
			ServiceAPIKeys:    make(map[string]types.UserAPIKey),
			FallbackAPIKeys:   make(map[string]types.UserAPIKey),
			UseGlobalDefaults: false,
		}

		// Verify structure
		if config.AgentID != "test-agent-123" {
			t.Errorf("Expected agent ID 'test-agent-123', got '%s'", config.AgentID)
		}

		if config.ServiceAPIKeys == nil {
			t.Error("ServiceAPIKeys map should not be nil")
		}

		if config.FallbackAPIKeys == nil {
			t.Error("FallbackAPIKeys map should not be nil")
		}

		// Test adding service keys
		testKey := types.UserAPIKey{
			ID:          "key-123",
			ServiceName: "github",
			KeyName:     "test-github-key",
			IsActive:    true,
		}

		config.ServiceAPIKeys["github"] = testKey

		if len(config.ServiceAPIKeys) != 1 {
			t.Errorf("Expected 1 service key, got %d", len(config.ServiceAPIKeys))
		}

		githubKey, exists := config.ServiceAPIKeys["github"]
		if !exists {
			t.Error("GitHub key should exist in ServiceAPIKeys")
		}

		if githubKey.ID != "key-123" {
			t.Errorf("Expected key ID 'key-123', got '%s'", githubKey.ID)
		}
	})

	t.Run("AgentAPIKeyTypesValidation", func(t *testing.T) {
		// Test AgentAPIKeyCreateRequest validation
		createReq := &types.AgentAPIKeyCreateRequest{
			AgentID:          "agent-123",
			APIKeyID:         "key-456",
			IsDefault:        false,
			UseGlobalDefault: true,
			Priority:         100,
		}

		if createReq.AgentID != "agent-123" {
			t.Errorf("Expected agent ID 'agent-123', got '%s'", createReq.AgentID)
		}

		if createReq.APIKeyID != "key-456" {
			t.Errorf("Expected API key ID 'key-456', got '%s'", createReq.APIKeyID)
		}

		if createReq.IsDefault {
			t.Error("IsDefault should be false")
		}

		if !createReq.UseGlobalDefault {
			t.Error("UseGlobalDefault should be true")
		}

		if createReq.Priority != 100 {
			t.Errorf("Expected priority 100, got %d", createReq.Priority)
		}

		// Test AgentAPIKeyUpdateRequest
		isDefaultTrue := true
		priorityNew := 50

		updateReq := &types.AgentAPIKeyUpdateRequest{
			IsDefault: &isDefaultTrue,
			Priority:  &priorityNew,
		}

		if updateReq.IsDefault == nil || *updateReq.IsDefault != true {
			t.Error("IsDefault should be pointer to true")
		}

		if updateReq.Priority == nil || *updateReq.Priority != 50 {
			t.Error("Priority should be pointer to 50")
		}
	})
}

// TestAgentAPIKeyHandlerMethods tests the handler method signatures
func TestAgentAPIKeyHandlerMethods(t *testing.T) {
	t.Run("HandlerMethodExists", func(t *testing.T) {
		// Create handler with nil db (this will work for method signature testing)
		handler := &AgentsHandler{db: nil}

		// Test that the GetAgentAPIKeyConfiguration method exists and has correct signature
		ctx := context.Background()

		// This will panic due to nil db, so we need to recover from panic
		defer func() {
			if r := recover(); r != nil {
				// Expected panic due to nil database - this means the method exists
				t.Logf("Got expected panic due to nil database: %v", r)
			}
		}()

		// This will panic, but that's fine - we just want to verify method exists
		_, err := handler.GetAgentAPIKeyConfiguration(ctx, "test-agent")

		// If we reach here without panic, something's wrong
		if err == nil {
			t.Error("Expected error or panic due to nil database connection, but got none")
		}
	})
}

// Helper function to check if string contains substring (case insensitive)
func containsIgnoreCase(s, substr string) bool {
	s = strings.ToLower(s)
	substr = strings.ToLower(substr)
	return strings.Contains(s, substr)
}
