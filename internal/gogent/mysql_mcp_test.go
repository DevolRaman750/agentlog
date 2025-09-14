package gogent

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"gogent/internal/db"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExecuteMySQLFunction(t *testing.T) {
	// Create a test client
	client := &Client{}

	// Mock function definition for MySQL
	funcDef := &db.FunctionDefinition{
		Name:       "test_mysql_query",
		HttpMethod: sql.NullString{String: "MYSQL", Valid: true},
	}

	t.Run("ValidSelectQuery", func(t *testing.T) {
		args := map[string]interface{}{
			"query":    "SELECT * FROM users WHERE id = 1",
			"database": "main",
			"limit":    50,
		}

		result, err := client.executeMySQLFunction(context.Background(), funcDef, args)

		require.NoError(t, err)
		assert.True(t, result["success"].(bool))
		assert.Equal(t, 3, result["rows_returned"])
		assert.Contains(t, result, "data")
		assert.Contains(t, result, "metadata")

		metadata := result["metadata"].(map[string]interface{})
		assert.Equal(t, "main", metadata["database"])
		assert.Equal(t, "SELECT", metadata["query_type"])
		assert.Equal(t, "high", metadata["security_level"])
	})

	t.Run("InvalidNonSelectQuery", func(t *testing.T) {
		args := map[string]interface{}{
			"query": "DELETE FROM users WHERE id = 1",
		}

		_, err := client.executeMySQLFunction(context.Background(), funcDef, args)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "security violation")
		assert.Contains(t, err.Error(), "only SELECT queries are allowed")
	})

	t.Run("DangerousSQLPatterns", func(t *testing.T) {
		dangerousQueries := []string{
			"SELECT * FROM users; DROP TABLE users;",
			"SELECT * FROM users UNION SELECT * FROM admin",
			"SELECT * FROM users INTO OUTFILE '/tmp/dump'",
			"SELECT LOAD_FILE('/etc/passwd')",
		}

		for _, query := range dangerousQueries {
			t.Run(query, func(t *testing.T) {
				args := map[string]interface{}{
					"query": query,
				}

				_, err := client.executeMySQLFunction(context.Background(), funcDef, args)
				require.Error(t, err)
				assert.Contains(t, err.Error(), "security violation")
			})
		}
	})

	t.Run("InvalidDatabase", func(t *testing.T) {
		args := map[string]interface{}{
			"query":    "SELECT * FROM users",
			"database": "evil_database",
		}

		_, err := client.executeMySQLFunction(context.Background(), funcDef, args)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "not in the allowed list")
	})

	t.Run("InvalidLimit", func(t *testing.T) {
		args := map[string]interface{}{
			"query": "SELECT * FROM users",
			"limit": 2000, // Exceeds max limit of 1000
		}

		_, err := client.executeMySQLFunction(context.Background(), funcDef, args)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "limit must be between 1 and 1000")
	})

	t.Run("MissingQueryParameter", func(t *testing.T) {
		args := map[string]interface{}{
			"database": "main",
		}

		_, err := client.executeMySQLFunction(context.Background(), funcDef, args)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "query parameter is required")
	})
}

func TestExecuteMCPFunction(t *testing.T) {
	// Create a test client
	client := &Client{}

	// Mock function definition for MCP
	funcDef := &db.FunctionDefinition{
		Name:       "test_mcp_github_ops",
		HttpMethod: sql.NullString{String: "MCP", Valid: true},
	}

	t.Run("CreateBranchOperation", func(t *testing.T) {
		args := map[string]interface{}{
			"operation":   "create_branch",
			"repo":        "testuser/testrepo",
			"branch_name": "feature/new-feature",
			"base_branch": "main",
		}

		result, err := client.executeMCPFunction(context.Background(), funcDef, args)

		require.NoError(t, err)
		assert.True(t, result["success"].(bool))
		assert.Equal(t, "create_branch", result["operation"])
		assert.Equal(t, "testuser/testrepo", result["repo"])
		assert.Equal(t, "feature/new-feature", result["branch_name"])
		assert.Contains(t, result, "branch_url")
		assert.Contains(t, result, "commit_sha")

		metadata := result["metadata"].(map[string]interface{})
		assert.Equal(t, "mock", metadata["source"])
		assert.Equal(t, "github-operations", metadata["mcp_server"])
	})

	t.Run("CommitFilesOperation", func(t *testing.T) {
		args := map[string]interface{}{
			"operation":      "commit_files",
			"repo":           "testuser/testrepo",
			"branch_name":    "feature/new-feature",
			"commit_message": "Add new feature implementation",
			"files": []interface{}{
				map[string]interface{}{
					"path":    "src/new_feature.go",
					"content": "package main\n\nfunc main() {}\n",
				},
			},
		}

		result, err := client.executeMCPFunction(context.Background(), funcDef, args)

		require.NoError(t, err)
		assert.True(t, result["success"].(bool))
		assert.Equal(t, "commit_files", result["operation"])
		assert.Equal(t, 1, result["files_committed"])
		assert.Contains(t, result, "commit_sha")
		assert.Contains(t, result, "commit_url")
	})

	t.Run("CreatePROperation", func(t *testing.T) {
		args := map[string]interface{}{
			"operation":      "create_pr",
			"repo":           "testuser/testrepo",
			"branch_name":    "feature/new-feature",
			"pr_title":       "Add new feature",
			"pr_description": "This PR adds an amazing new feature",
		}

		result, err := client.executeMCPFunction(context.Background(), funcDef, args)

		require.NoError(t, err)
		assert.True(t, result["success"].(bool))
		assert.Equal(t, "create_pr", result["operation"])
		assert.Equal(t, "Add new feature", result["pr_title"])
		assert.Equal(t, 42, result["pr_number"])
		assert.Contains(t, result, "pr_url")
		assert.Equal(t, "open", result["state"])
	})

	t.Run("InvalidRepositoryFormat", func(t *testing.T) {
		args := map[string]interface{}{
			"operation": "create_branch",
			"repo":      "invalid-repo-format", // Missing owner/repo format
		}

		_, err := client.executeMCPFunction(context.Background(), funcDef, args)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "repo must be in 'owner/repo' format")
	})

	t.Run("MissingOperation", func(t *testing.T) {
		args := map[string]interface{}{
			"repo": "testuser/testrepo",
		}

		_, err := client.executeMCPFunction(context.Background(), funcDef, args)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "operation parameter is required")
	})

	t.Run("UnsupportedOperation", func(t *testing.T) {
		args := map[string]interface{}{
			"operation": "invalid_operation",
			"repo":      "testuser/testrepo",
		}

		_, err := client.executeMCPFunction(context.Background(), funcDef, args)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "unsupported MCP operation")
	})

	t.Run("CreateBranchMissingBranchName", func(t *testing.T) {
		args := map[string]interface{}{
			"operation": "create_branch",
			"repo":      "testuser/testrepo",
			// Missing branch_name
		}

		_, err := client.executeMCPFunction(context.Background(), funcDef, args)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "branch_name is required")
	})

	t.Run("CommitFilesMissingMessage", func(t *testing.T) {
		args := map[string]interface{}{
			"operation":   "commit_files",
			"repo":        "testuser/testrepo",
			"branch_name": "feature/test",
			"files": []interface{}{
				map[string]interface{}{
					"path":    "test.txt",
					"content": "test content",
				},
			},
			// Missing commit_message
		}

		_, err := client.executeMCPFunction(context.Background(), funcDef, args)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "commit_message is required")
	})
}

