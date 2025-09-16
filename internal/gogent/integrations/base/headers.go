package base

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"gogent/internal/db"
	"gogent/internal/types"
)

// HeaderProcessor handles database header processing with token replacement
type HeaderProcessor struct {
	apiKeys *types.SessionAPIKeys
}

// NewHeaderProcessor creates a new header processor
func NewHeaderProcessor(apiKeys *types.SessionAPIKeys) *HeaderProcessor {
	return &HeaderProcessor{
		apiKeys: apiKeys,
	}
}

// ProcessDatabaseHeaders processes headers from function definition with token replacement
func (h *HeaderProcessor) ProcessDatabaseHeaders(req *http.Request, funcDef *db.FunctionDefinition) error {
	if funcDef.Headers == nil {
		return nil
	}

	var headers map[string]interface{}
	if err := json.Unmarshal(funcDef.Headers, &headers); err != nil {
		return fmt.Errorf("failed to unmarshal headers JSON: %w", err)
	}

	for key, value := range headers {
		headerValue := fmt.Sprintf("%v", value)
		originalValue := headerValue

		// Replace API key placeholders with actual keys (same logic as legacy system)
		headerValue = h.replaceTokenPlaceholders(headerValue)

		// Log the header replacement (with security masking)
		if originalValue != headerValue {
			fmt.Printf("🔍 DEBUG: Replaced tokens in header %s: '%s' -> '%s'\n", key, originalValue,
				h.maskHeaderValue(key, headerValue))
		}

		fmt.Printf("🔍 DEBUG: Setting header %s = %s\n", key, h.maskHeaderValue(key, headerValue))
		req.Header.Set(key, headerValue)
	}

	return nil
}

// replaceTokenPlaceholders replaces all known token placeholders with actual values
func (h *HeaderProcessor) replaceTokenPlaceholders(headerValue string) string {
	if h.apiKeys == nil {
		return headerValue
	}

	// Replace all known token placeholders
	replacements := map[string]string{
		"{SLACK_BOT_TOKEN}":      h.apiKeys.SlackBotToken,
		"{GITHUB_API_KEY}":       h.apiKeys.GithubAPIKey,
		"{GOOGLE_DRIVE_API_KEY}": h.apiKeys.GoogleDriveAPIKey,
		"{OPENWEATHER_API_KEY}":  h.apiKeys.OpenWeatherAPIKey,
		"{OPENROUTER_API_KEY}":   h.apiKeys.OpenRouterAPIKey,
		"{GEMINI_API_KEY}":       h.apiKeys.GeminiAPIKey,
	}

	result := headerValue
	for placeholder, token := range replacements {
		if token != "" && strings.Contains(result, placeholder) {
			result = strings.ReplaceAll(result, placeholder, token)
		}
	}

	return result
}

// maskHeaderValue masks sensitive header values for logging
func (h *HeaderProcessor) maskHeaderValue(key, value string) string {
	// Mask Authorization headers and other sensitive headers
	sensitiveHeaders := []string{"Authorization", "X-API-Key", "Bearer", "Token"}

	for _, sensitive := range sensitiveHeaders {
		if strings.Contains(strings.ToLower(key), strings.ToLower(sensitive)) {
			if len(value) > 20 {
				return value[:20] + "...***"
			}
			return value + "...***"
		}
	}

	return value
}

// SetFallbackAuth sets fallback authentication if no auth header is present
func (h *HeaderProcessor) SetFallbackAuth(req *http.Request, authType, token string) {
	if req.Header.Get("Authorization") == "" && token != "" {
		switch authType {
		case "bearer":
			req.Header.Set("Authorization", "Bearer "+token)
		case "token":
			req.Header.Set("Authorization", "token "+token)
		case "api_key":
			req.Header.Set("Authorization", "Bearer "+token)
		default:
			req.Header.Set("Authorization", "Bearer "+token)
		}
		fmt.Printf("🔑 Added fallback %s authentication\n", authType)
	}
}
