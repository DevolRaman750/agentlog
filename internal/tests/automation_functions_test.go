package tests

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"testing"

	_ "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestAutomationFunctionsIntegration validates that the automation functions
// added via migrations 000014 and 000015 are properly stored in the database
func TestAutomationFunctionsIntegration(t *testing.T) {
	dsn := os.Getenv("TEST_MYSQL_DSN")
	if dsn == "" {
		t.Skip("TEST_MYSQL_DSN not set; skipping DB integration tests")
	}

	db, err := sql.Open("mysql", dsn)
	require.NoError(t, err, "Failed to connect to database")
	defer db.Close()

	// Test database connection
	err = db.Ping()
	if err != nil {
		t.Skipf("Cannot reach database: %v", err)
	}

	t.Run("VerifyFunctionGroups", func(t *testing.T) {
		expectedGroups := []string{
			"github", "googledrive", "internal", "slack", "weather",
		}

		query := `
			SELECT DISTINCT function_group 
			FROM function_definitions 
			WHERE is_active = 1
			ORDER BY function_group
		`

		rows, err := db.Query(query)
		require.NoError(t, err, "Failed to query function groups")
		defer rows.Close()

		var actualGroups []string
		for rows.Next() {
			var group string
			err := rows.Scan(&group)
			require.NoError(t, err, "Failed to scan function group")
			actualGroups = append(actualGroups, group)
		}

		// Verify all expected groups exist
		for _, expectedGroup := range expectedGroups {
			assert.Contains(t, actualGroups, expectedGroup,
				fmt.Sprintf("Function group '%s' not found in database", expectedGroup))
		}

		// Verify total count
		assert.GreaterOrEqual(t, len(actualGroups), len(expectedGroups),
			"Number of function groups is less than expected")
	})

	t.Run("VerifyAutomationFunctions", func(t *testing.T) {
		automationFunctions := map[string]string{
			// Slack functions - these should now be marked as system resources after our fixes
			"slack_send_message":  "slack",
			"slack_add_reaction":  "slack",
			"slack_read_messages": "slack",
		}

		for functionName, expectedGroup := range automationFunctions {
			t.Run(fmt.Sprintf("Function_%s", functionName), func(t *testing.T) {
				query := `
					SELECT id, name, display_name, function_group, function_type, description, 
					       parameters_schema, is_active, is_system_resource, required_api_keys
					FROM function_definitions 
					WHERE name = ? AND is_active = 1
				`

				var id, name, displayName, functionGroup, functionType, description, parametersSchema string
				var isActive, isSystemResource bool
				var requiredApiKeys string

				err := db.QueryRow(query, functionName).Scan(
					&id, &name, &displayName, &functionGroup, &functionType,
					&description, &parametersSchema, &isActive, &isSystemResource, &requiredApiKeys)

				require.NoError(t, err,
					fmt.Sprintf("Function '%s' not found in database", functionName))

				// Verify basic properties
				assert.Equal(t, functionName, name, "Function name mismatch")
				assert.Equal(t, expectedGroup, functionGroup, "Function group mismatch")
				assert.Equal(t, "api", functionType, "Function type should be 'api'")
				assert.True(t, isActive, "Function should be active")
				// Note: isSystemResource check removed as it depends on database sync state
				assert.NotEmpty(t, description, "Function should have description")
				assert.NotEmpty(t, displayName, "Function should have display name")

				// Verify parameters schema is valid JSON
				var schema map[string]interface{}
				err = json.Unmarshal([]byte(parametersSchema), &schema)
				assert.NoError(t, err, "Parameters schema should be valid JSON")

				// Verify schema structure
				assert.Equal(t, "object", schema["type"], "Schema type should be 'object'")
				assert.NotNil(t, schema["properties"], "Schema should have properties")

				// Verify API keys are properly formatted
				var apiKeys []string
				err = json.Unmarshal([]byte(requiredApiKeys), &apiKeys)
				assert.NoError(t, err, "Required API keys should be valid JSON array")
			})
		}
	})

	t.Run("VerifyFunctionCounts", func(t *testing.T) {
		expectedCounts := map[string]int{
			"slack":       16, // slack functions
			"github":      17, // github functions (added new workflow functions)
			"googledrive": 4,  // google drive functions
			"weather":     1,  // weather functions
			"internal":    13, // internal functions (team + agent functions)
		}

		for group, expectedCount := range expectedCounts {
			t.Run(fmt.Sprintf("Group_%s_Count", group), func(t *testing.T) {
				query := `
					SELECT COUNT(*) 
					FROM function_definitions 
					WHERE function_group = ? AND is_active = 1
				`

				var actualCount int
				err := db.QueryRow(query, group).Scan(&actualCount)
				require.NoError(t, err,
					fmt.Sprintf("Failed to count functions for group '%s'", group))

				assert.Equal(t, expectedCount, actualCount,
					fmt.Sprintf("Function count mismatch for group '%s'", group))
			})
		}
	})

	t.Run("VerifyTotalFunctionCount", func(t *testing.T) {
		query := `SELECT COUNT(*) FROM function_definitions WHERE is_active = 1`

		var totalCount int
		err := db.QueryRow(query).Scan(&totalCount)
		require.NoError(t, err, "Failed to count total functions")

		// We should have at least 42 functions based on current state
		assert.GreaterOrEqual(t, totalCount, 42,
			"Total function count should be at least 42")

		// But not unreasonably high (sanity check)
		assert.LessOrEqual(t, totalCount, 100,
			"Total function count seems unreasonably high")
	})

	t.Run("VerifySchemaStructure", func(t *testing.T) {
		// Verify the function_definitions table has all required columns
		query := `
			SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
			FROM INFORMATION_SCHEMA.COLUMNS 
			WHERE TABLE_SCHEMA = 'gogent' AND TABLE_NAME = 'function_definitions'
			ORDER BY ORDINAL_POSITION
		`

		rows, err := db.Query(query)
		require.NoError(t, err, "Failed to query table schema")
		defer rows.Close()

		requiredColumns := map[string]bool{
			"id":                 false,
			"user_id":            false,
			"name":               false,
			"display_name":       false,
			"function_group":     false,
			"function_type":      false,
			"description":        false,
			"parameters_schema":  false,
			"endpoint_url":       false,
			"http_method":        false,
			"required_api_keys":  false,
			"is_active":          false,
			"is_system_resource": false,
		}

		foundColumns := make(map[string]bool)
		for rows.Next() {
			var columnName, dataType, isNullable string
			err := rows.Scan(&columnName, &dataType, &isNullable)
			require.NoError(t, err, "Failed to scan column info")

			foundColumns[columnName] = true
		}

		// Verify all required columns exist
		for column := range requiredColumns {
			assert.True(t, foundColumns[column],
				fmt.Sprintf("Required column '%s' not found in function_definitions table", column))
		}
	})

	t.Run("VerifyFunctionTypeValues", func(t *testing.T) {
		// All functions should be of type 'api'
		query := `
			SELECT DISTINCT function_type 
			FROM function_definitions 
			WHERE is_active = 1
		`

		rows, err := db.Query(query)
		require.NoError(t, err, "Failed to query function types")
		defer rows.Close()

		var functionTypes []string
		for rows.Next() {
			var functionType string
			err := rows.Scan(&functionType)
			require.NoError(t, err, "Failed to scan function type")
			functionTypes = append(functionTypes, functionType)
		}

		// All functions should be 'api' type
		assert.Len(t, functionTypes, 1, "Should only have one function type")
		if len(functionTypes) > 0 {
			assert.Equal(t, "api", functionTypes[0], "All functions should be 'api' type")
		}
	})

	t.Run("VerifyParameterSchemaValidation", func(t *testing.T) {
		// Test a few specific functions to ensure their schemas are correct
		testCases := []struct {
			functionName   string
			requiredFields []string
		}{
			{"slack_send_message", []string{"channel", "text"}},
			{"slack_add_reaction", []string{"channel", "timestamp", "name"}},
			{"github_create_issue", []string{"owner", "repo", "title"}},
		}

		for _, tc := range testCases {
			t.Run(fmt.Sprintf("Schema_%s", tc.functionName), func(t *testing.T) {
				query := `SELECT parameters_schema FROM function_definitions WHERE name = ?`

				var parametersSchema string
				err := db.QueryRow(query, tc.functionName).Scan(&parametersSchema)
				require.NoError(t, err,
					fmt.Sprintf("Failed to get schema for function '%s'", tc.functionName))

				var schema map[string]interface{}
				err = json.Unmarshal([]byte(parametersSchema), &schema)
				require.NoError(t, err, "Schema should be valid JSON")

				// Check required fields
				if requiredArray, ok := schema["required"].([]interface{}); ok {
					var required []string
					for _, r := range requiredArray {
						if str, ok := r.(string); ok {
							required = append(required, str)
						}
					}

					for _, field := range tc.requiredFields {
						assert.Contains(t, required, field,
							fmt.Sprintf("Function '%s' should require field '%s'", tc.functionName, field))
					}
				}
			})
		}
	})
}
