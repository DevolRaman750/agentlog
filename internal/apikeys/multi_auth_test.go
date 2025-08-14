package apikeys

import (
	"context"
	"testing"

	"gogent/internal/types"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMultiAuthSupport(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service, err := NewService(db)
	require.NoError(t, err)

	userID := "system"
	defer cleanupTestData(t, db, userID)

	ctx := context.Background()

	t.Run("CreateGitHubPATKey", func(t *testing.T) {
		req := &types.CreateApiKeyRequest{
			KeyName:     "github_pat_key",
			ServiceName: "github",
			KeyType:     "api_key",
			KeyValue:    "ghp_test1234567890abcdef1234567890abcdef",
			AuthMode:    "personal_access_token",
			AuthConfig: map[string]interface{}{
				"token": "ghp_test1234567890abcdef1234567890abcdef",
			},
			DisplayName: "GitHub PAT Key",
			Description: "Test GitHub Personal Access Token",
			AccessLevel: "read_write",
			Scopes:      []string{"repo", "read:user"},
			IsDefault:   true,
			Environment: "test",
		}

		apiKey, err := service.CreateAPIKey(ctx, userID, req)
		require.NoError(t, err, "Failed to create GitHub PAT key")

		assert.Equal(t, "personal_access_token", apiKey.AuthMode)
		assert.NotNil(t, apiKey.AuthConfig)
		assert.Equal(t, "ghp_test1234567890abcdef1234567890abcdef", apiKey.AuthConfig["token"])
		assert.Equal(t, "github", apiKey.ServiceName)
		assert.True(t, apiKey.IsDefault)
	})

	t.Run("CreateGitHubAppKey", func(t *testing.T) {
		req := &types.CreateApiKeyRequest{
			KeyName:     "github_app_key",
			ServiceName: "github",
			KeyType:     "api_key",
			KeyValue:    "dummy_private_key_content",
			AuthMode:    "github_app",
			AuthConfig: map[string]interface{}{
				"app_id":          123456,
				"private_key":     "-----BEGIN RSA PRIVATE KEY-----\ntest_key_content\n-----END RSA PRIVATE KEY-----",
				"installation_id": 12345678,
			},
			DisplayName: "GitHub App Key",
			Description: "Test GitHub App authentication",
			AccessLevel: "read_write",
			Scopes:      []string{"repo", "issues"},
			IsDefault:   false,
			Environment: "test",
		}

		apiKey, err := service.CreateAPIKey(ctx, userID, req)
		require.NoError(t, err, "Failed to create GitHub App key")

		assert.Equal(t, "github_app", apiKey.AuthMode)
		assert.NotNil(t, apiKey.AuthConfig)
		assert.Equal(t, 123456, apiKey.AuthConfig["app_id"])
		assert.Equal(t, 12345678, apiKey.AuthConfig["installation_id"])
		assert.Contains(t, apiKey.AuthConfig["private_key"], "BEGIN RSA PRIVATE KEY")
		assert.Equal(t, "github", apiKey.ServiceName)
		assert.False(t, apiKey.IsDefault)
	})

	t.Run("DefaultAuthModeAssignment", func(t *testing.T) {
		// Test that default auth modes are assigned when not specified
		req := &types.CreateApiKeyRequest{
			KeyName:     "slack_default_key",
			ServiceName: "slack",
			KeyType:     "api_key",
			KeyValue:    "xoxb-test-token",
			// AuthMode not specified - should default to "bot_token"
			DisplayName: "Slack Bot Token",
			AccessLevel: "read_write",
			IsDefault:   true,
			Environment: "test",
		}

		apiKey, err := service.CreateAPIKey(ctx, userID, req)
		require.NoError(t, err, "Failed to create Slack key with default auth mode")

		assert.Equal(t, "bot_token", apiKey.AuthMode)
		assert.Equal(t, "slack", apiKey.ServiceName)
	})

	t.Run("GetAPIKeysWithAuthModes", func(t *testing.T) {
		// Retrieve all API keys and verify auth modes are preserved
		apiKeys, err := service.GetAPIKeys(ctx, userID)
		require.NoError(t, err, "Failed to get API keys")

		// Should have at least 3 keys from the tests above
		assert.GreaterOrEqual(t, len(apiKeys), 3)

		// Find and verify each key
		var githubPATKey, githubAppKey, slackKey *types.UserApiKey
		for _, key := range apiKeys {
			switch key.KeyName {
			case "github_pat_key":
				githubPATKey = key
			case "github_app_key":
				githubAppKey = key
			case "slack_default_key":
				slackKey = key
			}
		}

		// Verify GitHub PAT key
		require.NotNil(t, githubPATKey, "GitHub PAT key not found")
		assert.Equal(t, "personal_access_token", githubPATKey.AuthMode)
		assert.NotNil(t, githubPATKey.AuthConfig)

		// Verify GitHub App key
		require.NotNil(t, githubAppKey, "GitHub App key not found")
		assert.Equal(t, "github_app", githubAppKey.AuthMode)
		assert.NotNil(t, githubAppKey.AuthConfig)

		// Verify Slack key
		require.NotNil(t, slackKey, "Slack key not found")
		assert.Equal(t, "bot_token", slackKey.AuthMode)
	})

	t.Run("GetAPIKeysByServiceWithAuthModes", func(t *testing.T) {
		// Get GitHub keys specifically
		githubKeys, err := service.GetAPIKeysByService(ctx, userID, "github")
		require.NoError(t, err, "Failed to get GitHub API keys")

		// Should have 2 GitHub keys with different auth modes
		assert.Len(t, githubKeys, 2)

		// Verify we have both auth modes
		authModes := make(map[string]bool)
		for _, key := range githubKeys {
			authModes[key.AuthMode] = true
			assert.Equal(t, "github", key.ServiceName)
		}

		assert.True(t, authModes["personal_access_token"], "Missing PAT auth mode")
		assert.True(t, authModes["github_app"], "Missing GitHub App auth mode")
	})

	t.Run("GetAPIKeyByIDWithAuthConfig", func(t *testing.T) {
		// First get all keys to find a GitHub App key ID
		apiKeys, err := service.GetAPIKeys(ctx, userID)
		require.NoError(t, err)

		var githubAppKeyID string
		for _, key := range apiKeys {
			if key.AuthMode == "github_app" {
				githubAppKeyID = key.ID
				break
			}
		}

		require.NotEmpty(t, githubAppKeyID, "GitHub App key ID not found")

		// Get the specific key and verify auth config is preserved
		apiKey, err := service.GetAPIKeyByID(ctx, userID, githubAppKeyID)
		require.NoError(t, err, "Failed to get GitHub App key by ID")

		assert.Equal(t, "github_app", apiKey.AuthMode)
		assert.NotNil(t, apiKey.AuthConfig)
		assert.Equal(t, float64(123456), apiKey.AuthConfig["app_id"])
		assert.Equal(t, float64(12345678), apiKey.AuthConfig["installation_id"])
		assert.Contains(t, apiKey.AuthConfig["private_key"], "BEGIN RSA PRIVATE KEY")
	})
}

func TestAuthModeDefaults(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service, err := NewService(db)
	require.NoError(t, err)

	userID := "system"
	defer cleanupTestData(t, db, userID)

	ctx := context.Background()

	testCases := []struct {
		serviceName      string
		expectedAuthMode string
	}{
		{"github", "personal_access_token"},
		{"slack", "bot_token"},
		{"gemini", "api_key"},
		{"openweather", "api_key"},
		{"unknown_service", "api_key"},
	}

	for _, tc := range testCases {
		t.Run(tc.serviceName, func(t *testing.T) {
			req := &types.CreateApiKeyRequest{
				KeyName:     tc.serviceName + "_test_key",
				ServiceName: tc.serviceName,
				KeyType:     "api_key",
				KeyValue:    "test-key-value",
				DisplayName: tc.serviceName + " Test Key",
				AccessLevel: "read_write",
				IsDefault:   true,
				Environment: "test",
			}

			apiKey, err := service.CreateAPIKey(ctx, userID, req)
			require.NoError(t, err, "Failed to create key for "+tc.serviceName)

			assert.Equal(t, tc.expectedAuthMode, apiKey.AuthMode,
				"Wrong default auth mode for service "+tc.serviceName)
		})
	}
}
