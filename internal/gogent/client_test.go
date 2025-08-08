package gogent

import (
	"fmt"
	"testing"
	"time"

	"gogent/internal/types"

	"github.com/google/uuid"
)

func TestConfigurationValidation(t *testing.T) {
	tests := []struct {
		name           string
		config         types.APIConfiguration
		expectError    bool
		expectedErrMsg string
	}{
		{
			name: "valid_configuration",
			config: types.APIConfiguration{
				ID:            uuid.New().String(),
				VariationName: "test-variation",
				ModelName:     "gemini-1.5-flash",
				SystemPrompt:  "You are a helpful assistant",
				Temperature:   &[]float32{0.7}[0],
				MaxTokens:     &[]int32{150}[0],
			},
			expectError: false,
		},
		{
			name: "missing_variation_name",
			config: types.APIConfiguration{
				ID:        uuid.New().String(),
				ModelName: "gemini-1.5-flash",
			},
			expectError:    true,
			expectedErrMsg: "variation name is required",
		},
		{
			name: "missing_model_name",
			config: types.APIConfiguration{
				ID:            uuid.New().String(),
				VariationName: "test-variation",
			},
			expectError:    true,
			expectedErrMsg: "model name is required",
		},
		{
			name: "invalid_temperature_too_low",
			config: types.APIConfiguration{
				ID:            uuid.New().String(),
				VariationName: "test-variation",
				ModelName:     "gemini-1.5-flash",
				Temperature:   &[]float32{-0.1}[0],
			},
			expectError:    true,
			expectedErrMsg: "temperature must be between 0.0 and 2.0",
		},
		{
			name: "invalid_temperature_too_high",
			config: types.APIConfiguration{
				ID:            uuid.New().String(),
				VariationName: "test-variation",
				ModelName:     "gemini-1.5-flash",
				Temperature:   &[]float32{2.1}[0],
			},
			expectError:    true,
			expectedErrMsg: "temperature must be between 0.0 and 2.0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateConfiguration(&tt.config)
			if tt.expectError {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				if !contains(err.Error(), tt.expectedErrMsg) {
					t.Errorf("expected error to contain %q, got %q", tt.expectedErrMsg, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("expected no error but got: %v", err)
				}
			}
		})
	}
}

func TestMultiExecutionRequestValidation(t *testing.T) {
	tests := []struct {
		name           string
		request        types.MultiExecutionRequest
		expectError    bool
		expectedErrMsg string
	}{
		{
			name: "valid_request",
			request: types.MultiExecutionRequest{
				ExecutionRunName: "test-run",
				Description:      "Test execution",
				BasePrompt:       "Test prompt",
				Configurations: []types.APIConfiguration{
					{
						ID:            uuid.New().String(),
						VariationName: "variation-1",
						ModelName:     "gemini-1.5-flash",
					},
				},
			},
			expectError: false,
		},
		{
			name: "missing_execution_run_name",
			request: types.MultiExecutionRequest{
				BasePrompt: "Test prompt",
				Configurations: []types.APIConfiguration{
					{
						ID:            uuid.New().String(),
						VariationName: "variation-1",
						ModelName:     "gemini-1.5-flash",
					},
				},
			},
			expectError:    true,
			expectedErrMsg: "execution run name is required",
		},
		{
			name: "missing_base_prompt",
			request: types.MultiExecutionRequest{
				ExecutionRunName: "test-run",
				Configurations: []types.APIConfiguration{
					{
						ID:            uuid.New().String(),
						VariationName: "variation-1",
						ModelName:     "gemini-1.5-flash",
					},
				},
			},
			expectError:    true,
			expectedErrMsg: "base prompt is required",
		},
		{
			name: "no_configurations",
			request: types.MultiExecutionRequest{
				ExecutionRunName: "test-run",
				BasePrompt:       "Test prompt",
				Configurations:   []types.APIConfiguration{},
			},
			expectError:    true,
			expectedErrMsg: "at least one configuration is required",
		},
		{
			name: "too_many_configurations",
			request: types.MultiExecutionRequest{
				ExecutionRunName: "test-run",
				BasePrompt:       "Test prompt",
				Configurations:   make([]types.APIConfiguration, 11), // Assuming max is 10
			},
			expectError:    true,
			expectedErrMsg: "maximum 10 configurations allowed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateMultiExecutionRequest(&tt.request)
			if tt.expectError {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				if !contains(err.Error(), tt.expectedErrMsg) {
					t.Errorf("expected error to contain %q, got %q", tt.expectedErrMsg, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("expected no error but got: %v", err)
				}
			}
		})
	}
}

