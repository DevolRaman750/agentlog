package gogent

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"gogent/internal/agents"
	"gogent/internal/apiauth"
	"gogent/internal/apikeys"
	"gogent/internal/code_analysis"
	"gogent/internal/db"
	"gogent/internal/gemini"
	"gogent/internal/github"
	"gogent/internal/gogent/integrations"
	"gogent/internal/gogent/integrations/base"
	githubIntegration "gogent/internal/gogent/integrations/github"
	slackIntegration "gogent/internal/gogent/integrations/slack"
	"gogent/internal/providers"
	"gogent/internal/teams"
	"gogent/internal/types"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/google/uuid"
)

// Client represents the main gogent client that wraps Gemini API calls
type Client struct {
	db              *sql.DB
	queries         *db.Queries
	config          *types.GeminiClientConfig
	sessionApiKeys  *types.SessionApiKeys // DEPRECATED: Will be removed - use database keys
	databaseApiKeys *types.SessionApiKeys // API keys loaded from database
	currentUserID   string                // Current user ID for loading API keys
	geminiClient    *gemini.GeminiClient
	providerFactory *providers.ProviderFactory // Provider factory for multi-model support
	mutex           sync.RWMutex
	// Add execution context for logging
	currentExecutionRunID *string
	currentConfigID       *string
	currentRequestID      *string

	// Sequence number counter for flow events
	sequenceCounter int

	// Function call deduplication - prevents duplicate calls within same execution
	functionCallHistory map[string]*FunctionCallHistory // executionRunID -> history
	functionCallMutex   sync.RWMutex

	// Refactored components
	codeAnalyzer      *code_analysis.Analyzer
	directoryAnalyzer *github.DirectoryAnalyzer

	// Integration framework
	httpClient   *base.HTTPClient
	integrations *integrations.Registry
}

// FunctionCallHistory tracks function calls within an execution session to prevent duplicates
type FunctionCallHistory struct {
	Calls   map[string][]map[string]interface{} // functionName -> []args
	Results map[string]map[string]interface{}   // functionName+argsHash -> result
	mutex   sync.RWMutex
}

// NewFunctionCallHistory creates a new function call history tracker
func NewFunctionCallHistory() *FunctionCallHistory {
	return &FunctionCallHistory{
		Calls:   make(map[string][]map[string]interface{}),
		Results: make(map[string]map[string]interface{}),
	}
}

// normalizeArgs creates a stable JSON representation of function arguments for caching
func (c *Client) normalizeArgs(args map[string]interface{}) string {
	if args == nil {
		return "{}"
	}

	// Create a sorted representation for consistent cache keys
	normalized := make(map[string]interface{})
	for k, v := range args {
		normalized[k] = v
	}

	jsonBytes, err := json.Marshal(normalized)
	if err != nil {
		// Fallback to string representation if JSON fails
		return fmt.Sprintf("%+v", args)
	}
	return string(jsonBytes)
}

// makeCacheKey creates a cache key from function name and normalized arguments
func (c *Client) makeCacheKey(functionName string, args map[string]interface{}) string {
	return functionName + "::" + c.normalizeArgs(args)
}

// getOrCreateHistory gets or creates function call history for an execution run
func (c *Client) getOrCreateHistory(runID string) *FunctionCallHistory {
	c.functionCallMutex.Lock()
	defer c.functionCallMutex.Unlock()

	if history, exists := c.functionCallHistory[runID]; exists {
		return history
	}

	history := NewFunctionCallHistory()
	c.functionCallHistory[runID] = history
	return history
}

// cacheGet retrieves a cached function result
func (c *Client) cacheGet(runID, key string) (map[string]interface{}, bool) {
	history := c.getOrCreateHistory(runID)
	history.mutex.RLock()
	defer history.mutex.RUnlock()

	result, exists := history.Results[key]
	if !exists {
		return nil, false
	}

	// Deep copy the result to avoid mutation
	return c.deepCopyMap(result), true
}

// cachePut stores a function result in the cache
func (c *Client) cachePut(runID, key string, result map[string]interface{}) {
	history := c.getOrCreateHistory(runID)
	history.mutex.Lock()
	defer history.mutex.Unlock()

	// Deep copy the result to avoid mutation
	history.Results[key] = c.deepCopyMap(result)
}

// deepCopyMap creates a deep copy of a map[string]interface{}
func (c *Client) deepCopyMap(original map[string]interface{}) map[string]interface{} {
	if original == nil {
		return nil
	}

	copy := make(map[string]interface{})
	for k, v := range original {
		switch val := v.(type) {
		case map[string]interface{}:
			copy[k] = c.deepCopyMap(val)
		case []interface{}:
			copy[k] = c.deepCopySlice(val)
		default:
			copy[k] = val
		}
	}
	return copy
}

// deepCopySlice creates a deep copy of a []interface{}
func (c *Client) deepCopySlice(original []interface{}) []interface{} {
	if original == nil {
		return nil
	}

	copy := make([]interface{}, len(original))
	for i, v := range original {
		switch val := v.(type) {
		case map[string]interface{}:
			copy[i] = c.deepCopyMap(val)
		case []interface{}:
			copy[i] = c.deepCopySlice(val)
		default:
			copy[i] = val
		}
	}
	return copy
}

// ResponsePart represents a part of the Gemini API response
type ResponsePart struct {
	Text         string `json:"text,omitempty"`
	FunctionCall struct {
		Name string                 `json:"name"`
		Args map[string]interface{} `json:"args"`
	} `json:"functionCall,omitempty"`
}

// ensureMultiStatements ensures the database URL includes multiStatements=true for proper migration support
func ensureMultiStatements(dbURL string) string {
	if !strings.Contains(dbURL, "multiStatements=true") {
		if strings.Contains(dbURL, "?") {
			dbURL += "&multiStatements=true"
		} else {
			dbURL += "?multiStatements=true"
		}
	}
	return dbURL
}

// NewClient creates a new gogent client with database connection
func NewClient(dbURL string, config *types.GeminiClientConfig, sessionApiKeys *types.SessionApiKeys) (*Client, error) {
	// Ensure dbURL includes multiStatements=true for migrations
	dbURL = ensureMultiStatements(dbURL)

	database, err := sql.Open("mysql", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := database.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	queries := db.New(database)

	// Create temporary client to run migrations
	tempClient := &Client{
		db:      database,
		queries: queries,
		config:  config,
		mutex:   sync.RWMutex{},
	}

	// Run migrations using golang-migrate
	if err := tempClient.RunMigrations(); err != nil {
		log.Printf("⚠️ Warning: failed to run migrations: %v", err)
		// Continue without migrations rather than failing completely
	}

	client := &Client{
		db:                  database,
		queries:             queries,
		config:              config,
		sessionApiKeys:      sessionApiKeys,
		providerFactory:     providers.NewProviderFactory(),
		mutex:               sync.RWMutex{},
		functionCallHistory: make(map[string]*FunctionCallHistory),
		functionCallMutex:   sync.RWMutex{},
	}

	// Initialize refactored components
	client.codeAnalyzer = code_analysis.NewAnalyzer(code_analysis.DefaultConfig())
	client.directoryAnalyzer = github.NewDirectoryAnalyzer(code_analysis.DefaultConfig())

	// Initialize integration framework
	client.httpClient = base.NewHTTPClient(base.HTTPClientConfig{
		TimeoutSeconds: 30,
		UserAgent:      "GoGent/1.0",
	})
	client.integrations = integrations.NewRegistry()

	// Register all integrations during client initialization
	if err := client.registerIntegrations(); err != nil {
		log.Printf("⚠️ Warning: failed to register integrations: %v", err)
		// Continue without integrations rather than failing completely
	}

	// Force REST API usage - no Go SDK client
	client.geminiClient = nil
	log.Printf("Go SDK disabled - using REST API for all Gemini calls")

	return client, nil
}

// Close closes the database connection and Gemini client
func (c *Client) Close() error {
	if c.geminiClient != nil {
		c.geminiClient.Close()
	}
	return c.db.Close()
}

// registerIntegrations registers all available integrations
func (c *Client) registerIntegrations() error {
	// Get effective API keys for legacy support
	apiKeys := c.getEffectiveApiKeys()

	// Create auth service if we have a current user
	var authService *apiauth.Service
	if c.currentUserID != "" {
		apiKeyService, err := apikeys.NewService(c.db)
		if err != nil {
			log.Printf("⚠️ Failed to create API key service for integrations: %v", err)
		} else {
			authService = apiauth.NewService(apiKeyService)
		}
	}

	// Register GitHub integration with new auth system
	var githubInt base.APIIntegration
	if authService != nil && c.currentUserID != "" {
		githubInt = githubIntegration.NewIntegrationWithAuth(authService, c.currentUserID)
		log.Printf("🔑 Registered GitHub integration with new auth system for user %s", c.currentUserID)
	} else {
		githubInt = githubIntegration.NewIntegration(apiKeys)
		log.Printf("🔑 Registered GitHub integration with legacy auth system")
	}
	if err := c.integrations.Register(githubInt); err != nil {
		return fmt.Errorf("failed to register GitHub integration: %w", err)
	}

	// Register Slack integration with new auth system
	var slackInt base.APIIntegration
	if authService != nil && c.currentUserID != "" {
		slackInt = slackIntegration.NewIntegrationWithAuth(authService, c.currentUserID)
		log.Printf("🔑 Registered Slack integration with new auth system for user %s", c.currentUserID)
	} else {
		slackInt = slackIntegration.NewIntegration(apiKeys)
		log.Printf("🔑 Registered Slack integration with legacy auth system")
	}
	if err := c.integrations.Register(slackInt); err != nil {
		return fmt.Errorf("failed to register Slack integration: %w", err)
	}

	log.Printf("✅ Registered integrations: %v", c.integrations.List())
	return nil
}

// LoadDatabaseApiKeys loads API keys from the database for the current user
func (c *Client) LoadDatabaseApiKeys(ctx context.Context, userID string) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	c.currentUserID = userID

	// Create API key service
	apiKeyService, err := apikeys.NewService(c.db)
	if err != nil {
		log.Printf("⚠️ Failed to create API key service: %v", err)
		return fmt.Errorf("failed to create API key service: %w", err)
	}

	// Get all API keys for the user
	userApiKeys, err := apiKeyService.GetAPIKeys(ctx, userID)
	if err != nil {
		log.Printf("⚠️ Failed to load API keys for user %s: %v", userID, err)
		// Don't fail completely - continue with empty keys
		c.databaseApiKeys = &types.SessionApiKeys{}
		return nil
	}

	log.Printf("🔑 Loaded %d API keys from database for user %s", len(userApiKeys), userID)

	// Convert database API keys to session format
	sessionKeys := &types.SessionApiKeys{}

	for _, apiKey := range userApiKeys {
		if !apiKey.IsActive || apiKey.ValidationStatus == "invalid" {
			continue
		}

		// Get decrypted key value
		decryptedKey, err := apiKeyService.GetDecryptedAPIKey(ctx, userID, apiKey.ID)
		if err != nil {
			log.Printf("⚠️ Failed to decrypt API key %s: %v", apiKey.KeyName, err)
			continue
		}

		// Map service names to session key fields
		switch apiKey.ServiceName {
		case "gemini":
			sessionKeys.GeminiApiKey = decryptedKey
			log.Printf("🔑 Loaded Gemini API key from database - Length: %d, Prefix: %s",
				len(decryptedKey),
				func() string {
					if len(decryptedKey) >= 10 {
						return decryptedKey[:10] + "..."
					} else if len(decryptedKey) > 0 {
						return decryptedKey + "..."
					}
					return "EMPTY"
				}())
		case "openweather":
			sessionKeys.OpenWeatherApiKey = decryptedKey
			log.Printf("🔑 Loaded OpenWeather API key from database")
		case "github":
			sessionKeys.GithubApiKey = decryptedKey
			log.Printf("🔑 Loaded GitHub API key from database")
		case "openrouter":
			sessionKeys.OpenRouterApiKey = decryptedKey
			log.Printf("🔑 Loaded OpenRouter API key from database")
		case "slack":
			sessionKeys.SlackBotToken = decryptedKey
			log.Printf("🔑 Loaded Slack Bot Token from database - Length: %d, Prefix: %s",
				len(decryptedKey),
				func() string {
					if len(decryptedKey) >= 10 {
						return decryptedKey[:10] + "..."
					} else if len(decryptedKey) > 0 {
						return decryptedKey + "..."
					}
					return "EMPTY"
				}())
			log.Printf("🔍 DEBUG: Slack token stored in sessionKeys.SlackBotToken: %t", sessionKeys.SlackBotToken != "")
		case "googledrive":
			sessionKeys.GoogleDriveApiKey = decryptedKey
			log.Printf("🔑 Loaded Google Drive API key from database - Length: %d, Prefix: %s",
				len(decryptedKey),
				func() string {
					if len(decryptedKey) >= 10 {
						return decryptedKey[:10] + "..."
					} else if len(decryptedKey) > 0 {
						return decryptedKey + "..."
					}
					return "EMPTY"
				}())
		case "neo4j":
			// For Neo4j, we need to handle the connection details differently
			// This is a simplified version - you might want to parse the connection string
			sessionKeys.Neo4jUrl = decryptedKey
			log.Printf("🔑 Loaded Neo4j connection from database")
		}
	}

	c.databaseApiKeys = sessionKeys
	log.Printf("🔑 Database API keys loaded: Gemini=%v, OpenWeather=%v, GitHub=%v, OpenRouter=%v, Slack=%v, GoogleDrive=%v",
		sessionKeys.GeminiApiKey != "",
		sessionKeys.OpenWeatherApiKey != "",
		sessionKeys.GithubApiKey != "",
		sessionKeys.OpenRouterApiKey != "",
		sessionKeys.SlackBotToken != "",
		sessionKeys.GoogleDriveApiKey != "")

	// Re-register integrations with the new user context and auth system
	if err := c.registerIntegrations(); err != nil {
		log.Printf("⚠️ Failed to register integrations after loading API keys: %v", err)
		// Don't fail completely - continue with existing integrations
	}

	return nil
}

