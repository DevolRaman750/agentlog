package apiauth

import (
	"context"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"net/http"
	"sync"
	"time"

	"gogent/internal/types"

	"github.com/golang-jwt/jwt/v5"
)

// AuthHandler interface for different authentication modes
type AuthHandler interface {
	GetAuthHeaders(ctx context.Context, apiKey *types.UserApiKey) (map[string]string, error)
	ValidateCredentials(ctx context.Context, apiKey *types.UserApiKey) error
	RefreshCredentials(ctx context.Context, apiKey *types.UserApiKey) (*types.AuthCredentials, error)
	GetRateLimit() *types.RateLimit
	GetAuthMode() string
}

// AuthResolver manages different authentication handlers
type AuthResolver struct {
	handlers map[string]map[string]AuthHandler // provider -> auth_mode -> handler
	mutex    sync.RWMutex
}

// NewAuthResolver creates a new authentication resolver
func NewAuthResolver() *AuthResolver {
	resolver := &AuthResolver{
		handlers: make(map[string]map[string]AuthHandler),
	}
	
	// Register default handlers
	resolver.RegisterHandler("github", "personal_access_token", NewGitHubPATHandler())
	resolver.RegisterHandler("github", "github_app", NewGitHubAppHandler())
	resolver.RegisterHandler("slack", "bot_token", NewSlackBotTokenHandler())
	resolver.RegisterHandler("gemini", "api_key", NewGeminiAPIKeyHandler())
	
	return resolver
}

// RegisterHandler registers an auth handler for a specific provider and auth mode
func (r *AuthResolver) RegisterHandler(provider, authMode string, handler AuthHandler) {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if r.handlers[provider] == nil {
		r.handlers[provider] = make(map[string]AuthHandler)
	}
	r.handlers[provider][authMode] = handler
}

// GetHandler returns the appropriate auth handler for a provider and auth mode
func (r *AuthResolver) GetHandler(provider, authMode string) (AuthHandler, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	providerHandlers, exists := r.handlers[provider]
	if !exists {
		return nil, fmt.Errorf("no handlers registered for provider: %s", provider)
	}
	
	handler, exists := providerHandlers[authMode]
	if !exists {
		return nil, fmt.Errorf("no handler registered for provider %s with auth mode: %s", provider, authMode)
	}
	
	return handler, nil
}

// ResolveAuth resolves authentication for a given API key
func (r *AuthResolver) ResolveAuth(ctx context.Context, apiKey *types.UserApiKey) (*types.AuthCredentials, error) {
	handler, err := r.GetHandler(apiKey.ServiceName, apiKey.AuthMode)
	if err != nil {
		return nil, fmt.Errorf("failed to get auth handler: %w", err)
	}
	
	headers, err := handler.GetAuthHeaders(ctx, apiKey)
	if err != nil {
		return nil, fmt.Errorf("failed to get auth headers: %w", err)
	}
	
	return &types.AuthCredentials{
		Headers:    headers,
		AuthMode:   apiKey.AuthMode,
		AuthConfig: apiKey.AuthConfig,
	}, nil
}

// GitHubPATHandler handles GitHub Personal Access Token authentication
type GitHubPATHandler struct{}

func NewGitHubPATHandler() *GitHubPATHandler {
	return &GitHubPATHandler{}
}

func (h *GitHubPATHandler) GetAuthMode() string {
	return "personal_access_token"
}

func (h *GitHubPATHandler) GetAuthHeaders(ctx context.Context, apiKey *types.UserApiKey) (map[string]string, error) {
	// For PAT, the token should be in the auth config under "decrypted_token"
	// This is set by the auth service when it decrypts the key value
	
	var token string
	if tokenVal, exists := apiKey.AuthConfig["decrypted_token"]; exists {
		if tokenStr, ok := tokenVal.(string); ok {
			token = tokenStr
		}
	}
	
	if token == "" {
		return nil, fmt.Errorf("GitHub PAT token not found - decrypted token not provided")
	}
	
	return map[string]string{
		"Authorization":         "token " + token,
		"Accept":               "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
		"User-Agent":           "GoGent/1.0",
	}, nil
}

