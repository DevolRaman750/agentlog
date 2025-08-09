package base

import (
	"context"
	"net/http"

	"gogent/internal/db"
)

// APIIntegration defines the interface that all API integrations must implement
type APIIntegration interface {
	// Name returns the integration name (e.g., "github", "slack", "discord")
	Name() string

	// BuildURL constructs the API URL for a given function and arguments
	BuildURL(funcDef *db.FunctionDefinition, args map[string]interface{}) (string, error)

	// PrepareRequest prepares the HTTP request with auth, headers, and body
	PrepareRequest(ctx context.Context, req *http.Request, funcDef *db.FunctionDefinition, args map[string]interface{}) error

	// ProcessResponse processes the API response and converts it to the expected format
	ProcessResponse(resp *http.Response, funcDef *db.FunctionDefinition) (map[string]interface{}, error)

	// ValidateFunction validates that a function is properly configured for this integration
	ValidateFunction(funcDef *db.FunctionDefinition) error

	// GetRequiredAuth returns the authentication methods required by this integration
	GetRequiredAuth() []AuthMethod
}

// AuthMethod represents different authentication methods
type AuthMethod string

const (
	AuthMethodAPIKey    AuthMethod = "api_key"
	AuthMethodOAuth     AuthMethod = "oauth"
	AuthMethodBearer    AuthMethod = "bearer"
	AuthMethodBasic     AuthMethod = "basic"
	AuthMethodCustom    AuthMethod = "custom"
)

// IntegrationConfig holds configuration for an integration
type IntegrationConfig struct {
	Name        string
	BaseURL     string
	AuthMethods []AuthMethod
	RateLimit   *RateLimitConfig
}

// RateLimitConfig defines rate limiting configuration
type RateLimitConfig struct {
	RequestsPerSecond int
	BurstSize         int
}

// HTTPClientConfig provides common HTTP client configuration
type HTTPClientConfig struct {
	TimeoutSeconds int
	MaxRetries     int
	UserAgent      string
}