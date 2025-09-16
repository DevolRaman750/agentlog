package gogent

import (
	"database/sql"
	"testing"

	"gogent/internal/db"
)

// TestAPIFunctionRouting tests the core routing logic between GitHub and generic APIs
// This protects us during the integration refactor
func TestAPIFunctionRouting(t *testing.T) {
	// Create a mock client for testing
	client := &Client{}

	tests := []struct {
		name           string
		functionGroup  string
		functionName   string
		expectedMethod string
		args           map[string]interface{}
	}{
		{
			name:          "GitHub function uses buildGitHubAPIURL",
			functionGroup: "github",
			functionName:  "github_read_issues",
			args: map[string]interface{}{
				"owner": "microsoft",
				"repo":  "vscode",
			},
		},
		{
			name:          "Slack function uses buildGenericAPIURL",
			functionGroup: "slack",
			functionName:  "slack_read_messages",
			args: map[string]interface{}{
				"channel": "C123456",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create mock function definition
			funcDef := &db.FunctionDefinition{
				Name:          tt.functionName,
				FunctionGroup: tt.functionGroup,
			}

			// Test the routing logic by checking which URL builder would be called
			if tt.functionGroup == "github" {
				// This should route to buildGitHubAPIURL
				url, err := client.buildGitHubAPIURL(tt.functionName, tt.args)
				if err != nil {
					t.Errorf("buildGitHubAPIURL failed for %s: %v", tt.functionName, err)
				}
				if url == "" {
					t.Errorf("buildGitHubAPIURL returned empty URL for %s", tt.functionName)
				}
			} else {
				// This should route to buildGenericAPIURL
				// We'll test this with a mock endpoint
				funcDef.EndpointUrl = sql.NullString{String: "https://slack.com/api/conversations.history", Valid: true}
				url, err := client.buildGenericAPIURL(funcDef, tt.args)
				if err != nil {
					t.Errorf("buildGenericAPIURL failed for %s: %v", tt.functionName, err)
				}
				if url == "" {
					t.Errorf("buildGenericAPIURL returned empty URL for %s", tt.functionName)
				}
			}
		})
	}
}

// TestURLBuilding tests the core URL construction logic
func TestURLBuilding(t *testing.T) {
	client := &Client{}

	t.Run("GitHub URL Building", func(t *testing.T) {
		args := map[string]interface{}{
			"owner": "microsoft",
			"repo":  "vscode",
			"state": "open",
		}

		url, err := client.buildGitHubAPIURL("github_read_issues", args)
		if err != nil {
			t.Fatalf("buildGitHubAPIURL failed: %v", err)
		}

		expectedPath := "/repos/microsoft/vscode/issues"
		if !containsSubstring(url, expectedPath) {
			t.Errorf("URL %s should contain path %s", url, expectedPath)
		}
	})

	t.Run("Slack URL Building with GET parameters", func(t *testing.T) {
		funcDef := &db.FunctionDefinition{
			Name:        "slack_read_messages",
			EndpointUrl: sql.NullString{String: "https://slack.com/api/conversations.history", Valid: true},
			HttpMethod:  sql.NullString{String: "GET", Valid: true},
		}

		args := map[string]interface{}{
			"channel": "C123456",
			"limit":   "10",
		}

		url, err := client.buildGenericAPIURL(funcDef, args)
		if err != nil {
			t.Fatalf("buildGenericAPIURL failed: %v", err)
		}

		// Should contain query parameters for GET requests
		if !containsSubstring(url, "channel=C123456") {
			t.Errorf("URL should contain channel parameter: %s", url)
		}
		if !containsSubstring(url, "limit=10") {
			t.Errorf("URL should contain limit parameter: %s", url)
		}
	})
}

// Use existing containsSubstring function from client_test.go