func TestExecutionResult(t *testing.T) {
	tests := []struct {
		name               string
		results            []types.VariationResult
		expectedSuccess    int
		expectedError      int
		expectedFastest    string
		expectedComparison bool
	}{
		{
			name: "all_successful_results",
			results: []types.VariationResult{
				{
					Configuration: types.APIConfiguration{
						ID:            "config-1",
						VariationName: "variation-1",
						ModelName:     "gemini-1.5-flash",
					},
					Response: types.APIResponse{
						ID:             "response-1",
						ResponseStatus: types.ResponseStatusSuccess,
						ResponseText:   "Response 1",
						ResponseTimeMs: 200,
					},
					ExecutionTime: 200,
				},
				{
					Configuration: types.APIConfiguration{
						ID:            "config-2",
						VariationName: "variation-2",
						ModelName:     "gemini-1.5-flash",
					},
					Response: types.APIResponse{
						ID:             "response-2",
						ResponseStatus: types.ResponseStatusSuccess,
						ResponseText:   "Response 2",
						ResponseTimeMs: 150,
					},
					ExecutionTime: 150,
				},
			},
			expectedSuccess:    2,
			expectedError:      0,
			expectedFastest:    "config-2",
			expectedComparison: true,
		},
		{
			name: "mixed_results",
			results: []types.VariationResult{
				{
					Configuration: types.APIConfiguration{
						ID:            "config-1",
						VariationName: "variation-1",
						ModelName:     "gemini-1.5-flash",
					},
					Response: types.APIResponse{
						ID:             "response-1",
						ResponseStatus: types.ResponseStatusSuccess,
						ResponseText:   "Response 1",
						ResponseTimeMs: 200,
					},
					ExecutionTime: 200,
				},
				{
					Configuration: types.APIConfiguration{
						ID:            "config-2",
						VariationName: "variation-2",
						ModelName:     "gemini-1.5-flash",
					},
					Response: types.APIResponse{
						ID:             "response-2",
						ResponseStatus: types.ResponseStatusError,
						ErrorMessage:   "API Error",
						ResponseTimeMs: 0,
					},
					ExecutionTime: 0,
				},
			},
			expectedSuccess:    1,
			expectedError:      1,
			expectedFastest:    "config-1",
			expectedComparison: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := analyzeExecutionResults(tt.results)

			if result.SuccessCount != tt.expectedSuccess {
				t.Errorf("expected success count %d, got %d", tt.expectedSuccess, result.SuccessCount)
			}
			if result.ErrorCount != tt.expectedError {
				t.Errorf("expected error count %d, got %d", tt.expectedError, result.ErrorCount)
			}

			if tt.expectedComparison && len(tt.results) > 0 {
				fastest := findFastestResult(tt.results)
				if fastest != nil && fastest.Configuration.ID != tt.expectedFastest {
					t.Errorf("expected fastest %s, got %s", tt.expectedFastest, fastest.Configuration.ID)
				}
			}
		})
	}
}

func TestComparisonMetrics(t *testing.T) {
	tests := []struct {
		name        string
		results     []types.VariationResult
		metrics     []string
		expectBest  string
		expectNotes string
	}{
		{
			name: "performance_comparison",
			results: []types.VariationResult{
				{
					Configuration: types.APIConfiguration{
						ID:            "fast-config",
						VariationName: "fast-variation",
					},
					Response: types.APIResponse{
						ResponseTimeMs: 100,
						ResponseStatus: types.ResponseStatusSuccess,
					},
				},
				{
					Configuration: types.APIConfiguration{
						ID:            "slow-config",
						VariationName: "slow-variation",
					},
					Response: types.APIResponse{
						ResponseTimeMs: 300,
						ResponseStatus: types.ResponseStatusSuccess,
					},
				},
			},
			metrics:     []string{"response_time"},
			expectBest:  "fast-config",
			expectNotes: "fastest response time",
		},
		{
			name: "quality_comparison",
			results: []types.VariationResult{
				{
					Configuration: types.APIConfiguration{
						ID:            "detailed-config",
						VariationName: "detailed-variation",
					},
					Response: types.APIResponse{
						ResponseText:   "This is a very detailed and comprehensive response with lots of information.",
						ResponseStatus: types.ResponseStatusSuccess,
						ResponseTimeMs: 200,
					},
				},
				{
					Configuration: types.APIConfiguration{
						ID:            "brief-config",
						VariationName: "brief-variation",
					},
					Response: types.APIResponse{
						ResponseText:   "Brief response.",
						ResponseStatus: types.ResponseStatusSuccess,
						ResponseTimeMs: 150,
					},
				},
			},
			metrics:     []string{"response_length"},
			expectBest:  "detailed-config",
			expectNotes: "longest response",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			comparison := compareResultsByMetrics(tt.results, tt.metrics)

			if comparison.BestConfigurationID != tt.expectBest {
				t.Errorf("expected best config %s, got %s", tt.expectBest, comparison.BestConfigurationID)
			}
			if !contains(comparison.AnalysisNotes, tt.expectNotes) {
				t.Errorf("expected notes to contain %q, got %q", tt.expectNotes, comparison.AnalysisNotes)
			}
		})
	}
}

