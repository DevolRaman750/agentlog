package base

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"gogent/internal/db"
)

// HTTPClient provides a common HTTP client for all integrations
type HTTPClient struct {
	client    *http.Client
	userAgent string
	debug     bool
}

// NewHTTPClient creates a new HTTP client with common configuration
func NewHTTPClient(config HTTPClientConfig) *HTTPClient {
	timeout := time.Duration(config.TimeoutSeconds) * time.Second
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	userAgent := config.UserAgent
	if userAgent == "" {
		userAgent = "GoGent/1.0"
	}

	return &HTTPClient{
		client: &http.Client{
			Timeout: timeout,
		},
		userAgent: userAgent,
		debug:     false,
	}
}

// ExecuteRequest executes an HTTP request using the integration
func (c *HTTPClient) ExecuteRequest(ctx context.Context, integration APIIntegration, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
	log.Printf("🔍 [HTTP_DEBUG] Starting HTTP request for function: %s", funcDef.Name)
	log.Printf("🔍 [HTTP_DEBUG] Integration: %s", integration.Name())
	log.Printf("🔍 [HTTP_DEBUG] Function args: %+v", args)

	// Build URL
	url, err := integration.BuildURL(funcDef, args)
	if err != nil {
		log.Printf("❌ [HTTP_DEBUG] Failed to build URL: %v", err)
		return nil, fmt.Errorf("failed to build URL: %w", err)
	}
	log.Printf("🔍 [HTTP_DEBUG] Built URL: %s", url)

	// Determine HTTP method
	httpMethod := "GET"
	if funcDef.HttpMethod.Valid && funcDef.HttpMethod.String != "" {
		httpMethod = funcDef.HttpMethod.String
	}
	log.Printf("🔍 [HTTP_DEBUG] HTTP method: %s", httpMethod)

	// Create request
	var requestBody io.Reader
	if httpMethod != "GET" && len(args) > 0 {
		bodyData, err := c.prepareRequestBody(integration, funcDef, args)
		if err != nil {
			log.Printf("❌ [HTTP_DEBUG] Failed to prepare request body: %v", err)
			return nil, fmt.Errorf("failed to prepare request body: %w", err)
		}
		if bodyData != nil {
			requestBody = bytes.NewReader(bodyData)
			log.Printf("🔍 [HTTP_DEBUG] Request body: %s", string(bodyData))
		}
	}

	req, err := http.NewRequestWithContext(ctx, httpMethod, url, requestBody)
	if err != nil {
		log.Printf("❌ [HTTP_DEBUG] Failed to create request: %v", err)
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set default headers
	req.Header.Set("User-Agent", c.userAgent)
	if httpMethod != "GET" && requestBody != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	log.Printf("🔍 [HTTP_DEBUG] Request headers before integration: %+v", req.Header)

	// Let integration prepare the request (auth, custom headers, etc.)
	if err := integration.PrepareRequest(ctx, req, funcDef, args); err != nil {
		log.Printf("❌ [HTTP_DEBUG] Failed to prepare request: %v", err)
		return nil, fmt.Errorf("failed to prepare request: %w", err)
	}

	log.Printf("🔍 [HTTP_DEBUG] About to execute HTTP request: %s %s", httpMethod, url)

	// Execute request
	resp, err := c.client.Do(req)
	if err != nil {
		log.Printf("❌ [HTTP_DEBUG] HTTP request failed: %v", err)
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	log.Printf("🔍 [HTTP_DEBUG] HTTP response received - Status: %s", resp.Status)
	// Headers truncated for readability - use debug mode for full headers

	// Let integration process the response
	result, err := integration.ProcessResponse(resp, funcDef)
	if err != nil {
		log.Printf("❌ [HTTP_DEBUG] Failed to process response: %v", err)
		return nil, fmt.Errorf("failed to process response: %w", err)
	}

	log.Printf("✅ [HTTP_DEBUG] Request completed successfully")
	return result, nil
}

// prepareRequestBody prepares the request body for non-GET requests
func (c *HTTPClient) prepareRequestBody(integration APIIntegration, funcDef *db.FunctionDefinition, args map[string]interface{}) ([]byte, error) {
	// Filter args based on integration type
	bodyData := make(map[string]interface{})

	switch integration.Name() {
	case "github":
		// For GitHub, exclude URL parameters from body
		for key, value := range args {
			if key != "owner" && key != "repo" && key != "issue_number" && key != "pull_number" && key != "path" {
				if value != nil {
					bodyData[key] = value
				}
			}
		}

		// Special handling for github_close_pull_request - automatically add state: closed
		if funcDef.Name == "github_close_pull_request" {
			bodyData["state"] = "closed"
		}
	default:
		// For other integrations, include all non-nil parameters
		for key, value := range args {
			if value != nil {
				bodyData[key] = value
			}
		}
	}

	if len(bodyData) == 0 {
		return nil, nil
	}

	return json.Marshal(bodyData)
}

// SetDebug enables or disables debug logging
func (c *HTTPClient) SetDebug(debug bool) {
	c.debug = debug
}
