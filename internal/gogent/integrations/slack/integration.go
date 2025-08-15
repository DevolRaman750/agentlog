package slack

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"

	"gogent/internal/apiauth"
	"gogent/internal/db"
	"gogent/internal/gogent/integrations/base"
	"gogent/internal/types"
)

// Integration implements the Slack API integration
type Integration struct {
	baseURL         string
	apiKeys         *types.SessionApiKeys // Legacy support
	authService     *apiauth.Service
	userID          string
	headerProcessor *base.HeaderProcessor
	// Store current function context for response processing
	currentChannelName string
}

// NewIntegration creates a new Slack integration
func NewIntegration(apiKeys *types.SessionApiKeys) *Integration {
	return &Integration{
		baseURL:         "https://slack.com/api",
		apiKeys:         apiKeys,
		headerProcessor: base.NewHeaderProcessor(apiKeys),
	}
}

// NewIntegrationWithAuth creates a new Slack integration with auth service
func NewIntegrationWithAuth(authService *apiauth.Service, userID string) *Integration {
	return &Integration{
		baseURL:     "https://slack.com/api",
		authService: authService,
		userID:      userID,
		// Note: headerProcessor will be created when needed with database auth
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
	log.Printf("🔍 [SLACK_DEBUG] Preparing request for function: %s", funcDef.Name)
	log.Printf("🔍 [SLACK_DEBUG] Request URL: %s", req.URL.String())
	log.Printf("🔍 [SLACK_DEBUG] Request method: %s", req.Method)
	log.Printf("🔍 [SLACK_DEBUG] Function args: %+v", args)

	// Store channel_name for response processing (for slack_find_channel)
	if funcDef.Name == "slack_find_channel" {
		if channelName, ok := args["channel_name"].(string); ok {
			s.currentChannelName = channelName
			log.Printf("🔍 [SLACK_DEBUG] Stored channel_name for filtering: %s", channelName)
		}
	}

	// Use new auth system if available
	if s.authService != nil && s.userID != "" {
		log.Printf("🔑 [SLACK_DEBUG] Using new auth system for user: %s", s.userID)

		// Get Slack auth credentials from database
		authCreds, err := s.authService.GetAuthCredentialsForService(ctx, s.userID, "slack")
		if err != nil {
			log.Printf("❌ [SLACK_DEBUG] Failed to get Slack auth credentials from database: %v", err)
			return fmt.Errorf("failed to get Slack auth credentials: %w", err)
		}

		if authCreds == nil {
			log.Printf("❌ [SLACK_DEBUG] No Slack auth credentials found in database for user %s", s.userID)
			return fmt.Errorf("no Slack auth credentials configured for user %s", s.userID)
		}

		// Apply auth headers from the credentials
		for key, value := range authCreds.Headers {
			req.Header.Set(key, value)
			log.Printf("🔑 [SLACK_DEBUG] Set auth header %s from database", key)
		}
	} else {
		// Fall back to legacy system
		log.Printf("🔍 [SLACK_DEBUG] Using legacy auth system")

		// Process database headers with token replacement using generic processor
		if s.headerProcessor != nil {
			if err := s.headerProcessor.ProcessDatabaseHeaders(req, funcDef); err != nil {
				log.Printf("❌ [SLACK_DEBUG] Failed to process database headers: %v", err)
				return fmt.Errorf("failed to process database headers: %w", err)
			}
		}

		// Set fallback authentication if not already set via headers
		if s.apiKeys != nil && s.apiKeys.SlackBotToken != "" {
			log.Printf("🔍 [SLACK_DEBUG] Setting fallback auth with token: %s...", s.apiKeys.SlackBotToken[:10])
			if s.headerProcessor != nil {
				s.headerProcessor.SetFallbackAuth(req, "bearer", s.apiKeys.SlackBotToken)
			}
		} else {
			log.Printf("⚠️ [SLACK_DEBUG] No Slack bot token available")
		}
	}

	// Set default Accept header if not already set
	if req.Header.Get("Accept") == "" {
		req.Header.Set("Accept", "application/json")
	}

	log.Printf("🔍 [SLACK_DEBUG] Final request headers: %+v", req.Header)
	return nil
}

// ProcessResponse processes the Slack API response
func (s *Integration) ProcessResponse(resp *http.Response, funcDef *db.FunctionDefinition) (map[string]interface{}, error) {
	log.Printf("🔍 [SLACK_DEBUG] Processing response for function: %s", funcDef.Name)
	log.Printf("🔍 [SLACK_DEBUG] Response status: %d", resp.StatusCode)
	// Headers truncated for readability

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("❌ [SLACK_DEBUG] Failed to read response body: %v", err)
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	log.Printf("🔍 [SLACK_DEBUG] Response body length: %d bytes", len(body))
	// Response body truncated - first 200 chars: %.200s", string(body))
	if len(body) > 200 {
		log.Printf("🔍 [SLACK_DEBUG] Response body preview: %.200s...", string(body))
	} else {
		log.Printf("🔍 [SLACK_DEBUG] Response body: %s", string(body))
	}

	// Check for HTTP errors
	if resp.StatusCode >= 400 {
		log.Printf("❌ [SLACK_DEBUG] HTTP error status %d: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("slack API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response as JSON
	var slackResponse map[string]interface{}
	if err := json.Unmarshal(body, &slackResponse); err != nil {
		log.Printf("❌ [SLACK_DEBUG] Failed to parse JSON: %v", err)
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	log.Printf("🔍 [SLACK_DEBUG] Parsed response keys: %v", getMapKeys(slackResponse))

	// Check for Slack API errors
	if ok, exists := slackResponse["ok"].(bool); exists && !ok {
		errorMsg := "unknown error"
		if errStr, ok := slackResponse["error"].(string); ok {
			errorMsg = errStr
		}

		log.Printf("❌ [SLACK_DEBUG] Slack API error: %s", errorMsg)
		log.Printf("🔍 [SLACK_DEBUG] Full error response: %+v", slackResponse)

		// Check if this is a retryable error
		if s.isRetryableError(errorMsg) {
			log.Printf("🔄 [SLACK_DEBUG] Error is retryable: %s", errorMsg)
			return nil, fmt.Errorf("retryable slack API error: %s", errorMsg)
		}

		log.Printf("❌ [SLACK_DEBUG] Error is NOT retryable: %s", errorMsg)
		return nil, fmt.Errorf("slack API error: %s", errorMsg)
	}

	// Apply response transformation if specified
	if funcDef.ResultTransformer.Valid && funcDef.ResultTransformer.String != "" {
		var transformerConfig map[string]interface{}
		if err := json.Unmarshal([]byte(funcDef.ResultTransformer.String), &transformerConfig); err == nil {
			if transformerType, ok := transformerConfig["type"].(string); ok && transformerType == "slack_channel_filter" {
				log.Printf("🔍 [SLACK_DEBUG] Applying slack_channel_filter transformer with channel_name: %s", s.currentChannelName)
				return s.filterChannelsByName(slackResponse, funcDef, s.currentChannelName)
			}
		}
	}

	log.Printf("✅ [SLACK_DEBUG] Response processed successfully")
	// Return the Slack response as-is (it's already properly structured)
	return slackResponse, nil
}

// getMapKeys returns the keys of a map for debugging
func getMapKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// filterChannelsByName filters channels by the channel_name parameter
func (s *Integration) filterChannelsByName(slackResponse map[string]interface{}, funcDef *db.FunctionDefinition, channelName string) (map[string]interface{}, error) {
	channels, ok := slackResponse["channels"].([]interface{})
	if !ok {
		log.Printf("❌ [SLACK_DEBUG] No channels array found in response")
		return slackResponse, nil
	}

	log.Printf("🔍 [SLACK_DEBUG] Found %d channels to filter for channel_name: %s", len(channels), channelName)

	// Clean the channel name (remove # prefix if present)
	targetName := strings.TrimPrefix(channelName, "#")

	// Look for exact match first
	for i, channelInterface := range channels {
		if channel, ok := channelInterface.(map[string]interface{}); ok {
			if name, ok := channel["name"].(string); ok && name == targetName {
				log.Printf("✅ [SLACK_DEBUG] Found exact match for channel '%s' at index %d, moving to front", name, i)
				// Move this channel to the front
				filteredChannels := make([]interface{}, len(channels))
				filteredChannels[0] = channel
				copyIndex := 1
				for j, ch := range channels {
					if j != i {
						filteredChannels[copyIndex] = ch
						copyIndex++
					}
				}

				// Return modified response with target channel first
				result := make(map[string]interface{})
				for k, v := range slackResponse {
					result[k] = v
				}
				result["channels"] = filteredChannels
				log.Printf("🔍 [SLACK_DEBUG] Returning filtered response with target channel first")
				return result, nil
			}
		}
	}

	log.Printf("❌ [SLACK_DEBUG] No channel found with name '%s', returning original response", targetName)
	return slackResponse, nil
}

// isRetryableError checks if a Slack API error is retryable
func (s *Integration) isRetryableError(errorMsg string) bool {
	retryableErrors := []string{
		"rate_limited",        // Rate limiting
		"internal_error",      // Slack internal errors
		"service_unavailable", // Service temporarily unavailable
		"timeout",             // Request timeout
		"ratelimited",         // Alternative rate limit error
	}

	for _, retryableError := range retryableErrors {
		if strings.Contains(errorMsg, retryableError) {
			return true
		}
	}

	// channel_not_found is NOT retryable - it means the channel doesn't exist or bot doesn't have access
	return false
}

// ValidateFunction validates that a Slack function is properly configured
func (s *Integration) ValidateFunction(funcDef *db.FunctionDefinition) error {
	if funcDef.FunctionGroup != "slack" {
		return fmt.Errorf("function %s is not a Slack function", funcDef.Name)
	}

	// Validate that endpoint URL is provided
	if !funcDef.EndpointUrl.Valid || funcDef.EndpointUrl.String == "" {
		return fmt.Errorf("slack function %s requires endpoint_url", funcDef.Name)
	}

	// Validate that endpoint URL is a Slack API URL
	if !strings.HasPrefix(funcDef.EndpointUrl.String, "https://slack.com/api/") {
		return fmt.Errorf("slack function %s endpoint_url must start with https://slack.com/api/", funcDef.Name)
	}

	return nil
}

// GetRequiredAuth returns the authentication methods required by Slack
func (s *Integration) GetRequiredAuth() []base.AuthMethod {
	return []base.AuthMethod{base.AuthMethodBearer}
}