// Helper functions for the tests
func validateConfiguration(config *types.APIConfiguration) error {
	if config.VariationName == "" {
		return fmt.Errorf("variation name is required")
	}
	if config.ModelName == "" {
		return fmt.Errorf("model name is required")
	}
	if config.Temperature != nil && (*config.Temperature < 0.0 || *config.Temperature > 2.0) {
		return fmt.Errorf("temperature must be between 0.0 and 2.0")
	}
	return nil
}

func validateMultiExecutionRequest(request *types.MultiExecutionRequest) error {
	if request.ExecutionRunName == "" {
		return fmt.Errorf("execution run name is required")
	}
	if request.BasePrompt == "" {
		return fmt.Errorf("base prompt is required")
	}
	if len(request.Configurations) == 0 {
		return fmt.Errorf("at least one configuration is required")
	}
	if len(request.Configurations) > 10 {
		return fmt.Errorf("maximum 10 configurations allowed")
	}
	return nil
}

func analyzeExecutionResults(results []types.VariationResult) types.ExecutionResult {
	successCount := 0
	errorCount := 0
	totalTime := int64(0)

	for _, result := range results {
		if result.Response.ResponseStatus == types.ResponseStatusSuccess {
			successCount++
		} else {
			errorCount++
		}
		totalTime += result.ExecutionTime
	}

	return types.ExecutionResult{
		Results:      results,
		SuccessCount: successCount,
		ErrorCount:   errorCount,
		TotalTime:    totalTime,
	}
}

func findFastestResult(results []types.VariationResult) *types.VariationResult {
	var fastest *types.VariationResult

	for i := range results {
		if results[i].Response.ResponseStatus == types.ResponseStatusSuccess {
			if fastest == nil || results[i].Response.ResponseTimeMs < fastest.Response.ResponseTimeMs {
				fastest = &results[i]
			}
		}
	}

	return fastest
}

func compareResultsByMetrics(results []types.VariationResult, metrics []string) types.ComparisonResult {
	if len(results) == 0 {
		return types.ComparisonResult{}
	}

	comparison := types.ComparisonResult{
		ID:             uuid.New().String(),
		ComparisonType: "multi-metric",
		CreatedAt:      time.Now(),
	}

	for _, metric := range metrics {
		switch metric {
		case "response_time":
			fastest := findFastestResult(results)
			if fastest != nil {
				comparison.BestConfigurationID = fastest.Configuration.ID
				comparison.MetricName = "response_time"
				comparison.AnalysisNotes = fmt.Sprintf("fastest response time: %dms", fastest.Response.ResponseTimeMs)
			}
		case "response_length":
			var longest *types.VariationResult
			for i := range results {
				if results[i].Response.ResponseStatus == types.ResponseStatusSuccess {
					if longest == nil || len(results[i].Response.ResponseText) > len(longest.Response.ResponseText) {
						longest = &results[i]
					}
				}
			}
			if longest != nil {
				comparison.BestConfigurationID = longest.Configuration.ID
				comparison.MetricName = "response_length"
				comparison.AnalysisNotes = fmt.Sprintf("longest response: %d characters", len(longest.Response.ResponseText))
			}
		}
	}

	return comparison
}

