package agents

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"gogent/internal/auth"
	"gogent/internal/types"
)

// setupTestDB creates a MySQL test database for testing using proper migration system
func setupTestDB(t *testing.T) *sql.DB {
	// Get database URL from environment or use default test database
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

	// Drop and recreate all tables to ensure clean state
	_, err = db.Exec("SET FOREIGN_KEY_CHECKS = 0")
	require.NoError(t, err)

	// Get list of tables and drop them
	rows, err := db.Query("SHOW TABLES")
	if err == nil {
		var tables []string
		for rows.Next() {
			var table string
			if err := rows.Scan(&table); err == nil {
				tables = append(tables, table)
			}
		}
		rows.Close()

		// Drop all tables
		for _, table := range tables {
			_, err = db.Exec("DROP TABLE IF EXISTS " + table)
			require.NoError(t, err)
		}
	}

	_, err = db.Exec("SET FOREIGN_KEY_CHECKS = 1")
	require.NoError(t, err)

	// Run migrations using golang-migrate (same as production)
	err = runMigrations(db)
	if err != nil {
		t.Skipf("Skipping test: Could not run migrations: %v", err)
		return nil
	}

	return db
}

// runMigrations applies database migrations using golang-migrate
func runMigrations(db *sql.DB) error {
	driver, err := mysql.WithInstance(db, &mysql.Config{})
	if err != nil {
		return fmt.Errorf("could not create mysql driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://../../migrations",
		"mysql",
		driver,
	)
	if err != nil {
		return fmt.Errorf("could not create migrate instance: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("could not run migrations: %w", err)
	}

	return nil
}

// createTestUser creates a test user and returns the user and auth token
func createTestUser(t *testing.T, authService *auth.Service) (*auth.User, string) {
	user, _, token, err := authService.CreateTemporaryUser("test-session")
	require.NoError(t, err)
	require.NotNil(t, user)
	require.NotEmpty(t, token)

	return user, token
}

// createTestTemplate creates a test execution template
func createTestTemplate(t *testing.T, db *sql.DB, userID string) string {
	templateID := "test-template-" + fmt.Sprintf("%d", time.Now().UnixNano())
	query := `
		INSERT INTO execution_templates (
			id, user_id, name, description, template_prompt, 
			enable_function_calling, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	_, err := db.Exec(query,
		templateID, userID, "Test Template", "A test template",
		"This is a test prompt", false, now, now)
	require.NoError(t, err)

	return templateID
}

// TestHandler_CreateAgent tests agent creation
func TestHandler_CreateAgent(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	authService := auth.NewService(db, "test-secret")
	user, token := createTestUser(t, authService)
	templateID := createTestTemplate(t, db, user.ID)

	handler := NewHandler(db)

	tests := []struct {
		name           string
		request        types.AgentCreateRequest
		expectedStatus int
		expectError    bool
	}{
		{
			name: "Valid agent creation",
			request: types.AgentCreateRequest{
				FirstName:        "John",
				LastName:         "Doe",
				TemplateID:       templateID,
				MaxTokensPerDay:  1000,
				HeartbeatMinutes: 10,
				LifecycleStatus:  types.LifecycleStatusStandby,
			},
			expectedStatus: http.StatusCreated,
			expectError:    false,
		},
		{
			name: "Missing first name",
			request: types.AgentCreateRequest{
				LastName:         "Doe",
				TemplateID:       templateID,
				MaxTokensPerDay:  1000,
				HeartbeatMinutes: 10,
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
		{
			name: "Missing last name",
			request: types.AgentCreateRequest{
				FirstName:        "John",
				TemplateID:       templateID,
				MaxTokensPerDay:  1000,
				HeartbeatMinutes: 10,
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
		{
			name: "Invalid template ID",
			request: types.AgentCreateRequest{
				FirstName:        "John",
				LastName:         "Doe",
				TemplateID:       "non-existent-template",
				MaxTokensPerDay:  1000,
				HeartbeatMinutes: 10,
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
		{
			name: "Invalid max tokens per day",
			request: types.AgentCreateRequest{
				FirstName:        "John",
				LastName:         "Doe",
				TemplateID:       templateID,
				MaxTokensPerDay:  0,
				HeartbeatMinutes: 10,
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
		{
			name: "Invalid heartbeat minutes (too low)",
			request: types.AgentCreateRequest{
				FirstName:        "John",
				LastName:         "Doe",
				TemplateID:       templateID,
				MaxTokensPerDay:  1000,
				HeartbeatMinutes: 3,
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request
			reqBody, err := json.Marshal(tt.request)
			require.NoError(t, err)

			req := httptest.NewRequest(http.MethodPost, "/api/agents", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+token)

			// Add user to context (simulate auth middleware)
			ctx := req.Context()
			ctx = auth.AddUserToContext(ctx, user)
			req = req.WithContext(ctx)

			recorder := httptest.NewRecorder()

			// Call handler
			handler.HandleAgents(recorder, req)

			// Check response
			assert.Equal(t, tt.expectedStatus, recorder.Code)

			if !tt.expectError {
				// Should return the created agent
				var createdAgent types.Agent
				err := json.Unmarshal(recorder.Body.Bytes(), &createdAgent)
				require.NoError(t, err)

				assert.Equal(t, tt.request.FirstName, createdAgent.FirstName)
				assert.Equal(t, tt.request.LastName, createdAgent.LastName)
				assert.Equal(t, tt.request.TemplateID, createdAgent.TemplateID)
				assert.Equal(t, tt.request.MaxTokensPerDay, createdAgent.MaxTokensPerDay)
				assert.Equal(t, tt.request.HeartbeatMinutes, createdAgent.HeartbeatMinutes)
				assert.Equal(t, user.ID, createdAgent.UserID)
				assert.NotEmpty(t, createdAgent.ID)
			}
		})
	}
}

// TestHandler_ListAgents tests listing agents
func TestHandler_ListAgents(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	authService := auth.NewService(db, "test-secret")
	user, token := createTestUser(t, authService)
	templateID := createTestTemplate(t, db, user.ID)

	handler := NewHandler(db)

	// Create test agents
	agent1 := &types.Agent{
		ID:               "agent-1",
		UserID:           user.ID,
		FirstName:        "John",
		LastName:         "Doe",
		TemplateID:       templateID,
		MaxTokensPerDay:  1000,
		HeartbeatMinutes: 10,
		LifecycleStatus:  types.LifecycleStatusStandby,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	agent2 := &types.Agent{
		ID:               "agent-2",
		UserID:           user.ID,
		FirstName:        "Jane",
		LastName:         "Smith",
		TemplateID:       templateID,
		MaxTokensPerDay:  2000,
		HeartbeatMinutes: 15,
		LifecycleStatus:  types.LifecycleStatusActive,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	require.NoError(t, handler.insertAgent(agent1))
	require.NoError(t, handler.insertAgent(agent2))

	tests := []struct {
		name           string
		includeStats   bool
		expectedStatus int
		expectedCount  int
	}{
		{
			name:           "List agents without stats",
			includeStats:   false,
			expectedStatus: http.StatusOK,
			expectedCount:  2,
		},
		{
			name:           "List agents with stats",
			includeStats:   true,
			expectedStatus: http.StatusOK,
			expectedCount:  2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := "/api/agents"
			if tt.includeStats {
				url += "?include_stats=true"
			}

			req := httptest.NewRequest(http.MethodGet, url, nil)
			req.Header.Set("Authorization", "Bearer "+token)

			// Add user to context (simulate auth middleware)
			ctx := req.Context()
			ctx = auth.AddUserToContext(ctx, user)
			req = req.WithContext(ctx)

			recorder := httptest.NewRecorder()

			// Call handler
			handler.HandleAgents(recorder, req)

			// Check response
			assert.Equal(t, tt.expectedStatus, recorder.Code)

			var agents []types.Agent
			err := json.Unmarshal(recorder.Body.Bytes(), &agents)
			require.NoError(t, err)

			assert.Len(t, agents, tt.expectedCount)

			// Verify agents belong to the user
			for _, agent := range agents {
				assert.Equal(t, user.ID, agent.UserID)
			}
		})
	}
}

// TestHandler_GetAgent tests getting a specific agent
func TestHandler_GetAgent(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	authService := auth.NewService(db, "test-secret")
	user, token := createTestUser(t, authService)
	templateID := createTestTemplate(t, db, user.ID)

	handler := NewHandler(db)

	// Create test agent
	agent := &types.Agent{
		ID:               "test-agent-id",
		UserID:           user.ID,
		FirstName:        "John",
		LastName:         "Doe",
		TemplateID:       templateID,
		MaxTokensPerDay:  1000,
		HeartbeatMinutes: 10,
		LifecycleStatus:  types.LifecycleStatusStandby,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	require.NoError(t, handler.insertAgent(agent))

	tests := []struct {
		name           string
		agentID        string
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "Get existing agent",
			agentID:        "test-agent-id",
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:           "Get non-existent agent",
			agentID:        "non-existent-agent",
			expectedStatus: http.StatusNotFound,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/agents/"+tt.agentID, nil)
			req.Header.Set("Authorization", "Bearer "+token)

			// Add user to context (simulate auth middleware)
			ctx := req.Context()
			ctx = auth.AddUserToContext(ctx, user)
			req = req.WithContext(ctx)

			recorder := httptest.NewRecorder()

			// Call handler
			handler.HandleAgentByID(recorder, req)

			// Check response
			assert.Equal(t, tt.expectedStatus, recorder.Code)

			if !tt.expectError {
				var returnedAgent types.Agent
				err := json.Unmarshal(recorder.Body.Bytes(), &returnedAgent)
				require.NoError(t, err)

				assert.Equal(t, agent.ID, returnedAgent.ID)
				assert.Equal(t, agent.FirstName, returnedAgent.FirstName)
				assert.Equal(t, agent.LastName, returnedAgent.LastName)
				assert.Equal(t, user.ID, returnedAgent.UserID)
			}
		})
	}
}

// TestHandler_UpdateAgent tests updating an agent
func TestHandler_UpdateAgent(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	authService := auth.NewService(db, "test-secret")
	user, token := createTestUser(t, authService)
	templateID := createTestTemplate(t, db, user.ID)

	handler := NewHandler(db)

	// Create test agent
	agent := &types.Agent{
		ID:               "test-agent-id",
		UserID:           user.ID,
		FirstName:        "John",
		LastName:         "Doe",
		TemplateID:       templateID,
		MaxTokensPerDay:  1000,
		HeartbeatMinutes: 10,
		LifecycleStatus:  types.LifecycleStatusStandby,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	require.NoError(t, handler.insertAgent(agent))

	newFirstName := "Jane"
	newMaxTokens := int32(2000)
	newLifecycleStatus := types.LifecycleStatusActive

	tests := []struct {
		name           string
		agentID        string
		request        types.AgentUpdateRequest
		expectedStatus int
		expectError    bool
	}{
		{
			name:    "Update agent first name",
			agentID: "test-agent-id",
			request: types.AgentUpdateRequest{
				FirstName: &newFirstName,
			},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:    "Update agent max tokens",
			agentID: "test-agent-id",
			request: types.AgentUpdateRequest{
				MaxTokensPerDay: &newMaxTokens,
			},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:    "Update agent lifecycle status",
			agentID: "test-agent-id",
			request: types.AgentUpdateRequest{
				LifecycleStatus: &newLifecycleStatus,
			},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:    "Update non-existent agent",
			agentID: "non-existent-agent",
			request: types.AgentUpdateRequest{
				FirstName: &newFirstName,
			},
			expectedStatus: http.StatusNotFound,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request
			reqBody, err := json.Marshal(tt.request)
			require.NoError(t, err)

			req := httptest.NewRequest(http.MethodPut, "/api/agents/"+tt.agentID, bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+token)

			// Add user to context (simulate auth middleware)
			ctx := req.Context()
			ctx = auth.AddUserToContext(ctx, user)
			req = req.WithContext(ctx)

			recorder := httptest.NewRecorder()

			// Call handler
			handler.HandleAgentByID(recorder, req)

			// Check response
			assert.Equal(t, tt.expectedStatus, recorder.Code)

			if !tt.expectError {
				var updatedAgent types.Agent
				err := json.Unmarshal(recorder.Body.Bytes(), &updatedAgent)
				require.NoError(t, err)

				assert.Equal(t, agent.ID, updatedAgent.ID)
				assert.Equal(t, user.ID, updatedAgent.UserID)

				// Check specific updates
				if tt.request.FirstName != nil {
					assert.Equal(t, *tt.request.FirstName, updatedAgent.FirstName)
				}
				if tt.request.MaxTokensPerDay != nil {
					assert.Equal(t, *tt.request.MaxTokensPerDay, updatedAgent.MaxTokensPerDay)
				}
				if tt.request.LifecycleStatus != nil {
					assert.Equal(t, *tt.request.LifecycleStatus, updatedAgent.LifecycleStatus)
				}
			}
		})
	}
}

// TestHandler_DeleteAgent tests deleting an agent
func TestHandler_DeleteAgent(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	authService := auth.NewService(db, "test-secret")
	user, token := createTestUser(t, authService)
	templateID := createTestTemplate(t, db, user.ID)

	handler := NewHandler(db)

	// Create test agent
	agent := &types.Agent{
		ID:               "test-agent-id",
		UserID:           user.ID,
		FirstName:        "John",
		LastName:         "Doe",
		TemplateID:       templateID,
		MaxTokensPerDay:  1000,
		HeartbeatMinutes: 10,
		LifecycleStatus:  types.LifecycleStatusStandby,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	require.NoError(t, handler.insertAgent(agent))

	tests := []struct {
		name           string
		agentID        string
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "Delete existing agent",
			agentID:        "test-agent-id",
			expectedStatus: http.StatusNoContent,
			expectError:    false,
		},
		{
			name:           "Delete non-existent agent",
			agentID:        "non-existent-agent",
			expectedStatus: http.StatusNotFound,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodDelete, "/api/agents/"+tt.agentID, nil)
			req.Header.Set("Authorization", "Bearer "+token)

			// Add user to context (simulate auth middleware)
			ctx := req.Context()
			ctx = auth.AddUserToContext(ctx, user)
			req = req.WithContext(ctx)

			recorder := httptest.NewRecorder()

			// Call handler
			handler.HandleAgentByID(recorder, req)

			// Check response
			assert.Equal(t, tt.expectedStatus, recorder.Code)

			if !tt.expectError {
				// Verify agent was deleted
				_, err := handler.getAgentByID(user.ID, tt.agentID)
				assert.Error(t, err)
				assert.Equal(t, sql.ErrNoRows, err)
			}
		})
	}
}

// TestHandler_GetAgentExecutions tests getting executions for an agent
func TestHandler_GetAgentExecutions(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	authService := auth.NewService(db, "test-secret")
	user, token := createTestUser(t, authService)
	templateID := createTestTemplate(t, db, user.ID)

	handler := NewHandler(db)

	// Create test agent
	agent := &types.Agent{
		ID:               "test-agent-id",
		UserID:           user.ID,
		FirstName:        "John",
		LastName:         "Doe",
		TemplateID:       templateID,
		MaxTokensPerDay:  1000,
		HeartbeatMinutes: 10,
		LifecycleStatus:  types.LifecycleStatusStandby,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	require.NoError(t, handler.insertAgent(agent))

	tests := []struct {
		name           string
		agentID        string
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "Get executions for existing agent",
			agentID:        "test-agent-id",
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:           "Get executions for non-existent agent",
			agentID:        "non-existent-agent",
			expectedStatus: http.StatusNotFound,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/agents/"+tt.agentID+"/executions", nil)
			req.Header.Set("Authorization", "Bearer "+token)

			// Add user to context (simulate auth middleware)
			ctx := req.Context()
			ctx = auth.AddUserToContext(ctx, user)
			req = req.WithContext(ctx)

			recorder := httptest.NewRecorder()

			// Call handler
			handler.HandleAgentByID(recorder, req)

			// Check response
			assert.Equal(t, tt.expectedStatus, recorder.Code)

			if !tt.expectError {
				var executions []types.ExecutionRun
				err := json.Unmarshal(recorder.Body.Bytes(), &executions)
				require.NoError(t, err)

				// Should return an empty array for new agent
				assert.IsType(t, []types.ExecutionRun{}, executions)
			}
		})
	}
}

// TestHandler_ValidationErrors tests various validation scenarios
func TestHandler_ValidationErrors(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	handler := NewHandler(db)

	tests := []struct {
		name    string
		request types.AgentCreateRequest
		wantErr bool
		errMsg  string
	}{
		{
			name: "Empty first name",
			request: types.AgentCreateRequest{
				FirstName:        "",
				LastName:         "Doe",
				TemplateID:       "template-id",
				MaxTokensPerDay:  1000,
				HeartbeatMinutes: 10,
			},
			wantErr: true,
			errMsg:  "firstName is required",
		},
		{
			name: "Empty last name",
			request: types.AgentCreateRequest{
				FirstName:        "John",
				LastName:         "",
				TemplateID:       "template-id",
				MaxTokensPerDay:  1000,
				HeartbeatMinutes: 10,
			},
			wantErr: true,
			errMsg:  "lastName is required",
		},
		{
			name: "Empty template ID",
			request: types.AgentCreateRequest{
				FirstName:        "John",
				LastName:         "Doe",
				TemplateID:       "",
				MaxTokensPerDay:  1000,
				HeartbeatMinutes: 10,
			},
			wantErr: true,
			errMsg:  "templateId is required",
		},
		{
			name: "Zero max tokens per day",
			request: types.AgentCreateRequest{
				FirstName:        "John",
				LastName:         "Doe",
				TemplateID:       "template-id",
				MaxTokensPerDay:  0,
				HeartbeatMinutes: 10,
			},
			wantErr: true,
			errMsg:  "maxTokensPerDay must be greater than 0",
		},
		{
			name: "Negative max tokens per day",
			request: types.AgentCreateRequest{
				FirstName:        "John",
				LastName:         "Doe",
				TemplateID:       "template-id",
				MaxTokensPerDay:  -100,
				HeartbeatMinutes: 10,
			},
			wantErr: true,
			errMsg:  "maxTokensPerDay must be greater than 0",
		},
		{
			name: "Heartbeat minutes too low",
			request: types.AgentCreateRequest{
				FirstName:        "John",
				LastName:         "Doe",
				TemplateID:       "template-id",
				MaxTokensPerDay:  1000,
				HeartbeatMinutes: 2,
			},
			wantErr: true,
			errMsg:  "heartbeatMinutes must be at least 5",
		},
		{
			name: "Invalid lifecycle status",
			request: types.AgentCreateRequest{
				FirstName:        "John",
				LastName:         "Doe",
				TemplateID:       "template-id",
				MaxTokensPerDay:  1000,
				HeartbeatMinutes: 10,
				LifecycleStatus:  types.LifecycleStatus("INVALID"),
			},
			wantErr: true,
			errMsg:  "invalid lifecycleStatus",
		},
		{
			name: "Valid request",
			request: types.AgentCreateRequest{
				FirstName:        "John",
				LastName:         "Doe",
				TemplateID:       "template-id",
				MaxTokensPerDay:  1000,
				HeartbeatMinutes: 10,
				LifecycleStatus:  types.LifecycleStatusStandby,
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := handler.validateCreateRequest(&tt.request)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestHandler_DatabaseOperations tests the database operations directly
func TestHandler_DatabaseOperations(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	authService := auth.NewService(db, "test-secret")
	user, _ := createTestUser(t, authService)
	templateID := createTestTemplate(t, db, user.ID)

	handler := NewHandler(db)

	// Test insertAgent
	agent := &types.Agent{
		ID:               "test-agent-id",
		UserID:           user.ID,
		FirstName:        "John",
		LastName:         "Doe",
		TemplateID:       templateID,
		MaxTokensPerDay:  1000,
		HeartbeatMinutes: 10,
		LifecycleStatus:  types.LifecycleStatusStandby,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	err := handler.insertAgent(agent)
	assert.NoError(t, err)

	// Test getAgentByID
	retrievedAgent, err := handler.getAgentByID(user.ID, agent.ID)
	assert.NoError(t, err)
	assert.Equal(t, agent.ID, retrievedAgent.ID)
	assert.Equal(t, agent.FirstName, retrievedAgent.FirstName)
	assert.Equal(t, agent.LastName, retrievedAgent.LastName)

	// Test getAgents
	agents, err := handler.getAgents(user.ID)
	assert.NoError(t, err)
	assert.Len(t, agents, 1)
	assert.Equal(t, agent.ID, agents[0].ID)

	// Test updateAgentFields
	newFirstName := "Jane"
	updateReq := &types.AgentUpdateRequest{
		FirstName: &newFirstName,
	}
	err = handler.updateAgentFields(user.ID, agent.ID, updateReq)
	assert.NoError(t, err)

	// Verify update
	updatedAgent, err := handler.getAgentByID(user.ID, agent.ID)
	assert.NoError(t, err)
	assert.Equal(t, newFirstName, updatedAgent.FirstName)

	// Test deleteAgentByID
	err = handler.deleteAgentByID(user.ID, agent.ID)
	assert.NoError(t, err)

	// Verify deletion
	_, err = handler.getAgentByID(user.ID, agent.ID)
	assert.Error(t, err)
	assert.Equal(t, sql.ErrNoRows, err)
}

// Benchmark tests for performance
func BenchmarkHandler_CreateAgent(b *testing.B) {
	db := setupTestDB(&testing.T{})
	if db == nil {
		b.Skip("Database not available")
	}
	defer db.Close()

	authService := auth.NewService(db, "test-secret")
	user, _ := createTestUser(&testing.T{}, authService)
	templateID := createTestTemplate(&testing.T{}, db, user.ID)

	handler := NewHandler(db)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		agent := &types.Agent{
			ID:               fmt.Sprintf("bench-agent-%d", i),
			UserID:           user.ID,
			FirstName:        "John",
			LastName:         "Doe",
			TemplateID:       templateID,
			MaxTokensPerDay:  1000,
			HeartbeatMinutes: 10,
			LifecycleStatus:  types.LifecycleStatusStandby,
			TokensUsedToday:  0,
			TokensResetDate:  time.Now().Format("2006-01-02"),
			TotalExecutions:  0,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}
		handler.insertAgent(agent)
	}
}

func BenchmarkHandler_GetAgent(b *testing.B) {
	db := setupTestDB(&testing.T{})
	if db == nil {
		b.Skip("Database not available")
	}
	defer db.Close()

	authService := auth.NewService(db, "test-secret")
	user, _ := createTestUser(&testing.T{}, authService)
	templateID := createTestTemplate(&testing.T{}, db, user.ID)

	handler := NewHandler(db)

	// Create test agent
	agent := &types.Agent{
		ID:               "bench-agent",
		UserID:           user.ID,
		FirstName:        "John",
		LastName:         "Doe",
		TemplateID:       templateID,
		MaxTokensPerDay:  1000,
		HeartbeatMinutes: 10,
		LifecycleStatus:  types.LifecycleStatusStandby,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	handler.insertAgent(agent)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		handler.getAgentByID(user.ID, agent.ID)
	}
}
