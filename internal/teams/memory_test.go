package teams

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"gogent/internal/auth"
	"gogent/internal/types"

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTeamMemoryOperations(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		t.Skip("Database setup failed")
	}
	defer db.Close()

	handler := NewTeamsHandler(db)

	// Create test user
	testUserEmail := "team-memory@test.com"
	testUser := &auth.User{
		ID:       "test-user-team-memory",
		Username: "teammemoryuser",
		Email:    &testUserEmail,
	}

	// Create test team
	testTeam := &types.Team{
		ID:               "test-team-memory",
		UserID:           testUser.ID,
		Name:             "Memory Test Team",
		Description:      nil,
		MaxTokensPerDay:  50000,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		AgentCount:       0,
		ActiveAgentCount: 0,
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// Create test agent
	testAgent := &types.Agent{
		ID:               "test-agent-team-memory",
		UserID:           testUser.ID,
		FirstName:        "Team",
		LastName:         "MemoryAgent",
		TemplateID:       "test-template",
		TeamID:           &testTeam.ID,
		MaxTokensPerDay:  1000,
		HeartbeatMinutes: 5,
		LifecycleStatus:  types.LifecycleStatusActive,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// Insert test data
	err := handler.createTeamInDB(*testTeam)
	require.NoError(t, err)

	err = handler.insertAgent(testAgent)
	require.NoError(t, err)

	t.Run("InitializeTeamMemory", func(t *testing.T) {
		memory, err := handler.InitializeTeamMemory(testTeam.ID)
		assert.NoError(t, err)
		assert.NotNil(t, memory)
		assert.Equal(t, "1.0", memory.Version)
		assert.NotNil(t, memory.Contexts)
		assert.NotNil(t, memory.Contexts.Workflow)
		assert.NotNil(t, memory.Contexts.Session)
		assert.NotNil(t, memory.Contexts.Persistent)
		assert.NotNil(t, memory.Contexts.Shared)
		assert.Equal(t, 0, len(memory.Relationships))
		assert.Equal(t, int32(0), memory.Metadata.SizeBytes)
		assert.Equal(t, int32(0), memory.Metadata.AccessCount)
	})

	t.Run("WriteTeamMemory", func(t *testing.T) {
		ctx := context.Background()

		// Write workflow data
		request := &types.TeamMemoryRequest{
			TeamID:  testTeam.ID,
			AgentID: testAgent.ID,
			Context: "workflow",
			Data: map[string]interface{}{
				"current_step": "data_analysis",
				"progress":     75,
				"team_status":  "active",
			},
			MergeStrategy: "merge",
		}

		response, err := handler.WriteTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.Contains(t, response.Data, "written")

		// Write shared data
		request.Context = "shared"
		request.Data = map[string]interface{}{
			"team_preferences": map[string]interface{}{
				"output_format": "detailed",
				"notifications": true,
			},
			"collaboration_settings": map[string]interface{}{
				"auto_sync":     true,
				"sync_interval": 300,
			},
		}

		response, err = handler.WriteTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)

		// Write persistent data
		request.Context = "persistent"
		request.Data = map[string]interface{}{
			"learned_patterns": map[string]interface{}{
				"team_workflow_preferences": []string{"parallel_processing", "batch_operations"},
				"common_errors":             []string{"timeout_on_large_datasets", "memory_overflow"},
				"successful_strategies":     []string{"incremental_processing", "caching"},
			},
		}

		response, err = handler.WriteTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
	})

	t.Run("ReadTeamMemory", func(t *testing.T) {
		ctx := context.Background()

		// Read all memory
		request := &types.TeamMemoryRequest{
			TeamID:  testTeam.ID,
			AgentID: testAgent.ID,
			Context: "all",
		}

		response, err := handler.ReadTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.Contains(t, response.Data, "contexts")

		// Read specific context
		request.Context = "workflow"
		response, err = handler.ReadTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.Contains(t, response.Data, "workflow")

		// Read shared context
		request.Context = "shared"
		response, err = handler.ReadTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.Contains(t, response.Data, "shared")

		// Read specific path
		request.Context = "workflow"
		request.Path = "workflow.current_step"
		response, err = handler.ReadTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.Contains(t, response.Data, "result")
	})

	t.Run("SearchTeamMemory", func(t *testing.T) {
		ctx := context.Background()

		request := &types.TeamMemoryRequest{
			TeamID:      testTeam.ID,
			AgentID:     testAgent.ID,
			SearchQuery: "data_analysis",
			Limit:       10,
		}

		response, err := handler.SearchTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.NotNil(t, response.Results)

		// Search for team preferences
		request.SearchQuery = "preferences"
		response, err = handler.SearchTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
	})

	t.Run("ClearTeamMemory", func(t *testing.T) {
		ctx := context.Background()

		// Clear session context
		request := &types.TeamMemoryRequest{
			TeamID:  testTeam.ID,
			AgentID: testAgent.ID,
			Context: "clear_context",
			Path:    "session",
		}

		response, err := handler.ClearTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.Contains(t, response.Data, "message")

		// Clear all memory
		request.Context = "clear_all"
		response, err = handler.ClearTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
	})

	t.Run("AccessDeniedForNonMember", func(t *testing.T) {
		ctx := context.Background()

		// Create another agent that's not a member of the team
		nonMemberAgent := &types.Agent{
			ID:               "non-member-agent",
			UserID:           testUser.ID,
			FirstName:        "NonMember",
			LastName:         "Agent",
			TemplateID:       "test-template",
			TeamID:           nil, // Not a member of any team
			MaxTokensPerDay:  1000,
			HeartbeatMinutes: 5,
			LifecycleStatus:  types.LifecycleStatusActive,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}

		err := handler.insertAgent(nonMemberAgent)
		require.NoError(t, err)

		request := &types.TeamMemoryRequest{
			TeamID:  testTeam.ID,
			AgentID: nonMemberAgent.ID,
			Context: "workflow",
			Data:    map[string]interface{}{"test": "data"},
		}

		response, err := handler.WriteTeamMemory(ctx, testTeam.ID, nonMemberAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.False(t, response.Success)
		assert.Contains(t, response.Error, "Access denied")
	})

	t.Run("TeamMemoryPersistence", func(t *testing.T) {
		ctx := context.Background()

		// Write some data
		writeReq := &types.TeamMemoryRequest{
			TeamID:  testTeam.ID,
			AgentID: testAgent.ID,
			Context: "persistent",
			Data: map[string]interface{}{
				"team_patterns": map[string]interface{}{
					"prefers_collaborative_work": true,
					"common_workflows":           []string{"parallel_processing", "sequential_analysis"},
					"active_hours":               "9AM-6PM PST",
				},
			},
		}

		response, err := handler.WriteTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, writeReq)
		assert.NoError(t, err)
		assert.True(t, response.Success)

		// Retrieve the team to verify memory was saved
		team, err := handler.getTeamByID(testTeam.ID, testUser.ID)
		assert.NoError(t, err)
		assert.NotNil(t, team.Memory)
		assert.Greater(t, team.MemorySizeBytes, int32(0))
		assert.NotNil(t, team.MemoryUpdatedAt)

		// Verify the memory structure
		assert.Equal(t, "1.0", team.Memory.Version)
		assert.NotNil(t, team.Memory.Contexts.Persistent)
		assert.Contains(t, team.Memory.Contexts.Persistent, "team_patterns")
	})
}

