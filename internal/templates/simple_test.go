package templates

import (
	"database/sql"
	"fmt"
	"os"
	"testing"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"gogent/internal/types"
)

// setupSimpleTestDB creates a simple test database connection without migrations
func setupSimpleTestDB(t *testing.T) *sql.DB {
	// Get database URL from environment (use TEST_DATABASE_URL to match other tests)
	testDatabaseURL := os.Getenv("TEST_DATABASE_URL")
	if testDatabaseURL == "" {
		// Default test database - you can override with TEST_DATABASE_URL env var
		testDatabaseURL = "root:@tcp(localhost:3306)/gogent_test?parseTime=true"
	}

	db, err := sql.Open("mysql", testDatabaseURL)
	if err != nil {
		t.Skipf("Skipping test: Could not connect to MySQL test database. Set TEST_DATABASE_URL or ensure MySQL is running. Error: %v", err)
		return nil
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		t.Skipf("Skipping test: Could not ping MySQL test database: %v", err)
		return nil
	}

	// Verify that execution template tables exist
	tables := []string{
		"execution_templates",
		"execution_template_parameters",
		"execution_template_auth_tokens",
		"execution_template_versions",
		"execution_template_executions",
		"users",
	}

	for _, table := range tables {
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", table).Scan(&count)
		if err != nil || count == 0 {
			t.Skipf("Skipping test: Required table %s does not exist in test database", table)
			return nil
		}
	}

	return db
}

// createSimpleTestUser creates a test user for template testing
func createSimpleTestUser(t *testing.T, db *sql.DB) string {
	userID := fmt.Sprintf("test-user-%d", time.Now().UnixNano())

	// Insert test user into users table
	_, err := db.Exec(`
		INSERT INTO users (id, username, email, password_hash, created_at, updated_at) 
		VALUES (?, ?, ?, ?, NOW(), NOW())
	`, userID, "testuser", "test@example.com", "hashedpassword")

	require.NoError(t, err)
	return userID
}

// Test Template Service Core Operations (Simplified)
func TestTemplateService_BasicOperations(t *testing.T) {
	db := setupSimpleTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	userID := createSimpleTestUser(t, db)
	templateService := NewTemplateService(db)

	// Test basic template creation
	template := &types.ExecutionTemplate{
		UserID:                  userID,
		Name:                    "Basic Test Template",
		Description:             "A basic test template",
		TemplatePrompt:          "Generate content for {{topic}} with style {{style}}",
		ContextTemplate:         "Context: {{context}}",
		EnableFunctionCalling:   false,
		IsActive:                true,
		Category:                "testing",
		ExecutionTimeoutSeconds: 300,
		RateLimitPerHour:        50,
		RateLimitPerDay:         500,
		RateLimitBurst:          5,
	}

	parameters := []types.ExecutionTemplateParameter{
		{
			ParameterName: "topic",
			ParameterType: "string",
			Description:   "The topic to write about",
			IsRequired:    true,
			ValidationRules: map[string]interface{}{
				"min_length": 3,
				"max_length": 100,
			},
			DisplayOrder: 1,
			UIComponent:  "text",
		},
		{
			ParameterName: "style",
			ParameterType: "string",
			Description:   "Writing style",
			DefaultValue:  "professional",
			IsRequired:    false,
			DisplayOrder:  2,
			UIComponent:   "select",
		},
	}

	// Create template
	createdTemplate, err := templateService.CreateTemplate(template, parameters, []string{})
	require.NoError(t, err)
	assert.NotEmpty(t, createdTemplate.ID)
	assert.Equal(t, template.Name, createdTemplate.Name)
	assert.Equal(t, template.UserID, createdTemplate.UserID)
	assert.Len(t, createdTemplate.Parameters, 2)

	// Test getting template by ID
	retrievedTemplate, err := templateService.GetTemplateByID(createdTemplate.ID, true, false)
	require.NoError(t, err)
	assert.Equal(t, createdTemplate.ID, retrievedTemplate.ID)
	assert.Equal(t, createdTemplate.Name, retrievedTemplate.Name)
	assert.Len(t, retrievedTemplate.Parameters, 2)

	// Test parameter validation
	validParams := map[string]interface{}{
		"topic": "AI Technology",
		"style": "casual",
	}

	errors, err := templateService.ValidateParameters(createdTemplate.ID, validParams)
	require.NoError(t, err)
	assert.Empty(t, errors, "Valid parameters should not produce errors")

	// Test parameter substitution
	resolvedPrompt, resolvedContext, err := templateService.SubstituteTemplateParameters(createdTemplate, validParams)
	require.NoError(t, err)
	assert.Equal(t, "Generate content for AI Technology with style casual", resolvedPrompt)
	assert.Equal(t, "Context: ", resolvedContext) // context param not provided, should be empty

	t.Logf("✅ Template created successfully: %s", createdTemplate.ID)
	t.Logf("✅ Parameter substitution test passed")
}

