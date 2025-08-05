package apikeys

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"gogent/internal/types"

	_ "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test database connection details
const testDSN = "root:Password123!@tcp(localhost:3306)/gogent?parseTime=true"

func setupTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("mysql", testDSN)
	require.NoError(t, err, "Failed to connect to test database")

	err = db.Ping()
	require.NoError(t, err, "Failed to ping test database")

	return db
}

func cleanupTestData(t *testing.T, db *sql.DB, userID string) {
	// Clean up test data
	_, err := db.Exec("DELETE FROM user_api_keys WHERE user_id = ?", userID)
	if err != nil {
		t.Logf("Warning: Failed to clean up test data: %v", err)
	}
}

func TestNewService(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service, err := NewService(db)
	require.NoError(t, err, "Failed to create new service")
	assert.NotNil(t, service, "Service should not be nil")
	assert.NotNil(t, service.db, "Database should be set")
	assert.NotEmpty(t, service.encryptionKey, "Encryption key should be set")
	assert.Equal(t, 1, service.encryptionKeyVersion, "Encryption key version should be 1")
}

func TestEncryptDecryptAPIKey(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service, err := NewService(db)
	require.NoError(t, err)

	testKey := "sk-test-api-key-12345"

	// Test encryption
	encrypted, err := service.encryptAPIKey(testKey)
	require.NoError(t, err, "Failed to encrypt API key")
	assert.NotEmpty(t, encrypted, "Encrypted value should not be empty")
	assert.NotEqual(t, testKey, encrypted, "Encrypted value should be different from original")

	// Test decryption
	decrypted, err := service.decryptAPIKey(encrypted)
	require.NoError(t, err, "Failed to decrypt API key")
	assert.Equal(t, testKey, decrypted, "Decrypted value should match original")

	// Test invalid inputs
	_, err = service.encryptAPIKey("")
	assert.Error(t, err, "Should fail to encrypt empty string")

	_, err = service.decryptAPIKey("")
	assert.Error(t, err, "Should fail to decrypt empty string")

	_, err = service.decryptAPIKey("invalid-base64")
	assert.Error(t, err, "Should fail to decrypt invalid base64")
}

func TestCreateAPIKey(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service, err := NewService(db)
	require.NoError(t, err)

	userID := "system" // Use existing system user
	defer cleanupTestData(t, db, userID)

	ctx := context.Background()

	// Test valid API key creation
	req := &types.CreateApiKeyRequest{
		KeyName:     "test_gemini_key",
		ServiceName: "gemini",
		KeyType:     "api_key",
		KeyValue:    "sk-test-gemini-key-12345",
		DisplayName: "Test Gemini API Key",
		Description: "Test key for Gemini API",
		AccessLevel: "read_write",
		Scopes:      []string{"generate", "chat"},
		Permissions: map[string]interface{}{"can_function_call": true},
		IsDefault:   true,
		Environment: "test",
		ServiceConfig: map[string]interface{}{
			"model":  "gemini-pro",
			"region": "us-central1",
		},
	}

	apiKey, err := service.CreateAPIKey(ctx, userID, req)
	require.NoError(t, err, "Failed to create API key")

	assert.NotEmpty(t, apiKey.ID, "API key ID should not be empty")
	assert.Equal(t, userID, apiKey.UserID, "User ID should match")
	assert.Equal(t, req.KeyName, apiKey.KeyName, "Key name should match")
	assert.Equal(t, req.ServiceName, apiKey.ServiceName, "Service name should match")
	assert.Equal(t, req.DisplayName, apiKey.DisplayName, "Display name should match")
	assert.Equal(t, "AES-256-GCM", apiKey.EncryptionAlgorithm, "Encryption algorithm should be set")
	assert.Equal(t, "untested", apiKey.ValidationStatus, "Initial validation status should be untested")
	assert.True(t, apiKey.IsActive, "API key should be active")
	assert.True(t, apiKey.IsDefault, "API key should be default")
	assert.Equal(t, 0, apiKey.TotalUses, "Initial usage should be zero")

	// Test duplicate key name
	_, err = service.CreateAPIKey(ctx, userID, req)
	assert.Error(t, err, "Should fail to create duplicate key name")
	assert.Contains(t, err.Error(), "already exists", "Error should mention key already exists")

	// Test invalid request
	invalidReq := &types.CreateApiKeyRequest{
		KeyName: "", // Missing required field
	}
	_, err = service.CreateAPIKey(ctx, userID, invalidReq)
	assert.Error(t, err, "Should fail with invalid request")
	assert.Contains(t, err.Error(), "validation failed", "Error should mention validation failure")
}