func TestTeamMemoryHTTPHandlers(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		t.Skip("Database setup failed")
	}
	defer db.Close()

	handler := NewTeamsHandler(db)

	// Create test user and team
	testUserEmail := "http-team@test.com"
	testUser := &auth.User{
		ID:       "test-user-http-team",
		Username: "httpteamuser",
		Email:    &testUserEmail,
	}

	testTeam := &types.Team{
		ID:               "test-team-http",
		UserID:           testUser.ID,
		Name:             "HTTP Test Team",
		Description:      nil,
		MaxTokensPerDay:  50000,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		AgentCount:       0,
		ActiveAgentCount: 0,
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	testAgent := &types.Agent{
		ID:               "test-agent-http-team",
		UserID:           testUser.ID,
		FirstName:        "HTTP",
		LastName:         "TeamAgent",
		TemplateID:       "test-template",
		TeamID:           &testTeam.ID,
		MaxTokensPerDay:  1000,
		HeartbeatMinutes: 5,
		LifecycleStatus:  types.LifecycleStatusActive,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	err := handler.createTeamInDB(*testTeam)
	require.NoError(t, err)

	err = handler.insertAgent(testAgent)
	require.NoError(t, err)

	t.Run("WriteTeamMemoryHTTP", func(t *testing.T) {
		requestBody := types.TeamMemoryRequest{
			TeamID:  testTeam.ID,
			AgentID: testAgent.ID,
			Context: "workflow",
			Data: map[string]interface{}{
				"test_data": "test_value",
				"number":    42,
			},
			MergeStrategy: "merge",
		}

		body, _ := json.Marshal(requestBody)
		req := httptest.NewRequest("POST", "/api/teams/test-team-http/memory/write", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		// Add user to context
		ctx := auth.AddUserToContext(req.Context(), testUser)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		pathParts := []string{"api", "teams", "test-team-http", "memory", "write"}
		handler.handleTeamMemory(rr, req, testTeam.ID, pathParts)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response types.TeamMemoryResponse
		err := json.Unmarshal(rr.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response.Success)
	})

	t.Run("ReadTeamMemoryHTTP", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/teams/test-team-http/memory/read?context=all", nil)

		// Add user to context
		ctx := auth.AddUserToContext(req.Context(), testUser)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		pathParts := []string{"api", "teams", "test-team-http", "memory", "read"}
		handler.handleTeamMemory(rr, req, testTeam.ID, pathParts)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response types.TeamMemoryResponse
		err := json.Unmarshal(rr.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response.Success)
	})

	// Helper function to reduce duplication in HTTP tests
	testTeamMemoryHTTP := func(t *testing.T, requestBody types.TeamMemoryRequest, endpoint string) {
		body, _ := json.Marshal(requestBody)
		req := httptest.NewRequest("POST", fmt.Sprintf("/api/teams/test-team-http/memory/%s", endpoint), bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		// Add user to context
		ctx := auth.AddUserToContext(req.Context(), testUser)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		pathParts := []string{"api", "teams", "test-team-http", "memory", endpoint}
		handler.handleTeamMemory(rr, req, testTeam.ID, pathParts)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response types.TeamMemoryResponse
		err := json.Unmarshal(rr.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response.Success)
	}

	t.Run("SearchTeamMemoryHTTP", func(t *testing.T) {
		requestBody := types.TeamMemoryRequest{
			TeamID:      testTeam.ID,
			AgentID:     testAgent.ID,
			SearchQuery: "test_data",
			Limit:       10,
		}
		testTeamMemoryHTTP(t, requestBody, "search")
	})

	t.Run("ClearTeamMemoryHTTP", func(t *testing.T) {
		requestBody := types.TeamMemoryRequest{
			TeamID:  testTeam.ID,
			AgentID: testAgent.ID,
			Context: "clear_context",
			Path:    "session",
		}
		testTeamMemoryHTTP(t, requestBody, "clear")
	})
}

func BenchmarkTeamMemoryOperations(b *testing.B) {
	if os.Getenv("SKIP_BENCHMARKS") == "true" {
		b.Skip("Benchmarks disabled")
	}

	db := setupTestDB(&testing.T{})
	if db == nil {
		b.Skip("Database setup failed")
	}
	defer db.Close()

	handler := NewTeamsHandler(db)

	// Setup test data
	testUserEmail := "bench-team@test.com"
	testUser := &auth.User{ID: "benchmark-team-user", Username: "benchteamuser", Email: &testUserEmail}
	testTeam := &types.Team{
		ID:               "benchmark-team",
		UserID:           testUser.ID,
		Name:             "Benchmark Team",
		Description:      nil,
		MaxTokensPerDay:  50000,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		AgentCount:       0,
		ActiveAgentCount: 0,
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	testAgent := &types.Agent{
		ID:               "benchmark-team-agent",
		UserID:           testUser.ID,
		FirstName:        "Benchmark",
		LastName:         "TeamAgent",
		TemplateID:       "test-template",
		TeamID:           &testTeam.ID,
		MaxTokensPerDay:  10000,
		HeartbeatMinutes: 5,
		LifecycleStatus:  types.LifecycleStatusActive,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	err := handler.createTeamInDB(*testTeam)
	if err != nil {
		b.Fatalf("Failed to create test team: %v", err)
	}

	err = handler.insertAgent(testAgent)
	if err != nil {
		b.Fatalf("Failed to create test agent: %v", err)
	}

	ctx := context.Background()

	b.Run("WriteTeamMemory", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			request := &types.TeamMemoryRequest{
				TeamID:  testTeam.ID,
				AgentID: testAgent.ID,
				Context: "session",
				Data: map[string]interface{}{
					"iteration": i,
					"timestamp": time.Now().Format(time.RFC3339),
					"data":      "some test data for team memory benchmarking",
				},
			}

			_, err := handler.WriteTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
			if err != nil {
				b.Fatalf("WriteTeamMemory failed: %v", err)
			}
		}
	})

	b.Run("ReadTeamMemory", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			request := &types.TeamMemoryRequest{
				TeamID:  testTeam.ID,
				AgentID: testAgent.ID,
				Context: "all",
			}

			_, err := handler.ReadTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
			if err != nil {
				b.Fatalf("ReadTeamMemory failed: %v", err)
			}
		}
	})

	b.Run("SearchTeamMemory", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			request := &types.TeamMemoryRequest{
				TeamID:      testTeam.ID,
				AgentID:     testAgent.ID,
				SearchQuery: "test data",
				Limit:       10,
			}

			_, err := handler.SearchTeamMemory(ctx, testTeam.ID, testAgent.ID, testUser.ID, request)
			if err != nil {
				b.Fatalf("SearchTeamMemory failed: %v", err)
			}
		}
	})
}