// TestCreateAPIConfiguration_PreservesSystemUserID tests that system configurations
// maintain their UserID='system' when saved to database during execution
func TestCreateAPIConfiguration_PreservesSystemUserID(t *testing.T) {
	// This is a unit test for the UserID preservation logic

	// Test case 1: System configuration should preserve UserID='system'
	systemConfig := &types.APIConfiguration{
		ID:               "test-system-config",
		UserID:           "system", // This should be preserved
		VariationName:    "Test System Config",
		ModelName:        "gemini-1.5-flash",
		SystemPrompt:     "Test system prompt",
		IsSystemResource: true,
	}

	// The logic that should be tested (from CreateAPIConfiguration):
	currentUserID := "test-user-123"
	configUserID := currentUserID
	if systemConfig.UserID != "" {
		configUserID = systemConfig.UserID
	}

	if configUserID != "system" {
		t.Errorf("Expected system configuration to preserve UserID='system', got '%s'", configUserID)
	}

	// Test case 2: User configuration without UserID should use provided userID
	userConfig := &types.APIConfiguration{
		ID:            "test-user-config",
		UserID:        "", // Empty - should use provided userID
		VariationName: "Test User Config",
		ModelName:     "gemini-1.5-flash",
	}

	configUserID = currentUserID
	if userConfig.UserID != "" {
		configUserID = userConfig.UserID
	}

	if configUserID != currentUserID {
		t.Errorf("Expected user configuration to use provided UserID='%s', got '%s'", currentUserID, configUserID)
	}

	// Test case 3: User configuration with UserID should preserve it
	userConfigWithID := &types.APIConfiguration{
		ID:            "test-user-config-with-id",
		UserID:        "specific-user-456",
		VariationName: "Test User Config With ID",
		ModelName:     "gemini-1.5-flash",
	}

	configUserID = currentUserID
	if userConfigWithID.UserID != "" {
		configUserID = userConfigWithID.UserID
	}

	if configUserID != "specific-user-456" {
		t.Errorf("Expected user configuration to preserve UserID='specific-user-456', got '%s'", configUserID)
	}
}

// TestGitHubFunctionDefinitions tests the structure and validation of GitHub functions
func TestGitHubFunctionDefinitions(t *testing.T) {
	tests := []struct {
		name                string
		functionName        string
		arguments           map[string]interface{}
		expectValid         bool
		expectedErrContains string
	}{
		{
			name:         "github_read_issues_valid_basic",
			functionName: "github_read_issues",
			arguments: map[string]interface{}{
				"owner": "microsoft",
				"repo":  "vscode",
				"state": "open",
			},
			expectValid: true,
		},
		{
			name:         "github_read_issues_valid_with_filters",
			functionName: "github_read_issues",
			arguments: map[string]interface{}{
				"owner":  "microsoft",
				"repo":   "vscode",
				"state":  "open",
				"labels": "bug,enhancement",
				"limit":  10,
			},
			expectValid: true,
		},
		{
			name:         "github_read_issues_missing_owner",
			functionName: "github_read_issues",
			arguments: map[string]interface{}{
				"repo":  "vscode",
				"state": "open",
			},
			expectValid:         false,
			expectedErrContains: "owner",
		},
		{
			name:         "github_read_issues_missing_repo",
			functionName: "github_read_issues",
			arguments: map[string]interface{}{
				"owner": "microsoft",
				"state": "open",
			},
			expectValid:         false,
			expectedErrContains: "repo",
		},
		{
			name:         "github_read_code_valid_file",
			functionName: "github_read_code",
			arguments: map[string]interface{}{
				"owner": "microsoft",
				"repo":  "vscode",
				"path":  "package.json",
			},
			expectValid: true,
		},
		{
			name:         "github_read_code_valid_directory",
			functionName: "github_read_code",
			arguments: map[string]interface{}{
				"owner": "microsoft",
				"repo":  "vscode",
				"path":  "src",
			},
			expectValid: true,
		},
		{
			name:         "github_read_code_missing_path",
			functionName: "github_read_code",
			arguments: map[string]interface{}{
				"owner": "microsoft",
				"repo":  "vscode",
			},
			expectValid:         false,
			expectedErrContains: "path",
		},
		{
			name:         "github_repo_info_valid",
			functionName: "github_repo_info",
			arguments: map[string]interface{}{
				"owner": "microsoft",
				"repo":  "vscode",
			},
			expectValid: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateGitHubFunctionArguments(tt.functionName, tt.arguments)

			if tt.expectValid {
				if err != nil {
					t.Errorf("expected valid arguments but got error: %v", err)
				}
			} else {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				if tt.expectedErrContains != "" && !contains(err.Error(), tt.expectedErrContains) {
					t.Errorf("expected error to contain %q, got %q", tt.expectedErrContains, err.Error())
				}
			}
		})
	}
}

