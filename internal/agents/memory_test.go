package agents

import (
	"bytes"
	"context"
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

func TestAgentMemoryOperations(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		t.Skip("Database setup failed")
	}
	defer db.Close()

	handler := NewAgentsHandler(db)

	// Create test user
	testUserEmail := "memory@test.com"
	testUser := &auth.User{
		ID:       "test-user-memory",
		Username: "memoryuser",
		Email:    &testUserEmail,
	}

	// Create test agent
	testAgent := &types.Agent{
		ID:               "test-agent-memory",
		UserID:           testUser.ID,
		FirstName:        "Memory",
		LastName:         "TestAgent",
		TemplateID:       "test-template",
		MaxTokensPerDay:  1000,
		HeartbeatMinutes: 5,
		LifecycleStatus:  types.LifecycleStatusActive,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// Insert test data
	err := handler.insertAgent(testAgent)
	require.NoError(t, err)

	t.Run("InitializeMemory", func(t *testing.T) {
		memory, err := handler.InitializeMemory(testAgent.ID)
		assert.NoError(t, err)
		assert.NotNil(t, memory)
		assert.Equal(t, "1.0", memory.Version)
		assert.NotNil(t, memory.Contexts)
		assert.NotNil(t, memory.Contexts.Workflow)
		assert.NotNil(t, memory.Contexts.Session)
		assert.NotNil(t, memory.Contexts.Persistent)
		assert.Equal(t, 0, len(memory.Relationships))
	})

	t.Run("WriteMemory", func(t *testing.T) {
		ctx := context.Background()

		// Test writing to workflow context
		request := &types.AgentMemoryRequest{
			AgentID: testAgent.ID,
			Context: "workflow",
			Data: map[string]interface{}{
				"current_step": "data_analysis",
				"progress":     "50%",
				"started_at":   time.Now().Format(time.RFC3339),
			},
			MergeStrategy: "merge",
		}

		response, err := handler.WriteMemory(ctx, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.Contains(t, response.Data, "written")

		// Test writing to session context
		request.Context = "session"
		request.Data = map[string]interface{}{
			"user_preferences": map[string]interface{}{
				"format":        "detailed",
				"notifications": true,
			},
		}

		response, err = handler.WriteMemory(ctx, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)

		// Test writing to persistent context
		request.Context = "persistent"
		request.Data = map[string]interface{}{
			"learned_patterns": map[string]interface{}{
				"user_behavior": "prefers_summaries",
				"common_errors": []string{"timeout", "connection_error"},
			},
		}

		response, err = handler.WriteMemory(ctx, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
	})

	t.Run("ReadMemory", func(t *testing.T) {
		ctx := context.Background()

		// Read all memory
		request := &types.AgentMemoryRequest{
			AgentID: testAgent.ID,
			Context: "all",
		}

		response, err := handler.ReadMemory(ctx, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.Contains(t, response.Data, "contexts")

		// Read specific context
		request.Context = "workflow"
		response, err = handler.ReadMemory(ctx, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.Contains(t, response.Data, "workflow")

		// Read specific path
		request.Path = "workflow.current_step"
		response, err = handler.ReadMemory(ctx, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.Contains(t, response.Data, "result")
	})

	t.Run("SearchMemory", func(t *testing.T) {
		ctx := context.Background()

		request := &types.AgentMemoryRequest{
			AgentID:     testAgent.ID,
			SearchQuery: "data_analysis",
			Limit:       10,
		}

		response, err := handler.SearchMemory(ctx, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.NotNil(t, response.Results)

		// Search for user preferences
		request.SearchQuery = "preferences"
		response, err = handler.SearchMemory(ctx, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)
	})

	t.Run("ClearMemory", func(t *testing.T) {
		ctx := context.Background()

		// Clear workflow context
		request := &types.AgentMemoryRequest{
			AgentID: testAgent.ID,
			Context: "clear_context",
			Path:    "workflow",
		}

		response, err := handler.ClearMemory(ctx, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.True(t, response.Success)

		// Verify workflow context is cleared
		readRequest := &types.AgentMemoryRequest{
			AgentID: testAgent.ID,
			Context: "workflow",
		}

		readResponse, err := handler.ReadMemory(ctx, testAgent.ID, testUser.ID, readRequest)
		assert.NoError(t, err)
		assert.True(t, readResponse.Success)
		// Workflow should be empty or have no content
		workflowData := readResponse.Data["workflow"].(map[string]interface{})
		assert.Equal(t, 0, len(workflowData))
	})
}

func TestAgentMemoryHTTPHandlers(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		t.Skip("Database setup failed")
	}
	defer db.Close()

	handler := NewAgentsHandler(db)

	// Create test user and agent
	testUserEmail := "http@test.com"
	testUser := &auth.User{
		ID:       "test-user-http",
		Username: "httpuser",
		Email:    &testUserEmail,
	}

	testAgent := &types.Agent{
		ID:               "test-agent-http",
		UserID:           testUser.ID,
		FirstName:        "HTTP",
		LastName:         "TestAgent",
		TemplateID:       "test-template",
		MaxTokensPerDay:  1000,
		HeartbeatMinutes: 5,
		LifecycleStatus:  types.LifecycleStatusActive,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	err := handler.insertAgent(testAgent)
	require.NoError(t, err)

	t.Run("WriteMemoryHTTP", func(t *testing.T) {
		requestBody := types.AgentMemoryRequest{
			Context: "workflow",
			Data: map[string]interface{}{
				"test_data": "test_value",
				"number":    42,
			},
			MergeStrategy: "merge",
		}

		body, _ := json.Marshal(requestBody)
		req := httptest.NewRequest("POST", "/api/agents/test-agent-http/memory/write", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		// Add user to context
		ctx := auth.AddUserToContext(req.Context(), testUser)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		pathParts := []string{"api", "agents", "test-agent-http", "memory", "write"}
		handler.handleAgentMemory(rr, req, testAgent.ID, pathParts)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response types.AgentMemoryResponse
		err := json.Unmarshal(rr.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response.Success)
	})

	t.Run("ReadMemoryHTTP", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/agents/test-agent-http/memory/read?context=workflow", nil)

		// Add user to context
		ctx := auth.AddUserToContext(req.Context(), testUser)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		pathParts := []string{"api", "agents", "test-agent-http", "memory", "read"}
		handler.handleAgentMemory(rr, req, testAgent.ID, pathParts)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response types.AgentMemoryResponse
		err := json.Unmarshal(rr.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.Contains(t, response.Data, "workflow")
	})

	t.Run("SearchMemoryHTTP", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/agents/test-agent-http/memory/search?query=test_data&limit=10", nil)

		// Add user to context
		ctx := auth.AddUserToContext(req.Context(), testUser)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		pathParts := []string{"api", "agents", "test-agent-http", "memory", "search"}
		handler.handleAgentMemory(rr, req, testAgent.ID, pathParts)

		assert.Equal(t, http.StatusOK, rr.Code)

		var response types.AgentMemoryResponse
		err := json.Unmarshal(rr.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response.Success)
		assert.NotNil(t, response.Results)
	})
}

func TestAgentMemoryIntegration(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		t.Skip("Database setup failed")
	}
	defer db.Close()

	handler := NewAgentsHandler(db)

	// Create test user and agent
	testUserEmail := "integration@test.com"
	testUser := &auth.User{
		ID:       "test-user-integration",
		Username: "integrationuser",
		Email:    &testUserEmail,
	}

	testAgent := &types.Agent{
		ID:               "test-agent-integration",
		UserID:           testUser.ID,
		FirstName:        "Integration",
		LastName:         "TestAgent",
		TemplateID:       "test-template",
		MaxTokensPerDay:  1000,
		HeartbeatMinutes: 5,
		LifecycleStatus:  types.LifecycleStatusActive,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	err := handler.insertAgent(testAgent)
	require.NoError(t, err)

	t.Run("ComplexWorkflow", func(t *testing.T) {
		ctx := context.Background()

		// Simulate a complex workflow with multiple memory operations

		// Step 1: Initialize workflow
		writeReq := &types.AgentMemoryRequest{
			AgentID: testAgent.ID,
			Context: "workflow",
			Data: map[string]interface{}{
				"workflow_id":     "workflow-001",
				"current_step":    "initialization",
				"total_steps":     5,
				"started_at":      time.Now().Format(time.RFC3339),
				"completed_steps": []string{},
			},
		}

		response, err := handler.WriteMemory(ctx, testAgent.ID, testUser.ID, writeReq)
		assert.NoError(t, err)
		assert.True(t, response.Success)

		// Step 2: Store session data
		writeReq.Context = "session"
		writeReq.Data = map[string]interface{}{
			"user_input": "Analyze GitHub repository",
			"parameters": map[string]interface{}{
				"owner": "microsoft",
				"repo":  "vscode",
			},
		}

		response, err = handler.WriteMemory(ctx, testAgent.ID, testUser.ID, writeReq)
		assert.NoError(t, err)
		assert.True(t, response.Success)

		// Step 3: Progress workflow
		writeReq.Context = "workflow"
		writeReq.Path = "current_step"
		writeReq.Data = map[string]interface{}{"current_step": "data_collection"}

		response, err = handler.WriteMemory(ctx, testAgent.ID, testUser.ID, writeReq)
		assert.NoError(t, err)
		assert.True(t, response.Success)

		// Step 4: Store results
		writeReq.Context = "persistent"
		writeReq.Path = ""
		writeReq.Data = map[string]interface{}{
			"api_performance": map[string]interface{}{
				"github_api_avg_time": 1200,
				"success_rate":        0.95,
				"last_check":          time.Now().Format(time.RFC3339),
			},
		}

		response, err = handler.WriteMemory(ctx, testAgent.ID, testUser.ID, writeReq)
		assert.NoError(t, err)
		assert.True(t, response.Success)

		// Step 5: Read complete memory state
		readReq := &types.AgentMemoryRequest{
			AgentID: testAgent.ID,
			Context: "all",
		}

		readResponse, err := handler.ReadMemory(ctx, testAgent.ID, testUser.ID, readReq)
		assert.NoError(t, err)
		assert.True(t, readResponse.Success)

		// Verify all contexts have data
		contexts := readResponse.Data["contexts"].(map[string]interface{})
		assert.Contains(t, contexts, "workflow")
		assert.Contains(t, contexts, "session")
		assert.Contains(t, contexts, "persistent")

		// Step 6: Search across all contexts
		searchReq := &types.AgentMemoryRequest{
			AgentID:     testAgent.ID,
			SearchQuery: "microsoft",
			Limit:       20,
		}

		searchResponse, err := handler.SearchMemory(ctx, testAgent.ID, testUser.ID, searchReq)
		assert.NoError(t, err)
		assert.True(t, searchResponse.Success)
		assert.Greater(t, len(searchResponse.Results), 0)

		// Verify search found the microsoft reference
		found := false
		for _, result := range searchResponse.Results {
			if result.Context == "session" {
				found = true
				break
			}
		}
		assert.True(t, found, "Should find microsoft reference in session context")
	})

	t.Run("MemoryPersistence", func(t *testing.T) {
		ctx := context.Background()

		// Write some data
		writeReq := &types.AgentMemoryRequest{
			AgentID: testAgent.ID,
			Context: "persistent",
			Data: map[string]interface{}{
				"user_patterns": map[string]interface{}{
					"prefers_detailed_responses": true,
					"common_queries":             []string{"github analysis", "code review"},
					"active_hours":               "9AM-5PM PST",
				},
			},
		}

		response, err := handler.WriteMemory(ctx, testAgent.ID, testUser.ID, writeReq)
		assert.NoError(t, err)
		assert.True(t, response.Success)

		// Retrieve the agent to verify memory was saved
		agent, err := handler.getAgentByID(testUser.ID, testAgent.ID)
		assert.NoError(t, err)
		assert.NotNil(t, agent.Memory)
		assert.Greater(t, agent.MemorySizeBytes, int32(0))
		assert.NotNil(t, agent.MemoryUpdatedAt)

		// Verify the memory structure
		assert.Equal(t, "1.0", agent.Memory.Version)
		assert.NotNil(t, agent.Memory.Contexts.Persistent)
		assert.Contains(t, agent.Memory.Contexts.Persistent, "user_patterns")
	})
}

func TestMemoryErrorHandling(t *testing.T) {
	db := setupTestDB(t)
	if db == nil {
		t.Skip("Database setup failed")
	}
	defer db.Close()

	handler := NewAgentsHandler(db)

	t.Run("NonExistentAgent", func(t *testing.T) {
		ctx := context.Background()

		request := &types.AgentMemoryRequest{
			AgentID: "non-existent-agent",
			Context: "workflow",
			Data:    map[string]interface{}{"test": "data"},
		}

		response, err := handler.WriteMemory(ctx, "non-existent-agent", "non-existent-user", request)
		assert.NoError(t, err) // Function should not return error
		assert.False(t, response.Success)
		assert.Contains(t, response.Error, "Agent not found")
	})

	t.Run("InvalidContext", func(t *testing.T) {
		// Create test agent first
		testUserEmail := "error@test.com"
		testUser := &auth.User{ID: "test-user-error", Username: "erroruser", Email: &testUserEmail}
		testAgent := &types.Agent{
			ID:               "test-agent-error",
			UserID:           testUser.ID,
			FirstName:        "Error",
			LastName:         "TestAgent",
			TemplateID:       "test-template",
			MaxTokensPerDay:  1000,
			HeartbeatMinutes: 5,
			LifecycleStatus:  types.LifecycleStatusActive,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}

		err := handler.insertAgent(testAgent)
		require.NoError(t, err)

		ctx := context.Background()

		request := &types.AgentMemoryRequest{
			AgentID: testAgent.ID,
			Context: "invalid_context",
			Data:    map[string]interface{}{"test": "data"},
		}

		response, err := handler.WriteMemory(ctx, testAgent.ID, testUser.ID, request)
		assert.NoError(t, err)
		assert.False(t, response.Success)
		assert.Contains(t, response.Error, "Invalid context")
	})
}

func BenchmarkMemoryOperations(b *testing.B) {
	if os.Getenv("SKIP_BENCHMARKS") == "true" {
		b.Skip("Benchmarks disabled")
	}

	db := setupTestDB(&testing.T{})
	if db == nil {
		b.Skip("Database setup failed")
	}
	defer db.Close()

	handler := NewAgentsHandler(db)

	// Setup test data
	testUserEmail := "bench@test.com"
	testUser := &auth.User{ID: "benchmark-user", Username: "benchuser", Email: &testUserEmail}
	testAgent := &types.Agent{
		ID:               "benchmark-agent",
		UserID:           testUser.ID,
		FirstName:        "Benchmark",
		LastName:         "Agent",
		TemplateID:       "test-template",
		MaxTokensPerDay:  10000,
		HeartbeatMinutes: 5,
		LifecycleStatus:  types.LifecycleStatusActive,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	err := handler.insertAgent(testAgent)
	if err != nil {
		b.Fatalf("Failed to create test agent: %v", err)
	}

	ctx := context.Background()

	b.Run("WriteMemory", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			request := &types.AgentMemoryRequest{
				AgentID: testAgent.ID,
				Context: "session",
				Data: map[string]interface{}{
					"iteration": i,
					"timestamp": time.Now().Format(time.RFC3339),
					"data":      "some test data for benchmarking",
				},
			}

			_, err := handler.WriteMemory(ctx, testAgent.ID, testUser.ID, request)
			if err != nil {
				b.Fatalf("WriteMemory failed: %v", err)
			}
		}
	})

	b.Run("ReadMemory", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			request := &types.AgentMemoryRequest{
				AgentID: testAgent.ID,
				Context: "all",
			}

			_, err := handler.ReadMemory(ctx, testAgent.ID, testUser.ID, request)
			if err != nil {
				b.Fatalf("ReadMemory failed: %v", err)
			}
		}
	})

	b.Run("SearchMemory", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			request := &types.AgentMemoryRequest{
				AgentID:     testAgent.ID,
				SearchQuery: "test data",
				Limit:       10,
			}

			_, err := handler.SearchMemory(ctx, testAgent.ID, testUser.ID, request)
			if err != nil {
				b.Fatalf("SearchMemory failed: %v", err)
			}
		}
	})
}