// Helper function to set up test database
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

// Helper function to insert test agent
func (h *TeamsHandler) insertAgent(agent *types.Agent) error {
	query := `
		INSERT INTO agents (id, user_id, team_id, first_name, last_name, template_id, max_tokens_per_day, tokens_used_today, tokens_reset_date, total_executions, lifecycle_status, heartbeat_minutes, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := h.db.Exec(query,
		agent.ID,
		agent.UserID,
		agent.TeamID,
		agent.FirstName,
		agent.LastName,
		agent.TemplateID,
		agent.MaxTokensPerDay,
		agent.TokensUsedToday,
		agent.TokensResetDate,
		agent.TotalExecutions,
		agent.LifecycleStatus,
		agent.HeartbeatMinutes,
		agent.CreatedAt,
		agent.UpdatedAt,
	)

	return err
}

// Test the convertToTeamTask function to prevent nil pointer issues
func TestConvertToTeamTask(t *testing.T) {
	tests := []struct {
		name      string
		input     interface{}
		expectErr bool
	}{
		{
			name: "Valid TeamTask pointer",
			input: &types.TeamTask{
				ID:          "task-123",
				Title:       "Test Task",
				Description: "Test Description",
				Status:      types.TaskStatusPending,
				Priority:    types.TaskPriorityMedium,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			},
			expectErr: false,
		},
		{
			name: "Valid TeamTask struct",
			input: types.TeamTask{
				ID:          "task-456",
				Title:       "Another Task",
				Description: "Another Description",
				Status:      types.TaskStatusCompleted,
				Priority:    types.TaskPriorityHigh,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			},
			expectErr: false,
		},
		{
			name: "Map from JSON unmarshaling",
			input: map[string]interface{}{
				"id":          "task-789",
				"title":       "Map Task",
				"description": "From Map",
				"status":      "pending",
				"priority":    "low",
				"created_at":  "2024-01-01T00:00:00Z",
				"updated_at":  "2024-01-01T00:00:00Z",
			},
			expectErr: false,
		},
		{
			name:      "Invalid type - string",
			input:     "invalid",
			expectErr: true,
		},
		{
			name:      "Invalid type - nil",
			input:     nil,
			expectErr: true,
		},
		{
			name:      "Invalid type - integer",
			input:     123,
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := convertToTeamTask(tt.input)

			if tt.expectErr {
				assert.Error(t, err, "Expected error for input: %v", tt.input)
				assert.Nil(t, result, "Expected nil result for invalid input")
			} else {
				assert.NoError(t, err, "Expected no error for valid input: %v", tt.input)
				assert.NotNil(t, result, "Expected non-nil result for valid input")
				assert.NotEmpty(t, result.ID, "Expected task to have ID")
			}
		})
	}
}

// Test that task storage and retrieval works correctly with marshaling
func TestTaskMarshalingUnmarshaling(t *testing.T) {
	// Create a test task
	originalTask := types.TeamTask{
		ID:          "test-marshaling-123",
		Title:       "Marshaling Test Task",
		Description: "Test marshaling and unmarshaling",
		Status:      types.TaskStatusPending,
		Priority:    types.TaskPriorityMedium,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Create a memory structure like the one used in the system
	memory := &types.TeamMemory{
		Version: "1.0",
		Contexts: types.TeamMemoryContexts{
			Shared: map[string]interface{}{
				"tasks": map[string]interface{}{
					originalTask.ID: originalTask, // Store as struct (like we do)
				},
			},
		},
		Metadata: types.MemoryMetadata{
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	// Marshal to JSON (simulating database storage)
	memoryJSON, err := json.Marshal(memory)
	assert.NoError(t, err, "Failed to marshal memory to JSON")

	// Unmarshal from JSON (simulating database retrieval)
	var retrievedMemory types.TeamMemory
	err = json.Unmarshal(memoryJSON, &retrievedMemory)
	assert.NoError(t, err, "Failed to unmarshal memory from JSON")

	// Now test that we can convert the task data correctly
	tasksMap, ok := retrievedMemory.Contexts.Shared["tasks"].(map[string]interface{})
	assert.True(t, ok, "Tasks map should exist")

	taskData, exists := tasksMap[originalTask.ID]
	assert.True(t, exists, "Task should exist in map")

	// This is the critical test - convert the taskData using our helper function
	convertedTask, err := convertToTeamTask(taskData)
	assert.NoError(t, err, "convertToTeamTask should handle JSON-unmarshaled data")
	assert.NotNil(t, convertedTask, "Converted task should not be nil")

	// Verify the task data is correct
	assert.Equal(t, originalTask.ID, convertedTask.ID)
	assert.Equal(t, originalTask.Title, convertedTask.Title)
	assert.Equal(t, originalTask.Description, convertedTask.Description)
	assert.Equal(t, string(originalTask.Status), string(convertedTask.Status))
	assert.Equal(t, string(originalTask.Priority), string(convertedTask.Priority))
}

func TestAgentTaskOperations(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		t.Skip("Database setup failed")
	}
	defer db.Close()

	handler := NewTeamsHandler(db)
	ctx := context.Background()

	// Create test user
	testUserEmail := "agent-task@test.com"
	testUser := &auth.User{
		ID:       "test-user-agent-task",
		Username: "agenttaskuser",
		Email:    &testUserEmail,
	}

	// Create test team
	testTeam := &types.Team{
		ID:               "test-team-agent-task",
		UserID:           testUser.ID,
		Name:             "Agent Task Test Team",
		Description:      nil,
		MaxTokensPerDay:  50000,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		AgentCount:       1,
		ActiveAgentCount: 1,
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		MemorySizeBytes:  0,
	}

	// Create test agent to associate with the team
	testAgent := &types.Agent{
		ID:               "test-agent-1",
		UserID:           testUser.ID,
		FirstName:        "Agent",
		LastName:         "TaskAgent",
		TemplateID:       "test-template",
		TeamID:           &testTeam.ID,
		MaxTokensPerDay:  1000,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		HeartbeatMinutes: 5,
		LifecycleStatus:  types.LifecycleStatusActive,
		TotalExecutions:  0,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		MemorySizeBytes:  0,
	}

	// Insert test data
	err := handler.createTeamInDB(*testTeam)
	require.NoError(t, err)

	err = handler.insertAgent(testAgent)
	require.NoError(t, err)

	agentID := "test-agent-1"
	teamID := testTeam.ID
	userID := testUser.ID

	// Test 1: Store agent task
	taskID1 := "task-reported-123"
	storeRequest := &types.TeamTaskRequest{
		TaskID: taskID1,
		Metadata: map[string]interface{}{
			"title":                "Test Task Completion",
			"last_reported_status": "completed",
			"reported_at":          time.Now().Format(time.RFC3339),
			"context":              "reported_tasks",
			"metadata": map[string]interface{}{
				"slack_channel": "#ai-code-updates",
				"artifacts":     []string{"PR#456"},
			},
		},
	}

	storeResponse, err := handler.StoreAgentTask(ctx, teamID, agentID, userID, storeRequest)
	require.NoError(t, err)
	assert.True(t, storeResponse.Success)
	assert.Equal(t, taskID1, storeResponse.Data["task_id"])
	assert.Equal(t, "reported_tasks", storeResponse.Data["context"])

	// Test 2: List agent tasks
	listRequest := &types.TeamTaskRequest{
		Metadata: map[string]interface{}{
			"context": "reported_tasks",
		},
	}

	listResponse, err := handler.ListAgentTasks(ctx, teamID, agentID, userID, listRequest)
	require.NoError(t, err)
	assert.True(t, listResponse.Success)

	tasks := listResponse.Data["tasks"].([]interface{})
	assert.Equal(t, 1, len(tasks))

	task := tasks[0].(map[string]interface{})
	assert.Equal(t, taskID1, task["task_id"])

	taskData := task["task_data"].(map[string]interface{})
	assert.Equal(t, "Test Task Completion", taskData["title"])

	// Test 3: Store another task in different context
	taskID2 := "task-summary-456"
	storeRequest2 := &types.TeamTaskRequest{
		TaskID: taskID2,
		Metadata: map[string]interface{}{
			"context":           "summary_tracking",
			"last_summary_time": time.Now().Format(time.RFC3339),
			"summary_type":      "daily",
		},
	}

	storeResponse2, err := handler.StoreAgentTask(ctx, teamID, agentID, userID, storeRequest2)
	require.NoError(t, err)
	assert.True(t, storeResponse2.Success)
	assert.Equal(t, "summary_tracking", storeResponse2.Data["context"])

	// Test 4: List tasks from different context
	listRequest2 := &types.TeamTaskRequest{
		Metadata: map[string]interface{}{
			"context": "summary_tracking",
		},
	}

	listResponse2, err := handler.ListAgentTasks(ctx, teamID, agentID, userID, listRequest2)
	require.NoError(t, err)
	assert.True(t, listResponse2.Success)

	summaryTasks := listResponse2.Data["tasks"].([]interface{})
	assert.Equal(t, 1, len(summaryTasks))

	// Test 5: Verify contexts are isolated
	listOriginalContext, err := handler.ListAgentTasks(ctx, teamID, agentID, userID, listRequest)
	require.NoError(t, err)
	assert.True(t, listOriginalContext.Success)

	originalTasks := listOriginalContext.Data["tasks"].([]interface{})
	assert.Equal(t, 1, len(originalTasks)) // Should still have only 1 task

	// Test 6: Delete agent task
	deleteRequest := &types.TeamTaskRequest{
		TaskID: taskID1,
		Metadata: map[string]interface{}{
			"context": "reported_tasks",
		},
	}

	deleteResponse, err := handler.DeleteAgentTask(ctx, teamID, agentID, userID, deleteRequest)
	require.NoError(t, err)
	assert.True(t, deleteResponse.Success)
	assert.Equal(t, taskID1, deleteResponse.Data["task_id"])

	// Test 7: Verify task was deleted
	listAfterDelete, err := handler.ListAgentTasks(ctx, teamID, agentID, userID, listRequest)
	require.NoError(t, err)
	assert.True(t, listAfterDelete.Success)

	tasksAfterDelete := listAfterDelete.Data["tasks"].([]interface{})
	assert.Equal(t, 0, len(tasksAfterDelete))

	// Test 8: Try to delete non-existent task
	deleteNonExistent := &types.TeamTaskRequest{
		TaskID: "non-existent-task",
		Metadata: map[string]interface{}{
			"context": "reported_tasks",
		},
	}

	deleteNonExistentResponse, err := handler.DeleteAgentTask(ctx, teamID, agentID, userID, deleteNonExistent)
	require.NoError(t, err)
	assert.False(t, deleteNonExistentResponse.Success)
	assert.Contains(t, deleteNonExistentResponse.Error, "not found")

	// Test 9: Test with empty context (should use default)
	taskID3 := "task-default-context"
	storeDefaultContext := &types.TeamTaskRequest{
		TaskID: taskID3,
		Metadata: map[string]interface{}{
			"title": "Default Context Task",
		},
	}

	storeDefaultResponse, err := handler.StoreAgentTask(ctx, teamID, agentID, userID, storeDefaultContext)
	require.NoError(t, err)
	assert.True(t, storeDefaultResponse.Success)
	assert.Equal(t, "reported_tasks", storeDefaultResponse.Data["context"]) // Should default to reported_tasks

	// Test 10: Test access control (wrong team ID)
	wrongTeamResponse, err := handler.StoreAgentTask(ctx, "wrong-team-id", agentID, userID, storeRequest)
	require.NoError(t, err)
	assert.False(t, wrongTeamResponse.Success)
	assert.Contains(t, wrongTeamResponse.Error, "Team not found")
}
