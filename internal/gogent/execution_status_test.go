package gogent

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"gogent/internal/db"
	"gogent/internal/types"

	_ "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExecutionStatusTracking(t *testing.T) {
	// Setup test database
	testDB := setupTestDB(t)
	defer testDB.Close()

	client, err := NewClient(testDB, &types.GeminiClientConfig{
		APIKey: "test-key",
	})
	require.NoError(t, err)

	ctx := context.Background()
	userID := "test-user"

	t.Run("CreateExecutionRun", func(t *testing.T) {
		executionRun, err := client.CreateExecutionRun(ctx, userID, "Test Execution", "Test Description", true, nil)
		require.NoError(t, err)
		assert.NotEmpty(t, executionRun.ID)
		assert.Equal(t, "Test Execution", executionRun.Name)
		assert.Equal(t, "pending", executionRun.Status)
	})

	t.Run("UpdateExecutionRunStatus", func(t *testing.T) {
		// Create execution
		executionRun, err := client.CreateExecutionRun(ctx, userID, "Test Status Update", "Test", true, nil)
		require.NoError(t, err)

		// Update status to running
		err = client.queries.UpdateExecutionRunStatus(ctx, db.UpdateExecutionRunStatusParams{
			ID:           executionRun.ID,
			UserID:       userID,
			Status:       "running",
			ErrorMessage: sql.NullString{},
		})
		require.NoError(t, err)

		// Verify status updated
		updated, err := client.GetExecutionRun(ctx, userID, executionRun.ID)
		require.NoError(t, err)
		assert.Equal(t, "running", updated.Status)

		// Update status to completed
		err = client.queries.UpdateExecutionRunStatus(ctx, db.UpdateExecutionRunStatusParams{
			ID:           executionRun.ID,
			UserID:       userID,
			Status:       "completed",
			ErrorMessage: sql.NullString{},
		})
		require.NoError(t, err)

		// Verify final status
		completed, err := client.GetExecutionRun(ctx, userID, executionRun.ID)
		require.NoError(t, err)
		assert.Equal(t, "completed", completed.Status)
	})

	t.Run("UpdateExecutionRunStatusWithError", func(t *testing.T) {
		// Create execution
		executionRun, err := client.CreateExecutionRun(ctx, userID, "Test Error Status", "Test", true, nil)
		require.NoError(t, err)

		// Update status to failed with error message
		errorMsg := "Test error message"
		err = client.queries.UpdateExecutionRunStatus(ctx, db.UpdateExecutionRunStatusParams{
			ID:           executionRun.ID,
			UserID:       userID,
			Status:       "failed",
			ErrorMessage: sql.NullString{String: errorMsg, Valid: true},
		})
		require.NoError(t, err)

		// Verify status and error message
		failed, err := client.GetExecutionRun(ctx, userID, executionRun.ID)
		require.NoError(t, err)
		assert.Equal(t, "failed", failed.Status)
		assert.Equal(t, errorMsg, failed.ErrorMessage)
	})
}

func TestExecutionStatusAPIEndpoints(t *testing.T) {
	// Setup test database and server
	testDB := setupTestDB(t)
	defer testDB.Close()

	client, err := NewClient(testDB, &types.GeminiClientConfig{
		APIKey: "test-key",
	})
	require.NoError(t, err)

	server := &Server{
		client: client,
	}

	ctx := context.Background()
	userID := "test-user"

	t.Run("StatusEndpoint_DatabaseBased", func(t *testing.T) {
		// Create execution run directly in database
		executionRun, err := client.CreateExecutionRun(ctx, userID, "Test API Status", "Test", true, nil)
		require.NoError(t, err)

		// Update status to running
		err = client.queries.UpdateExecutionRunStatus(ctx, db.UpdateExecutionRunStatusParams{
			ID:           executionRun.ID,
			UserID:       userID,
			Status:       "running",
			ErrorMessage: sql.NullString{},
		})
		require.NoError(t, err)

		// Test status endpoint
		req := httptest.NewRequest("GET", "/api/executions/"+executionRun.ID+"/status?userId="+userID, nil)
		w := httptest.NewRecorder()

		server.getExecutionStatusHandler(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "running", response["status"])
		assert.Equal(t, executionRun.ID, response["id"])
	})

	t.Run("StatusEndpoint_NotFound", func(t *testing.T) {
		// Test with non-existent execution ID
		req := httptest.NewRequest("GET", "/api/executions/non-existent-id/status?userId="+userID, nil)
		w := httptest.NewRecorder()

		server.getExecutionStatusHandler(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "not_found", response["status"])
	})

	t.Run("StatusEndpoint_CompletedExecution", func(t *testing.T) {
		// Create and complete execution
		executionRun, err := client.CreateExecutionRun(ctx, userID, "Test Completed", "Test", true, nil)
		require.NoError(t, err)

		// Update to completed
		err = client.queries.UpdateExecutionRunStatus(ctx, db.UpdateExecutionRunStatusParams{
			ID:           executionRun.ID,
			UserID:       userID,
			Status:       "completed",
			ErrorMessage: sql.NullString{},
		})
		require.NoError(t, err)

		// Test status endpoint
		req := httptest.NewRequest("GET", "/api/executions/"+executionRun.ID+"/status?userId="+userID, nil)
		w := httptest.NewRecorder()

		server.getExecutionStatusHandler(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "completed", response["status"])

		// Should have execution result data
		assert.NotNil(t, response["result"])
	})
}