// Test Template Parameter Validation Edge Cases
func TestTemplateService_ParameterValidation(t *testing.T) {
	db := setupSimpleTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	userID := createSimpleTestUser(t, db)
	templateService := NewTemplateService(db)

	// Create template with strict validation
	template := &types.ExecutionTemplate{
		UserID:         userID,
		Name:           "Validation Test Template",
		TemplatePrompt: "Process {{input}} with {{settings}}",
		IsActive:       true,
	}

	parameters := []types.ExecutionTemplateParameter{
		{
			ParameterName: "input",
			ParameterType: "string",
			IsRequired:    true,
			ValidationRules: map[string]interface{}{
				"min_length": 5,
				"max_length": 50,
			},
			AllowSQLKeywords: false,
		},
		{
			ParameterName: "settings",
			ParameterType: "string",
			DefaultValue:  "default",
			IsRequired:    false,
		},
	}

	createdTemplate, err := templateService.CreateTemplate(template, parameters, []string{})
	require.NoError(t, err)

	// Test cases for validation
	testCases := []struct {
		name           string
		params         map[string]interface{}
		expectErrors   bool
		expectedErrors int
	}{
		{
			name: "valid parameters",
			params: map[string]interface{}{
				"input":    "valid input text",
				"settings": "custom",
			},
			expectErrors: false,
		},
		{
			name: "missing required parameter",
			params: map[string]interface{}{
				"settings": "custom",
			},
			expectErrors:   true,
			expectedErrors: 1,
		},
		{
			name: "input too short",
			params: map[string]interface{}{
				"input": "abc", // less than min_length of 5
			},
			expectErrors:   true,
			expectedErrors: 1,
		},
		{
			name: "SQL injection attempt",
			params: map[string]interface{}{
				"input": "SELECT * FROM users; DROP TABLE users; --",
			},
			expectErrors:   true,
			expectedErrors: 1,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			errors, err := templateService.ValidateParameters(createdTemplate.ID, tc.params)
			require.NoError(t, err)

			if tc.expectErrors {
				assert.Len(t, errors, tc.expectedErrors, "Expected %d validation errors", tc.expectedErrors)
			} else {
				assert.Empty(t, errors, "Expected no validation errors")
			}
		})
	}
}