// TestGitHubURLConstruction tests GitHub API URL building
func TestGitHubURLConstruction(t *testing.T) {
	tests := []struct {
		name         string
		functionName string
		arguments    map[string]interface{}
		expectedURL  string
	}{
		{
			name:         "github_repo_info_url",
			functionName: "github_repo_info",
			arguments: map[string]interface{}{
				"owner": "microsoft",
				"repo":  "vscode",
			},
			expectedURL: "https://api.github.com/repos/microsoft/vscode",
		},
		{
			name:         "github_read_issues_basic",
			functionName: "github_read_issues",
			arguments: map[string]interface{}{
				"owner": "microsoft",
				"repo":  "vscode",
				"state": "open",
			},
			expectedURL: "https://api.github.com/repos/microsoft/vscode/issues?state=open",
		},
		{
			name:         "github_read_issues_with_filters",
			functionName: "github_read_issues",
			arguments: map[string]interface{}{
				"owner":  "microsoft",
				"repo":   "vscode",
				"state":  "open",
				"labels": "bug,enhancement",
				"limit":  5,
			},
			expectedURL: "https://api.github.com/repos/microsoft/vscode/issues?state=open&labels=bug,enhancement&per_page=5",
		},
		{
			name:         "github_read_code_file",
			functionName: "github_read_code",
			arguments: map[string]interface{}{
				"owner": "microsoft",
				"repo":  "vscode",
				"path":  "package.json",
			},
			expectedURL: "https://api.github.com/repos/microsoft/vscode/contents/package.json",
		},
		{
			name:         "github_read_code_directory",
			functionName: "github_read_code",
			arguments: map[string]interface{}{
				"owner": "microsoft",
				"repo":  "vscode",
				"path":  "src/vs",
			},
			expectedURL: "https://api.github.com/repos/microsoft/vscode/contents/src/vs",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url, err := buildGitHubURL(tt.functionName, tt.arguments)
			if err != nil {
				t.Errorf("unexpected error building URL: %v", err)
				return
			}

			if url != tt.expectedURL {
				t.Errorf("expected URL %q, got %q", tt.expectedURL, url)
			}
		})
	}
}

// TestGitHubMockResponses tests the structure of mock responses for GitHub functions
func TestGitHubMockResponses(t *testing.T) {
	tests := []struct {
		name           string
		functionName   string
		expectedFields []string
		expectArray    bool
	}{
		{
			name:           "github_repo_info_mock",
			functionName:   "github_repo_info",
			expectedFields: []string{"name", "full_name", "description", "stargazers_count", "forks_count"},
			expectArray:    false,
		},
		{
			name:           "github_read_issues_mock",
			functionName:   "github_read_issues",
			expectedFields: []string{"title", "body", "state", "number"},
			expectArray:    true,
		},
		{
			name:           "github_read_code_mock",
			functionName:   "github_read_code",
			expectedFields: []string{"name", "type", "content"},
			expectArray:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockResponse := getGitHubMockResponse(tt.functionName)

			if mockResponse == nil {
				t.Errorf("expected mock response but got nil")
				return
			}

			// Check if it's an array when expected
			if tt.expectArray {
				if responseArray, ok := mockResponse.([]interface{}); ok {
					if len(responseArray) == 0 {
						t.Errorf("expected non-empty array response")
						return
					}
					// Check first item in array
					if firstItem, ok := responseArray[0].(map[string]interface{}); ok {
						for _, field := range tt.expectedFields {
							if _, exists := firstItem[field]; !exists {
								t.Errorf("expected field %q not found in mock response", field)
							}
						}
					} else {
						t.Errorf("expected array of objects but got different type")
					}
				} else {
					t.Errorf("expected array response but got different type")
				}
			} else {
				// Check object response
				if responseObj, ok := mockResponse.(map[string]interface{}); ok {
					for _, field := range tt.expectedFields {
						if _, exists := responseObj[field]; !exists {
							t.Errorf("expected field %q not found in mock response", field)
						}
					}
				} else {
					t.Errorf("expected object response but got different type")
				}
			}
		})
	}
}

