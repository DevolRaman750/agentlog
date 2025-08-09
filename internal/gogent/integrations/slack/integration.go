package slack

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

// Integration implements the Slack API integration
type Integration struct {
	baseURL string
	apiKeys *types.SessionApiKeys
}

// NewIntegration creates a new Slack integration
func NewIntegration(apiKeys *types.SessionApiKeys) *Integration {
	return &Integration{
		baseURL: "https://slack.com/api",
		apiKeys: apiKeys,
	}
}

// Name returns the integration name
func (s *Integration) Name() string {
	return "slack"
}

// BuildURL constructs the Slack API URL for a given function
func (s *Integration) BuildURL(funcDef *db.FunctionDefinition, args map[string]interface{}) (string, error) {
	// Use the endpoint URL from the function definition
	baseURL := funcDef.EndpointUrl.String
	if baseURL == "" {
		return "", fmt.Errorf("no endpoint_url defined for function %s", funcDef.Name)
	}

	// For GET requests, add parameters as query parameters
	httpMethod := "GET"
	if funcDef.HttpMethod.Valid {
		httpMethod = funcDef.HttpMethod.String
	}

	if httpMethod == "GET" {
		// Replace any {parameter} placeholders in the URL with actual values
		finalURL := baseURL
		usedParams := make(map[string]bool)

		for key, value := range args {
			placeholder := fmt.Sprintf("{%s}", key)
			if strings.Contains(finalURL, placeholder) {
				finalURL = strings.ReplaceAll(finalURL, placeholder, fmt.Sprintf("%v", value))
				usedParams[key] = true
			}
		}

		// Add remaining parameters as query parameters
		var queryParams []string
		for key, value := range args {
			if !usedParams[key] && value != nil {
				queryParams = append(queryParams, fmt.Sprintf("%s=%s",
					url.QueryEscape(key),
					url.QueryEscape(fmt.Sprintf("%v", value))))
			}
		}

		if len(queryParams) > 0 {
			if strings.Contains(finalURL, "?") {
				finalURL += "&" + strings.Join(queryParams, "&")
			} else {
				finalURL += "?" + strings.Join(queryParams, "&")
			}
		}

		return finalURL, nil
	}

	// For non-GET requests, just replace placeholders
	finalURL := baseURL
	for key, value := range args {
		placeholder := fmt.Sprintf("{%s}", key)
		if strings.Contains(finalURL, placeholder) {
			finalURL = strings.ReplaceAll(finalURL, placeholder, fmt.Sprintf("%v", value))
		}
	}

	return finalURL, nil
}

// PrepareRequest prepares the HTTP request with Slack authentication and headers
func (s *Integration) PrepareRequest(ctx context.Context, req *http.Request, funcDef *db.FunctionDefinition, args map[string]interface{}) error {
	// Add Slack API authentication
	if s.apiKeys != nil && s.apiKeys.SlackBotToken != "" {
		req.Header.Set("Authorization", "Bearer "+s.apiKeys.SlackBotToken)
	}

	// Set Slack-specific headers
	req.Header.Set("Accept", "application/json")

	return nil
}

// ProcessResponse processes the Slack API response
func (s *Integration) ProcessResponse(resp *http.Response, funcDef *db.FunctionDefinition) (map[string]interface{}, error) {
	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Check for HTTP errors
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("slack API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response as JSON
	var slackResponse map[string]interface{}
	if err := json.Unmarshal(body, &slackResponse); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	// Check for Slack API errors
	if ok, exists := slackResponse["ok"].(bool); exists && !ok {
		errorMsg := "unknown error"
		if errStr, ok := slackResponse["error"].(string); ok {
			errorMsg = errStr
		}
		return nil, fmt.Errorf("slack API error: %s", errorMsg)
	}

	// Return the Slack response as-is (it's already properly structured)
	return slackResponse, nil
}

// ValidateFunction validates that a Slack function is properly configured
func (s *Integration) ValidateFunction(funcDef *db.FunctionDefinition) error {
	if funcDef.FunctionGroup != "slack" {
		return fmt.Errorf("function %s is not a Slack function", funcDef.Name)
	}

	// Validate that endpoint URL is provided
	if !funcDef.EndpointUrl.Valid || funcDef.EndpointUrl.String == "" {
		return fmt.Errorf("Slack function %s requires endpoint_url", funcDef.Name)
	}

	// Validate that endpoint URL is a Slack API URL
	if !strings.HasPrefix(funcDef.EndpointUrl.String, "https://slack.com/api/") {
		return fmt.Errorf("Slack function %s endpoint_url must start with https://slack.com/api/", funcDef.Name)
	}

	return nil
}

// GetRequiredAuth returns the authentication methods required by Slack
func (s *Integration) GetRequiredAuth() []base.AuthMethod {
	return []base.AuthMethod{base.AuthMethodBearer}
}