// getEffectiveApiKeys returns the database API keys
func (c *Client) getEffectiveApiKeys() *types.SessionApiKeys {
	// Use database keys only - session keys are no longer supported
	if c.databaseApiKeys != nil {
		return c.databaseApiKeys
	}

	// Return empty keys if none available
	return &types.SessionApiKeys{}
}

// GetDB returns the database connection
func (c *Client) GetDB() *sql.DB {
	return c.db
}

// setExecutionContext sets the current execution context for logging
func (c *Client) setExecutionContext(executionRunID, configID, requestID *string) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.currentExecutionRunID = executionRunID
	c.currentConfigID = configID
	c.currentRequestID = requestID
}

// clearExecutionContext clears the current execution context
func (c *Client) clearExecutionContext() {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.currentExecutionRunID = nil
	c.currentConfigID = nil
	c.currentRequestID = nil
}

// getNextSequenceNumber returns the next sequence number for flow events
func (c *Client) getNextSequenceNumber() int {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.sequenceCounter++
	return c.sequenceCounter
}

// getCurrentRequestID returns the current request ID
func (c *Client) getCurrentRequestID() string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	if c.currentRequestID != nil {
		return *c.currentRequestID
	}
	return ""
}

// getUserIDFromExecutionRun gets the user ID from an execution run
func (c *Client) getUserIDFromExecutionRun(ctx context.Context, executionRunID string) (string, error) {
	executionRun, err := c.queries.GetExecutionRun(ctx, db.GetExecutionRunParams{
		ID:     executionRunID,
		UserID: c.currentUserID,
	})
	if err != nil {
		return "", fmt.Errorf("failed to get execution run: %w", err)
	}
	return executionRun.UserID, nil
}

// RunMigrations runs database migrations using golang-migrate
func (c *Client) RunMigrations() error {
	log.Printf("🔧 Running database migrations...")

	// Import the mysql driver for golang-migrate
	driver, err := mysql.WithInstance(c.db, &mysql.Config{})
	if err != nil {
		return fmt.Errorf("could not create mysql driver for migrations: %w", err)
	}

	// Create migrate instance pointing to the migrations directory
	m, err := migrate.NewWithDatabaseInstance(
		"file://migrations",
		"mysql",
		driver,
	)
	if err != nil {
		return fmt.Errorf("could not create migrate instance: %w", err)
	}

	// Run migrations
	if err := m.Up(); err != nil {
		if err == migrate.ErrNoChange {
			log.Printf("✅ Database schema is up to date - no migrations needed")
			return nil
		}
		return fmt.Errorf("could not run migrations: %w", err)
	}

	log.Printf("✅ Database migrations completed successfully")
	return nil
}

// executeMySQLFunction executes a MySQL function with security validation
func (c *Client) executeMySQLFunction(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
	// Validate required parameters
	query, ok := args["query"].(string)
	if !ok || query == "" {
		return nil, fmt.Errorf("query parameter is required")
	}

	// Security validation - only allow SELECT queries
	if !strings.HasPrefix(strings.ToUpper(strings.TrimSpace(query)), "SELECT") {
		return nil, fmt.Errorf("security violation: only SELECT queries are allowed")
	}

	// Check for dangerous SQL patterns
	dangerousPatterns := []string{
		";", "UNION", "INTO OUTFILE", "LOAD_FILE", "DROP", "DELETE", "UPDATE", "INSERT",
	}
	for _, pattern := range dangerousPatterns {
		if strings.Contains(strings.ToUpper(query), pattern) {
			return nil, fmt.Errorf("security violation: dangerous SQL pattern detected")
		}
	}

	// Validate database parameter
	if dbName, ok := args["database"].(string); ok && dbName != "" {
		allowedDBs := []string{"main", "test"}
		found := false
		for _, allowed := range allowedDBs {
			if dbName == allowed {
				found = true
				break
			}
		}
		if !found {
			return nil, fmt.Errorf("database '%s' is not in the allowed list", dbName)
		}
	}

	// Validate limit parameter
	if limit, ok := args["limit"].(int); ok {
		if limit < 1 || limit > 1000 {
			return nil, fmt.Errorf("limit must be between 1 and 1000")
		}
	}

	// Return mock response for valid queries
	result := map[string]interface{}{
		"success":       true,
		"rows_returned": 3,
		"data":          []map[string]interface{}{},
		"metadata": map[string]interface{}{
			"database":       "main",
			"query_type":     "SELECT",
			"security_level": "high",
		},
		"execution_time_ms": int64(50),
	}

	return result, nil
}

// executeMCPFunction executes an MCP function
func (c *Client) executeMCPFunction(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
	// Validate required parameters
	operation, ok := args["operation"].(string)
	if !ok || operation == "" {
		return nil, fmt.Errorf("operation parameter is required")
	}

	repo, ok := args["repo"].(string)
	if !ok || repo == "" {
		return nil, fmt.Errorf("repo parameter is required")
	}

	// Validate repo format
	if !strings.Contains(repo, "/") {
		return nil, fmt.Errorf("repo must be in 'owner/repo' format")
	}

	// Validate operation type
	validOperations := []string{"create_branch", "commit_files", "create_pr"}
	validOp := false
	for _, valid := range validOperations {
		if operation == valid {
			validOp = true
			break
		}
	}
	if !validOp {
		return nil, fmt.Errorf("unsupported MCP operation: %s", operation)
	}

	// Operation-specific validation
	switch operation {
	case "create_branch":
		if _, ok := args["branch_name"]; !ok {
			return nil, fmt.Errorf("branch_name is required")
		}
	case "commit_files":
		if _, ok := args["commit_message"]; !ok {
			return nil, fmt.Errorf("commit_message is required")
		}
	}

	// Return mock response based on operation
	result := map[string]interface{}{
		"success":           true,
		"operation":         operation,
		"repo":              repo,
		"execution_time_ms": int64(100),
		"metadata": map[string]interface{}{
			"source":     "mock",
			"mcp_server": "github-operations",
		},
	}

	// Add operation-specific fields
	switch operation {
	case "create_branch":
		result["branch_name"] = args["branch_name"]
		result["branch_url"] = fmt.Sprintf("https://github.com/%s/tree/%s", repo, args["branch_name"])
		result["commit_sha"] = "abc123def456"
	case "commit_files":
		result["files_committed"] = 1
		result["commit_sha"] = "def456ghi789"
		result["commit_url"] = fmt.Sprintf("https://github.com/%s/commit/def456ghi789", repo)
	case "create_pr":
		result["pr_title"] = "Add new feature"
		result["pr_number"] = 42
		result["pr_url"] = fmt.Sprintf("https://github.com/%s/pull/42", repo)
		result["state"] = "open"
	}

	return result, nil
}

// executeDynamicFunction routes to the appropriate execution method based on function definition
func (c *Client) executeDynamicFunction(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
	// Debug logging for function routing
	log.Printf("🔍 [ROUTING_DEBUG] Function: %s, FunctionGroup: %s, HttpMethod: %s", funcDef.Name, funcDef.FunctionGroup, funcDef.HttpMethod.String)

	// Handle internal functions differently
	if funcDef.FunctionGroup == "internal" {
		log.Printf("🔍 [ROUTING_DEBUG] Routing %s to executeInternalFunction", funcDef.Name)
		return c.executeInternalFunction(ctx, funcDef, args)
	}

	// Route functions with registered integrations through the integration system
	// This ensures proper authentication and user context for all integration functions
	if c.integrations != nil && c.integrations.HasIntegration(funcDef.FunctionGroup) {
		log.Printf("🔍 [ROUTING_DEBUG] Routing %s to executeIntegrationFunction (function_group: %s)", funcDef.Name, funcDef.FunctionGroup)
		return c.executeIntegrationFunction(ctx, funcDef, args)
	}

	log.Printf("🔍 [ROUTING_DEBUG] No integration found for function_group: %s, falling back to HTTP method routing", funcDef.FunctionGroup)
	switch funcDef.HttpMethod.String {
	case "MYSQL":
		log.Printf("🔍 [ROUTING_DEBUG] Routing %s to executeMySQLFunction", funcDef.Name)
		return c.executeMySQLFunction(ctx, funcDef, args)
	case "MCP":
		log.Printf("🔍 [ROUTING_DEBUG] Routing %s to executeMCPFunction", funcDef.Name)
		return c.executeMCPFunction(ctx, funcDef, args)
	case "GET", "POST", "PUT", "PATCH", "DELETE":
		log.Printf("🔍 [ROUTING_DEBUG] Routing %s to executeAPIFunction (HTTP method: %s)", funcDef.Name, funcDef.HttpMethod.String)
		return c.executeAPIFunction(ctx, funcDef, args)
	default:
		return nil, fmt.Errorf("unsupported execution method: %s", funcDef.HttpMethod.String)
	}
}

