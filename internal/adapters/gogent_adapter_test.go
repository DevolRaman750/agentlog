package adapters

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestNewGoGentClientAdapter tests adapter creation
func TestNewGoGentClientAdapter(t *testing.T) {
	adapter := NewGoGentClientAdapter(nil, "test-user-123")

	assert.NotNil(t, adapter, "Adapter should not be nil")
	assert.Equal(t, "test-user-123", adapter.userID, "User ID should be set")
}

// TestGoGentClientAdapter_GetUnderlyingClient tests getting the underlying client
func TestGoGentClientAdapter_GetUnderlyingClient(t *testing.T) {
	adapter := NewGoGentClientAdapter(nil, "test-user-123")

	client := adapter.GetUnderlyingClient()
	assert.Nil(t, client, "Should return the underlying client (nil in this test)")
}

// TestGoGentClientAdapter_InterfaceCompliance tests that adapter implements all required interfaces
func TestGoGentClientAdapter_InterfaceCompliance(t *testing.T) {
	// This test ensures that the adapter implements all required interfaces
	// If any interface is not implemented, this will fail at compile time

	adapter := NewGoGentClientAdapter(nil, "test-user-123")
	require.NotNil(t, adapter)

	// The interface compliance is checked at compile time via the var declarations
	// in gogent_adapter.go lines 30-36. If this test compiles, interfaces are satisfied.
	t.Log("✅ Adapter implements all required interfaces (verified at compile time)")
}