func (h *GitHubPATHandler) ValidateCredentials(ctx context.Context, apiKey *types.UserApiKey) error {
	headers, err := h.GetAuthHeaders(ctx, apiKey)
	if err != nil {
		return err
	}
	
	// Make a test request to GitHub API
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user", nil)
	if err != nil {
		return fmt.Errorf("failed to create validation request: %w", err)
	}
	
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("validation request failed: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("GitHub PAT validation failed with status: %d", resp.StatusCode)
	}
	
	return nil
}

func (h *GitHubPATHandler) RefreshCredentials(ctx context.Context, apiKey *types.UserApiKey) (*types.AuthCredentials, error) {
	// PAT doesn't need refresh, just return current credentials
	headers, err := h.GetAuthHeaders(ctx, apiKey)
	if err != nil {
		return nil, err
	}
	
	return &types.AuthCredentials{
		Headers:    headers,
		AuthMode:   apiKey.AuthMode,
		AuthConfig: apiKey.AuthConfig,
	}, nil
}

func (h *GitHubPATHandler) GetRateLimit() *types.RateLimit {
	return &types.RateLimit{
		RequestsPerHour: 5000,
		ResetTime:       "top of the hour",
	}
}

// GitHubAppHandler handles GitHub App authentication
type GitHubAppHandler struct {
	tokenCache map[int64]*types.InstallationToken
	cacheMutex sync.RWMutex
}

func NewGitHubAppHandler() *GitHubAppHandler {
	return &GitHubAppHandler{
		tokenCache: make(map[int64]*types.InstallationToken),
	}
}

func (h *GitHubAppHandler) GetAuthMode() string {
	return "github_app"
}

func (h *GitHubAppHandler) GetAuthHeaders(ctx context.Context, apiKey *types.UserApiKey) (map[string]string, error) {
	// Parse GitHub App config
	appConfig, err := h.parseAppConfig(apiKey.AuthConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to parse GitHub App config: %w", err)
	}
	
	// Get or refresh installation token
	installationToken, err := h.getInstallationToken(ctx, appConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to get installation token: %w", err)
	}
	
	return map[string]string{
		"Authorization":         "token " + installationToken.Token,
		"Accept":               "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
		"User-Agent":           "GoGent/1.0",
	}, nil
}

func (h *GitHubAppHandler) parseAppConfig(authConfig map[string]interface{}) (*types.GitHubAppConfig, error) {
	appIDVal, exists := authConfig["app_id"]
	if !exists {
		return nil, fmt.Errorf("app_id not found in auth config")
	}
	
	privateKeyVal, exists := authConfig["private_key"]
	if !exists {
		return nil, fmt.Errorf("private_key not found in auth config")
	}
	
	installationIDVal, exists := authConfig["installation_id"]
	if !exists {
		return nil, fmt.Errorf("installation_id not found in auth config")
	}
	
	// Convert values to appropriate types
	var appID, installationID int64
	var privateKey string
	
	switch v := appIDVal.(type) {
	case float64:
		appID = int64(v)
	case int64:
		appID = v
	case int:
		appID = int64(v)
	default:
		return nil, fmt.Errorf("invalid app_id type: %T", v)
	}
	
	switch v := installationIDVal.(type) {
	case float64:
		installationID = int64(v)
	case int64:
		installationID = v
	case int:
		installationID = int64(v)
	default:
		return nil, fmt.Errorf("invalid installation_id type: %T", v)
	}
	
	if keyStr, ok := privateKeyVal.(string); ok {
		privateKey = keyStr
	} else {
		return nil, fmt.Errorf("invalid private_key type: %T", privateKeyVal)
	}
	
	return &types.GitHubAppConfig{
		AppID:          appID,
		PrivateKey:     privateKey,
		InstallationID: installationID,
	}, nil
}

