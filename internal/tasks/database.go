package tasks

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"gogent/internal/types"
)

// Database handles raw SQL operations for the tasks system
type Database struct {
	db *sql.DB
}

// NewDatabase creates a new Database instance
func NewDatabase(db *sql.DB) *Database {
	return &Database{db: db}
}

// --- Task CRUD ---

// InsertTask inserts a new task into the database
func (d *Database) InsertTask(ctx context.Context, task *types.Task) error {
	contextSourcesJSON, err := marshalJSON(task.ContextSources)
	if err != nil {
		return fmt.Errorf("failed to marshal context_sources: %w", err)
	}
	resultsJSON, err := marshalJSON(task.Results)
	if err != nil {
		return fmt.Errorf("failed to marshal results: %w", err)
	}
	artifactsJSON, err := marshalJSON(task.Artifacts)
	if err != nil {
		return fmt.Errorf("failed to marshal artifacts: %w", err)
	}
	metadataJSON, err := marshalJSON(task.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	query := `INSERT INTO tasks (
		id, user_id, team_id, agent_id, created_by,
		parent_task_id, depth, path,
		title, description, priority, state,
		failure_type, failure_reason, failure_at, retry_count,
		context_sources, results, artifacts, completion_notes,
		estimated_duration, actual_duration, deadline, metadata,
		created_at, updated_at, compiled_at, started_at, completed_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err = d.db.ExecContext(ctx, query,
		task.ID,
		task.UserID,
		nullString(task.TeamID),
		nullString(task.AgentID),
		task.CreatedBy,
		nullStringPtr(task.ParentTaskID),
		task.Depth,
		task.Path,
		task.Title,
		task.Description,
		task.Priority,
		string(task.State),
		nullFailureType(task.FailureType),
		task.FailureReason,
		nullTime(task.FailureAt),
		task.RetryCount,
		contextSourcesJSON,
		resultsJSON,
		artifactsJSON,
		task.CompletionNotes,
		task.EstimatedDuration,
		task.ActualDuration,
		nullTime(task.Deadline),
		metadataJSON,
		task.CreatedAt,
		task.UpdatedAt,
		nullTime(task.CompiledAt),
		nullTime(task.StartedAt),
		nullTime(task.CompletedAt),
	)
	return err
}

// GetTask retrieves a task by ID and user ID
func (d *Database) GetTask(ctx context.Context, userID, taskID string) (*types.Task, error) {
	query := `SELECT
		id, user_id, team_id, agent_id, created_by,
		parent_task_id, depth, path,
		title, description, priority, state,
		failure_type, failure_reason, failure_at, retry_count,
		context_sources, results, artifacts, completion_notes,
		estimated_duration, actual_duration, deadline, metadata,
		created_at, updated_at, compiled_at, started_at, completed_at
	FROM tasks WHERE id = ? AND user_id = ?`

	task := &types.Task{}
	var (
		teamID, agentID, parentTaskID sql.NullString
		failureType                   sql.NullString
		failureAt                     sql.NullTime
		contextSourcesJSON            []byte
		resultsJSON                   []byte
		artifactsJSON                 []byte
		metadataJSON                  []byte
		deadline                      sql.NullTime
		compiledAt, startedAt         sql.NullTime
		completedAt                   sql.NullTime
		description                   sql.NullString
		failureReason                 sql.NullString
		completionNotes               sql.NullString
		estimatedDuration             sql.NullString
		actualDuration                sql.NullString
	)

	err := d.db.QueryRowContext(ctx, query, taskID, userID).Scan(
		&task.ID, &task.UserID, &teamID, &agentID, &task.CreatedBy,
		&parentTaskID, &task.Depth, &task.Path,
		&task.Title, &description, &task.Priority, &task.State,
		&failureType, &failureReason, &failureAt, &task.RetryCount,
		&contextSourcesJSON, &resultsJSON, &artifactsJSON, &completionNotes,
		&estimatedDuration, &actualDuration, &deadline, &metadataJSON,
		&task.CreatedAt, &task.UpdatedAt, &compiledAt, &startedAt, &completedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Map nullable fields
	task.TeamID = teamID.String
	task.AgentID = agentID.String
	task.Description = description.String
	task.FailureReason = failureReason.String
	task.CompletionNotes = completionNotes.String
	task.EstimatedDuration = estimatedDuration.String
	task.ActualDuration = actualDuration.String

	if parentTaskID.Valid {
		task.ParentTaskID = &parentTaskID.String
	}
	if failureType.Valid {
		ft := types.TaskFailureType(failureType.String)
		task.FailureType = &ft
	}
	if failureAt.Valid {
		task.FailureAt = &failureAt.Time
	}
	if deadline.Valid {
		task.Deadline = &deadline.Time
	}
	if compiledAt.Valid {
		task.CompiledAt = &compiledAt.Time
	}
	if startedAt.Valid {
		task.StartedAt = &startedAt.Time
	}
	if completedAt.Valid {
		task.CompletedAt = &completedAt.Time
	}

	// Unmarshal JSON fields
	if len(contextSourcesJSON) > 0 {
		if err := json.Unmarshal(contextSourcesJSON, &task.ContextSources); err != nil {
			return nil, fmt.Errorf("failed to unmarshal context_sources: %w", err)
		}
	}
	if len(resultsJSON) > 0 {
		if err := json.Unmarshal(resultsJSON, &task.Results); err != nil {
			return nil, fmt.Errorf("failed to unmarshal results: %w", err)
		}
	}
	if len(artifactsJSON) > 0 {
		if err := json.Unmarshal(artifactsJSON, &task.Artifacts); err != nil {
			return nil, fmt.Errorf("failed to unmarshal artifacts: %w", err)
		}
	}
	if len(metadataJSON) > 0 {
		if err := json.Unmarshal(metadataJSON, &task.Metadata); err != nil {
			return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
		}
	}

	return task, nil
}

// UpdateTask updates mutable fields of a task
func (d *Database) UpdateTask(ctx context.Context, userID, taskID string, req *types.TaskUpdateRequest) error {
	setClauses := []string{}
	args := []interface{}{}

	if req.Title != nil {
		setClauses = append(setClauses, "title = ?")
		args = append(args, *req.Title)
	}
	if req.Description != nil {
		setClauses = append(setClauses, "description = ?")
		args = append(args, *req.Description)
	}
	if req.Priority != nil {
		setClauses = append(setClauses, "priority = ?")
		args = append(args, *req.Priority)
	}
	if req.AgentID != nil {
		setClauses = append(setClauses, "agent_id = ?")
		args = append(args, nullString(*req.AgentID))
	}
	if req.EstimatedDuration != nil {
		setClauses = append(setClauses, "estimated_duration = ?")
		args = append(args, *req.EstimatedDuration)
	}
	if req.Deadline != nil {
		setClauses = append(setClauses, "deadline = ?")
		args = append(args, *req.Deadline)
	}
	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			return fmt.Errorf("failed to marshal metadata: %w", err)
		}
		setClauses = append(setClauses, "metadata = ?")
		args = append(args, metadataJSON)
	}

	if len(setClauses) == 0 {
		return nil // nothing to update
	}

	setClauses = append(setClauses, "updated_at = ?")
	args = append(args, time.Now())

	args = append(args, taskID, userID)

	query := fmt.Sprintf("UPDATE tasks SET %s WHERE id = ? AND user_id = ?", strings.Join(setClauses, ", "))
	result, err := d.db.ExecContext(ctx, query, args...)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("task not found")
	}
	return nil
}

// UpdateTaskState updates the state and related fields of a task
func (d *Database) UpdateTaskState(ctx context.Context, userID, taskID string, state types.TaskState, updates map[string]interface{}) error {
	setClauses := []string{"state = ?", "updated_at = ?"}
	args := []interface{}{string(state), time.Now()}

	for key, val := range updates {
		setClauses = append(setClauses, key+" = ?")
		args = append(args, val)
	}

	args = append(args, taskID, userID)

	query := fmt.Sprintf("UPDATE tasks SET %s WHERE id = ? AND user_id = ?", strings.Join(setClauses, ", "))
	result, err := d.db.ExecContext(ctx, query, args...)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("task not found")
	}
	return nil
}

// UpdateTaskContextSources updates the context_sources JSON column
func (d *Database) UpdateTaskContextSources(ctx context.Context, userID, taskID string, sources []types.ContextSource) error {
	sourcesJSON, err := marshalJSON(sources)
	if err != nil {
		return fmt.Errorf("failed to marshal context_sources: %w", err)
	}

	query := `UPDATE tasks SET context_sources = ?, updated_at = ? WHERE id = ? AND user_id = ?`
	result, err := d.db.ExecContext(ctx, query, sourcesJSON, time.Now(), taskID, userID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("task not found")
	}
	return nil
}

// DeleteTask deletes a task by ID
func (d *Database) DeleteTask(ctx context.Context, userID, taskID string) error {
	// First set children's parent to NULL
	_, err := d.db.ExecContext(ctx,
		"UPDATE tasks SET parent_task_id = NULL WHERE parent_task_id = ? AND user_id = ?",
		taskID, userID)
	if err != nil {
		return fmt.Errorf("failed to unlink children: %w", err)
	}

	result, err := d.db.ExecContext(ctx,
		"DELETE FROM tasks WHERE id = ? AND user_id = ?", taskID, userID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("task not found")
	}
	return nil
}

// --- Task Listing/Queries ---

// ListTasks returns tasks matching the given filters
func (d *Database) ListTasks(ctx context.Context, userID string, teamID string, req *types.TaskListRequest) ([]types.Task, error) {
	whereClauses := []string{"t.user_id = ?"}
	args := []interface{}{userID}

	if teamID != "" {
		whereClauses = append(whereClauses, "t.team_id = ?")
		args = append(args, teamID)
	}

	if req.ParentTaskID != nil {
		whereClauses = append(whereClauses, "t.parent_task_id = ?")
		args = append(args, *req.ParentTaskID)
	}

	if len(req.States) > 0 {
		placeholders := make([]string, len(req.States))
		for i, s := range req.States {
			placeholders[i] = "?"
			args = append(args, s)
		}
		whereClauses = append(whereClauses, fmt.Sprintf("t.state IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(req.Priority) > 0 {
		placeholders := make([]string, len(req.Priority))
		for i, p := range req.Priority {
			placeholders[i] = "?"
			args = append(args, p)
		}
		whereClauses = append(whereClauses, fmt.Sprintf("t.priority IN (%s)", strings.Join(placeholders, ",")))
	}

	if req.AgentID != "" {
		whereClauses = append(whereClauses, "t.agent_id = ?")
		args = append(args, req.AgentID)
	}

	limit := 50
	if req.Limit > 0 && req.Limit <= 200 {
		limit = req.Limit
	}
	offset := 0
	if req.Offset > 0 {
		offset = req.Offset
	}

	query := fmt.Sprintf(`SELECT
		t.id, t.user_id, t.team_id, t.agent_id, t.created_by,
		t.parent_task_id, t.depth, t.path,
		t.title, t.description, t.priority, t.state,
		t.failure_type, t.failure_reason, t.failure_at, t.retry_count,
		t.context_sources, t.results, t.artifacts, t.completion_notes,
		t.estimated_duration, t.actual_duration, t.deadline, t.metadata,
		t.created_at, t.updated_at, t.compiled_at, t.started_at, t.completed_at
	FROM tasks t
	WHERE %s
	ORDER BY t.created_at DESC
	LIMIT ? OFFSET ?`, strings.Join(whereClauses, " AND "))

	args = append(args, limit, offset)
	return d.scanTasks(ctx, query, args...)
}

// ListChildren returns direct children of a task
func (d *Database) ListChildren(ctx context.Context, userID, taskID string, limit, offset int) ([]types.Task, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	query := `SELECT
		t.id, t.user_id, t.team_id, t.agent_id, t.created_by,
		t.parent_task_id, t.depth, t.path,
		t.title, t.description, t.priority, t.state,
		t.failure_type, t.failure_reason, t.failure_at, t.retry_count,
		t.context_sources, t.results, t.artifacts, t.completion_notes,
		t.estimated_duration, t.actual_duration, t.deadline, t.metadata,
		t.created_at, t.updated_at, t.compiled_at, t.started_at, t.completed_at
	FROM tasks t
	WHERE t.parent_task_id = ? AND t.user_id = ?
	ORDER BY t.created_at ASC
	LIMIT ? OFFSET ?`

	return d.scanTasks(ctx, query, taskID, userID, limit, offset)
}

// ListSubtree returns the full subtree of a task using materialized path
func (d *Database) ListSubtree(ctx context.Context, userID, taskID string) ([]types.Task, error) {
	// Get the task's path first
	var taskPath string
	err := d.db.QueryRowContext(ctx,
		"SELECT path FROM tasks WHERE id = ? AND user_id = ?",
		taskID, userID).Scan(&taskPath)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("task not found")
		}
		return nil, err
	}

	// Use path prefix to find all descendants
	pathPrefix := taskPath + taskID + "/"
	query := `SELECT
		t.id, t.user_id, t.team_id, t.agent_id, t.created_by,
		t.parent_task_id, t.depth, t.path,
		t.title, t.description, t.priority, t.state,
		t.failure_type, t.failure_reason, t.failure_at, t.retry_count,
		t.context_sources, t.results, t.artifacts, t.completion_notes,
		t.estimated_duration, t.actual_duration, t.deadline, t.metadata,
		t.created_at, t.updated_at, t.compiled_at, t.started_at, t.completed_at
	FROM tasks t
	WHERE t.path LIKE ? AND t.user_id = ?
	ORDER BY t.depth ASC, t.created_at ASC`

	return d.scanTasks(ctx, query, pathPrefix+"%", userID)
}

// ListRoots returns top-level tasks (no parent)
func (d *Database) ListRoots(ctx context.Context, userID, teamID string, limit, offset int) ([]types.Task, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	whereClauses := []string{"t.parent_task_id IS NULL", "t.user_id = ?"}
	args := []interface{}{userID}

	if teamID != "" {
		whereClauses = append(whereClauses, "t.team_id = ?")
		args = append(args, teamID)
	}

	args = append(args, limit, offset)

	query := fmt.Sprintf(`SELECT
		t.id, t.user_id, t.team_id, t.agent_id, t.created_by,
		t.parent_task_id, t.depth, t.path,
		t.title, t.description, t.priority, t.state,
		t.failure_type, t.failure_reason, t.failure_at, t.retry_count,
		t.context_sources, t.results, t.artifacts, t.completion_notes,
		t.estimated_duration, t.actual_duration, t.deadline, t.metadata,
		t.created_at, t.updated_at, t.compiled_at, t.started_at, t.completed_at
	FROM tasks t
	WHERE %s
	ORDER BY t.created_at DESC
	LIMIT ? OFFSET ?`, strings.Join(whereClauses, " AND "))

	return d.scanTasks(ctx, query, args...)
}

// GetAncestors walks up the parent chain from a task
func (d *Database) GetAncestors(ctx context.Context, userID, taskID string) ([]types.Task, error) {
	// Get the task's path and parse ancestor IDs
	var taskPath string
	err := d.db.QueryRowContext(ctx,
		"SELECT path FROM tasks WHERE id = ? AND user_id = ?",
		taskID, userID).Scan(&taskPath)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("task not found")
		}
		return nil, err
	}

	// Parse ancestor IDs from path (e.g., "/root_id/parent_id/")
	ancestorIDs := parsePathIDs(taskPath)
	if len(ancestorIDs) == 0 {
		return []types.Task{}, nil
	}

	placeholders := make([]string, len(ancestorIDs))
	args := make([]interface{}, 0, len(ancestorIDs)+1)
	for i, id := range ancestorIDs {
		placeholders[i] = "?"
		args = append(args, id)
	}
	args = append(args, userID)

	query := fmt.Sprintf(`SELECT
		t.id, t.user_id, t.team_id, t.agent_id, t.created_by,
		t.parent_task_id, t.depth, t.path,
		t.title, t.description, t.priority, t.state,
		t.failure_type, t.failure_reason, t.failure_at, t.retry_count,
		t.context_sources, t.results, t.artifacts, t.completion_notes,
		t.estimated_duration, t.actual_duration, t.deadline, t.metadata,
		t.created_at, t.updated_at, t.compiled_at, t.started_at, t.completed_at
	FROM tasks t
	WHERE t.id IN (%s) AND t.user_id = ?
	ORDER BY t.depth ASC`, strings.Join(placeholders, ","))

	return d.scanTasks(ctx, query, args...)
}

// GetChildCount returns the number of direct children of a task
func (d *Database) GetChildCount(ctx context.Context, taskID string) (int, error) {
	var count int
	err := d.db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM tasks WHERE parent_task_id = ?", taskID).Scan(&count)
	return count, err
}

// --- Task Dependencies ---

// InsertDependency adds a dependency edge
func (d *Database) InsertDependency(ctx context.Context, taskID, dependsOnID, depType string) error {
	_, err := d.db.ExecContext(ctx,
		`INSERT INTO task_dependencies (task_id, depends_on_id, dependency_type) VALUES (?, ?, ?)`,
		taskID, dependsOnID, depType)
	return err
}

// DeleteDependency removes a dependency edge
func (d *Database) DeleteDependency(ctx context.Context, taskID, dependsOnID string) error {
	result, err := d.db.ExecContext(ctx,
		`DELETE FROM task_dependencies WHERE task_id = ? AND depends_on_id = ?`,
		taskID, dependsOnID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("dependency not found")
	}
	return nil
}

// GetDependencies returns all tasks that a given task depends on
func (d *Database) GetDependencies(ctx context.Context, taskID string) ([]types.TaskDependency, error) {
	rows, err := d.db.QueryContext(ctx,
		`SELECT task_id, depends_on_id, dependency_type, created_at
		FROM task_dependencies WHERE task_id = ?`, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deps []types.TaskDependency
	for rows.Next() {
		var dep types.TaskDependency
		if err := rows.Scan(&dep.TaskID, &dep.DependsOnID, &dep.DependencyType, &dep.CreatedAt); err != nil {
			return nil, err
		}
		deps = append(deps, dep)
	}
	return deps, rows.Err()
}

// GetDependents returns all tasks that depend on a given task
func (d *Database) GetDependents(ctx context.Context, dependsOnID string) ([]types.TaskDependency, error) {
	rows, err := d.db.QueryContext(ctx,
		`SELECT task_id, depends_on_id, dependency_type, created_at
		FROM task_dependencies WHERE depends_on_id = ?`, dependsOnID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deps []types.TaskDependency
	for rows.Next() {
		var dep types.TaskDependency
		if err := rows.Scan(&dep.TaskID, &dep.DependsOnID, &dep.DependencyType, &dep.CreatedAt); err != nil {
			return nil, err
		}
		deps = append(deps, dep)
	}
	return deps, rows.Err()
}

// GetBlockers returns dependencies that are NOT in completed state
func (d *Database) GetBlockers(ctx context.Context, taskID string) ([]types.Task, error) {
	query := `SELECT
		t.id, t.user_id, t.team_id, t.agent_id, t.created_by,
		t.parent_task_id, t.depth, t.path,
		t.title, t.description, t.priority, t.state,
		t.failure_type, t.failure_reason, t.failure_at, t.retry_count,
		t.context_sources, t.results, t.artifacts, t.completion_notes,
		t.estimated_duration, t.actual_duration, t.deadline, t.metadata,
		t.created_at, t.updated_at, t.compiled_at, t.started_at, t.completed_at
	FROM tasks t
	INNER JOIN task_dependencies td ON t.id = td.depends_on_id
	WHERE td.task_id = ? AND t.state != 'completed'
	ORDER BY t.created_at ASC`

	return d.scanTasks(ctx, query, taskID)
}

// GetNextAvailable returns compiled tasks with no incomplete dependencies, ready to start
func (d *Database) GetNextAvailable(ctx context.Context, userID, teamID, agentID string) (*types.Task, error) {
	whereClauses := []string{
		"t.user_id = ?",
		"t.state = 'compiled'",
	}
	args := []interface{}{userID}

	if teamID != "" {
		whereClauses = append(whereClauses, "t.team_id = ?")
		args = append(args, teamID)
	}
	if agentID != "" {
		whereClauses = append(whereClauses, "(t.agent_id = ? OR t.agent_id IS NULL)")
		args = append(args, agentID)
	}

	query := fmt.Sprintf(`SELECT
		t.id, t.user_id, t.team_id, t.agent_id, t.created_by,
		t.parent_task_id, t.depth, t.path,
		t.title, t.description, t.priority, t.state,
		t.failure_type, t.failure_reason, t.failure_at, t.retry_count,
		t.context_sources, t.results, t.artifacts, t.completion_notes,
		t.estimated_duration, t.actual_duration, t.deadline, t.metadata,
		t.created_at, t.updated_at, t.compiled_at, t.started_at, t.completed_at
	FROM tasks t
	WHERE %s
	AND NOT EXISTS (
		SELECT 1 FROM task_dependencies td
		INNER JOIN tasks dep ON td.depends_on_id = dep.id
		WHERE td.task_id = t.id AND dep.state != 'completed'
	)
	ORDER BY
		FIELD(t.priority, 'urgent', 'high', 'medium', 'low'),
		t.created_at ASC
	LIMIT 1`, strings.Join(whereClauses, " AND "))

	tasks, err := d.scanTasks(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	if len(tasks) == 0 {
		return nil, nil
	}
	return &tasks[0], nil
}

// TaskExists checks if a task exists for the given user
func (d *Database) TaskExists(ctx context.Context, userID, taskID string) (bool, error) {
	var count int
	err := d.db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM tasks WHERE id = ? AND user_id = ?",
		taskID, userID).Scan(&count)
	return count > 0, err
}

// GetTaskState returns just the state of a task
func (d *Database) GetTaskState(ctx context.Context, taskID string) (types.TaskState, error) {
	var state string
	err := d.db.QueryRowContext(ctx,
		"SELECT state FROM tasks WHERE id = ?", taskID).Scan(&state)
	if err != nil {
		return "", err
	}
	return types.TaskState(state), nil
}

// --- Helpers ---

// scanTasks scans multiple task rows from a query result
func (d *Database) scanTasks(ctx context.Context, query string, args ...interface{}) ([]types.Task, error) {
	rows, err := d.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []types.Task
	for rows.Next() {
		task, err := scanTaskRow(rows)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, *task)
	}
	return tasks, rows.Err()
}

// scanTaskRow scans a single task row
func scanTaskRow(scanner interface{ Scan(...interface{}) error }) (*types.Task, error) {
	task := &types.Task{}
	var (
		teamID, agentID, parentTaskID sql.NullString
		failureType                   sql.NullString
		failureAt                     sql.NullTime
		contextSourcesJSON            []byte
		resultsJSON                   []byte
		artifactsJSON                 []byte
		metadataJSON                  []byte
		deadline                      sql.NullTime
		compiledAt, startedAt         sql.NullTime
		completedAt                   sql.NullTime
		description                   sql.NullString
		failureReason                 sql.NullString
		completionNotes               sql.NullString
		estimatedDuration             sql.NullString
		actualDuration                sql.NullString
	)

	err := scanner.Scan(
		&task.ID, &task.UserID, &teamID, &agentID, &task.CreatedBy,
		&parentTaskID, &task.Depth, &task.Path,
		&task.Title, &description, &task.Priority, &task.State,
		&failureType, &failureReason, &failureAt, &task.RetryCount,
		&contextSourcesJSON, &resultsJSON, &artifactsJSON, &completionNotes,
		&estimatedDuration, &actualDuration, &deadline, &metadataJSON,
		&task.CreatedAt, &task.UpdatedAt, &compiledAt, &startedAt, &completedAt,
	)
	if err != nil {
		return nil, err
	}

	task.TeamID = teamID.String
	task.AgentID = agentID.String
	task.Description = description.String
	task.FailureReason = failureReason.String
	task.CompletionNotes = completionNotes.String
	task.EstimatedDuration = estimatedDuration.String
	task.ActualDuration = actualDuration.String

	if parentTaskID.Valid {
		task.ParentTaskID = &parentTaskID.String
	}
	if failureType.Valid {
		ft := types.TaskFailureType(failureType.String)
		task.FailureType = &ft
	}
	if failureAt.Valid {
		task.FailureAt = &failureAt.Time
	}
	if deadline.Valid {
		task.Deadline = &deadline.Time
	}
	if compiledAt.Valid {
		task.CompiledAt = &compiledAt.Time
	}
	if startedAt.Valid {
		task.StartedAt = &startedAt.Time
	}
	if completedAt.Valid {
		task.CompletedAt = &completedAt.Time
	}

	if len(contextSourcesJSON) > 0 {
		if err := json.Unmarshal(contextSourcesJSON, &task.ContextSources); err != nil {
			return nil, fmt.Errorf("failed to unmarshal context_sources: %w", err)
		}
	}
	if len(resultsJSON) > 0 {
		if err := json.Unmarshal(resultsJSON, &task.Results); err != nil {
			return nil, fmt.Errorf("failed to unmarshal results: %w", err)
		}
	}
	if len(artifactsJSON) > 0 {
		if err := json.Unmarshal(artifactsJSON, &task.Artifacts); err != nil {
			return nil, fmt.Errorf("failed to unmarshal artifacts: %w", err)
		}
	}
	if len(metadataJSON) > 0 {
		if err := json.Unmarshal(metadataJSON, &task.Metadata); err != nil {
			return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
		}
	}

	return task, nil
}

// marshalJSON marshals a value to JSON, returning nil for nil/empty values
func marshalJSON(v interface{}) ([]byte, error) {
	if v == nil {
		return nil, nil
	}
	return json.Marshal(v)
}

// nullString returns sql.NullString for optional string fields
func nullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}

// nullStringPtr returns sql.NullString for optional *string fields
func nullStringPtr(s *string) sql.NullString {
	if s == nil || *s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: *s, Valid: true}
}

// nullTime returns sql.NullTime for optional *time.Time fields
func nullTime(t *time.Time) sql.NullTime {
	if t == nil {
		return sql.NullTime{}
	}
	return sql.NullTime{Time: *t, Valid: true}
}

// nullFailureType returns sql.NullString for optional *TaskFailureType fields
func nullFailureType(ft *types.TaskFailureType) sql.NullString {
	if ft == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: string(*ft), Valid: true}
}

// parsePathIDs extracts task IDs from a materialized path string
// e.g., "/root_id/parent_id/" → ["root_id", "parent_id"]
func parsePathIDs(path string) []string {
	if path == "" || path == "/" {
		return nil
	}
	parts := strings.Split(strings.Trim(path, "/"), "/")
	var ids []string
	for _, p := range parts {
		if p != "" {
			ids = append(ids, p)
		}
	}
	return ids
}