func TestDynamicFunctionExecution(t *testing.T) {
	// Create a test client
	client := &Client{}

	t.Run("MySQLFunctionRouting", func(t *testing.T) {
		funcDef := &db.FunctionDefinition{
			Name:       "mysql_test_function",
			HttpMethod: sql.NullString{String: "MYSQL", Valid: true},
		}

		args := map[string]interface{}{
			"query": "SELECT * FROM test_table",
		}

		result, err := client.executeDynamicFunction(context.Background(), funcDef, args)

		require.NoError(t, err)
		assert.True(t, result["success"].(bool))
		assert.Contains(t, result, "data")
	})

	t.Run("MCPFunctionRouting", func(t *testing.T) {
		funcDef := &db.FunctionDefinition{
			Name:       "mcp_test_function",
			HttpMethod: sql.NullString{String: "MCP", Valid: true},
		}

		args := map[string]interface{}{
			"operation":   "create_branch",
			"repo":        "test/repo",
			"branch_name": "test-branch",
		}

		result, err := client.executeDynamicFunction(context.Background(), funcDef, args)

		require.NoError(t, err)
		assert.True(t, result["success"].(bool))
		assert.Equal(t, "create_branch", result["operation"])
	})

	t.Run("UnsupportedMethod", func(t *testing.T) {
		funcDef := &db.FunctionDefinition{
			Name:       "unsupported_function",
			HttpMethod: sql.NullString{String: "UNSUPPORTED", Valid: true},
		}

		args := map[string]interface{}{}

		_, err := client.executeDynamicFunction(context.Background(), funcDef, args)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "unsupported execution method: UNSUPPORTED")
	})
}

func TestPerformanceAndTiming(t *testing.T) {
	client := &Client{}

	t.Run("MySQLExecutionTiming", func(t *testing.T) {
		funcDef := &db.FunctionDefinition{
			Name:       "mysql_performance_test",
			HttpMethod: sql.NullString{String: "MYSQL", Valid: true},
		}

		args := map[string]interface{}{
			"query": "SELECT * FROM users",
		}

		start := time.Now()
		result, err := client.executeMySQLFunction(context.Background(), funcDef, args)
		elapsed := time.Since(start)

		require.NoError(t, err)
		assert.True(t, result["success"].(bool))

		// Verify timing is recorded in result
		executionTimeMs := result["execution_time_ms"].(int64)
		assert.GreaterOrEqual(t, executionTimeMs, int64(0))
		assert.LessOrEqual(t, executionTimeMs, elapsed.Milliseconds()+100) // Allow some margin
	})

	t.Run("MCPExecutionTiming", func(t *testing.T) {
		funcDef := &db.FunctionDefinition{
			Name:       "mcp_performance_test",
			HttpMethod: sql.NullString{String: "MCP", Valid: true},
		}

		args := map[string]interface{}{
			"operation":   "create_branch",
			"repo":        "test/repo",
			"branch_name": "perf-test",
		}

		start := time.Now()
		result, err := client.executeMCPFunction(context.Background(), funcDef, args)
		elapsed := time.Since(start)

		require.NoError(t, err)
		assert.True(t, result["success"].(bool))

		// Verify timing is recorded in result
		executionTimeMs := result["execution_time_ms"].(int64)
		assert.GreaterOrEqual(t, executionTimeMs, int64(0))
		assert.LessOrEqual(t, executionTimeMs, elapsed.Milliseconds()+100) // Allow some margin
	})
}
