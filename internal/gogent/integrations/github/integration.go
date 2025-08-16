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
	"time"

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
	// Use the endpoint URL from the function definition if available
	if funcDef.EndpointUrl.Valid && funcDef.EndpointUrl.String != "" {
		baseURL := funcDef.EndpointUrl.String

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

		// For GET requests, add remaining parameters as query parameters
		httpMethod := "GET"
		if funcDef.HttpMethod.Valid {
			httpMethod = funcDef.HttpMethod.String
		}

		if httpMethod == "GET" {
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
		}

		return finalURL, nil
	}

	// Fallback to legacy hardcoded URL construction for backward compatibility
	return g.buildLegacyURL(funcDef, args)
}

// buildLegacyURL provides backward compatibility for functions without endpoint_url
func (g *Integration) buildLegacyURL(funcDef *db.FunctionDefinition, args map[string]interface{}) (string, error) {
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
			encodedPath := url.PathEscape(pathParam)
			path = fmt.Sprintf("/repos/%s/%s/contents/%s", owner, repo, encodedPath)
		} else {
			path = fmt.Sprintf("/repos/%s/%s/contents", owner, repo)
		}
		if ref, ok := args["ref"].(string); ok && ref != "" {
			queryParams = append(queryParams, fmt.Sprintf("ref=%s", url.QueryEscape(ref)))
		}

	case "github_read_commits":
		path = fmt.Sprintf("/repos/%s/%s/commits", owner, repo)
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
			encodedPath := url.PathEscape(filePath)
			path = fmt.Sprintf("/repos/%s/%s/contents/%s", owner, repo, encodedPath)
		} else {
			return "", fmt.Errorf("github_create_update_file requires 'path' parameter")
		}

	default:
		return "", fmt.Errorf("legacy GitHub function not supported: %s (function should have endpoint_url defined)", functionName)
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
	// Handle composite workflow functions
	if funcDef.Name == "github_update_file_on_branch" {
		return g.handleUpdateFileOnBranch(ctx, req, funcDef, args)
	}

	if funcDef.Name == "github_branch_update_pr_workflow" {
		return g.handleBranchUpdatePRWorkflow(ctx, req, funcDef, args)
	}

	// Handle content encoding for file operations before authentication
	if funcDef.Name == "github_create_update_file" && req.Method == "PUT" {
		if err := g.encodeFileContent(req, args); err != nil {
			return fmt.Errorf("failed to encode file content: %w", err)
		}
	}

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
			Message          string `json:"message"`
			DocumentationURL string `json:"documentation_url"`
			Errors           []struct {
				Resource string `json:"resource"`
				Code     string `json:"code"`
				Field    string `json:"field"`
				Message  string `json:"message"`
			} `json:"errors"`
		}

		if err := json.Unmarshal(body, &errorResp); err == nil && errorResp.Message != "" {
			// Enhanced error message with details
			errorMsg := fmt.Sprintf("GitHub API error: %s", errorResp.Message)

			// Add specific error details if available
			if len(errorResp.Errors) > 0 {
				errorMsg += " - Details:"
				for _, e := range errorResp.Errors {
					if e.Field != "" && e.Code != "" {
						errorMsg += fmt.Sprintf(" [%s: %s - %s]", e.Field, e.Code, e.Message)
					} else if e.Message != "" {
						errorMsg += fmt.Sprintf(" [%s]", e.Message)
					}
				}
			}

			// Add documentation URL if available
			if errorResp.DocumentationURL != "" {
				errorMsg += fmt.Sprintf(" (See: %s)", errorResp.DocumentationURL)
			}

			// Add function-specific hints
			if funcDef.Name == "github_create_pull_request" && resp.StatusCode == 422 {
				errorMsg += " - Common causes: branch doesn't exist, no commits difference, or invalid branch names"
			}

			return nil, fmt.Errorf("%s", errorMsg)
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

	// Validate that endpoint URL is provided
	if !funcDef.EndpointUrl.Valid || funcDef.EndpointUrl.String == "" {
		return fmt.Errorf("github function %s requires endpoint_url", funcDef.Name)
	}

	// Validate that endpoint URL is a GitHub API URL
	if !strings.HasPrefix(funcDef.EndpointUrl.String, "https://api.github.com/") {
		return fmt.Errorf("github function %s endpoint_url must start with https://api.github.com/", funcDef.Name)
	}

	// No hardcoded function list - if it's loaded from JSON and has proper endpoint, it's valid
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

// encodeFileContent encodes file content as Base64 for GitHub API requests
func (g *Integration) encodeFileContent(req *http.Request, args map[string]interface{}) error {
	// Read the current request body
	if req.Body == nil {
		return fmt.Errorf("no request body to encode")
	}

	bodyBytes, err := io.ReadAll(req.Body)
	if err != nil {
		return fmt.Errorf("failed to read request body: %w", err)
	}
	req.Body.Close()

	// Parse the JSON body
	var bodyData map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &bodyData); err != nil {
		return fmt.Errorf("failed to parse request body JSON: %w", err)
	}

	// Encode the content field if it exists
	if content, exists := bodyData["content"]; exists {
		if contentStr, ok := content.(string); ok {
			// Encode content as Base64
			encodedContent := base64.StdEncoding.EncodeToString([]byte(contentStr))
			bodyData["content"] = encodedContent
			log.Printf("🔍 [GITHUB_DEBUG] Encoded file content: %d chars -> %d chars (Base64)", len(contentStr), len(encodedContent))
		}
	}

	// Handle empty SHA for new files (remove it from the request)
	if sha, exists := bodyData["sha"]; exists {
		if shaStr, ok := sha.(string); ok && shaStr == "" {
			delete(bodyData, "sha")
			log.Printf("🔍 [GITHUB_DEBUG] Removed empty SHA for new file creation")
		}
	}

	// Re-marshal the body with encoded content
	newBodyBytes, err := json.Marshal(bodyData)
	if err != nil {
		return fmt.Errorf("failed to marshal updated request body: %w", err)
	}

	// Replace the request body
	req.Body = io.NopCloser(strings.NewReader(string(newBodyBytes)))
	req.ContentLength = int64(len(newBodyBytes))

	return nil
}

