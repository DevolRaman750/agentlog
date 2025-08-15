package github

import (
	"context"
	"encoding/base64"
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

// Integration implements the GitHub API integration
type Integration struct {
	baseURL     string
	apiKeys     *types.SessionApiKeys // Legacy support
	authService *apiauth.Service
	userID      string
}

// NewIntegration creates a new GitHub integration
func NewIntegration(apiKeys *types.SessionApiKeys) *Integration {
	return &Integration{
		baseURL: "https://api.github.com",
		apiKeys: apiKeys,
	}
}

// NewIntegrationWithAuth creates a new GitHub integration with auth service
func NewIntegrationWithAuth(authService *apiauth.Service, userID string) *Integration {
	return &Integration{
		baseURL:     "https://api.github.com",
		authService: authService,
		userID:      userID,
	}
}

// Name returns the integration name
func (g *Integration) Name() string {
	return "github"
}

// BuildURL constructs the GitHub API URL for a given function
func (g *Integration) BuildURL(funcDef *db.FunctionDefinition, args map[string]interface{}) (string, error) {
	functionName := funcDef.Name

	// Extract common parameters
	owner, hasOwner := args["owner"].(string)
	repo, hasRepo := args["repo"].(string)

	if !hasOwner || !hasRepo {
		return "", fmt.Errorf("GitHub functions require 'owner' and 'repo' parameters")
	}

	var path string
	var queryParams []string

	switch functionName {
	case "github_read_issues":
		path = fmt.Sprintf("/repos/%s/%s/issues", owner, repo)

		// Add optional query parameters
		if state, ok := args["state"].(string); ok && state != "" {
			queryParams = append(queryParams, fmt.Sprintf("state=%s", url.QueryEscape(state)))
		}
		if labels, ok := args["labels"].(string); ok && labels != "" {
			queryParams = append(queryParams, fmt.Sprintf("labels=%s", url.QueryEscape(labels)))
		}
		if per_page, ok := args["per_page"]; ok {
			queryParams = append(queryParams, fmt.Sprintf("per_page=%v", per_page))
		} else {
			queryParams = append(queryParams, "per_page=30")
		}

	case "github_read_code":
		if pathParam, ok := args["path"].(string); ok && pathParam != "" {
			// URL encode the path to handle special characters and slashes
			encodedPath := url.PathEscape(pathParam)
			path = fmt.Sprintf("/repos/%s/%s/contents/%s", owner, repo, encodedPath)
		} else {
			path = fmt.Sprintf("/repos/%s/%s/contents", owner, repo)
		}

		// Add optional ref parameter for branch/commit specification
		if ref, ok := args["ref"].(string); ok && ref != "" {
			queryParams = append(queryParams, fmt.Sprintf("ref=%s", url.QueryEscape(ref)))
		}

	case "github_read_commits":
		path = fmt.Sprintf("/repos/%s/%s/commits", owner, repo)

		// Add optional query parameters
		if sha, ok := args["sha"].(string); ok && sha != "" {
			queryParams = append(queryParams, fmt.Sprintf("sha=%s", url.QueryEscape(sha)))
		}
		if pathParam, ok := args["path"].(string); ok && pathParam != "" {
			queryParams = append(queryParams, fmt.Sprintf("path=%s", url.QueryEscape(pathParam)))
		}
		if since, ok := args["since"].(string); ok && since != "" {
			queryParams = append(queryParams, fmt.Sprintf("since=%s", url.QueryEscape(since)))
		}
		if until, ok := args["until"].(string); ok && until != "" {
			queryParams = append(queryParams, fmt.Sprintf("until=%s", url.QueryEscape(until)))
		}
		if per_page, ok := args["per_page"]; ok {
			queryParams = append(queryParams, fmt.Sprintf("per_page=%v", per_page))
		} else {
			queryParams = append(queryParams, "per_page=30")
		}

	case "github_search_code":
		path = "/search/code"

		query := fmt.Sprintf("repo:%s/%s", owner, repo)
		if searchQuery, ok := args["query"].(string); ok && searchQuery != "" {
			query += " " + searchQuery
		}
		queryParams = append(queryParams, fmt.Sprintf("q=%s", url.QueryEscape(query)))

	case "github_create_issue":
		path = fmt.Sprintf("/repos/%s/%s/issues", owner, repo)

	case "github_update_issue":
		if issueNumber, ok := args["issue_number"]; ok {
			path = fmt.Sprintf("/repos/%s/%s/issues/%v", owner, repo, issueNumber)
		} else {
			return "", fmt.Errorf("github_update_issue requires 'issue_number' parameter")
		}

	case "github_create_update_file":
		if filePath, ok := args["path"].(string); ok && filePath != "" {
			// URL encode the path to handle special characters and slashes
			encodedPath := url.PathEscape(filePath)
			path = fmt.Sprintf("/repos/%s/%s/contents/%s", owner, repo, encodedPath)
		} else {
			return "", fmt.Errorf("github_create_update_file requires 'path' parameter")
		}

	default:
		return "", fmt.Errorf("unsupported GitHub function: %s", functionName)
	}

	// Construct final URL
	fullURL := g.baseURL + path
	if len(queryParams) > 0 {
		fullURL += "?" + strings.Join(queryParams, "&")
	}

	return fullURL, nil
}

// PrepareRequest prepares the HTTP request with GitHub authentication and headers
func (g *Integration) PrepareRequest(ctx context.Context, req *http.Request, funcDef *db.FunctionDefinition, args map[string]interface{}) error {
	// Try new auth system first
	if g.authService != nil && g.userID != "" {
		credentials, err := g.authService.GetAuthCredentialsForService(ctx, g.userID, "github")
		if err == nil {
			// Apply auth headers from the new system
			for key, value := range credentials.Headers {
				req.Header.Set(key, value)
			}
			fmt.Printf("🔑 GitHub integration using new auth system successfully\n")
			return nil
		}
		// If new auth system fails, fall back to legacy system
		fmt.Printf("⚠️ GitHub integration new auth system failed: %v, falling back to legacy\n", err)
	}

	// Legacy authentication fallback
	if g.apiKeys != nil && g.apiKeys.GithubApiKey != "" {
		req.Header.Set("Authorization", "token "+g.apiKeys.GithubApiKey)
		req.Header.Set("Accept", "application/vnd.github+json")
		req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
		req.Header.Set("User-Agent", "GoGent/1.0")
	}

	return nil
}

// ProcessResponse processes the GitHub API response
func (g *Integration) ProcessResponse(resp *http.Response, funcDef *db.FunctionDefinition) (map[string]interface{}, error) {
	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Check for GitHub API errors
	if resp.StatusCode >= 400 {
		var errorResp struct {
			Message string `json:"message"`
			Errors  []struct {
				Message string `json:"message"`
			} `json:"errors"`
		}

		if err := json.Unmarshal(body, &errorResp); err == nil && errorResp.Message != "" {
			return nil, fmt.Errorf("GitHub API error: %s", errorResp.Message)
		}

		return nil, fmt.Errorf("GitHub API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response as JSON
	var result interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	// Handle base64 decoding for github_read_code function
	if funcDef.Name == "github_read_code" {
		result = g.decodeGitHubContent(result)
	}

	// Return structured response
	return map[string]interface{}{
		"status": "success",
		"data":   result,
	}, nil
}

// ValidateFunction validates that a GitHub function is properly configured
func (g *Integration) ValidateFunction(funcDef *db.FunctionDefinition) error {
	if funcDef.FunctionGroup != "github" {
		return fmt.Errorf("function %s is not a GitHub function", funcDef.Name)
	}

	// Validate required fields
	supportedFunctions := []string{
		"github_read_issues",
		"github_read_code",
		"github_read_commits",
		"github_search_code",
		"github_create_issue",
		"github_update_issue",
		"github_create_update_file",
	}

	isSupported := false
	for _, supported := range supportedFunctions {
		if funcDef.Name == supported {
			isSupported = true
			break
		}
	}

	if !isSupported {
		return fmt.Errorf("unsupported GitHub function: %s", funcDef.Name)
	}

	return nil
}

// GetRequiredAuth returns the authentication methods required by GitHub
func (g *Integration) GetRequiredAuth() []base.AuthMethod {
	return []base.AuthMethod{base.AuthMethodAPIKey}
}

// decodeGitHubContent decodes base64 content in GitHub API responses
func (g *Integration) decodeGitHubContent(data interface{}) interface{} {
	// Handle single file response (map)
	if fileData, ok := data.(map[string]interface{}); ok {
		return g.decodeFileContent(fileData)
	}

	// Handle directory listing response (array)
	if items, ok := data.([]interface{}); ok {
		decodedItems := make([]interface{}, len(items))
		for i, item := range items {
			if itemMap, ok := item.(map[string]interface{}); ok {
				decodedItems[i] = g.decodeFileContent(itemMap)
			} else {
				decodedItems[i] = item
			}
		}
		return decodedItems
	}

	// Return unchanged if not a recognized format
	return data
}

// decodeFileContent decodes base64 content in a single file object
func (g *Integration) decodeFileContent(fileData map[string]interface{}) map[string]interface{} {
	// Check if this is a file with content
	fileType, hasType := fileData["type"].(string)
	if !hasType || fileType != "file" {
		return fileData // Not a file, return as-is
	}

	// Check if content exists and is base64 encoded
	content, hasContent := fileData["content"].(string)
	encoding, hasEncoding := fileData["encoding"].(string)

	if !hasContent || !hasEncoding || encoding != "base64" {
		return fileData // No content or not base64, return as-is
	}

	// Decode base64 content
	decodedBytes, err := base64.StdEncoding.DecodeString(content)
	if err != nil {
		log.Printf("⚠️ Failed to decode base64 content for file %s: %v", fileData["name"], err)
		return fileData // Return original on decode error
	}

	// Create a copy of the file data with decoded content
	result := make(map[string]interface{})
	for k, v := range fileData {
		result[k] = v
	}

	// Replace content with decoded text and update encoding
	result["content"] = string(decodedBytes)
	result["encoding"] = "utf-8"
	result["original_encoding"] = "base64" // Keep track of original encoding

	log.Printf("✅ Decoded base64 content for file: %s (%d bytes -> %d chars)",
		fileData["name"], len(content), len(decodedBytes))

	return result
}
