package github

import (
	"bytes"
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
	apiKeys     *types.SessionAPIKeys // Legacy support
	authService *apiauth.Service
	userID      string
}

// NewIntegration creates a new GitHub integration
func NewIntegration(apiKeys *types.SessionAPIKeys) *Integration {
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
		if funcDef.HTTPMethod.Valid {
			httpMethod = funcDef.HTTPMethod.String
		}

		if httpMethod == "GET" {
			var queryParams []string

			// Special handling for GitHub search endpoints
			if strings.Contains(finalURL, "/search/code") {
				// GitHub search requires a single 'q' parameter with combined search terms
				owner, hasOwner := args["owner"].(string)
				repo, hasRepo := args["repo"].(string)
				searchQuery, hasQuery := args["query"].(string)

				if hasOwner && hasRepo {
					combinedQuery := fmt.Sprintf("repo:%s/%s", owner, repo)
					if hasQuery && searchQuery != "" {
						combinedQuery += " " + searchQuery
					}
					queryParams = append(queryParams, fmt.Sprintf("q=%s", url.QueryEscape(combinedQuery)))

					// Mark these parameters as used so they don't get added again
					usedParams["owner"] = true
					usedParams["repo"] = true
					usedParams["query"] = true
				}
			}

			// Add remaining parameters as normal query parameters
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

	// Note: github_branch_update_pr_workflow is handled as a special composite function
	// and should not reach this PrepareRequest method

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
	if g.apiKeys != nil && g.apiKeys.GithubAPIKey != "" {
		req.Header.Set("Authorization", "token "+g.apiKeys.GithubAPIKey)
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
	// Extract required parameters
	owner, _ := args["owner"].(string)
	repo, _ := args["repo"].(string)
	branchName, _ := args["branch_name"].(string)
	filePath, _ := args["file_path"].(string)
	fileContent, _ := args["file_content"].(string)
	commitMessage, _ := args["commit_message"].(string)
	prTitle, _ := args["pr_title"].(string)
	prBody, _ := args["pr_body"].(string)
	baseBranch, _ := args["base_branch"].(string)
	draft, _ := args["draft"].(bool)

	// Set default base branch
	if baseBranch == "" {
		baseBranch = "main"
	}

	if owner == "" || repo == "" || branchName == "" || filePath == "" || fileContent == "" || commitMessage == "" || prTitle == "" {
		return fmt.Errorf("missing required parameters for github_branch_update_pr_workflow")
	}

	log.Printf("🔧 [GITHUB_WORKFLOW] Starting complete branch-update-PR workflow")
	log.Printf("🔧 [GITHUB_WORKFLOW] Branch: %s, File: %s, Base: %s", branchName, filePath, baseBranch)

	// Step 1: Get base branch SHA
	baseSHA, err := g.GetBranchSHA(ctx, owner, repo, baseBranch)
	if err != nil {
		return fmt.Errorf("failed to get base branch %s SHA: %w", baseBranch, err)
	}
	log.Printf("✅ [GITHUB_WORKFLOW] Got base branch %s SHA: %s", baseBranch, baseSHA)

	// Step 2: Create new branch
	err = g.CreateBranch(ctx, owner, repo, branchName, baseSHA)
	if err != nil {
		return fmt.Errorf("failed to create branch %s: %w", branchName, err)
	}
	log.Printf("✅ [GITHUB_WORKFLOW] Created branch: %s", branchName)

	// Step 3: Update file on new branch
	err = g.UpdateFileOnBranch(ctx, owner, repo, filePath, fileContent, commitMessage, branchName)
	if err != nil {
		return fmt.Errorf("failed to update file %s on branch %s: %w", filePath, branchName, err)
	}
	log.Printf("✅ [GITHUB_WORKFLOW] Updated file %s on branch %s", filePath, branchName)

	// Step 4: Create pull request
	prData := map[string]interface{}{
		"title": prTitle,
		"head":  branchName,
		"base":  baseBranch,
		"draft": draft,
	}
	if prBody != "" {
		prData["body"] = prBody
	}

	prResult, err := g.CreatePullRequest(ctx, owner, repo, prData)
	if err != nil {
		return fmt.Errorf("failed to create pull request: %w", err)
	}
	log.Printf("✅ [GITHUB_WORKFLOW] Created pull request: %v", prResult)

	// Modify the original request to return the PR creation result
	prJSON, _ := json.Marshal(prData)
	req.Body = io.NopCloser(strings.NewReader(string(prJSON)))
	req.ContentLength = int64(len(prJSON))

	// Update the URL to the PR endpoint
	req.URL, _ = url.Parse(fmt.Sprintf("%s/repos/%s/%s/pulls", g.baseURL, owner, repo))

	log.Printf("✅ [GITHUB_WORKFLOW] Complete workflow finished successfully")
	return nil
}

// getFileSHAFromBranch retrieves the SHA of a file from a specific branch
func (g *Integration) getFileSHAFromBranch(ctx context.Context, owner, repo, path, branch string) (string, error) {
	// Build URL for getting file info from specific branch
	url := fmt.Sprintf("%s/repos/%s/%s/contents/%s?ref=%s", g.baseURL, owner, repo, path, branch)

	// Create GET request
	req, err := http.NewRequestWithContext(ctx, "GET", url, http.NoBody)
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
	} else if g.apiKeys != nil && g.apiKeys.GithubAPIKey != "" {
		req.Header.Set("Authorization", "token "+g.apiKeys.GithubAPIKey)
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

// GetBranchSHA retrieves the SHA of a branch (public method for workflow use)
func (g *Integration) GetBranchSHA(ctx context.Context, owner, repo, branch string) (string, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/git/refs/heads/%s", g.baseURL, owner, repo, branch)

	req, err := http.NewRequestWithContext(ctx, "GET", url, http.NoBody)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Apply authentication
	if err := g.applyAuth(ctx, req); err != nil {
		return "", fmt.Errorf("failed to apply auth: %w", err)
	}

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

	var refInfo struct {
		Object struct {
			SHA string `json:"sha"`
		} `json:"object"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&refInfo); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	return refInfo.Object.SHA, nil
}

// CreateBranch creates a new branch from a base SHA (public method for workflow use)
func (g *Integration) CreateBranch(ctx context.Context, owner, repo, branchName, baseSHA string) error {
	url := fmt.Sprintf("%s/repos/%s/%s/git/refs", g.baseURL, owner, repo)

	data := map[string]interface{}{
		"ref": fmt.Sprintf("refs/heads/%s", branchName),
		"sha": baseSHA,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal branch data: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// Apply authentication
	if err := g.applyAuth(ctx, req); err != nil {
		return fmt.Errorf("failed to apply auth: %w", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 {
		body, _ := io.ReadAll(resp.Body)

		// Enhanced error handling for branch creation
		errorMsg := fmt.Sprintf("GitHub API returned status %d: %s", resp.StatusCode, string(body))

		// Add specific guidance for common branch creation errors
		if resp.StatusCode == 422 && strings.Contains(string(body), "Reference update failed") {
			errorMsg += " - Common causes: branch already exists, invalid SHA, or insufficient permissions. Try using a different branch name or verify the source SHA is valid."
		} else if resp.StatusCode == 422 && strings.Contains(string(body), "Reference already exists") {
			errorMsg += " - The branch already exists. Use a different branch name or delete the existing branch first."
		}

		return fmt.Errorf("%s", errorMsg)
	}

	return nil
}

// UpdateFileOnBranch updates a file on a specific branch (public method for workflow use)
func (g *Integration) UpdateFileOnBranch(ctx context.Context, owner, repo, filePath, content, message, branch string) error {
	// First get the current file SHA from the branch
	fileSHA, err := g.getFileSHAFromBranch(ctx, owner, repo, filePath, branch)
	if err != nil {
		// File might not exist, that's ok for new files
		log.Printf("⚠️ [GITHUB_WORKFLOW] File %s not found on branch %s, creating new file", filePath, branch)
		fileSHA = ""
	}

	url := fmt.Sprintf("%s/repos/%s/%s/contents/%s", g.baseURL, owner, repo, filePath)

	data := map[string]interface{}{
		"message": message,
		"content": base64.StdEncoding.EncodeToString([]byte(content)),
		"branch":  branch,
	}

	// Add SHA if file exists
	if fileSHA != "" {
		data["sha"] = fileSHA
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal file data: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "PUT", url, bytes.NewReader(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// Apply authentication
	if err := g.applyAuth(ctx, req); err != nil {
		return fmt.Errorf("failed to apply auth: %w", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("GitHub API returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// CreatePullRequest creates a pull request (public method for workflow use)
func (g *Integration) CreatePullRequest(ctx context.Context, owner, repo string, prData map[string]interface{}) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/pulls", g.baseURL, owner, repo)

	jsonData, err := json.Marshal(prData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal PR data: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// Apply authentication
	if err := g.applyAuth(ctx, req); err != nil {
		return nil, fmt.Errorf("failed to apply auth: %w", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != 201 {
		return nil, fmt.Errorf("GitHub API returned status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

// applyAuth applies authentication to a request
func (g *Integration) applyAuth(ctx context.Context, req *http.Request) error {
	// Try new auth system first
	if g.authService != nil && g.userID != "" {
		credentials, err := g.authService.GetAuthCredentialsForService(ctx, g.userID, "github")
		if err == nil {
			for key, value := range credentials.Headers {
				req.Header.Set(key, value)
			}
			return nil
		}
	}

	// Legacy authentication fallback
	if g.apiKeys != nil && g.apiKeys.GithubAPIKey != "" {
		req.Header.Set("Authorization", "token "+g.apiKeys.GithubAPIKey)
		req.Header.Set("Accept", "application/vnd.github+json")
		req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
		req.Header.Set("User-Agent", "GoGent/1.0")
		return nil
	}

	return fmt.Errorf("no GitHub authentication available")
}
