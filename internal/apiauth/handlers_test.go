package apiauth

import (
	"context"
	"testing"

	"gogent/internal/types"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGitHubPATHandler(t *testing.T) {
	handler := NewGitHubPATHandler()

	t.Run("GetAuthMode", func(t *testing.T) {
		assert.Equal(t, "personal_access_token", handler.GetAuthMode())
	})

	t.Run("GetAuthHeaders", func(t *testing.T) {
		apiKey := &types.UserApiKey{
			AuthMode: "personal_access_token",
			AuthConfig: map[string]interface{}{
				"decrypted_token": "ghp_test1234567890abcdef1234567890abcdef",
			},
		}

		headers, err := handler.GetAuthHeaders(context.Background(), apiKey)
		require.NoError(t, err)

		assert.Equal(t, "token ghp_test1234567890abcdef1234567890abcdef", headers["Authorization"])
		assert.Equal(t, "application/vnd.github+json", headers["Accept"])
		assert.Equal(t, "2022-11-28", headers["X-GitHub-Api-Version"])
		assert.Equal(t, "GoGent/1.0", headers["User-Agent"])
	})

	t.Run("GetAuthHeaders_MissingToken", func(t *testing.T) {
		apiKey := &types.UserApiKey{
			AuthMode:   "personal_access_token",
			AuthConfig: map[string]interface{}{},
		}

		_, err := handler.GetAuthHeaders(context.Background(), apiKey)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "GitHub PAT token not found")
	})

	t.Run("GetRateLimit", func(t *testing.T) {
		rateLimit := handler.GetRateLimit()
		assert.Equal(t, 5000, rateLimit.RequestsPerHour)
		assert.Equal(t, "top of the hour", rateLimit.ResetTime)
	})
}

func TestGitHubAppHandler(t *testing.T) {
	handler := NewGitHubAppHandler()

	t.Run("GetAuthMode", func(t *testing.T) {
		assert.Equal(t, "github_app", handler.GetAuthMode())
	})

	t.Run("ParseAppConfig", func(t *testing.T) {
		authConfig := map[string]interface{}{
			"app_id":          float64(123456),
			"private_key":     "-----BEGIN RSA PRIVATE KEY-----\ntest_key_content\n-----END RSA PRIVATE KEY-----",
			"installation_id": float64(12345678),
		}

		config, err := handler.parseAppConfig(authConfig)
		require.NoError(t, err)

		assert.Equal(t, int64(123456), config.AppID)
		assert.Equal(t, int64(12345678), config.InstallationID)
		assert.Contains(t, config.PrivateKey, "BEGIN RSA PRIVATE KEY")
	})

	t.Run("ParseAppConfig_MissingFields", func(t *testing.T) {
		authConfig := map[string]interface{}{
			"app_id": float64(123456),
			// missing private_key and installation_id
		}

		_, err := handler.parseAppConfig(authConfig)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "private_key not found")
	})

	t.Run("ParseAppConfig_InvalidTypes", func(t *testing.T) {
		authConfig := map[string]interface{}{
			"app_id":          "not_a_number",
			"private_key":     "test_key",
			"installation_id": float64(12345678),
		}

		_, err := handler.parseAppConfig(authConfig)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid app_id type")
	})

	t.Run("GetRateLimit", func(t *testing.T) {
		rateLimit := handler.GetRateLimit()
		assert.Equal(t, 5000, rateLimit.RequestsPerHour)
		assert.Equal(t, "top of the hour", rateLimit.ResetTime)
	})
}

func TestSlackBotTokenHandler(t *testing.T) {
	handler := NewSlackBotTokenHandler()

	t.Run("GetAuthMode", func(t *testing.T) {
		assert.Equal(t, "bot_token", handler.GetAuthMode())
	})

	t.Run("GetAuthHeaders", func(t *testing.T) {
		apiKey := &types.UserApiKey{
			AuthMode: "bot_token",
			AuthConfig: map[string]interface{}{
				"token": "xoxb-test-token-12345",
			},
		}

		headers, err := handler.GetAuthHeaders(context.Background(), apiKey)
		require.NoError(t, err)

		assert.Equal(t, "Bearer xoxb-test-token-12345", headers["Authorization"])
		assert.Equal(t, "application/json", headers["Content-Type"])
		assert.Equal(t, "GoGent/1.0", headers["User-Agent"])
	})

	t.Run("GetRateLimit", func(t *testing.T) {
		rateLimit := handler.GetRateLimit()
		assert.Equal(t, 100, rateLimit.RequestsPerHour)
		assert.Equal(t, "per minute", rateLimit.ResetTime)
	})
}

func TestGeminiAPIKeyHandler(t *testing.T) {
	handler := NewGeminiAPIKeyHandler()

	t.Run("GetAuthMode", func(t *testing.T) {
		assert.Equal(t, "api_key", handler.GetAuthMode())
	})

	t.Run("GetAuthHeaders", func(t *testing.T) {
		apiKey := &types.UserApiKey{
			AuthMode: "api_key",
			AuthConfig: map[string]interface{}{
				"api_key": "AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
			},
		}

		headers, err := handler.GetAuthHeaders(context.Background(), apiKey)
		require.NoError(t, err)

		assert.Equal(t, "AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", headers["x-goog-api-key"])
		assert.Equal(t, "application/json", headers["Content-Type"])
		assert.Equal(t, "GoGent/1.0", headers["User-Agent"])
	})

	t.Run("GetRateLimit", func(t *testing.T) {
		rateLimit := handler.GetRateLimit()
		assert.Equal(t, 60, rateLimit.RequestsPerHour)
		assert.Equal(t, 1500, rateLimit.RequestsPerDay)
		assert.Equal(t, "per minute", rateLimit.ResetTime)
	})
}

func TestAuthResolver(t *testing.T) {
	resolver := NewAuthResolver()

	t.Run("GetHandler", func(t *testing.T) {
		handler, err := resolver.GetHandler("github", "personal_access_token")
		require.NoError(t, err)
		assert.Equal(t, "personal_access_token", handler.GetAuthMode())

		handler, err = resolver.GetHandler("github", "github_app")
		require.NoError(t, err)
		assert.Equal(t, "github_app", handler.GetAuthMode())
	})

	t.Run("GetHandler_UnknownProvider", func(t *testing.T) {
		_, err := resolver.GetHandler("unknown", "api_key")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "no handlers registered for provider: unknown")
	})

	t.Run("GetHandler_UnknownAuthMode", func(t *testing.T) {
		_, err := resolver.GetHandler("github", "unknown_mode")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "no handler registered for provider github with auth mode: unknown_mode")
	})

	t.Run("RegisterHandler", func(t *testing.T) {
		customHandler := NewGitHubPATHandler()
		resolver.RegisterHandler("custom", "test_mode", customHandler)

		handler, err := resolver.GetHandler("custom", "test_mode")
		require.NoError(t, err)
		assert.Equal(t, customHandler, handler)
	})

	t.Run("ResolveAuth", func(t *testing.T) {
		apiKey := &types.UserApiKey{
			ServiceName: "github",
			AuthMode:    "personal_access_token",
			AuthConfig: map[string]interface{}{
				"decrypted_token": "ghp_test1234567890abcdef1234567890abcdef",
			},
		}

		credentials, err := resolver.ResolveAuth(context.Background(), apiKey)
		require.NoError(t, err)

		assert.Equal(t, "personal_access_token", credentials.AuthMode)
		assert.Equal(t, apiKey.AuthConfig, credentials.AuthConfig)
		assert.Contains(t, credentials.Headers["Authorization"], "ghp_test1234567890abcdef1234567890abcdef")
	})
}