func (h *GitHubAppHandler) getInstallationToken(ctx context.Context, config *types.GitHubAppConfig) (*types.InstallationToken, error) {
	h.cacheMutex.RLock()
	if token, exists := h.tokenCache[config.InstallationID]; exists {
		// Check if token is still valid (expires in 1 hour, refresh 5 minutes early)
		if time.Until(token.ExpiresAt) > 5*time.Minute {
			h.cacheMutex.RUnlock()
			return token, nil
		}
	}
	h.cacheMutex.RUnlock()
	
	// Generate JWT for GitHub App authentication
	jwt, err := h.generateJWT(config)
	if err != nil {
		return nil, fmt.Errorf("failed to generate JWT: %w", err)
	}
	
	// Request installation token
	installationToken, err := h.requestInstallationToken(ctx, config.InstallationID, jwt)
	if err != nil {
		return nil, fmt.Errorf("failed to request installation token: %w", err)
	}
	
	// Cache the token
	h.cacheMutex.Lock()
	h.tokenCache[config.InstallationID] = installationToken
	h.cacheMutex.Unlock()
	
	return installationToken, nil
}

func (h *GitHubAppHandler) generateJWT(config *types.GitHubAppConfig) (string, error) {
	// Parse private key
	block, _ := pem.Decode([]byte(config.PrivateKey))
	if block == nil {
		return "", fmt.Errorf("failed to decode PEM block containing private key")
	}
	
	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		// Try PKCS8 format
		key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			return "", fmt.Errorf("failed to parse private key: %w", err)
		}
		var ok bool
		privateKey, ok = key.(*rsa.PrivateKey)
		if !ok {
			return "", fmt.Errorf("private key is not RSA")
		}
	}
	
	// Create JWT claims
	now := time.Now()
	claims := jwt.MapClaims{
		"iat": now.Unix(),
		"exp": now.Add(10 * time.Minute).Unix(), // JWT expires in 10 minutes
		"iss": config.AppID,
	}
	
	// Create and sign token
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	return token.SignedString(privateKey)
}