// executeInternalFunction handles internal function calls (like agent memory functions)
func (c *Client) executeInternalFunction(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
	functionName := funcDef.Name
	log.Printf("🔧 Executing internal function: %s", functionName)
	log.Printf("🔍 DEBUG: Function args: %+v", args)
	log.Printf("🔍 DEBUG: Current execution run ID: %v", c.currentExecutionRunID)
	log.Printf("🔍 DEBUG: Current user ID: %s", c.currentUserID)

	// Extract agent ID from args or current execution context
	agentID, ok := args["agent_id"].(string)
	if !ok {
		log.Printf("🔍 DEBUG: agent_id not found in args, checking execution context...")
		// Try to get agent ID from current execution run
		if c.currentExecutionRunID != nil && c.currentUserID != "" {
			log.Printf("🔍 DEBUG: Querying execution run %s for agent_id", *c.currentExecutionRunID)
			// Query execution run's agent ID directly from database
			query := "SELECT agent_id FROM execution_runs WHERE id = ?"
			var agentIDNullString sql.NullString
			if queryErr := c.db.QueryRowContext(ctx, query, *c.currentExecutionRunID).Scan(&agentIDNullString); queryErr == nil && agentIDNullString.Valid {
				agentID = agentIDNullString.String
				log.Printf("🔧 Using agent ID from execution context: %s", agentID)
			} else {
				log.Printf("🔍 DEBUG: Failed to get agent_id from execution run: %v", queryErr)
				if !agentIDNullString.Valid {
					log.Printf("🔍 DEBUG: agent_id is NULL in execution run")
				}
			}
		} else {
			log.Printf("🔍 DEBUG: Missing execution context - executionRunID: %v, userID: %s", c.currentExecutionRunID, c.currentUserID)
		}

		if agentID == "" {
			// No agent ID available - this is a regular execution, not an agent execution
			// Return mock success responses instead of failing
			log.Printf("🔍 No agent ID found for %s - providing mock response for non-agent execution", functionName)
			return c.createMockMemoryResponse(functionName, args), nil
		}
	} else {
		log.Printf("🔧 Using agent ID from function args: %s", agentID)
	}

	// Extract user ID from current client context
	userID := c.currentUserID
	if userID == "" {
		return nil, fmt.Errorf("user context is required for internal function %s", functionName)
	}

	// Create handlers
	agentsHandler := agents.NewAgentsHandler(c.db)
	teamsHandler := teams.NewTeamsHandler(c.db)

	// Check if this is a team memory function
	if strings.HasPrefix(functionName, "team_memory_") {
		// Extract team ID from args
		teamID, ok := args["team_id"].(string)
		if !ok {
			return nil, fmt.Errorf("team_id is required for team memory functions")
		}

		// Convert args to TeamMemoryRequest
		request := &types.TeamMemoryRequest{
			TeamID:  teamID,
			AgentID: agentID,
		}

		// Map function arguments to request fields
		if context, ok := args["context"].(string); ok {
			request.Context = context
		}
		if path, ok := args["path"].(string); ok {
			request.Path = path
		}
		if searchQuery, ok := args["search_query"].(string); ok {
			request.SearchQuery = searchQuery
		}
		if query, ok := args["query"].(string); ok {
			request.SearchQuery = query
		}
		if limit, ok := args["limit"].(float64); ok {
			request.Limit = int(limit)
		}
		if data, ok := args["data"].(map[string]interface{}); ok {
			request.Data = data
		}
		if mergeStrategy, ok := args["merge_strategy"].(string); ok {
			request.MergeStrategy = mergeStrategy
		}
		if action, ok := args["action"].(string); ok {
			request.Context = action // For clear operations, action is passed via context field
		}

		// Route to appropriate team memory function
		var response *types.TeamMemoryResponse
		var err error

		switch functionName {
		case "team_memory_read":
			response, err = teamsHandler.ReadTeamMemory(ctx, teamID, agentID, userID, request)
		case "team_memory_write":
			response, err = teamsHandler.WriteTeamMemory(ctx, teamID, agentID, userID, request)
		case "team_memory_search":
			response, err = teamsHandler.SearchTeamMemory(ctx, teamID, agentID, userID, request)
		case "team_memory_clear":
			response, err = teamsHandler.ClearTeamMemory(ctx, teamID, agentID, userID, request)
		default:
			return nil, fmt.Errorf("unsupported team memory function: %s", functionName)
		}

		if err != nil {
			return nil, fmt.Errorf("team memory function %s failed: %w", functionName, err)
		}

		// Convert response to map[string]interface{}
		result := map[string]interface{}{
			"success": response.Success,
		}

		if response.Error != "" {
			result["error"] = response.Error
		}
		if response.Data != nil {
			result["data"] = response.Data
		}
		if response.Results != nil {
			result["results"] = response.Results
		}
		if response.Metadata != (types.MemoryMetadata{}) {
			result["metadata"] = response.Metadata
		}

		log.Printf("✅ Team memory function %s completed successfully", functionName)
		return result, nil
	}

	// Convert args to AgentMemoryRequest for agent memory functions
	request := &types.AgentMemoryRequest{
		AgentID: agentID,
	}

	// Map function arguments to request fields
	if context, ok := args["context"].(string); ok {
		request.Context = context
	}
	if path, ok := args["path"].(string); ok {
		request.Path = path
	}
	if searchQuery, ok := args["search_query"].(string); ok {
		request.SearchQuery = searchQuery
	}
	if query, ok := args["query"].(string); ok {
		request.SearchQuery = query
	}
	if limit, ok := args["limit"].(float64); ok {
		request.Limit = int(limit)
	}
	if data, ok := args["data"].(map[string]interface{}); ok {
		request.Data = data
	}
	if mergeStrategy, ok := args["merge_strategy"].(string); ok {
		request.MergeStrategy = mergeStrategy
	}
	if action, ok := args["action"].(string); ok {
		request.Context = action // For clear operations, action is passed via context field
	}

	// Route to appropriate memory function
	var response *types.AgentMemoryResponse
	var err error

	switch functionName {
	case "agent_memory_read":
		response, err = agentsHandler.ReadMemory(ctx, agentID, userID, request)
	case "agent_memory_write":
		response, err = agentsHandler.WriteMemory(ctx, agentID, userID, request)
	case "agent_memory_search":
		response, err = agentsHandler.SearchMemory(ctx, agentID, userID, request)
	case "agent_memory_clear":
		response, err = agentsHandler.ClearMemory(ctx, agentID, userID, request)
	default:
		return nil, fmt.Errorf("unsupported internal function: %s", functionName)
	}

	if err != nil {
		return nil, fmt.Errorf("internal function %s failed: %w", functionName, err)
	}

	// Convert response to map[string]interface{}
	result := map[string]interface{}{
		"success": response.Success,
	}

	if response.Error != "" {
		result["error"] = response.Error
	}
	if response.Data != nil {
		result["data"] = response.Data
	}
	if response.Results != nil {
		result["results"] = response.Results
	}
	if response.Metadata != (types.MemoryMetadata{}) {
		result["metadata"] = response.Metadata
	}

	log.Printf("✅ Internal function %s completed successfully", functionName)
	return result, nil
}

// createMockMemoryResponse creates mock responses for memory functions when no agent context is available
func (c *Client) createMockMemoryResponse(functionName string, args map[string]interface{}) map[string]interface{} {
	switch functionName {
	case "agent_memory_write":
		return map[string]interface{}{
			"success": true,
			"data":    map[string]interface{}{"written": args["data"]},
			"metadata": map[string]interface{}{
				"createdAt":   time.Now(),
				"updatedAt":   time.Now(),
				"sizeBytes":   0,
				"accessCount": 1,
				"version":     "1.0",
			},
			"message": "Memory function called in non-agent execution - no data stored",
		}
	case "agent_memory_read":
		return map[string]interface{}{
			"success": true,
			"data":    map[string]interface{}{},
			"metadata": map[string]interface{}{
				"createdAt":   time.Now(),
				"updatedAt":   time.Now(),
				"sizeBytes":   0,
				"accessCount": 1,
				"version":     "1.0",
			},
			"message": "Memory function called in non-agent execution - no data available",
		}
	case "agent_memory_search":
		return map[string]interface{}{
			"success": true,
			"results": []interface{}{},
			"metadata": map[string]interface{}{
				"createdAt":   time.Now(),
				"updatedAt":   time.Now(),
				"sizeBytes":   0,
				"accessCount": 1,
				"version":     "1.0",
			},
			"message": "Memory function called in non-agent execution - no data to search",
		}
	case "agent_memory_clear":
		return map[string]interface{}{
			"success": true,
			"data":    map[string]interface{}{"message": "Memory cleared successfully"},
			"metadata": map[string]interface{}{
				"createdAt":   time.Now(),
				"updatedAt":   time.Now(),
				"sizeBytes":   0,
				"accessCount": 1,
				"version":     "1.0",
			},
			"message": "Memory function called in non-agent execution - no data to clear",
		}
	case "team_memory_write":
		return map[string]interface{}{
			"success": true,
			"data":    map[string]interface{}{"written": args["data"]},
			"metadata": map[string]interface{}{
				"createdAt":   time.Now(),
				"updatedAt":   time.Now(),
				"sizeBytes":   0,
				"accessCount": 1,
				"version":     "1.0",
			},
			"message": "Team memory function called in non-agent execution - no data stored",
		}
	case "team_memory_read":
		return map[string]interface{}{
			"success": true,
			"data":    map[string]interface{}{},
			"metadata": map[string]interface{}{
				"createdAt":   time.Now(),
				"updatedAt":   time.Now(),
				"sizeBytes":   0,
				"accessCount": 1,
				"version":     "1.0",
			},
			"message": "Team memory function called in non-agent execution - no data available",
		}
	case "team_memory_search":
		return map[string]interface{}{
			"success": true,
			"results": []interface{}{},
			"metadata": map[string]interface{}{
				"createdAt":   time.Now(),
				"updatedAt":   time.Now(),
				"sizeBytes":   0,
				"accessCount": 1,
				"version":     "1.0",
			},
			"message": "Team memory function called in non-agent execution - no data to search",
		}
	case "team_memory_clear":
		return map[string]interface{}{
			"success": true,
			"data":    map[string]interface{}{"message": "Memory cleared successfully"},
			"metadata": map[string]interface{}{
				"createdAt":   time.Now(),
				"updatedAt":   time.Now(),
				"sizeBytes":   0,
				"accessCount": 1,
				"version":     "1.0",
			},
			"message": "Team memory function called in non-agent execution - no data to clear",
		}
	default:
		return map[string]interface{}{
			"success": true,
			"message": "Memory function called in non-agent execution - operation mocked",
		}
	}
}

// executeIntegrationFunction executes functions through the registered integration system
func (c *Client) executeIntegrationFunction(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
	functionName := funcDef.Name
	startTime := time.Now()

	// Enhanced logging for integration function execution
	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryIntegration,
		fmt.Sprintf("🔧 Executing function through integration system: %s", functionName),
		map[string]interface{}{
			"functionName":     functionName,
			"functionGroup":    funcDef.FunctionGroup,
			"arguments":        args,
			"argumentCount":    len(args),
			"endpointUrl":      funcDef.EndpointUrl.String,
			"httpMethod":       funcDef.HttpMethod.String,
			"integrationStart": time.Now().Format("15:04:05.000"),
		})

	log.Printf("🔧 Executing function through integration system: %s", functionName)

	// Handle special composite workflow functions
	if functionName == "github_branch_update_pr_workflow" {
		return c.executeGitHubBranchUpdatePRWorkflow(ctx, funcDef, args)
	}

	// Get the integration for this function group
	integration, err := c.integrations.Get(funcDef.FunctionGroup)
	if err != nil {
		return nil, fmt.Errorf("integration not found for function group %s: %w", funcDef.FunctionGroup, err)
	}

	// For Slack functions, create a new integration with current user context if available
	if funcDef.FunctionGroup == "slack" && c.currentUserID != "" {
		log.Printf("🔑 [SLACK_DEBUG] Creating Slack integration with current user context: %s", c.currentUserID)

		// Create auth service for current user
		apiKeyService, err := apikeys.NewService(c.db)
		if err != nil {
			log.Printf("❌ [SLACK_DEBUG] Failed to create API key service: %v", err)
		} else {
			authService := apiauth.NewService(apiKeyService)
			// Create new Slack integration with auth service and current user
			slackInt := slackIntegration.NewIntegrationWithAuth(authService, c.currentUserID)
			integration = slackInt
			log.Printf("✅ [SLACK_DEBUG] Created Slack integration with user context: %s", c.currentUserID)
		}
	}

	// For GitHub functions, create a new integration with current user context if available
	if funcDef.FunctionGroup == "github" && c.currentUserID != "" {
		log.Printf("🔑 [GITHUB_DEBUG] Creating GitHub integration with current user context: %s", c.currentUserID)

		// Create auth service for current user
		apiKeyService, err := apikeys.NewService(c.db)
		if err != nil {
			log.Printf("❌ [GITHUB_DEBUG] Failed to create API key service: %v", err)
		} else {
			authService := apiauth.NewService(apiKeyService)
			// Create new GitHub integration with auth service and current user
			githubInt := githubIntegration.NewIntegrationWithAuth(authService, c.currentUserID)
			integration = githubInt
			log.Printf("✅ [GITHUB_DEBUG] Created GitHub integration with user context: %s", c.currentUserID)
		}
	}

	// Validate the function with the integration
	if err := integration.ValidateFunction(funcDef); err != nil {
		return nil, fmt.Errorf("function validation failed: %w", err)
	}

	// Create HTTP client for the integration
	httpClient := c.getHTTPClientForIntegration()

	// Execute the request through the integration
	result, err := httpClient.ExecuteRequest(ctx, integration, funcDef, args)
	executionTimeMs := time.Since(startTime).Milliseconds()

	if err != nil {
		// Enhanced error logging for integration failures
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryIntegration,
			fmt.Sprintf("❌ Integration function failed: %s - %v", functionName, err),
			map[string]interface{}{
				"functionName":     functionName,
				"functionGroup":    funcDef.FunctionGroup,
				"integrationError": err.Error(),
				"duration":         executionTimeMs,
				"integrationEnd":   time.Now().Format("15:04:05.000"),
			})
		return nil, fmt.Errorf("integration execution failed: %w", err)
	}

	// Enhanced success logging for integration execution
	resultSummary := c.createIntegrationResultSummary(functionName, result)
	c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryIntegration,
		fmt.Sprintf("✅ Integration function executed successfully: %s - %s", functionName, resultSummary),
		map[string]interface{}{
			"functionName":   functionName,
			"functionGroup":  funcDef.FunctionGroup,
			"duration":       executionTimeMs,
			"resultSummary":  resultSummary,
			"resultKeys":     c.getMapKeysFromResult(result),
			"integrationEnd": time.Now().Format("15:04:05.000"),
			"resultPreview":  c.truncateString(fmt.Sprintf("%v", result), 300),
		})

	log.Printf("✅ Integration function executed successfully: %s", functionName)
	return result, nil
}

// createIntegrationResultSummary creates a summary of integration execution results
func (c *Client) createIntegrationResultSummary(functionName string, result map[string]interface{}) string {
	if result == nil {
		return "No data returned"
	}

	// Check for integration response structure
	if status, ok := result["status"].(string); ok {
		if status == "success" {
			if data, ok := result["data"]; ok {
				switch functionName {
				case "github_read_issues", "github_read_commits", "github_read_code", "github_search_code":
					return fmt.Sprintf("GitHub API success - data type: %T", data)
				case "slack_find_channel", "slack_read_messages", "slack_send_message":
					return fmt.Sprintf("Slack API success - data type: %T", data)
				default:
					return fmt.Sprintf("API success - data type: %T", data)
				}
			}
			return "API success"
		} else {
			return fmt.Sprintf("API status: %s", status)
		}
	}

	return fmt.Sprintf("Result with %d fields", len(result))
}

// getMapKeysFromResult gets keys from a result map, handling nested structures
func (c *Client) getMapKeysFromResult(result map[string]interface{}) []string {
	if result == nil {
		return []string{}
	}

	keys := make([]string, 0, len(result))
	for k := range result {
		keys = append(keys, k)
	}
	return keys
}

