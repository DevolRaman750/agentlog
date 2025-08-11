package teams

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"gogent/internal/auth"
	"gogent/internal/types"

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

	t.Run("SearchTeamMemoryHTTP", func(t *testing.T) {
		requestBody := types.TeamMemoryRequest{
			TeamID:      testTeam.ID,
			AgentID:     testAgent.ID,
			SearchQuery: "test_data",
			Limit:       10,
		}

		body, _ := json.Marshal(requestBody)
		req := httptest.NewRequest("POST", "/api/teams/test-team-http/memory/search", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		// Add user to context
		ctx := auth.AddUserToContext(req.Context(), testUser)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		pathParts := []string{"api", "teams", "test-team-http", "memory", "search"}
		handler.handleTeamMemory(rr, req, testTeam.ID, pathParts)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response types.TeamMemoryResponse
		err := json.Unmarshal(rr.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response.Success)
	})

	t.Run("ClearTeamMemoryHTTP", func(t *testing.T) {
		requestBody := types.TeamMemoryRequest{
			TeamID:  testTeam.ID,
			AgentID: testAgent.ID,
			Context: "clear_context",
			Path:    "session",
		}

		body, _ := json.Marshal(requestBody)
		req := httptest.NewRequest("POST", "/api/teams/test-team-http/memory/clear", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		// Add user to context
		ctx := auth.AddUserToContext(req.Context(), testUser)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		pathParts := []string{"api", "teams", "test-team-http", "memory", "clear"}
		handler.handleTeamMemory(rr, req, testTeam.ID, pathParts)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response types.TeamMemoryResponse
		err := json.Unmarshal(rr.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response.Success)
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
	// This would need to be implemented based on your test database setup
	// For now, return nil to skip tests if database is not available
	return nil
}

// Helper function to insert test agent
func (h *TeamsHandler) insertAgent(agent *types.Agent) error {
	// This would need to be implemented based on your database structure
	// For now, return nil to skip tests
	return nil
}