// handleUpdateFileOnBranch handles the composite workflow for updating a file on a specific branch
func (g *Integration) handleUpdateFileOnBranch(ctx context.Context, req *http.Request, funcDef *db.FunctionDefinition, args map[string]interface{}) error {
	// Extract parameters
	owner, _ := args["owner"].(string)
	repo, _ := args["repo"].(string)
	path, _ := args["path"].(string)
	branch, _ := args["branch"].(string)
	content, _ := args["content"].(string)
	message, _ := args["message"].(string)

	if owner == "" || repo == "" || path == "" || branch == "" || content == "" || message == "" {
		return fmt.Errorf("missing required parameters for github_update_file_on_branch")
	}

	log.Printf("🔧 [GITHUB_WORKFLOW] Starting update file on branch: %s/%s:%s on branch %s", owner, repo, path, branch)

	// Step 1: Get current file SHA from the target branch
	sha, err := g.getFileSHAFromBranch(ctx, owner, repo, path, branch)
	if err != nil {
		return fmt.Errorf("failed to get file SHA from branch %s: %w", branch, err)
	}

	log.Printf("✅ [GITHUB_WORKFLOW] Got file SHA from branch %s: %s", branch, sha)

	// Step 2: Prepare the update request with the SHA
	args["sha"] = sha
	args["branch"] = branch

	// Step 3: Encode content and prepare request as normal
	if err := g.encodeFileContent(req, args); err != nil {
		return fmt.Errorf("failed to encode file content: %w", err)
	}

	log.Printf("✅ [GITHUB_WORKFLOW] File update prepared for branch %s", branch)
	return nil
}

// handleBranchUpdatePRWorkflow handles the complete branch creation, file update, and PR creation workflow
func (g *Integration) handleBranchUpdatePRWorkflow(ctx context.Context, req *http.Request, funcDef *db.FunctionDefinition, args map[string]interface{}) error {
	// This is a complex multi-step workflow that needs to be handled differently
	// For now, return an error indicating this needs special handling
	return fmt.Errorf("github_branch_update_pr_workflow requires special multi-step handling - not yet implemented")
}

// getFileSHAFromBranch retrieves the SHA of a file from a specific branch
func (g *Integration) getFileSHAFromBranch(ctx context.Context, owner, repo, path, branch string) (string, error) {
	// Build URL for getting file info from specific branch
	url := fmt.Sprintf("%s/repos/%s/%s/contents/%s?ref=%s", g.baseURL, owner, repo, path, branch)

	// Create GET request
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Apply authentication
	if g.authService != nil && g.userID != "" {
		credentials, err := g.authService.GetAuthCredentialsForService(ctx, g.userID, "github")
		if err == nil {
			for key, value := range credentials.Headers {
				req.Header.Set(key, value)
			}
		}
	} else if g.apiKeys != nil && g.apiKeys.GithubApiKey != "" {
		req.Header.Set("Authorization", "token "+g.apiKeys.GithubApiKey)
		req.Header.Set("Accept", "application/vnd.github+json")
		req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
		req.Header.Set("User-Agent", "GoGent/1.0")
	}

	// Execute request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("GitHub API returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response to get SHA
	var fileInfo struct {
		SHA string `json:"sha"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&fileInfo); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if fileInfo.SHA == "" {
		return "", fmt.Errorf("no SHA found in response")
	}

	return fileInfo.SHA, nil
}