func TestGetAPIKeys(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service, err := NewService(db)
	require.NoError(t, err)

	userID := "system" // Use existing system user
	defer cleanupTestData(t, db, userID)

	ctx := context.Background()

	// Initially should have no API keys
	apiKeys, err := service.GetAPIKeys(ctx, userID)
	require.NoError(t, err, "Failed to get API keys")
	assert.Empty(t, apiKeys, "Should have no API keys initially")

	// Create some test API keys
	services := []string{"gemini", "openweather", "stripe"}
	for i, serviceName := range services {
		req := &types.CreateApiKeyRequest{
			KeyName:     serviceName + "_key_" + time.Now().Format("150405"),
			ServiceName: serviceName,
			KeyType:     "api_key",
			KeyValue:    "sk-test-" + serviceName + "-key-12345",
			DisplayName: "Test " + serviceName + " API Key",
			AccessLevel: "read_write",
			IsDefault:   i == 0, // First one is default
			Environment: "test",
		}

		_, err := service.CreateAPIKey(ctx, userID, req)
		require.NoError(t, err, "Failed to create test API key")
	}

	// Test getting all API keys
	apiKeys, err = service.GetAPIKeys(ctx, userID)
	require.NoError(t, err, "Failed to get API keys")
	assert.Len(t, apiKeys, 3, "Should have 3 API keys")

	// Verify sorting (by service name, then by default status)
	assert.Equal(t, "gemini", apiKeys[0].ServiceName, "First should be gemini")
	assert.True(t, apiKeys[0].IsDefault, "First gemini key should be default")

	// Test getting API keys by service
	geminiKeys, err := service.GetAPIKeysByService(ctx, userID, "gemini")
	require.NoError(t, err, "Failed to get Gemini API keys")
	assert.Len(t, geminiKeys, 1, "Should have 1 Gemini API key")
	assert.Equal(t, "gemini", geminiKeys[0].ServiceName, "Should be Gemini service")
}

func TestGetAPIKeyByID(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service, err := NewService(db)
	require.NoError(t, err)

	userID := "system" // Use existing system user
	defer cleanupTestData(t, db, userID)

	ctx := context.Background()

	// Create a test API key
	req := &types.CreateApiKeyRequest{
		KeyName:     "test_key_for_id",
		ServiceName: "gemini",
		KeyType:     "api_key",
		KeyValue:    "sk-test-key-for-id-12345",
		DisplayName: "Test Key for ID Lookup",
		AccessLevel: "read_write",
		IsDefault:   true,
		Environment: "test",
	}

	createdKey, err := service.CreateAPIKey(ctx, userID, req)
	require.NoError(t, err, "Failed to create test API key")

	// Test getting API key by ID
	retrievedKey, err := service.GetAPIKeyByID(ctx, userID, createdKey.ID)
	require.NoError(t, err, "Failed to get API key by ID")

	assert.Equal(t, createdKey.ID, retrievedKey.ID, "IDs should match")
	assert.Equal(t, createdKey.KeyName, retrievedKey.KeyName, "Key names should match")
	assert.Equal(t, createdKey.ServiceName, retrievedKey.ServiceName, "Service names should match")

	// Test getting non-existent API key
	_, err = service.GetAPIKeyByID(ctx, userID, "non-existent-id")
	assert.Error(t, err, "Should fail to get non-existent API key")
	assert.Contains(t, err.Error(), "not found", "Error should mention not found")

	// Test getting API key with wrong user ID
	_, err = service.GetAPIKeyByID(ctx, "wrong-user-id", createdKey.ID)
	assert.Error(t, err, "Should fail to get API key with wrong user ID")
}

func TestGetDecryptedAPIKey(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service, err := NewService(db)
	require.NoError(t, err)

	userID := "system" // Use existing system user
	defer cleanupTestData(t, db, userID)

	ctx := context.Background()

	originalKey := "sk-test-decryption-key-12345"

	// Create a test API key
	req := &types.CreateApiKeyRequest{
		KeyName:     "test_decryption_key",
		ServiceName: "gemini",
		KeyType:     "api_key",
		KeyValue:    originalKey,
		DisplayName: "Test Decryption Key",
		AccessLevel: "read_write",
		Environment: "test",
	}

	createdKey, err := service.CreateAPIKey(ctx, userID, req)
	require.NoError(t, err, "Failed to create test API key")

	// Test getting decrypted API key
	decryptedKey, err := service.GetDecryptedAPIKey(ctx, userID, createdKey.ID)
	require.NoError(t, err, "Failed to get decrypted API key")
	assert.Equal(t, originalKey, decryptedKey, "Decrypted key should match original")

	// Test getting non-existent API key
	_, err = service.GetDecryptedAPIKey(ctx, userID, "non-existent-id")
	assert.Error(t, err, "Should fail to get non-existent API key")

	// Test getting API key with wrong user ID
	_, err = service.GetDecryptedAPIKey(ctx, "wrong-user-id", createdKey.ID)
	assert.Error(t, err, "Should fail to get API key with wrong user ID")
}

