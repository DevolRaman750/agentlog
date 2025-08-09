# Adding New API Providers

This guide provides step-by-step instructions for adding new API providers to GoGent. The process is designed to be simple enough for an LLM to implement in a single PR.

## Overview

GoGent uses a JSON-based specification system that automatically syncs to the database on server startup. No migrations required!

## Step 1: Create Provider Specification

Create a new JSON file in `system/providers/{provider_name}.json`:

```json
{
  "name": "provider_name",
  "display_name": "Provider Display Name",
  "description": "Brief description of what this provider does",
  "base_url": "https://api.provider.com",
  "auth_methods": ["api_key", "bearer", "oauth"],
  "auth_config": {
    "api_key": {
      "header": "Authorization",
      "format": "Bearer {api_key}",
      "description": "API key description"
    }
  },
  "rate_limits": {
    "requests_per_minute": 60,
    "requests_per_hour": 1000
  },
  "common_headers": {
    "Accept": "application/json",
    "User-Agent": "GoGent/1.0"
  },
  "error_handling": {
    "error_status_codes": [400, 401, 403, 404, 500],
    "retry_status_codes": [500, 502, 503],
    "max_retries": 3
  },
  "supported_functions": [
    "provider_function_1",
    "provider_function_2"
  ]
}
```

### Required Fields
- `name`: Unique provider identifier (lowercase, no spaces)
- `display_name`: Human-readable name
- `description`: What the provider does
- `base_url`: Base API URL
- `auth_methods`: Array of supported auth methods
- `supported_functions`: List of function names this provider supports

### Auth Methods
- `api_key`: API key in header
- `bearer`: Bearer token  
- `oauth`: OAuth 2.0
- `basic`: Basic authentication
- `custom`: Custom authentication

## Step 2: Create Integration Implementation

Create `internal/gogent/integrations/{provider_name}/integration.go`:

```go
package provider_name

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"gogent/internal/db"
	"gogent/internal/gogent/integrations/base"
	"gogent/internal/types"
)

// Integration implements the [Provider] API integration
type Integration struct {
	baseURL string
	apiKeys *types.SessionApiKeys
}

// NewIntegration creates a new [Provider] integration
func NewIntegration(apiKeys *types.SessionApiKeys) *Integration {
	return &Integration{
		baseURL: "https://api.provider.com",
		apiKeys: apiKeys,
	}
}

// Name returns the integration name
func (p *Integration) Name() string {
	return "provider_name"
}

// BuildURL constructs the API URL for a given function
func (p *Integration) BuildURL(funcDef *db.FunctionDefinition, args map[string]interface{}) (string, error) {
	// Use endpoint URL from function definition or build dynamically
	baseURL := funcDef.EndpointUrl.String
	if baseURL == "" {
		return "", fmt.Errorf("no endpoint_url defined for function %s", funcDef.Name)
	}

	// Replace path parameters
	url := baseURL
	for key, value := range args {
		placeholder := fmt.Sprintf("{%s}", key)
		if strings.Contains(url, placeholder) {
			url = strings.ReplaceAll(url, placeholder, fmt.Sprintf("%v", value))
		}
	}

	// Add query parameters for GET requests
	httpMethod := "GET"
	if funcDef.HttpMethod.Valid {
		httpMethod = funcDef.HttpMethod.String
	}

	if httpMethod == "GET" {
		// Add remaining args as query parameters
		var queryParams []string
		for key, value := range args {
			if value != nil && !strings.Contains(baseURL, "{"+key+"}") {
				queryParams = append(queryParams, fmt.Sprintf("%s=%s", 
					url.QueryEscape(key), 
					url.QueryEscape(fmt.Sprintf("%v", value))))
			}
		}

		if len(queryParams) > 0 {
			if strings.Contains(url, "?") {
				url += "&" + strings.Join(queryParams, "&")
			} else {
				url += "?" + strings.Join(queryParams, "&")
			}
		}
	}

	return url, nil
}

// PrepareRequest prepares the HTTP request with authentication and headers
func (p *Integration) PrepareRequest(ctx context.Context, req *http.Request, funcDef *db.FunctionDefinition, args map[string]interface{}) error {
	// Add authentication based on provider requirements
	if p.apiKeys != nil && p.apiKeys.ProviderAPIKey != "" {
		req.Header.Set("Authorization", "Bearer "+p.apiKeys.ProviderAPIKey)
	}

	// Set provider-specific headers
	req.Header.Set("Accept", "application/json")

	return nil
}

// ProcessResponse processes the API response
func (p *Integration) ProcessResponse(resp *http.Response, funcDef *db.FunctionDefinition) (map[string]interface{}, error) {
	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Check for HTTP errors
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse JSON response
	var result interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	// Return structured response
	return map[string]interface{}{
		"status": "success",
		"data":   result,
	}, nil
}

// ValidateFunction validates that a function is properly configured
func (p *Integration) ValidateFunction(funcDef *db.FunctionDefinition) error {
	if funcDef.FunctionGroup != "provider_name" {
		return fmt.Errorf("function %s is not a [Provider] function", funcDef.Name)
	}

	if !funcDef.EndpointUrl.Valid || funcDef.EndpointUrl.String == "" {
		return fmt.Errorf("[Provider] function %s requires endpoint_url", funcDef.Name)
	}

	return nil
}

// GetRequiredAuth returns the authentication methods required
func (p *Integration) GetRequiredAuth() []base.AuthMethod {
	return []base.AuthMethod{base.AuthMethodBearer}
}
```

## Step 3: Register Integration (Auto-registered)

The integration is automatically registered when the system starts up. No manual registration needed!

## Step 4: Add API Key Support (if needed)

If your provider needs API keys, add the field to `internal/types/index.ts`:

```go
type SessionApiKeys struct {
    // ... existing fields ...
    ProviderAPIKey    string `json:"provider_api_key,omitempty"`
}
```

## Step 5: Test Your Integration

1. Start the server: `make run-server`
2. Check logs for provider registration: `✅ Registered integrations: [github, slack, provider_name]`
3. Add functions using the function creation guide
4. Test function execution

## Common Patterns

### REST API with JSON
```json
{
  "auth_methods": ["api_key"],
  "auth_config": {
    "api_key": {
      "header": "Authorization",
      "format": "Bearer {api_key}"
    }
  }
}
```

### GraphQL API
```json
{
  "auth_methods": ["bearer"],
  "common_headers": {
    "Content-Type": "application/json"
  }
}
```

### OAuth API
```json
{
  "auth_methods": ["oauth"],
  "auth_config": {
    "oauth": {
      "header": "Authorization",
      "format": "Bearer {access_token}"
    }
  }
}
```

## Error Handling

The framework automatically handles:
- HTTP status code errors
- JSON parsing errors  
- Authentication failures
- Rate limiting (via provider config)

## Examples

See existing providers:
- `system/providers/github.json` - GitHub API
- `system/providers/slack.json` - Slack API
- `internal/gogent/integrations/github/integration.go` - GitHub implementation
- `internal/gogent/integrations/slack/integration.go` - Slack implementation

That's it! Your provider will be automatically available for function creation.