// executeGitHubBranchUpdatePRWorkflow executes the complete GitHub branch-update-PR workflow
func (c *Client) executeGitHubBranchUpdatePRWorkflow(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
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
		return nil, fmt.Errorf("missing required parameters for github_branch_update_pr_workflow")
	}

	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryIntegration,
		fmt.Sprintf("🔧 Starting GitHub branch-update-PR workflow: %s -> %s", branchName, filePath),
		map[string]interface{}{
			"owner":         owner,
			"repo":          repo,
			"branchName":    branchName,
			"filePath":      filePath,
			"baseBranch":    baseBranch,
			"prTitle":       prTitle,
			"workflowStart": time.Now().Format("15:04:05.000"),
		})

	// Get GitHub integration
	integration, err := c.integrations.Get("github")
	if err != nil {
		return nil, fmt.Errorf("GitHub integration not found: %w", err)
	}

	githubInt, ok := integration.(*githubIntegration.Integration)
	if !ok {
		return nil, fmt.Errorf("invalid GitHub integration type")
	}

	// Set up auth context for the integration
	if c.currentUserID != "" {
		apiKeyService, err := apikeys.NewService(c.db)
		if err == nil {
			authService := apiauth.NewService(apiKeyService)
			githubInt = githubIntegration.NewIntegrationWithAuth(authService, c.currentUserID)
		}
	}

	// Execute the complete workflow
	result, err := c.executeCompleteGitHubWorkflow(ctx, githubInt, owner, repo, branchName, filePath, fileContent, commitMessage, prTitle, prBody, baseBranch, draft)
	if err != nil {
		c.logExecutionEvent(types.LogLevelError, types.LogCategoryIntegration,
			fmt.Sprintf("❌ GitHub workflow failed: %v", err),
			map[string]interface{}{
				"error":       err.Error(),
				"owner":       owner,
				"repo":        repo,
				"branchName":  branchName,
				"workflowEnd": time.Now().Format("15:04:05.000"),
			})
		return nil, err
	}

	c.logExecutionEvent(types.LogLevelSuccess, types.LogCategoryIntegration,
		"✅ GitHub branch-update-PR workflow completed successfully",
		map[string]interface{}{
			"owner":       owner,
			"repo":        repo,
			"branchName":  branchName,
			"prNumber":    result["number"],
			"prUrl":       result["html_url"],
			"workflowEnd": time.Now().Format("15:04:05.000"),
		})

	return map[string]interface{}{
		"status":   "success",
		"workflow": "branch_update_pr",
		"data":     result,
	}, nil
}

// executeCompleteGitHubWorkflow executes all steps of the GitHub workflow
func (c *Client) executeCompleteGitHubWorkflow(ctx context.Context, githubInt *githubIntegration.Integration, owner, repo, branchName, filePath, fileContent, commitMessage, prTitle, prBody, baseBranch string, draft bool) (map[string]interface{}, error) {
	// Step 1: Get base branch SHA
	baseSHA, err := githubInt.GetBranchSHA(ctx, owner, repo, baseBranch)
	if err != nil {
		return nil, fmt.Errorf("failed to get base branch %s SHA: %w", baseBranch, err)
	}
	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryIntegration,
		fmt.Sprintf("✅ Got base branch %s SHA: %s", baseBranch, baseSHA), nil)

	// Step 2: Create new branch
	err = githubInt.CreateBranch(ctx, owner, repo, branchName, baseSHA)
	if err != nil {
		return nil, fmt.Errorf("failed to create branch %s: %w", branchName, err)
	}
	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryIntegration,
		fmt.Sprintf("✅ Created branch: %s", branchName), nil)

	// Step 3: Update file on new branch
	err = githubInt.UpdateFileOnBranch(ctx, owner, repo, filePath, fileContent, commitMessage, branchName)
	if err != nil {
		return nil, fmt.Errorf("failed to update file %s on branch %s: %w", filePath, branchName, err)
	}
	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryIntegration,
		fmt.Sprintf("✅ Updated file %s on branch %s", filePath, branchName), nil)

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

	prResult, err := githubInt.CreatePullRequest(ctx, owner, repo, prData)
	if err != nil {
		return nil, fmt.Errorf("failed to create pull request: %w", err)
	}
	c.logExecutionEvent(types.LogLevelInfo, types.LogCategoryIntegration,
		fmt.Sprintf("✅ Created pull request #%.0f", prResult["number"]), nil)

	return prResult, nil
}

// getHTTPClientForIntegration creates an HTTP client for integration use
func (c *Client) getHTTPClientForIntegration() *base.HTTPClient {
	config := base.HTTPClientConfig{
		TimeoutSeconds: 30,
		MaxRetries:     3,
		UserAgent:      "GoGent/1.0",
	}
	return base.NewHTTPClient(config)
}

