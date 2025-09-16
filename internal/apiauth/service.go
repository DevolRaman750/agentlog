package apiauth

import (
	"context"
	"fmt"

	"gogent/internal/apikeys"
	"gogent/internal/types"
)

// Service provides authentication services
type Service struct {
	apiKeyService *apikeys.Service
	authResolver  *AuthResolver
}

// NewService creates a new authentication service
func NewService(apiKeyService *apikeys.Service) *Service {
	return &Service{
		apiKeyService: apiKeyService,
		authResolver:  NewAuthResolver(),
	}
}

// GetAuthCredentialsForService gets authentication credentials for a specific service
func (s *Service) GetAuthCredentialsForService(ctx context.Context, userID, serviceName string) (
	*types.AuthCredentials, error) {
	// Get API keys for the service
	apiKeys, err := s.apiKeyService.GetAPIKeysByService(ctx, userID, serviceName)
	if err != nil {
		return nil, fmt.Errorf("failed to get API keys for service %s: %w", serviceName, err)
	}

	if len(apiKeys) == 0 {
		return nil, fmt.Errorf("no API keys found for service: %s", serviceName)
	}

	// Select the best key based on priority:
	// 1. GitHub App credentials (github_app auth mode) - highest priority
	// 2. Default key (is_default = true)
	// 3. Most recently created key
	var selectedKey *types.UserAPIKey

	// First, look for GitHub App credentials
	for _, key := range apiKeys {
		if key.AuthMode == AuthModeGitHubApp {
			selectedKey = key
			break
		}
	}

	// If no GitHub App key found, use the default logic (first key is already sorted by is_default DESC, created_at DESC)
	if selectedKey == nil {
		selectedKey = apiKeys[0]
	}

	// Get the decrypted key value and add it to the API key for the handler
	decryptedValue, err := s.apiKeyService.GetDecryptedAPIKey(ctx, userID, selectedKey.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt API key: %w", err)
	}

	// Create a copy of the API key with the decrypted value in auth config
	keyWithDecryptedValue := *selectedKey

	// Create a copy of the auth config and add the decrypted value appropriately
	authConfig := make(map[string]interface{})
	for k, v := range selectedKey.AuthConfig {
		authConfig[k] = v
	}

	// Handle different auth modes differently
	if selectedKey.AuthMode == AuthModeGitHubApp {
		// For GitHub App, check if private_key already exists in auth_config
		if _, exists := authConfig["private_key"]; !exists {
			// Only use decrypted value if private_key is not already in auth_config
			authConfig["private_key"] = decryptedValue
		}
		// Note: For GitHub App, the private_key should be in auth_config JSON, not encrypted_key_value
	} else {
		// For PAT and other modes, use decrypted_token
		authConfig["decrypted_token"] = decryptedValue
	}

	keyWithDecryptedValue.AuthConfig = authConfig

	// Resolve authentication using the auth resolver
	return s.authResolver.ResolveAuth(ctx, &keyWithDecryptedValue)
}

// GetAuthCredentialsForKey gets authentication credentials for a specific API key
func (s *Service) GetAuthCredentialsForKey(ctx context.Context, userID, keyID string) (*types.AuthCredentials, error) {
	// Get the specific API key
	apiKey, err := s.apiKeyService.GetAPIKeyByID(ctx, userID, keyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get API key %s: %w", keyID, err)
	}

	// Resolve authentication using the auth resolver
	return s.authResolver.ResolveAuth(ctx, apiKey)
}

// ValidateCredentials validates credentials for an API key
func (s *Service) ValidateCredentials(ctx context.Context, userID, keyID string) error {
	// Get the API key
	apiKey, err := s.apiKeyService.GetAPIKeyByID(ctx, userID, keyID)
	if err != nil {
		return fmt.Errorf("failed to get API key %s: %w", keyID, err)
	}

	// Get the appropriate handler
	handler, err := s.authResolver.GetHandler(apiKey.ServiceName, apiKey.AuthMode)
	if err != nil {
		return fmt.Errorf("failed to get auth handler: %w", err)
	}

	// Validate credentials
	return handler.ValidateCredentials(ctx, apiKey)
}

// RefreshCredentials refreshes credentials for an API key
func (s *Service) RefreshCredentials(ctx context.Context, userID, keyID string) (*types.AuthCredentials, error) {
	// Get the API key
	apiKey, err := s.apiKeyService.GetAPIKeyByID(ctx, userID, keyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get API key %s: %w", keyID, err)
	}

	// Get the appropriate handler
	handler, err := s.authResolver.GetHandler(apiKey.ServiceName, apiKey.AuthMode)
	if err != nil {
		return nil, fmt.Errorf("failed to get auth handler: %w", err)
	}

	// Refresh credentials
	return handler.RefreshCredentials(ctx, apiKey)
}

// GetSupportedAuthModes returns supported authentication modes for a provider
func (s *Service) GetSupportedAuthModes(provider string) ([]string, error) {
	s.authResolver.mutex.RLock()
	defer s.authResolver.mutex.RUnlock()

	providerHandlers, exists := s.authResolver.handlers[provider]
	if !exists {
		return nil, fmt.Errorf("no handlers registered for provider: %s", provider)
	}

	var authModes []string
	for authMode := range providerHandlers {
		authModes = append(authModes, authMode)
	}

	return authModes, nil
}

// GetRateLimit returns rate limit information for a specific auth mode
func (s *Service) GetRateLimit(provider, authMode string) (*types.RateLimit, error) {
	handler, err := s.authResolver.GetHandler(provider, authMode)
	if err != nil {
		return nil, fmt.Errorf("failed to get auth handler: %w", err)
	}

	return handler.GetRateLimit(), nil
}