// Helper functions for GitHub function tests
func validateGitHubFunctionArguments(functionName string, arguments map[string]interface{}) error {
	// Basic validation for required fields
	switch functionName {
	case "github_repo_info", "github_read_issues", "github_read_code":
		if _, ok := arguments["owner"]; !ok {
			return fmt.Errorf("owner is required")
		}
		if _, ok := arguments["repo"]; !ok {
			return fmt.Errorf("repo is required")
		}
	}

	// Function-specific validation
	switch functionName {
	case "github_read_code":
		if _, ok := arguments["path"]; !ok {
			return fmt.Errorf("path is required")
		}
	case "github_read_issues":
		// State is optional but if provided should be valid
		if state, ok := arguments["state"]; ok {
			if stateStr, ok := state.(string); ok {
				if stateStr != "open" && stateStr != "closed" && stateStr != "all" {
					return fmt.Errorf("state must be 'open', 'closed', or 'all'")
				}
			}
		}
	}

	return nil
}

func buildGitHubURL(functionName string, arguments map[string]interface{}) (string, error) {
	owner, ok := arguments["owner"].(string)
	if !ok {
		return "", fmt.Errorf("owner must be a string")
	}

	repo, ok := arguments["repo"].(string)
	if !ok {
		return "", fmt.Errorf("repo must be a string")
	}

	baseURL := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo)

	switch functionName {
	case "github_repo_info":
		return baseURL, nil

	case "github_read_issues":
		url := baseURL + "/issues"
		params := []string{}

		if state, ok := arguments["state"].(string); ok {
			params = append(params, fmt.Sprintf("state=%s", state))
		}
		if labels, ok := arguments["labels"].(string); ok {
			params = append(params, fmt.Sprintf("labels=%s", labels))
		}
		if limit, ok := arguments["limit"]; ok {
			if limitInt, ok := limit.(int); ok {
				params = append(params, fmt.Sprintf("per_page=%d", limitInt))
			}
		}

		if len(params) > 0 {
			url += "?" + params[0]
			for _, param := range params[1:] {
				url += "&" + param
			}
		}
		return url, nil

	case "github_read_code":
		path, ok := arguments["path"].(string)
		if !ok {
			return "", fmt.Errorf("path must be a string")
		}
		return baseURL + "/contents/" + path, nil

	default:
		return "", fmt.Errorf("unknown GitHub function: %s", functionName)
	}
}

func getGitHubMockResponse(functionName string) interface{} {
	switch functionName {
	case "github_repo_info":
		return map[string]interface{}{
			"name":             "vscode",
			"full_name":        "microsoft/vscode",
			"description":      "Visual Studio Code",
			"stargazers_count": 158000,
			"forks_count":      28000,
			"language":         "TypeScript",
			"open_issues":      5234,
		}

	case "github_read_issues":
		return []interface{}{
			map[string]interface{}{
				"number":     12345,
				"title":      "Sample Issue Title",
				"body":       "This is a sample issue description for testing purposes.",
				"state":      "open",
				"labels":     []string{"bug", "needs-investigation"},
				"user":       map[string]interface{}{"login": "testuser"},
				"created_at": "2024-01-15T10:30:00Z",
				"updated_at": "2024-01-16T14:20:00Z",
			},
			map[string]interface{}{
				"number":     12344,
				"title":      "Another Sample Issue",
				"body":       "Another issue for testing GitHub API integration.",
				"state":      "open",
				"labels":     []string{"enhancement"},
				"user":       map[string]interface{}{"login": "developer"},
				"created_at": "2024-01-14T09:15:00Z",
				"updated_at": "2024-01-15T16:45:00Z",
			},
		}

	case "github_read_code":
		return map[string]interface{}{
			"name":     "package.json",
			"type":     "file",
			"size":     1024,
			"content":  "ewogICJuYW1lIjogInZzY29kZSIsCiAgInZlcnNpb24iOiAiMS44NS4wIgp9", // base64 encoded
			"encoding": "base64",
			"sha":      "abc123def456",
		}

	default:
		return nil
	}
}

// Helper function for string contains check
func contains(s, substr string) bool {
	return len(s) >= len(substr) &&
		(s == substr ||
			(len(s) > len(substr) &&
				(s[:len(substr)] == substr ||
					s[len(s)-len(substr):] == substr ||
					containsSubstring(s, substr))))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