// executeAPIFunction executes any API function with real HTTP calls using the function definition's endpoint URL
func (c *Client) executeAPIFunction(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
	startTime := time.Now()
	functionName := funcDef.Name

	// Build API URL based on function group
	var url string
	var err error

	if funcDef.FunctionGroup == "github" {
		// Use specialized GitHub URL builder for GitHub functions
		url, err = c.buildGitHubAPIURL(functionName, args)
		if err != nil {
			return nil, fmt.Errorf("failed to build GitHub API URL: %w", err)
		}
	} else if funcDef.FunctionGroup == "googledrive" {
		// Use specialized Google Drive URL builder for Google Drive functions
		url, err = c.buildGoogleDriveAPIURL(functionName, args)
		if err != nil {
			return nil, fmt.Errorf("failed to build Google Drive API URL: %w", err)
		}
	} else {
		// Use generic URL building for non-GitHub functions
		url, err = c.buildGenericAPIURL(funcDef, args)
		if err != nil {
			return nil, fmt.Errorf("failed to build API URL: %w", err)
		}
	}

	// Determine HTTP method from function definition
	httpMethod := "GET" // Default
	if funcDef.HttpMethod.Valid {
		httpMethod = funcDef.HttpMethod.String
	}

	log.Printf("🌐 Making API call: %s %s (function: %s)", httpMethod, url, functionName)

	// Prepare request body for non-GET requests
	var requestBody io.Reader
	if httpMethod != "GET" && len(args) > 0 {
		var bodyData map[string]interface{}

		if funcDef.FunctionGroup == "github" {
			// For GitHub functions, exclude URL parameters from body
			bodyData = make(map[string]interface{})
			for key, value := range args {
				if key != "owner" && key != "repo" && key != "issue_number" && key != "pull_number" {
					// Only include non-nil values to avoid GitHub API 422 errors
					if value != nil {
						bodyData[key] = value
					}
				}
			}
		} else {
			// For non-GitHub functions, include all parameters in body
			bodyData = make(map[string]interface{})
			for key, value := range args {
				if value != nil {
					bodyData[key] = value
				}
			}
		}

		if len(bodyData) > 0 {
			jsonData, err := json.Marshal(bodyData)
			if err == nil {
				requestBody = strings.NewReader(string(jsonData))
				log.Printf("🔧 Request body: %s", string(jsonData))
			}
		}
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, httpMethod, url, requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add authentication based on function type and available headers
	effectiveKeys := c.getEffectiveApiKeys()
	log.Printf("🔍 DEBUG: Effective keys for %s - Slack: %s, GitHub: %s, Gemini: %s, GoogleDrive: %s",
		functionName,
		func() string {
			if effectiveKeys.SlackBotToken != "" {
				return "PRESENT"
			}
			return "MISSING"
		}(),
		func() string {
			if effectiveKeys.GithubApiKey != "" {
				return "PRESENT"
			}
			return "MISSING"
		}(),
		func() string {
			if effectiveKeys.GeminiApiKey != "" {
				return "PRESENT"
			}
			return "MISSING"
		}(),
		func() string {
			if effectiveKeys.GoogleDriveApiKey != "" {
				return "PRESENT"
			}
			return "MISSING"
		}())

	// Apply function-specific headers from database first
	log.Printf("🔍 DEBUG: Function %s - Headers field exists: %t", functionName, funcDef.Headers != nil)
	if funcDef.Headers != nil {
		log.Printf("🔍 DEBUG: Function %s - Headers raw JSON: %s", functionName, string(funcDef.Headers))
		var headers map[string]interface{}
		if err := json.Unmarshal(funcDef.Headers, &headers); err == nil {
			log.Printf("🔍 DEBUG: Function %s - Parsed headers: %+v", functionName, headers)
			for key, value := range headers {
				headerValue := fmt.Sprintf("%v", value)
				originalValue := headerValue
				// Replace API key placeholders with actual keys
				if strings.Contains(headerValue, "{SLACK_BOT_TOKEN}") && effectiveKeys.SlackBotToken != "" {
					headerValue = strings.ReplaceAll(headerValue, "{SLACK_BOT_TOKEN}", effectiveKeys.SlackBotToken)
					log.Printf("🔍 DEBUG: Replaced Slack token in header %s: '%s' -> '%s'", key, originalValue,
						func() string {
							// Mask the token for logging
							if len(headerValue) > 20 {
								return headerValue[:20] + "...***"
							}
							return headerValue
						}())
				}
				if strings.Contains(headerValue, "{GITHUB_API_KEY}") && effectiveKeys.GithubApiKey != "" {
					headerValue = strings.ReplaceAll(headerValue, "{GITHUB_API_KEY}", effectiveKeys.GithubApiKey)
				}
				if strings.Contains(headerValue, "{GOOGLE_DRIVE_API_KEY}") && effectiveKeys.GoogleDriveApiKey != "" {
					headerValue = strings.ReplaceAll(headerValue, "{GOOGLE_DRIVE_API_KEY}", effectiveKeys.GoogleDriveApiKey)
				}
				log.Printf("🔍 DEBUG: Setting header %s = %s", key,
					func() string {
						// Mask Authorization headers for security
						if key == "Authorization" && len(headerValue) > 20 {
							return headerValue[:20] + "...***"
						}
						return headerValue
					}())
				req.Header.Set(key, headerValue)
			}
		} else {
			log.Printf("🔍 DEBUG: Function %s - Failed to unmarshal headers JSON: %v", functionName, err)
		}
	} else {
		log.Printf("🔍 DEBUG: Function %s - No headers field in function definition", functionName)
	}

	// Add function-group-specific authentication if not already set via headers
	if funcDef.FunctionGroup == "github" {
		if req.Header.Get("Authorization") == "" && effectiveKeys.GithubApiKey != "" {
			req.Header.Set("Authorization", "token "+effectiveKeys.GithubApiKey)
			log.Printf("🔑 Added GitHub API authentication")
		} else if effectiveKeys.GithubApiKey == "" {
			log.Printf("⚠️ No GitHub API key available - proceeding without authentication")
		}
		// Set GitHub-specific headers if not already set
		if req.Header.Get("User-Agent") == "" {
			req.Header.Set("User-Agent", "gogent/1.0")
		}
		if req.Header.Get("Accept") == "" {
			req.Header.Set("Accept", "application/vnd.github.v3+json")
		}
	} else if funcDef.FunctionGroup == "googledrive" {
		if req.Header.Get("Authorization") == "" && effectiveKeys.GoogleDriveApiKey != "" {
			req.Header.Set("Authorization", "Bearer "+effectiveKeys.GoogleDriveApiKey)
			log.Printf("🔑 Added Google Drive API authentication")
		} else if effectiveKeys.GoogleDriveApiKey == "" {
			log.Printf("⚠️ No Google Drive API key available - proceeding without authentication")
		}
		// Set Google Drive-specific headers if not already set
		if req.Header.Get("User-Agent") == "" {
			req.Header.Set("User-Agent", "gogent/1.0")
		}
		if req.Header.Get("Accept") == "" {
			req.Header.Set("Accept", "application/json")
		}
	} else if funcDef.FunctionGroup == "communication" && strings.HasPrefix(functionName, "slack_") {
		// Slack authentication should be handled via headers from database for all Slack functions
		if req.Header.Get("Authorization") != "" {
			log.Printf("🔑 Added Slack API authentication via function headers for %s", functionName)
		} else {
			log.Printf("⚠️ No Slack API authentication found in function headers for %s", functionName)
		}
	}

	// Set Content-Type for non-GET requests
	if httpMethod != "GET" && requestBody != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	// Make HTTP request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("API request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	executionTimeMs := time.Since(startTime).Milliseconds()
	apiType := func() string {
		if funcDef.FunctionGroup == "github" {
			return "GitHub"
		} else if funcDef.FunctionGroup == "communication" {
			return "Slack"
		} else if funcDef.FunctionGroup == "googledrive" {
			return "Google Drive"
		}
		return "API"
	}()

	log.Printf("🌐 %s API response: %d status, %d bytes, %dms", apiType, resp.StatusCode, len(body), executionTimeMs)

	// DEBUG: Log Slack API response content to understand the loop issue
	if funcDef.FunctionGroup == "communication" && strings.HasPrefix(functionName, "slack_") {
		if len(body) > 500 {
			log.Printf("🔍 DEBUG Slack %s response preview: %.500s...", functionName, string(body))
		} else {
			log.Printf("🔍 DEBUG Slack %s response content: %s", functionName, string(body))
		}
		log.Printf("🔍 DEBUG Slack %s response length: %d bytes", functionName, len(body))
		log.Printf("🔍 DEBUG Slack %s request URL: %s", functionName, url)
	}

	// Check for API errors
	if resp.StatusCode >= 400 {
		apiName := "API"
		if funcDef.FunctionGroup == "github" {
			apiName = "GitHub API"
		} else if funcDef.FunctionGroup == "communication" {
			apiName = "Slack API"
		} else if funcDef.FunctionGroup == "googledrive" {
			apiName = "Google Drive API"
		}
		return nil, fmt.Errorf("%s returned %d: %s", apiName, resp.StatusCode, string(body))
	}

	// Parse JSON response
	var responseData interface{}
	if err := json.Unmarshal(body, &responseData); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	// Handle API-specific error patterns (APIs that return 200 but indicate errors in response body)
	if funcDef.FunctionGroup == "communication" && strings.HasPrefix(functionName, "slack_") {
		if responseMap, ok := responseData.(map[string]interface{}); ok {
			if okField, exists := responseMap["ok"]; exists {
				if ok, isBool := okField.(bool); isBool && !ok {
					// This is a Slack API error
					errorMsg := "unknown error"
					if errorField, hasError := responseMap["error"]; hasError {
						errorMsg = fmt.Sprintf("%v", errorField)
					}
					return nil, fmt.Errorf("slack API error: %s", errorMsg)
				}
			}
		}
	}

	// Build result using api_source from function definition (after migration 029)
	apiSource := "api" // Default fallback
	if funcDef.FunctionGroup == "github" {
		apiSource = "github_api" // TODO: Remove after migration 029 is applied
	} else if funcDef.FunctionGroup == "communication" {
		apiSource = "slack_api" // TODO: Remove after migration 029 is applied
	} else if funcDef.FunctionGroup == "weather" {
		apiSource = "weather_api" // TODO: Remove after migration 029 is applied
	} else if funcDef.FunctionGroup == "googledrive" {
		apiSource = "googledrive_api" // TODO: Remove after migration 029 is applied
	}

	result := map[string]interface{}{
		"success":           true,
		"function":          functionName,
		"execution_time_ms": executionTimeMs,
		"response":          responseData,
		"metadata": map[string]interface{}{
			"source":         apiSource,
			"api_method":     httpMethod,
			"endpoint":       url,
			"status_code":    resp.StatusCode,
			"response_size":  len(body),
			"function_group": funcDef.FunctionGroup,
		},
	}

	// Add function-specific data processing for GitHub functions
	if funcDef.FunctionGroup == "github" {
		switch functionName {
		case "github_read_issues":
			if issues, ok := responseData.([]interface{}); ok {
				result["issues"] = issues
				result["total_count"] = len(issues)
				log.Printf("✅ Retrieved %d issues from GitHub", len(issues))
			}
		case "github_read_code":
			// Handle both single file (map) and directory listing (array) responses
			if codeData, ok := responseData.(map[string]interface{}); ok {
				// Single file response
				result["type"] = codeData["type"]
				result["name"] = codeData["name"]
				result["path"] = codeData["path"]
				result["size"] = codeData["size"]
				if content, exists := codeData["content"]; exists {
					result["content"] = content
					result["encoding"] = codeData["encoding"]
				}
				log.Printf("✅ Retrieved single file: %s", codeData["name"])
			} else if directoryItems, ok := responseData.([]interface{}); ok {
				// Directory listing response
				result["type"] = "dir"
				result["items"] = directoryItems
				result["total_count"] = len(directoryItems)
				log.Printf("✅ Retrieved directory with %d items", len(directoryItems))
			} else {
				log.Printf("⚠️ Unexpected github_read_code response type: %T", responseData)
			}
		case "github_search_code":
			if searchData, ok := responseData.(map[string]interface{}); ok {
				result["items"] = searchData["items"]
				result["total_count"] = searchData["total_count"]
				if items, exists := searchData["items"].([]interface{}); exists {
					log.Printf("✅ Found %d code search results", len(items))
				}
			}
		case "github_read_commits":
			if commits, ok := responseData.([]interface{}); ok {
				result["commits"] = commits
				result["total_count"] = len(commits)
				log.Printf("✅ Retrieved %d commits from GitHub", len(commits))

				// Extract key info from the latest commit for easy access
				if len(commits) > 0 {
					if latestCommit, ok := commits[0].(map[string]interface{}); ok {
						result["latest_commit_sha"] = latestCommit["sha"]
						if commitData, ok := latestCommit["commit"].(map[string]interface{}); ok {
							result["latest_commit_message"] = commitData["message"]
							if author, ok := commitData["author"].(map[string]interface{}); ok {
								result["latest_commit_author"] = author["name"]
								result["latest_commit_date"] = author["date"]
							}
						}
					}
				}
			} else {
				log.Printf("⚠️ Unexpected github_read_commits response type: %T", responseData)
			}
		}
	}

	// Add function-specific data processing for Google Drive functions
	if funcDef.FunctionGroup == "googledrive" {
		switch functionName {
		case "googledrive_list_files":
			if filesData, ok := responseData.(map[string]interface{}); ok {
				if files, exists := filesData["files"].([]interface{}); exists {
					result["files"] = files
					result["total_count"] = len(files)
					log.Printf("✅ Retrieved %d files from Google Drive", len(files))
				}
				if nextPageToken, exists := filesData["nextPageToken"]; exists {
					result["next_page_token"] = nextPageToken
				}
			}
		case "googledrive_get_file":
			if fileData, ok := responseData.(map[string]interface{}); ok {
				result["file"] = fileData
				result["file_id"] = fileData["id"]
				result["file_name"] = fileData["name"]
				result["mime_type"] = fileData["mimeType"]
				if size, exists := fileData["size"]; exists {
					result["file_size"] = size
				}
				log.Printf("✅ Retrieved file metadata: %s", fileData["name"])
			}
		case "googledrive_get_file_content":
			// For file content, the response might be text or binary
			if content, ok := responseData.(string); ok {
				result["content"] = content
				result["content_length"] = len(content)
				log.Printf("✅ Retrieved file content: %d characters", len(content))
			} else {
				// Handle binary content or other formats
				result["content"] = responseData
				log.Printf("✅ Retrieved file content (non-text format)")
			}
		case "googledrive_search_files":
			if searchData, ok := responseData.(map[string]interface{}); ok {
				if files, exists := searchData["files"].([]interface{}); exists {
					result["files"] = files
					result["total_count"] = len(files)
					log.Printf("✅ Found %d files in Google Drive search", len(files))
				}
				if nextPageToken, exists := searchData["nextPageToken"]; exists {
					result["next_page_token"] = nextPageToken
				}
			}
		}
	}

	return result, nil
}

// buildGitHubAPIURL constructs the appropriate GitHub API URL for the function
func (c *Client) buildGitHubAPIURL(functionName string, args map[string]interface{}) (string, error) {
	owner := args["owner"].(string)
	repo := args["repo"].(string)
	baseURL := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo)

	switch functionName {
	case "github_read_issues":
		url := baseURL + "/issues"
		params := []string{}

		if state, ok := args["state"].(string); ok && state != "" {
			params = append(params, fmt.Sprintf("state=%s", state))
		} else {
			params = append(params, "state=open") // Default to open issues
		}

		if labels, ok := args["labels"].(string); ok && labels != "" {
			params = append(params, fmt.Sprintf("labels=%s", labels))
		}

		if limit, ok := args["limit"]; ok {
			if limitInt, ok := limit.(float64); ok {
				params = append(params, fmt.Sprintf("per_page=%.0f", limitInt))
			} else if limitInt, ok := limit.(int); ok {
				params = append(params, fmt.Sprintf("per_page=%d", limitInt))
			}
		} else {
			params = append(params, "per_page=30") // Default limit
		}

		if len(params) > 0 {
			url += "?" + strings.Join(params, "&")
		}
		return url, nil

	case "github_read_code":
		path, ok := args["path"].(string)
		if !ok || path == "" {
			path = "" // Root directory
		}
		// URL encode the path to handle special characters and spaces
		encodedPath := url.QueryEscape(path)
		return baseURL + "/contents/" + encodedPath, nil

	case "github_search_code":
		query, ok := args["query"].(string)
		if !ok || query == "" {
			return "", fmt.Errorf("query parameter is required for github_search_code")
		}
		// GitHub search API has different endpoint structure
		searchURL := fmt.Sprintf("https://api.github.com/search/code?q=%s+repo:%s/%s", query, owner, repo)
		return searchURL, nil

	case "github_update_issue":
		issueNumber, ok := args["issue_number"]
		if !ok {
			return "", fmt.Errorf("issue_number parameter is required for github_update_issue")
		}
		// Convert to string if it's a number
		issueStr := fmt.Sprintf("%v", issueNumber)
		return baseURL + "/issues/" + issueStr, nil

	case "github_add_comment":
		issueNumber, ok := args["issue_number"]
		if !ok {
			return "", fmt.Errorf("issue_number parameter is required for github_add_comment")
		}
		issueStr := fmt.Sprintf("%v", issueNumber)
		return baseURL + "/issues/" + issueStr + "/comments", nil

	case "github_create_issue":
		return baseURL + "/issues", nil

	case "github_merge_pull_request":
		pullNumber, ok := args["pull_number"]
		if !ok {
			return "", fmt.Errorf("pull_number parameter is required for github_merge_pull_request")
		}
		pullStr := fmt.Sprintf("%v", pullNumber)
		return baseURL + "/pulls/" + pullStr + "/merge", nil

	case "github_get_file_sha":
		path, ok := args["path"].(string)
		if !ok || path == "" {
			return "", fmt.Errorf("path parameter is required for github_get_file_sha")
		}
		// URL encode the path to handle special characters and spaces
		encodedPath := url.QueryEscape(path)
		return baseURL + "/contents/" + encodedPath, nil

	case "github_list_branches":
		return baseURL + "/branches", nil

	case "github_read_commits":
		url := baseURL + "/commits"
		params := []string{}

		if sha, ok := args["sha"].(string); ok && sha != "" {
			params = append(params, fmt.Sprintf("sha=%s", sha))
		}

		if path, ok := args["path"].(string); ok && path != "" {
			params = append(params, fmt.Sprintf("path=%s", path))
		}

		if perPage, ok := args["per_page"]; ok {
			if perPageInt, ok := perPage.(float64); ok {
				params = append(params, fmt.Sprintf("per_page=%.0f", perPageInt))
			} else if perPageInt, ok := perPage.(int); ok {
				params = append(params, fmt.Sprintf("per_page=%d", perPageInt))
			}
		} else {
			params = append(params, "per_page=30") // Default limit
		}

		if since, ok := args["since"].(string); ok && since != "" {
			params = append(params, fmt.Sprintf("since=%s", since))
		}

		if until, ok := args["until"].(string); ok && until != "" {
			params = append(params, fmt.Sprintf("until=%s", until))
		}

		if len(params) > 0 {
			url += "?" + strings.Join(params, "&")
		}
		return url, nil

	default:
		return "", fmt.Errorf("unknown GitHub function: %s", functionName)
	}
}

// buildGenericAPIURL constructs the API URL for non-GitHub functions using their endpoint_url
func (c *Client) buildGenericAPIURL(funcDef *db.FunctionDefinition, args map[string]interface{}) (string, error) {
	// Start with the base endpoint URL from function definition
	apiURL := funcDef.EndpointUrl.String
	if apiURL == "" {
		return "", fmt.Errorf("no endpoint_url defined for function %s", funcDef.Name)
	}

	// For functions that need URL parameter substitution (like Slack with placeholders)
	// Replace any {parameter} placeholders in the URL with actual values
	usedParams := make(map[string]bool)
	for key, value := range args {
		placeholder := fmt.Sprintf("{%s}", key)
		if strings.Contains(apiURL, placeholder) {
			apiURL = strings.ReplaceAll(apiURL, placeholder, fmt.Sprintf("%v", value))
			usedParams[key] = true
		}
	}

	// For GET requests, add remaining parameters as query parameters
	httpMethod := "GET" // Default
	if funcDef.HttpMethod.Valid {
		httpMethod = funcDef.HttpMethod.String
	}

	if httpMethod == "GET" && len(args) > 0 {
		queryParams := []string{}
		for key, value := range args {
			// Skip parameters that were already used in URL substitution
			if usedParams[key] {
				continue
			}
			// Skip nil values
			if value == nil {
				continue
			}
			queryParams = append(queryParams, fmt.Sprintf("%s=%s", url.QueryEscape(key), url.QueryEscape(fmt.Sprintf("%v", value))))
		}

		if len(queryParams) > 0 {
			separator := "?"
			if strings.Contains(apiURL, "?") {
				separator = "&"
			}
			apiURL += separator + strings.Join(queryParams, "&")
		}
	}

	return apiURL, nil
}

// TestExecuteFunctionCall provides a public method to test function execution
func (c *Client) TestExecuteFunctionCall(ctx context.Context, functionName string, args map[string]interface{}) (map[string]interface{}, error) {
	// Get function definition from database
	funcDef, err := c.getFunctionDefinition(ctx, functionName)
	if err != nil {
		return nil, fmt.Errorf("function %s not found in database: %w", functionName, err)
	}

	// Execute using dynamic function routing
	return c.executeDynamicFunction(ctx, funcDef, args)
}

// getFunctionDefinition retrieves a function definition from the database
func (c *Client) getFunctionDefinition(ctx context.Context, functionName string) (*db.FunctionDefinition, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	// Get function definition from database
	funcDef, err := c.queries.GetFunctionDefinitionByName(ctx, db.GetFunctionDefinitionByNameParams{
		Name:   functionName,
		UserID: "system", // System functions are stored with user_id = 'system'
	})
	if err != nil {
		return nil, fmt.Errorf("function %s not found in database: %w", functionName, err)
	}

	return &funcDef, nil
}