// Test Auth Token Creation and Management
func TestTemplateService_AuthTokens(t *testing.T) {
	db := setupSimpleTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	userID := createSimpleTestUser(t, db)
	templateService := NewTemplateService(db)

	// Create template first
	template := &types.ExecutionTemplate{
		UserID:         userID,
		Name:           "Token Test Template",
		TemplatePrompt: "Test template for token management",
		IsActive:       true,
	}

	createdTemplate, err := templateService.CreateTemplate(template, nil, []string{})
	require.NoError(t, err)

	// Create auth token
	token := &types.ExecutionTemplateAuthToken{
		TemplateID:     createdTemplate.ID,
		UserID:         userID,
		TokenName:      "Test Token",
		Description:    "Token for testing",
		IsActive:       true,
		AllowedOrigins: map[string]interface{}{"origins": []interface{}{"https://example.com"}},
		AllowedIPs:     map[string]interface{}{"ips": []interface{}{"127.0.0.1"}},
	}

	createdToken, err := templateService.CreateAuthToken(token)
	require.NoError(t, err)
	assert.NotEmpty(t, createdToken.ID)
	assert.NotEmpty(t, createdToken.TokenValue)
	assert.Equal(t, token.TokenName, createdToken.TokenName)
	assert.Equal(t, token.TemplateID, createdToken.TemplateID)

	// Test getting token by value
	retrievedToken, err := templateService.GetAuthTokenByValue(createdToken.TokenValue)
	require.NoError(t, err)
	assert.Equal(t, createdToken.ID, retrievedToken.ID)
	assert.Equal(t, createdToken.TokenName, retrievedToken.TokenName)

	t.Logf("✅ Auth token created successfully: %s", createdToken.ID)
}

// Test Rate Limiting Functionality
func TestRateLimiter_Basic(t *testing.T) {
	db := setupSimpleTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	userID := createSimpleTestUser(t, db)
	templateService := NewTemplateService(db)
	rateLimiter := NewRateLimiter(db)

	// Create template with low limits for testing
	template := &types.ExecutionTemplate{
		UserID:           userID,
		Name:             "Rate Limit Test Template",
		TemplatePrompt:   "Rate limit test",
		IsActive:         true,
		RateLimitPerHour: 3, // Very low for testing
		RateLimitPerDay:  5,
		RateLimitBurst:   1, // Only 1 request in burst
	}

	createdTemplate, err := templateService.CreateTemplate(template, nil, []string{})
	require.NoError(t, err)

	// Create auth token
	token := &types.ExecutionTemplateAuthToken{
		TemplateID: createdTemplate.ID,
		UserID:     userID,
		TokenName:  "Rate Limit Test Token",
		IsActive:   true,
	}

	createdToken, err := templateService.CreateAuthToken(token)
	require.NoError(t, err)

	// Test rate limiting
	// First request should be allowed
	result1, err := rateLimiter.CheckRateLimit(createdTemplate.ID, createdToken)
	require.NoError(t, err)
	assert.True(t, result1.Allowed, "First request should be allowed")

	// Record the request
	err = rateLimiter.RecordRequest(createdTemplate.ID, createdToken)
	require.NoError(t, err)

	// Second request should be rate limited (burst=1)
	result2, err := rateLimiter.CheckRateLimit(createdTemplate.ID, createdToken)
	require.NoError(t, err)
	assert.False(t, result2.Allowed, "Second request should be rate limited")

	t.Logf("✅ Rate limiting working correctly")
}

// Test Database Schema Verification
func TestExecutionTemplates_SchemaVerification(t *testing.T) {
	db := setupSimpleTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	// Verify all required tables exist
	expectedTables := []string{
		"execution_templates",
		"execution_template_parameters",
		"execution_template_auth_tokens",
		"execution_template_versions",
		"execution_template_parameter_versions",
		"execution_template_rate_limits",
		"execution_template_executions",
	}

	for _, tableName := range expectedTables {
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", tableName).Scan(&count)
		require.NoError(t, err)
		assert.Equal(t, 1, count, "Table %s should exist", tableName)
	}

	// Verify system example template exists
	var sysTemplateCount int
	err := db.QueryRow("SELECT COUNT(*) FROM execution_templates WHERE id = 'system-example-template'").Scan(&sysTemplateCount)
	require.NoError(t, err)
	assert.Equal(t, 1, sysTemplateCount, "System example template should exist")

	// Verify it has parameters
	var paramCount int
	err = db.QueryRow("SELECT COUNT(*) FROM execution_template_parameters WHERE template_id = 'system-example-template'").Scan(&paramCount)
	require.NoError(t, err)
	assert.Equal(t, 2, paramCount, "System example template should have 2 parameters")

	t.Logf("✅ Database schema verification passed")
}