func TestMultiPodExecutionConsistency(t *testing.T) {
	// This test simulates multiple pods accessing the same execution
	testDB := setupTestDB(t)
	defer testDB.Close()

	// Create two clients (simulating two pods)
	client1, err := NewClient(testDB, &types.GeminiClientConfig{APIKey: "test-key"})
	require.NoError(t, err)

	client2, err := NewClient(testDB, &types.GeminiClientConfig{APIKey: "test-key"})
	require.NoError(t, err)

	ctx := context.Background()
	userID := "test-user"

	t.Run("CrossPodStatusConsistency", func(t *testing.T) {
		// Pod 1 creates execution
		executionRun, err := client1.CreateExecutionRun(ctx, userID, "Multi-Pod Test", "Test", true, nil)
		require.NoError(t, err)

		// Pod 1 updates status to running
		err = client1.queries.UpdateExecutionRunStatus(ctx, db.UpdateExecutionRunStatusParams{
			ID:           executionRun.ID,
			UserID:       userID,
			Status:       "running",
			ErrorMessage: sql.NullString{},
		})
		require.NoError(t, err)

		// Pod 2 should see the same status
		executionFromPod2, err := client2.GetExecutionRun(ctx, userID, executionRun.ID)
		require.NoError(t, err)
		assert.Equal(t, "running", executionFromPod2.Status)

		// Pod 2 updates status to completed
		err = client2.queries.UpdateExecutionRunStatus(ctx, db.UpdateExecutionRunStatusParams{
			ID:           executionRun.ID,
			UserID:       userID,
			Status:       "completed",
			ErrorMessage: sql.NullString{},
		})
		require.NoError(t, err)

		// Pod 1 should see the updated status
		executionFromPod1, err := client1.GetExecutionRun(ctx, userID, executionRun.ID)
		require.NoError(t, err)
		assert.Equal(t, "completed", executionFromPod1.Status)
	})
}

func TestExecutionStatusTransitions(t *testing.T) {
	testDB := setupTestDB(t)
	defer testDB.Close()

	client, err := NewClient(testDB, &types.GeminiClientConfig{APIKey: "test-key"})
	require.NoError(t, err)

	ctx := context.Background()
	userID := "test-user"

	t.Run("ValidStatusTransitions", func(t *testing.T) {
		// Test the full lifecycle: pending -> running -> completed
		executionRun, err := client.CreateExecutionRun(ctx, userID, "Lifecycle Test", "Test", true, nil)
		require.NoError(t, err)
		assert.Equal(t, "pending", executionRun.Status)

		// pending -> running
		err = client.queries.UpdateExecutionRunStatus(ctx, db.UpdateExecutionRunStatusParams{
			ID:           executionRun.ID,
			UserID:       userID,
			Status:       "running",
			ErrorMessage: sql.NullString{},
		})
		require.NoError(t, err)

		// running -> completed
		err = client.queries.UpdateExecutionRunStatus(ctx, db.UpdateExecutionRunStatusParams{
			ID:           executionRun.ID,
			UserID:       userID,
			Status:       "completed",
			ErrorMessage: sql.NullString{},
		})
		require.NoError(t, err)

		// Verify final state
		final, err := client.GetExecutionRun(ctx, userID, executionRun.ID)
		require.NoError(t, err)
		assert.Equal(t, "completed", final.Status)
	})

	t.Run("FailedStatusTransition", func(t *testing.T) {
		// Test: pending -> running -> failed
		executionRun, err := client.CreateExecutionRun(ctx, userID, "Failed Test", "Test", true, nil)
		require.NoError(t, err)

		// pending -> running
		err = client.queries.UpdateExecutionRunStatus(ctx, db.UpdateExecutionRunStatusParams{
			ID:           executionRun.ID,
			UserID:       userID,
			Status:       "running",
			ErrorMessage: sql.NullString{},
		})
		require.NoError(t, err)

		// running -> failed
		errorMsg := "Execution failed due to timeout"
		err = client.queries.UpdateExecutionRunStatus(ctx, db.UpdateExecutionRunStatusParams{
			ID:           executionRun.ID,
			UserID:       userID,
			Status:       "failed",
			ErrorMessage: sql.NullString{String: errorMsg, Valid: true},
		})
		require.NoError(t, err)

		// Verify final state
		final, err := client.GetExecutionRun(ctx, userID, executionRun.ID)
		require.NoError(t, err)
		assert.Equal(t, "failed", final.Status)
		assert.Equal(t, errorMsg, final.ErrorMessage)
	})
}

// Helper function to setup test database (reuse existing test setup)
func setupTestDB(t *testing.T) *sql.DB {
	// This would use the same test DB setup as other tests
	// For now, using a simple in-memory SQLite for testing
	// In production, this should use the same MySQL test setup

	testDB, err := sql.Open("mysql", "root:@tcp(localhost:3306)/gogent_test")
	require.NoError(t, err)

	// Ensure test tables exist
	_, err = testDB.Exec(`CREATE TABLE IF NOT EXISTS execution_runs (
		id VARCHAR(255) PRIMARY KEY,
		user_id VARCHAR(255) NOT NULL,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		base_prompt TEXT,
		context_prompt TEXT,
		enable_function_calling BOOLEAN NOT NULL DEFAULT FALSE,
		status ENUM('pending','running','completed','failed') DEFAULT 'pending',
		error_message TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		agent_id VARCHAR(255)
	)`)
	require.NoError(t, err)

	return testDB
}