// LoadSystemFunctionTools loads all active system functions and converts them to Tool objects
func (c *Client) LoadSystemFunctionTools(ctx context.Context, userID string) ([]types.Tool, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	log.Printf("🔍 DEBUG: LoadSystemFunctionTools called with userID: %s", userID)

	// Get all active function definitions (both system and user functions)
	funcDefs, err := c.queries.ListFunctionDefinitions(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to load function definitions: %w", err)
	}

	log.Printf("🔍 DEBUG: Found %d function definitions total", len(funcDefs))

	tools := make([]types.Tool, 0, len(funcDefs))

	for _, funcDef := range funcDefs {
		// Parse parameters schema from JSON
		var parametersSchema map[string]interface{}
		if funcDef.ParametersSchema != nil {
			if err := json.Unmarshal(funcDef.ParametersSchema, &parametersSchema); err != nil {
				log.Printf("⚠️ Failed to parse parameters schema for function %s: %v", funcDef.Name, err)
				// Skip this function if we can't parse its schema
				continue
			}
		} else {
			// Default empty schema
			parametersSchema = map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			}
		}

		// Create Tool object
		description := ""
		if funcDef.Description.Valid {
			description = funcDef.Description.String
		}

		// DEBUG: Log Slack function descriptions to see what's actually being loaded
		if funcDef.Name == "slack_find_channel" || funcDef.Name == "slack_read_messages" {
			preview := description
			if len(description) > 100 {
				preview = description[:100] + "..."
			}
			log.Printf("🔍 DEBUG: Loading function %s with description: %s", funcDef.Name, preview)
		}

		tool := types.Tool{
			Name:        funcDef.Name,
			Description: description,
			Parameters:  parametersSchema,
		}

		tools = append(tools, tool)
	}

	log.Printf("🔧 Loaded %d system function tools for user %s", len(tools), userID)
	return tools, nil
}