func (h *GitHubAppHandler) requestInstallationToken(ctx context.Context, installationID int64, jwtToken string) (*types.InstallationToken, error) {
	url := fmt.Sprintf("https://api.github.com/app/installations/%d/access_tokens", installationID)
	
	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	
	req.Header.Set("Authorization", "Bearer "+jwtToken)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "GoGent/1.0")
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}
	
	var tokenResp struct {
		Token     string    `json:"token"`
		ExpiresAt time.Time `json:"expires_at"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	
	return &types.InstallationToken{
		Token:     tokenResp.Token,
		ExpiresAt: tokenResp.ExpiresAt,
	}, nil
}

func (h *GitHubAppHandler) ValidateCredentials(ctx context.Context, apiKey *types.UserApiKey) error {
	headers, err := h.GetAuthHeaders(ctx, apiKey)
	if err != nil {
		return err
	}
	
	// Parse config to get installation ID for validation endpoint
	appConfig, err := h.parseAppConfig(apiKey.AuthConfig)
	if err != nil {
		return fmt.Errorf("failed to parse app config: %w", err)
	}
	
	// Make a test request to validate the installation
	url := fmt.Sprintf("https://api.github.com/app/installations/%d", appConfig.InstallationID)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create validation request: %w", err)
	}
	
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("validation request failed: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("GitHub App validation failed with status: %d", resp.StatusCode)
	}
	
	return nil
}

func (h *GitHubAppHandler) RefreshCredentials(ctx context.Context, apiKey *types.UserApiKey) (*types.AuthCredentials, error) {
	// Parse config and force refresh token
	appConfig, err := h.parseAppConfig(apiKey.AuthConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to parse app config: %w", err)
	}
	
	// Clear cached token to force refresh
	h.cacheMutex.Lock()
	delete(h.tokenCache, appConfig.InstallationID)
	h.cacheMutex.Unlock()
	
	// Get fresh headers
	headers, err := h.GetAuthHeaders(ctx, apiKey)
	if err != nil {
		return nil, err
	}
	
	return &types.AuthCredentials{
		Headers:    headers,
		AuthMode:   apiKey.AuthMode,
		AuthConfig: apiKey.AuthConfig,
	}, nil
}

func (h *GitHubAppHandler) GetRateLimit() *types.RateLimit {
	return &types.RateLimit{
		RequestsPerHour: 5000,
		ResetTime:       "top of the hour",
	}
}

// SlackBotTokenHandler handles Slack Bot Token authentication
type SlackBotTokenHandler struct{}

func NewSlackBotTokenHandler() *SlackBotTokenHandler {
	return &SlackBotTokenHandler{}
}

func (h *SlackBotTokenHandler) GetAuthMode() string {
	return "bot_token"
}

func (h *SlackBotTokenHandler) GetAuthHeaders(ctx context.Context, apiKey *types.UserApiKey) (map[string]string, error) {
	// For Slack, the token should be in the encrypted key value or auth config
	var token string
	if tokenVal, exists := apiKey.AuthConfig["token"]; exists {
		if tokenStr, ok := tokenVal.(string); ok {
			token = tokenStr
		}
	}
	
	if token == "" {
		return nil, fmt.Errorf("Slack bot token not found in auth config")
	}
	
	return map[string]string{
		"Authorization": "Bearer " + token,
		"Content-Type":  "application/json",
		"User-Agent":    "GoGent/1.0",
	}, nil
}

func (h *SlackBotTokenHandler) ValidateCredentials(ctx context.Context, apiKey *types.UserApiKey) error {
	// Implementation would validate Slack token
	return nil
}

func (h *SlackBotTokenHandler) RefreshCredentials(ctx context.Context, apiKey *types.UserApiKey) (*types.AuthCredentials, error) {
	headers, err := h.GetAuthHeaders(ctx, apiKey)
	if err != nil {
		return nil, err
	}
	
	return &types.AuthCredentials{
		Headers:    headers,
		AuthMode:   apiKey.AuthMode,
		AuthConfig: apiKey.AuthConfig,
	}, nil
}

func (h *SlackBotTokenHandler) GetRateLimit() *types.RateLimit {
	return &types.RateLimit{
		RequestsPerHour: 100, // Slack has tier-based limits
		ResetTime:       "per minute",
	}
}

// GeminiAPIKeyHandler handles Gemini API Key authentication
type GeminiAPIKeyHandler struct{}

func NewGeminiAPIKeyHandler() *GeminiAPIKeyHandler {
	return &GeminiAPIKeyHandler{}
}

func (h *GeminiAPIKeyHandler) GetAuthMode() string {
	return "api_key"
}

func (h *GeminiAPIKeyHandler) GetAuthHeaders(ctx context.Context, apiKey *types.UserApiKey) (map[string]string, error) {
	var token string
	if tokenVal, exists := apiKey.AuthConfig["api_key"]; exists {
		if tokenStr, ok := tokenVal.(string); ok {
			token = tokenStr
		}
	}
	
	if token == "" {
		return nil, fmt.Errorf("Gemini API key not found in auth config")
	}
	
	return map[string]string{
		"x-goog-api-key": token,
		"Content-Type":   "application/json",
		"User-Agent":     "GoGent/1.0",
	}, nil
}

func (h *GeminiAPIKeyHandler) ValidateCredentials(ctx context.Context, apiKey *types.UserApiKey) error {
	// Implementation would validate Gemini API key
	return nil
}

func (h *GeminiAPIKeyHandler) RefreshCredentials(ctx context.Context, apiKey *types.UserApiKey) (*types.AuthCredentials, error) {
	headers, err := h.GetAuthHeaders(ctx, apiKey)
	if err != nil {
		return nil, err
	}
	
	return &types.AuthCredentials{
		Headers:    headers,
		AuthMode:   apiKey.AuthMode,
		AuthConfig: apiKey.AuthConfig,
	}, nil
}

func (h *GeminiAPIKeyHandler) GetRateLimit() *types.RateLimit {
	return &types.RateLimit{
		RequestsPerHour: 60,
		RequestsPerDay:  1500,
		ResetTime:       "per minute",
	}
}