func TestValidateCreateRequest(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service, err := NewService(db)
	require.NoError(t, err)

	// Test valid request
	validReq := &types.CreateApiKeyRequest{
		KeyName:     "valid_key",
		ServiceName: "gemini",
		KeyValue:    "sk-valid-key-12345",
		DisplayName: "Valid Key",
		AccessLevel: "read_write",
		KeyType:     "api_key",
		Environment: "production",
	}
	err = service.validateCreateRequest(validReq)
	assert.NoError(t, err, "Valid request should pass validation")

	// Test missing required fields
	testCases := []struct {
		name          string
		req           *types.CreateApiKeyRequest
		expectedError string
	}{
		{
			name: "Missing key name",
			req: &types.CreateApiKeyRequest{
				ServiceName: "gemini",
				KeyValue:    "sk-key-12345",
				DisplayName: "Test Key",
			},
			expectedError: "key name is required",
		},
		{
			name: "Missing service name",
			req: &types.CreateApiKeyRequest{
				KeyName:     "test_key",
				KeyValue:    "sk-key-12345",
				DisplayName: "Test Key",
			},
			expectedError: "service name is required",
		},
		{
			name: "Missing key value",
			req: &types.CreateApiKeyRequest{
				KeyName:     "test_key",
				ServiceName: "gemini",
				DisplayName: "Test Key",
			},
			expectedError: "key value is required",
		},
		{
			name: "Missing display name",
			req: &types.CreateApiKeyRequest{
				KeyName:     "test_key",
				ServiceName: "gemini",
				KeyValue:    "sk-key-12345",
			},
			expectedError: "display name is required",
		},
		{
			name: "Invalid access level",
			req: &types.CreateApiKeyRequest{
				KeyName:     "test_key",
				ServiceName: "gemini",
				KeyValue:    "sk-key-12345",
				DisplayName: "Test Key",
				AccessLevel: "invalid_level",
			},
			expectedError: "invalid access level",
		},
		{
			name: "Invalid key type",
			req: &types.CreateApiKeyRequest{
				KeyName:     "test_key",
				ServiceName: "gemini",
				KeyValue:    "sk-key-12345",
				DisplayName: "Test Key",
				KeyType:     "invalid_type",
			},
			expectedError: "invalid key type",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := service.validateCreateRequest(tc.req)
			assert.Error(t, err, "Should fail validation")
			assert.Contains(t, err.Error(), tc.expectedError, "Error message should contain expected text")
		})
	}

	// Test default value setting
	reqWithDefaults := &types.CreateApiKeyRequest{
		KeyName:     "test_defaults",
		ServiceName: "gemini",
		KeyValue:    "sk-key-12345",
		DisplayName: "Test Defaults",
		// AccessLevel, Environment, KeyType not set
	}
	err = service.validateCreateRequest(reqWithDefaults)
	assert.NoError(t, err, "Should set defaults and pass validation")
	assert.Equal(t, "read_write", reqWithDefaults.AccessLevel, "Should set default access level")
	assert.Equal(t, "production", reqWithDefaults.Environment, "Should set default environment")
	assert.Equal(t, "api_key", reqWithDefaults.KeyType, "Should set default key type")
}

func TestDefaultKeyManagement(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service, err := NewService(db)
	require.NoError(t, err)

	userID := "system" // Use existing system user
	defer cleanupTestData(t, db, userID)

	ctx := context.Background()

	// Create first key as default
	req1 := &types.CreateApiKeyRequest{
		KeyName:     "gemini_key_1",
		ServiceName: "gemini",
		KeyType:     "api_key",
		KeyValue:    "sk-gemini-key-1",
		DisplayName: "Gemini Key 1",
		AccessLevel: "read_write",
		IsDefault:   true,
		Environment: "test",
	}

	key1, err := service.CreateAPIKey(ctx, userID, req1)
	require.NoError(t, err, "Failed to create first API key")
	assert.True(t, key1.IsDefault, "First key should be default")

	// Create second key as default (should unset the first)
	req2 := &types.CreateApiKeyRequest{
		KeyName:     "gemini_key_2",
		ServiceName: "gemini",
		KeyType:     "api_key",
		KeyValue:    "sk-gemini-key-2",
		DisplayName: "Gemini Key 2",
		AccessLevel: "read_write",
		IsDefault:   true,
		Environment: "test",
	}

	key2, err := service.CreateAPIKey(ctx, userID, req2)
	require.NoError(t, err, "Failed to create second API key")
	assert.True(t, key2.IsDefault, "Second key should be default")

	// Verify first key is no longer default
	updatedKey1, err := service.GetAPIKeyByID(ctx, userID, key1.ID)
	require.NoError(t, err, "Failed to get updated first key")
	assert.False(t, updatedKey1.IsDefault, "First key should no longer be default")

	// Verify only one default key per service
	geminiKeys, err := service.GetAPIKeysByService(ctx, userID, "gemini")
	require.NoError(t, err, "Failed to get Gemini keys")

	defaultCount := 0
	for _, key := range geminiKeys {
		if key.IsDefault {
			defaultCount++
		}
	}
	assert.Equal(t, 1, defaultCount, "Should have exactly one default key per service")
}