// GetExecutionResult retrieves complete execution details from the database
func (c *Client) GetExecutionResult(ctx context.Context, userID string, executionRunID string) (*types.ExecutionResult, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	// Get the execution run
	executionRun, err := c.GetExecutionRun(ctx, userID, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("failed to get execution run: %w", err)
	}

	// Get all configurations for this execution run
	configRows, err := c.queries.GetAPIConfigurationsByRun(ctx, db.GetAPIConfigurationsByRunParams{
		ExecutionRunID: executionRunID,
		UserID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get configurations: %w", err)
	}

	// Get all requests for this execution run
	requestRows, err := c.queries.GetAPIRequestsByRun(ctx, db.GetAPIRequestsByRunParams{
		ExecutionRunID: executionRunID,
		UserID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get requests: %w", err)
	}

	// Get all responses with joined data for this execution run
	responseRows, err := c.queries.GetAPIResponsesWithRequests(ctx, db.GetAPIResponsesWithRequestsParams{
		ExecutionRunID: executionRunID,
		UserID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get responses: %w", err)
	}

	// Build configurations map
	configs := make(map[string]*types.APIConfiguration)
	for _, row := range configRows {
		config := &types.APIConfiguration{
			ID:            row.ID,
			VariationName: row.VariationName,
			ModelName:     row.ModelName,
			SystemPrompt:  row.SystemPrompt.String,
			CreatedAt:     row.CreatedAt.Time,
		}

		// Parse nullable fields
		if row.Temperature.Valid {
			temp, _ := parseFloat32(row.Temperature.String)
			config.Temperature = &temp
		}
		if row.MaxTokens.Valid {
			config.MaxTokens = &row.MaxTokens.Int32
		}
		if row.TopP.Valid {
			topP, _ := parseFloat32(row.TopP.String)
			config.TopP = &topP
		}
		if row.TopK.Valid {
			config.TopK = &row.TopK.Int32
		}

		configs[config.ID] = config
	}

	// Build requests map
	requests := make(map[string]*types.APIRequest)
	for _, row := range requestRows {
		request := &types.APIRequest{
			ID:              row.ID,
			ExecutionRunID:  row.ExecutionRunID,
			ConfigurationID: row.ConfigurationID,
			RequestType:     types.RequestType(row.RequestType.String),
			Prompt:          row.Prompt.String,
			Context:         row.Context.String,
			FunctionName:    row.FunctionName.String,
			CreatedAt:       row.CreatedAt.Time,
		}
		requests[request.ID] = request
	}

	// Build variation results
	results := make([]types.VariationResult, 0)
	successCount := 0
	errorCount := 0
	totalTime := int64(0)

	for _, respRow := range responseRows {
		// Get the request first to find the configuration ID
		request := requests[respRow.RequestID]
		if request == nil {
			continue
		}

		// Get the configuration using the request's configuration ID
		configID := request.ConfigurationID
		config := configs[configID]

		if config == nil {
			continue
		}

		response := &types.APIResponse{
			ID:             respRow.ID,
			RequestID:      respRow.RequestID,
			ResponseStatus: types.ResponseStatus(respRow.ResponseStatus.String),
			ResponseText:   respRow.ResponseText.String,
			FinishReason:   respRow.FinishReason.String,
			ErrorMessage:   respRow.ErrorMessage.String,
			ResponseTimeMs: respRow.ResponseTimeMs.Int32,
			CreatedAt:      respRow.CreatedAt.Time,
		}

		// Parse and set UsageMetadata from database
		if respRow.UsageMetadata != nil {
			var usageMetadata map[string]interface{}
			if err := json.Unmarshal(respRow.UsageMetadata, &usageMetadata); err == nil {
				response.UsageMetadata = usageMetadata
				log.Printf("✅ Successfully loaded token data for response %s: %+v", respRow.ID, usageMetadata)
			} else {
				log.Printf("⚠️ Failed to parse usage metadata for response %s: %v", respRow.ID, err)
			}
		} else {
			log.Printf("⚠️ No usage metadata found for response %s", respRow.ID)
		}

		// Parse and set other JSON fields if needed
		if respRow.FunctionCallResponse != nil {
			var functionCallResponse map[string]interface{}
			if err := json.Unmarshal(respRow.FunctionCallResponse, &functionCallResponse); err == nil {
				response.FunctionCallResponse = functionCallResponse
			}
		}

		if respRow.SafetyRatings != nil {
			var safetyRatings map[string]interface{}
			if err := json.Unmarshal(respRow.SafetyRatings, &safetyRatings); err == nil {
				response.SafetyRatings = safetyRatings
			}
		}

		if respRow.ResponseHeaders != nil {
			var responseHeaders map[string]interface{}
			if err := json.Unmarshal(respRow.ResponseHeaders, &responseHeaders); err == nil {
				response.ResponseHeaders = responseHeaders
			}
		}

		if respRow.ResponseBody != nil {
			var responseBody map[string]interface{}
			if err := json.Unmarshal(respRow.ResponseBody, &responseBody); err == nil {
				response.ResponseBody = responseBody
			}
		}

		variationResult := types.VariationResult{
			Configuration: *config,
			Request:       *request,
			Response:      *response,
			ExecutionTime: int64(response.ResponseTimeMs),
		}

		results = append(results, variationResult)

		// Update counters
		if response.ResponseStatus == types.ResponseStatusSuccess {
			successCount++
		} else {
			errorCount++
		}
		totalTime += int64(response.ResponseTimeMs)
	}

	// Try to fetch comparison result for this execution run
	var comparison *types.ComparisonResult
	comparisonRow, err := c.queries.GetComparisonResult(ctx, executionRunID)
	if err == nil {
		// Parse the comparison data
		comparison = &types.ComparisonResult{
			ID:             comparisonRow.ID,
			ExecutionRunID: comparisonRow.ExecutionRunID,
		}

		// Handle nullable string fields
		if comparisonRow.ComparisonType.Valid {
			comparison.ComparisonType = comparisonRow.ComparisonType.String
		}
		if comparisonRow.MetricName.Valid {
			comparison.MetricName = comparisonRow.MetricName.String
		}
		if comparisonRow.BestConfigurationID.Valid {
			comparison.BestConfigurationID = comparisonRow.BestConfigurationID.String
		}
		if comparisonRow.AnalysisNotes.Valid {
			comparison.AnalysisNotes = comparisonRow.AnalysisNotes.String
		}
		if comparisonRow.CreatedAt.Valid {
			comparison.CreatedAt = comparisonRow.CreatedAt.Time
		}

		// Parse configuration_scores JSON
		if comparisonRow.ConfigurationScores != nil {
			var configScores map[string]interface{}
			if err := json.Unmarshal(comparisonRow.ConfigurationScores, &configScores); err == nil {
				comparison.ConfigurationScores = configScores
			}
		}

		// Parse best_configuration_data JSON if available
		if comparisonRow.BestConfigurationData != nil {
			if dataStr, ok := comparisonRow.BestConfigurationData.(string); ok && dataStr != "" {
				var bestConfig types.APIConfiguration
				if err := json.Unmarshal([]byte(dataStr), &bestConfig); err == nil {
					comparison.BestConfiguration = &bestConfig
				}
			}
		}

		// Parse all_configurations_data JSON if available
		if comparisonRow.AllConfigurationsData != nil {
			if dataStr, ok := comparisonRow.AllConfigurationsData.(string); ok && dataStr != "" {
				var allConfigs []types.APIConfiguration
				if err := json.Unmarshal([]byte(dataStr), &allConfigs); err == nil {
					comparison.AllConfigurations = allConfigs
				}
			}
		}

		log.Printf("✅ Successfully loaded comparison result for execution run %s", executionRunID)
	} else {
		log.Printf("⚠️ No comparison result found for execution run %s: %v", executionRunID, err)
	}

	return &types.ExecutionResult{
		ExecutionRun: *executionRun,
		Results:      results,
		Comparison:   comparison,
		TotalTime:    totalTime,
		SuccessCount: successCount,
		ErrorCount:   errorCount,
	}, nil
}

// GetExecutionRun retrieves an execution run by ID
func (c *Client) GetExecutionRun(ctx context.Context, userID string, executionRunID string) (*types.ExecutionRun, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	row, err := c.queries.GetExecutionRun(ctx, db.GetExecutionRunParams{
		ID:     executionRunID,
		UserID: userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get execution run: %w", err)
	}

	description := ""
	if row.Description.Valid {
		description = row.Description.String
	}

	basePrompt := ""
	if row.BasePrompt.Valid {
		basePrompt = row.BasePrompt.String
	}

	contextPrompt := ""
	if row.ContextPrompt.Valid {
		contextPrompt = row.ContextPrompt.String
	}

	// Get the actual status from database
	var status string
	var errorMessage string
	if row.Status.Valid {
		status = string(row.Status.ExecutionRunsStatus)
	} else {
		status = "pending" // Default if not set
	}
	if row.ErrorMessage.Valid {
		errorMessage = row.ErrorMessage.String
	}

	// Handle agent_id field
	var agentID *string
	if row.AgentID.Valid {
		agentID = &row.AgentID.String
	}

	return &types.ExecutionRun{
		ID:                    row.ID,
		Name:                  row.Name,
		Description:           description,
		BasePrompt:            basePrompt,
		ContextPrompt:         contextPrompt,
		EnableFunctionCalling: row.EnableFunctionCalling,
		Status:                status,       // Use actual database status
		ErrorMessage:          errorMessage, // Use actual error message
		AgentID:               agentID,      // Include agent ID if present
		CreatedAt:             row.CreatedAt.Time,
		UpdatedAt:             row.UpdatedAt.Time,
	}, nil
}

// ListExecutionRuns retrieves a list of execution runs for a user
func (c *Client) ListExecutionRuns(ctx context.Context, userID string, limit, offset int32) ([]*types.ExecutionRun, error) {
	executionRuns, err := c.queries.GetExecutionRunsByUser(ctx, db.GetExecutionRunsByUserParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list execution runs: %w", err)
	}

	result := make([]*types.ExecutionRun, 0, len(executionRuns))
	for _, run := range executionRuns {
		description := ""
		if run.Description.Valid {
			description = run.Description.String
		}

		basePrompt := ""
		if run.BasePrompt.Valid {
			basePrompt = run.BasePrompt.String
		}

		contextPrompt := ""
		if run.ContextPrompt.Valid {
			contextPrompt = run.ContextPrompt.String
		}

		// Handle agent_id field
		var agentID *string
		if run.AgentID.Valid {
			agentID = &run.AgentID.String
		}

		result = append(result, &types.ExecutionRun{
			ID:                    run.ID,
			Name:                  run.Name,
			Description:           description,
			BasePrompt:            basePrompt,
			ContextPrompt:         contextPrompt,
			EnableFunctionCalling: run.EnableFunctionCalling,
			Status:                "completed", // Default status for existing records
			ErrorMessage:          "",
			AgentID:               agentID, // Include agent ID if present
			CreatedAt:             run.CreatedAt.Time,
			UpdatedAt:             run.UpdatedAt.Time,
		})
	}

	return result, nil
}

// GetExecutionFlowGraph retrieves the execution flow graph for an execution run
func (c *Client) GetExecutionFlowGraph(ctx context.Context, userID string, executionRunID string) (*types.ExecutionFlowGraph, error) {
	log.Printf("🔍 Getting execution flow graph for execution run: %s, user: %s", executionRunID, userID)

	// First verify the execution run belongs to the user
	executionRun, err := c.GetExecutionRun(ctx, userID, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("execution run not found or access denied: %w", err)
	}

	// Get execution flow events
	events, err := c.getExecutionFlowEvents(ctx, executionRunID)
	if err != nil {
		log.Printf("⚠️ Failed to get execution flow events: %v", err)
		events = []types.ExecutionFlowEvent{} // Continue with empty events
	}

	// Get function calls for this execution run
	functionCalls, err := c.getFunctionCalls(ctx, executionRunID)
	if err != nil {
		log.Printf("⚠️ Failed to get function calls: %v", err)
		functionCalls = []types.FunctionCall{} // Continue with empty function calls
	}

	// Get execution stats
	stats, err := c.getExecutionStats(ctx, executionRunID)
	if err != nil {
		log.Printf("⚠️ Failed to get execution stats: %v", err)
		// Continue without stats
	}

	// Generate graph YAML
	graphYAML := c.generateGraphYAML(executionRun, events, functionCalls)

	flowGraph := &types.ExecutionFlowGraph{
		ExecutionRunID: executionRunID,
		Events:         events,
		FunctionCalls:  functionCalls,
		Stats:          stats,
		GraphYAML:      graphYAML,
	}

	log.Printf("✅ Generated execution flow graph with %d events, %d function calls", len(events), len(functionCalls))
	return flowGraph, nil
}

// GetExecutionLogsByConfiguration retrieves execution logs for a specific configuration
func (c *Client) GetExecutionLogsByConfiguration(ctx context.Context, executionRunID, configurationID string) ([]types.ExecutionLog, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	log.Printf("🔍 Getting execution logs for execution run: %s, configuration: %s", executionRunID, configurationID)

	// Query database directly since the signature doesn't match sqlc generated
	query := `
		SELECT id, execution_run_id, configuration_id, request_id, log_level, log_category, 
		       message, details, timestamp, sequence_number, duration_ms
		FROM execution_logs 
		WHERE execution_run_id = ? AND configuration_id = ?
		ORDER BY sequence_number ASC, timestamp ASC
	`

	rows, err := c.db.QueryContext(ctx, query, executionRunID, configurationID)
	if err != nil {
		return nil, fmt.Errorf("failed to query execution logs by configuration: %w", err)
	}
	defer rows.Close()

	var logs []types.ExecutionLog
	for rows.Next() {
		var log types.ExecutionLog
		var configurationIDStr, requestID sql.NullString
		var details sql.NullString
		var sequenceNumber sql.NullInt32
		var durationMs sql.NullInt64

		err := rows.Scan(
			&log.ID,
			&log.ExecutionRunID,
			&configurationIDStr,
			&requestID,
			&log.LogLevel,
			&log.LogCategory,
			&log.Message,
			&details,
			&log.Timestamp,
			&sequenceNumber,
			&durationMs,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan execution log: %w", err)
		}

		if configurationIDStr.Valid {
			log.ConfigurationID = &configurationIDStr.String
		}
		if requestID.Valid {
			log.RequestID = &requestID.String
		}
		if sequenceNumber.Valid {
			seqNum := int32(sequenceNumber.Int32)
			log.SequenceNumber = &seqNum
		}
		if durationMs.Valid {
			durMs := int32(durationMs.Int64)
			log.DurationMs = &durMs
		}

		logs = append(logs, log)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate execution logs: %w", err)
	}

	log.Printf("✅ Found %d execution logs for configuration %s", len(logs), configurationID)
	return logs, nil
}

// GetExecutionLogsByRun retrieves execution logs for a specific execution run
func (c *Client) GetExecutionLogsByRun(ctx context.Context, executionRunID string) ([]types.ExecutionLog, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	log.Printf("🔍 Getting ALL execution logs for execution run: %s", executionRunID)

	// Query database directly
	query := `
		SELECT id, execution_run_id, configuration_id, request_id, log_level, log_category, 
		       message, details, timestamp, sequence_number, duration_ms
		FROM execution_logs 
		WHERE execution_run_id = ?
		ORDER BY sequence_number ASC, timestamp ASC
	`

	rows, err := c.db.QueryContext(ctx, query, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("failed to query execution logs by run: %w", err)
	}
	defer rows.Close()

	var logs []types.ExecutionLog
	for rows.Next() {
		var log types.ExecutionLog
		var configurationID, requestID sql.NullString
		var details sql.NullString
		var sequenceNumber sql.NullInt32
		var durationMs sql.NullInt64

		err := rows.Scan(
			&log.ID,
			&log.ExecutionRunID,
			&configurationID,
			&requestID,
			&log.LogLevel,
			&log.LogCategory,
			&log.Message,
			&details,
			&log.Timestamp,
			&sequenceNumber,
			&durationMs,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan execution log: %w", err)
		}

		if configurationID.Valid {
			log.ConfigurationID = &configurationID.String
		}
		if requestID.Valid {
			log.RequestID = &requestID.String
		}
		if sequenceNumber.Valid {
			seqNum := int32(sequenceNumber.Int32)
			log.SequenceNumber = &seqNum
		}
		if durationMs.Valid {
			durMs := int32(durationMs.Int64)
			log.DurationMs = &durMs
		}

		logs = append(logs, log)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate execution logs: %w", err)
	}

	log.Printf("✅ Found %d execution logs for execution run %s", len(logs), executionRunID)
	return logs, nil
}

// GetExecutionFlowGraphByConfiguration retrieves the execution flow graph for a specific configuration
func (c *Client) GetExecutionFlowGraphByConfiguration(ctx context.Context, userID string, executionRunID string, configurationID string) (*types.ExecutionFlowGraph, error) {
	log.Printf("🔍 Getting execution flow graph for execution run: %s, configuration: %s, user: %s", executionRunID, configurationID, userID)

	// First verify the execution run belongs to the user
	executionRun, err := c.GetExecutionRun(ctx, userID, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("execution run not found or access denied: %w", err)
	}

	// Get execution flow events filtered by configuration (through request_id)
	events, err := c.getExecutionFlowEventsByConfiguration(ctx, executionRunID, configurationID)
	if err != nil {
		log.Printf("⚠️ Failed to get execution flow events by configuration: %v", err)
		events = []types.ExecutionFlowEvent{} // Continue with empty events
	}

	// Get function calls for this execution run filtered by configuration
	functionCalls, err := c.getFunctionCallsByConfiguration(ctx, executionRunID, configurationID)
	if err != nil {
		log.Printf("⚠️ Failed to get function calls by configuration: %v", err)
		functionCalls = []types.FunctionCall{} // Continue with empty function calls
	}

	// Get execution stats (not filtered by configuration for now)
	stats, err := c.getExecutionStats(ctx, executionRunID)
	if err != nil {
		log.Printf("⚠️ Failed to get execution stats: %v", err)
		// Continue without stats
	}

	// Generate graph YAML (simplified for now)
	graphYAML := c.generateGraphYAML(executionRun, events, functionCalls)

	flowGraph := &types.ExecutionFlowGraph{
		ExecutionRunID: executionRunID,
		Events:         events,
		FunctionCalls:  functionCalls,
		Stats:          stats,
		GraphYAML:      graphYAML,
	}

	log.Printf("✅ Generated execution flow graph for configuration %s with %d events, %d function calls", configurationID, len(events), len(functionCalls))
	return flowGraph, nil
}

// Helper functions for type conversions
func (c *Client) parseFloat32FromNullString(ns sql.NullString) *float32 {
	if !ns.Valid {
		return nil
	}
	if f, err := parseFloat32(ns.String); err == nil {
		return &f
	}
	return nil
}

func (c *Client) parseInt32FromNullInt32(ni sql.NullInt32) *int32 {
	if !ni.Valid {
		return nil
	}
	return &ni.Int32
}

func (c *Client) parseJSONToTools(raw json.RawMessage) []types.Tool {
	var tools []types.Tool
	if len(raw) > 0 {
		json.Unmarshal(raw, &tools)
	}
	return tools
}

func (c *Client) parseJSONToMap(raw json.RawMessage) map[string]interface{} {
	var result map[string]interface{}
	if len(raw) > 0 {
		json.Unmarshal(raw, &result)
	}
	return result
}

// Helper functions for execution flow graph
func (c *Client) getExecutionFlowEvents(ctx context.Context, executionRunID string) ([]types.ExecutionFlowEvent, error) {
	// Use sqlc-generated query for better type safety
	dbEvents, err := c.queries.GetExecutionFlowEventsByRun(ctx, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("failed to query execution flow events: %w", err)
	}

	// Convert from database types to application types
	events := make([]types.ExecutionFlowEvent, 0, len(dbEvents))
	for _, dbEvent := range dbEvents {
		event := types.ExecutionFlowEvent{
			ID:             dbEvent.ID,
			ExecutionRunID: dbEvent.ExecutionRunID,
			EventType:      types.ExecutionFlowEventType(dbEvent.EventType),
			SequenceNumber: dbEvent.SequenceNumber,
			Status:         types.ExecutionFlowEventStatus(dbEvent.Status.ExecutionFlowEventsStatus),
		}

		// Handle CreatedAt timestamp
		if dbEvent.CreatedAt.Valid {
			event.CreatedAt = dbEvent.CreatedAt.Time
		}

		// Handle nullable fields
		if dbEvent.RequestID.Valid {
			event.RequestID = &dbEvent.RequestID.String
		}
		if dbEvent.ParentEventID.Valid {
			event.ParentEventID = &dbEvent.ParentEventID.String
		}
		if dbEvent.ErrorMessage.Valid {
			event.ErrorMessage = &dbEvent.ErrorMessage.String
		}
		if dbEvent.DurationMs.Valid {
			event.DurationMs = &dbEvent.DurationMs.Int32
		}

		// Parse event data JSON
		if dbEvent.EventData != nil {
			var eventData map[string]interface{}
			if err := json.Unmarshal(dbEvent.EventData, &eventData); err != nil {
				log.Printf("⚠️ Failed to parse event data JSON for event %s: %v", event.ID, err)
			} else {
				event.EventData = eventData
			}
		}

		events = append(events, event)
	}

	return events, nil
}

func (c *Client) getFunctionCalls(ctx context.Context, executionRunID string) ([]types.FunctionCall, error) {
	query := `
		SELECT f.id, f.request_id, f.function_name, f.function_arguments, f.function_response, 
		       f.execution_status, f.error_details, f.created_at
		FROM function_calls f
		INNER JOIN api_requests r ON f.request_id = r.id
		WHERE r.execution_run_id = ?
		ORDER BY f.created_at ASC
	`

	rows, err := c.db.QueryContext(ctx, query, executionRunID)
	if err != nil {
		return nil, fmt.Errorf("failed to query function calls: %w", err)
	}
	defer rows.Close()

	var functionCalls []types.FunctionCall
	for rows.Next() {
		var call types.FunctionCall
		var functionArgs, functionResponse, errorDetails sql.NullString

		err := rows.Scan(
			&call.ID,
			&call.RequestID,
			&call.FunctionName,
			&functionArgs,
			&functionResponse,
			&call.ExecutionStatus,
			&errorDetails,
			&call.CreatedAt,
		)
		if err != nil {
			log.Printf("⚠️ Failed to scan function call: %v", err)
			continue
		}

		// Handle nullable fields and JSON parsing
		if functionArgs.Valid {
			var args map[string]interface{}
			if err := json.Unmarshal([]byte(functionArgs.String), &args); err == nil {
				call.FunctionArgs = args
			}
		}
		if functionResponse.Valid {
			var response map[string]interface{}
			if err := json.Unmarshal([]byte(functionResponse.String), &response); err == nil {
				call.FunctionResponse = response
			}
		}
		if errorDetails.Valid {
			call.ErrorDetails = errorDetails.String
		}

		functionCalls = append(functionCalls, call)
	}

	return functionCalls, rows.Err()
}

func (c *Client) getExecutionFlowEventsByConfiguration(ctx context.Context, executionRunID, configurationID string) ([]types.ExecutionFlowEvent, error) {
	// Use sqlc-generated query for better type safety
	params := db.GetExecutionFlowEventsByConfigurationParams{
		ExecutionRunID:  executionRunID,
		ConfigurationID: configurationID,
	}
	dbEvents, err := c.queries.GetExecutionFlowEventsByConfiguration(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to query execution flow events by configuration: %w", err)
	}

	// Convert from database types to application types
	events := make([]types.ExecutionFlowEvent, 0, len(dbEvents))
	for _, dbEvent := range dbEvents {
		event := types.ExecutionFlowEvent{
			ID:             dbEvent.ID,
			ExecutionRunID: dbEvent.ExecutionRunID,
			EventType:      types.ExecutionFlowEventType(dbEvent.EventType),
			SequenceNumber: dbEvent.SequenceNumber,
			Status:         types.ExecutionFlowEventStatus(dbEvent.Status.ExecutionFlowEventsStatus),
		}

		// Handle CreatedAt timestamp
		if dbEvent.CreatedAt.Valid {
			event.CreatedAt = dbEvent.CreatedAt.Time
		}

		// Handle nullable fields
		if dbEvent.RequestID.Valid {
			event.RequestID = &dbEvent.RequestID.String
		}
		if dbEvent.ParentEventID.Valid {
			event.ParentEventID = &dbEvent.ParentEventID.String
		}
		if dbEvent.ErrorMessage.Valid {
			event.ErrorMessage = &dbEvent.ErrorMessage.String
		}
		if dbEvent.DurationMs.Valid {
			event.DurationMs = &dbEvent.DurationMs.Int32
		}

		// Parse event data JSON
		if dbEvent.EventData != nil {
			var eventData map[string]interface{}
			if err := json.Unmarshal(dbEvent.EventData, &eventData); err != nil {
				log.Printf("⚠️ Failed to parse event data JSON for event %s: %v", event.ID, err)
			} else {
				event.EventData = eventData
			}
		}

		events = append(events, event)
	}

	return events, nil
}

func (c *Client) getFunctionCallsByConfiguration(ctx context.Context, executionRunID, configurationID string) ([]types.FunctionCall, error) {
	query := `
		SELECT f.id, f.request_id, f.function_name, f.function_arguments, f.function_response, 
		       f.execution_status, f.error_details, f.created_at
		FROM function_calls f
		INNER JOIN api_requests r ON f.request_id = r.id
		WHERE r.execution_run_id = ? AND r.configuration_id = ?
		ORDER BY f.created_at ASC
	`

	rows, err := c.db.QueryContext(ctx, query, executionRunID, configurationID)
	if err != nil {
		return nil, fmt.Errorf("failed to query function calls by configuration: %w", err)
	}
	defer rows.Close()

	var functionCalls []types.FunctionCall
	for rows.Next() {
		var call types.FunctionCall
		var functionArgs, functionResponse, errorDetails sql.NullString

		err := rows.Scan(
			&call.ID,
			&call.RequestID,
			&call.FunctionName,
			&functionArgs,
			&functionResponse,
			&call.ExecutionStatus,
			&errorDetails,
			&call.CreatedAt,
		)
		if err != nil {
			log.Printf("⚠️ Failed to scan function call: %v", err)
			continue
		}

		// Handle nullable fields and JSON parsing
		if functionArgs.Valid {
			var args map[string]interface{}
			if err := json.Unmarshal([]byte(functionArgs.String), &args); err == nil {
				call.FunctionArgs = args
			}
		}
		if functionResponse.Valid {
			var response map[string]interface{}
			if err := json.Unmarshal([]byte(functionResponse.String), &response); err == nil {
				call.FunctionResponse = response
			}
		}
		if errorDetails.Valid {
			call.ErrorDetails = errorDetails.String
		}

		functionCalls = append(functionCalls, call)
	}

	return functionCalls, rows.Err()
}

func (c *Client) getExecutionStats(ctx context.Context, executionRunID string) (*types.ExecutionStats, error) {
	// Get basic counts
	var requestCount, successCount, errorCount int

	query := `
		SELECT 
			COUNT(*) as total_requests,
			COALESCE(SUM(CASE WHEN response_status = 'success' THEN 1 ELSE 0 END), 0) as success_count,
			COALESCE(SUM(CASE WHEN response_status = 'error' THEN 1 ELSE 0 END), 0) as error_count
		FROM api_responses r
		INNER JOIN api_requests req ON r.request_id = req.id
		WHERE req.execution_run_id = ?
	`

	err := c.db.QueryRowContext(ctx, query, executionRunID).Scan(&requestCount, &successCount, &errorCount)
	if err != nil {
		return nil, fmt.Errorf("failed to get execution stats: %w", err)
	}

	// Get function call counts
	var functionCallCount int
	funcQuery := `
		SELECT COUNT(*) 
		FROM function_calls f
		INNER JOIN api_requests req ON f.request_id = req.id
		WHERE req.execution_run_id = ?
	`

	err = c.db.QueryRowContext(ctx, funcQuery, executionRunID).Scan(&functionCallCount)
	if err != nil {
		functionCallCount = 0 // Continue without function call stats
	}

	stats := &types.ExecutionStats{
		ID:                    uuid.New().String(),
		ExecutionRunID:        executionRunID,
		TotalFunctionCalls:    int32(functionCallCount),
		TotalAIModelCalls:     int32(requestCount),
		TotalErrors:           int32(errorCount),
		TotalRetries:          0, // TODO: Calculate retries
		TotalExecutionTimeMs:  0, // TODO: Calculate total time
		AvgFunctionCallTimeMs: 0, // TODO: Calculate averages
		AvgAIResponseTimeMs:   0, // TODO: Calculate averages
		MaxExecutionDepth:     1, // TODO: Calculate depth
		FunctionCallBreakdown: map[string]interface{}{
			"total":   functionCallCount,
			"success": successCount,
			"errors":  errorCount,
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return stats, nil
}

func (c *Client) generateGraphYAML(executionRun *types.ExecutionRun, events []types.ExecutionFlowEvent, functionCalls []types.FunctionCall) string {
	// Simple YAML generation for now
	yaml := fmt.Sprintf(`execution_run:
  id: %s
  name: %s
  status: %s
  created_at: %s

events:
  count: %d

function_calls:
  count: %d
`,
		executionRun.ID,
		executionRun.Name,
		executionRun.Status,
		executionRun.CreatedAt.Format("2006-01-02T15:04:05Z"),
		len(events),
		len(functionCalls),
	)

	return yaml
}

// buildGoogleDriveAPIURL constructs the appropriate Google Drive API URL for the function
func (c *Client) buildGoogleDriveAPIURL(functionName string, args map[string]interface{}) (string, error) {
	baseURL := "https://www.googleapis.com/drive/v3"

	switch functionName {
	case "googledrive_list_files":
		apiURL := baseURL + "/files"
		params := []string{}

		if pageSize, ok := args["pageSize"]; ok {
			if pageSizeInt, ok := pageSize.(float64); ok {
				params = append(params, fmt.Sprintf("pageSize=%.0f", pageSizeInt))
			} else if pageSizeInt, ok := pageSize.(int); ok {
				params = append(params, fmt.Sprintf("pageSize=%d", pageSizeInt))
			}
		} else {
			params = append(params, "pageSize=100") // Default limit
		}

		if pageToken, ok := args["pageToken"].(string); ok && pageToken != "" {
			params = append(params, fmt.Sprintf("pageToken=%s", url.QueryEscape(pageToken)))
		}

		if q, ok := args["q"].(string); ok && q != "" {
			params = append(params, fmt.Sprintf("q=%s", url.QueryEscape(q)))
		}

		if orderBy, ok := args["orderBy"].(string); ok && orderBy != "" {
			params = append(params, fmt.Sprintf("orderBy=%s", url.QueryEscape(orderBy)))
		} else {
			params = append(params, "orderBy=modifiedTime desc") // Default sort
		}

		if fields, ok := args["fields"].(string); ok && fields != "" {
			params = append(params, fmt.Sprintf("fields=%s", url.QueryEscape(fields)))
		} else {
			params = append(params, "fields=nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink)")
		}

		if spaces, ok := args["spaces"].(string); ok && spaces != "" {
			params = append(params, fmt.Sprintf("spaces=%s", url.QueryEscape(spaces)))
		} else {
			params = append(params, "spaces=drive") // Default space
		}

		if corpora, ok := args["corpora"].(string); ok && corpora != "" {
			params = append(params, fmt.Sprintf("corpora=%s", url.QueryEscape(corpora)))
		}

		if includeItemsFromAllDrives, ok := args["includeItemsFromAllDrives"]; ok {
			if include, isBool := includeItemsFromAllDrives.(bool); isBool {
				params = append(params, fmt.Sprintf("includeItemsFromAllDrives=%t", include))
			}
		} else {
			params = append(params, "includeItemsFromAllDrives=true") // Default
		}

		if supportsAllDrives, ok := args["supportsAllDrives"]; ok {
			if supports, isBool := supportsAllDrives.(bool); isBool {
				params = append(params, fmt.Sprintf("supportsAllDrives=%t", supports))
			}
		} else {
			params = append(params, "supportsAllDrives=true") // Default
		}

		if len(params) > 0 {
			apiURL += "?" + strings.Join(params, "&")
		}
		return apiURL, nil

	case "googledrive_get_file":
		fileId, ok := args["fileId"].(string)
		if !ok || fileId == "" {
			return "", fmt.Errorf("fileId parameter is required for googledrive_get_file")
		}
		apiURL := baseURL + "/files/" + url.QueryEscape(fileId)
		params := []string{}

		if fields, ok := args["fields"].(string); ok && fields != "" {
			params = append(params, fmt.Sprintf("fields=%s", url.QueryEscape(fields)))
		} else {
			params = append(params, "fields=id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, permissions, owners, shared, trashed")
		}

		if supportsAllDrives, ok := args["supportsAllDrives"]; ok {
			if supports, isBool := supportsAllDrives.(bool); isBool {
				params = append(params, fmt.Sprintf("supportsAllDrives=%t", supports))
			}
		} else {
			params = append(params, "supportsAllDrives=true") // Default
		}

		if includeItemsFromAllDrives, ok := args["includeItemsFromAllDrives"]; ok {
			if include, isBool := includeItemsFromAllDrives.(bool); isBool {
				params = append(params, fmt.Sprintf("includeItemsFromAllDrives=%t", include))
			}
		} else {
			params = append(params, "includeItemsFromAllDrives=true") // Default
		}

		if len(params) > 0 {
			apiURL += "?" + strings.Join(params, "&")
		}
		return apiURL, nil

	case "googledrive_get_file_content":
		fileId, ok := args["fileId"].(string)
		if !ok || fileId == "" {
			return "", fmt.Errorf("fileId parameter is required for googledrive_get_file_content")
		}
		apiURL := baseURL + "/files/" + url.QueryEscape(fileId)
		params := []string{}

		if alt, ok := args["alt"].(string); ok && alt != "" {
			params = append(params, fmt.Sprintf("alt=%s", url.QueryEscape(alt)))
		} else {
			params = append(params, "alt=media") // Default to get content
		}

		if fields, ok := args["fields"].(string); ok && fields != "" {
			params = append(params, fmt.Sprintf("fields=%s", url.QueryEscape(fields)))
		}

		if len(params) > 0 {
			apiURL += "?" + strings.Join(params, "&")
		}
		return apiURL, nil

	case "googledrive_search_files":
		q, ok := args["q"].(string)
		if !ok || q == "" {
			return "", fmt.Errorf("q parameter is required for googledrive_search_files")
		}
		apiURL := baseURL + "/files"
		params := []string{fmt.Sprintf("q=%s", url.QueryEscape(q))}

		if pageSize, ok := args["pageSize"]; ok {
			if pageSizeInt, ok := pageSize.(float64); ok {
				params = append(params, fmt.Sprintf("pageSize=%.0f", pageSizeInt))
			} else if pageSizeInt, ok := pageSize.(int); ok {
				params = append(params, fmt.Sprintf("pageSize=%d", pageSizeInt))
			}
		} else {
			params = append(params, "pageSize=100") // Default limit
		}

		if pageToken, ok := args["pageToken"].(string); ok && pageToken != "" {
			params = append(params, fmt.Sprintf("pageToken=%s", url.QueryEscape(pageToken)))
		}

		if orderBy, ok := args["orderBy"].(string); ok && orderBy != "" {
			params = append(params, fmt.Sprintf("orderBy=%s", url.QueryEscape(orderBy)))
		} else {
			params = append(params, "orderBy=relevance") // Default for search
		}

		if fields, ok := args["fields"].(string); ok && fields != "" {
			params = append(params, fmt.Sprintf("fields=%s", url.QueryEscape(fields)))
		} else {
			params = append(params, "fields=nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink)")
		}

		if spaces, ok := args["spaces"].(string); ok && spaces != "" {
			params = append(params, fmt.Sprintf("spaces=%s", url.QueryEscape(spaces)))
		} else {
			params = append(params, "spaces=drive") // Default space
		}

		if corpora, ok := args["corpora"].(string); ok && corpora != "" {
			params = append(params, fmt.Sprintf("corpora=%s", url.QueryEscape(corpora)))
		}

		if includeItemsFromAllDrives, ok := args["includeItemsFromAllDrives"]; ok {
			if include, isBool := includeItemsFromAllDrives.(bool); isBool {
				params = append(params, fmt.Sprintf("includeItemsFromAllDrives=%t", include))
			}
		} else {
			params = append(params, "includeItemsFromAllDrives=true") // Default
		}

		if supportsAllDrives, ok := args["supportsAllDrives"]; ok {
			if supports, isBool := supportsAllDrives.(bool); isBool {
				params = append(params, fmt.Sprintf("supportsAllDrives=%t", supports))
			}
		} else {
			params = append(params, "supportsAllDrives=true") // Default
		}

		if len(params) > 0 {
			apiURL += "?" + strings.Join(params, "&")
		}
		return apiURL, nil

	default:
		return "", fmt.Errorf("unsupported Google Drive function: %s", functionName)
	}
}
