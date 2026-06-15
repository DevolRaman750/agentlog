package tasks

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"gogent/internal/types"

	"github.com/google/uuid"
)

// Service implements the business logic for the structured task system
type Service struct {
	database *Database
	db       *sql.DB
}

// NewService creates a new task service
func NewService(db *sql.DB) *Service {
	return &Service{
		database: NewDatabase(db),
		db:       db,
	}
}

// validTransitions defines the allowed state machine transitions
var validTransitions = map[types.TaskState][]types.TaskState{
	types.TaskStateDefining:   {types.TaskStateCompiling, types.TaskStateCompiled, types.TaskStateFailed},
	types.TaskStateCompiling:  {types.TaskStateCompiled, types.TaskStateFailed, types.TaskStateDefining},
	types.TaskStateCompiled:   {types.TaskStateInProgress, types.TaskStateFailed},
	types.TaskStateInProgress: {types.TaskStateCompleted, types.TaskStateFailed, types.TaskStateCompiled},
	types.TaskStateFailed:     {types.TaskStateDefining},
	types.TaskStateCompleted:  {}, // terminal state
}

// --- CRUD Operations ---

// CreateTask creates a new structured task
func (s *Service) CreateTask(ctx context.Context, userID, agentID string, teamID string, req *types.TaskCreateRequest) (*types.Task, error) {
	if req.Title == "" {
		return nil, fmt.Errorf("title is required")
	}

	priority := req.Priority
	if priority == "" {
		priority = "medium"
	}

	// Validate priority
	switch priority {
	case "low", "medium", "high", "urgent":
		// valid
	default:
		return nil, fmt.Errorf("invalid priority: %s", priority)
	}

	// Validate context sources if provided
	if len(req.ContextSources) > 0 {
		if err := ValidateAllContextSources(req.ContextSources); err != nil {
			return nil, fmt.Errorf("invalid context sources: %w", err)
		}
	}

	now := time.Now()
	task := &types.Task{
		ID:                uuid.New().String(),
		UserID:            userID,
		TeamID:            teamID,
		AgentID:           "", // Leave unassigned — any team member can pick it up
		CreatedBy:         agentID,
		Title:             req.Title,
		Description:       req.Description,
		Priority:          priority,
		State:             types.TaskStateDefining,
		EstimatedDuration: req.EstimatedDuration,
		Deadline:          req.Deadline,
		Metadata:          req.Metadata,
		ContextSources:    req.ContextSources,
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	// Handle tree structure
	if req.ParentTaskID != nil && *req.ParentTaskID != "" {
		parent, err := s.database.GetTask(ctx, userID, *req.ParentTaskID)
		if err != nil {
			return nil, fmt.Errorf("failed to get parent task: %w", err)
		}
		if parent == nil {
			return nil, fmt.Errorf("parent task not found: %s", *req.ParentTaskID)
		}
		task.ParentTaskID = req.ParentTaskID
		task.Depth = parent.Depth + 1
		task.Path = parent.Path + parent.ID + "/"
	} else {
		task.Depth = 0
		task.Path = "/"
	}

	// Insert task
	if err := s.database.InsertTask(ctx, task); err != nil {
		return nil, fmt.Errorf("failed to insert task: %w", err)
	}

	// Add dependencies
	if len(req.Dependencies) > 0 {
		for _, depID := range req.Dependencies {
			exists, err := s.database.TaskExists(ctx, userID, depID)
			if err != nil {
				return nil, fmt.Errorf("failed to check dependency: %w", err)
			}
			if !exists {
				log.Printf("Warning: dependency task %s not found, skipping", depID)
				continue
			}
			if err := s.database.InsertDependency(ctx, task.ID, depID, "requires"); err != nil {
				return nil, fmt.Errorf("failed to add dependency: %w", err)
			}
		}
		task.Dependencies = req.Dependencies
	}

	return task, nil
}

// GetTask retrieves a task by ID with dependencies and child count
func (s *Service) GetTask(ctx context.Context, userID, taskID string) (*types.Task, error) {
	task, err := s.database.GetTask(ctx, userID, taskID)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, nil
	}

	// Load dependencies
	deps, err := s.database.GetDependencies(ctx, taskID)
	if err != nil {
		return nil, fmt.Errorf("failed to load dependencies: %w", err)
	}
	for _, dep := range deps {
		task.Dependencies = append(task.Dependencies, dep.DependsOnID)
	}

	// Load blockers (incomplete dependencies)
	blockers, err := s.database.GetBlockers(ctx, taskID)
	if err != nil {
		return nil, fmt.Errorf("failed to load blockers: %w", err)
	}
	for _, b := range blockers {
		task.Blockers = append(task.Blockers, b.ID)
	}

	// Load child count
	childCount, err := s.database.GetChildCount(ctx, taskID)
	if err != nil {
		return nil, fmt.Errorf("failed to load child count: %w", err)
	}
	task.ChildCount = childCount

	return task, nil
}

// UpdateTask updates mutable fields of a task
func (s *Service) UpdateTask(ctx context.Context, userID, taskID string, req *types.TaskUpdateRequest) (*types.Task, error) {
	// Validate priority if provided
	if req.Priority != nil {
		switch *req.Priority {
		case "low", "medium", "high", "urgent":
			// valid
		default:
			return nil, fmt.Errorf("invalid priority: %s", *req.Priority)
		}
	}

	if err := s.database.UpdateTask(ctx, userID, taskID, req); err != nil {
		return nil, err
	}

	return s.GetTask(ctx, userID, taskID)
}

// DeleteTask deletes a task
func (s *Service) DeleteTask(ctx context.Context, userID, taskID string) error {
	return s.database.DeleteTask(ctx, userID, taskID)
}

// --- State Machine ---

// TransitionTask validates and performs a state transition
func (s *Service) TransitionTask(ctx context.Context, userID, agentID string, req *types.TaskTransitionRequest) (*types.Task, error) {
	task, err := s.database.GetTask(ctx, userID, req.TaskID)
	if err != nil {
		return nil, fmt.Errorf("failed to get task: %w", err)
	}
	if task == nil {
		return nil, fmt.Errorf("task not found: %s", req.TaskID)
	}

	// Validate transition
	allowed := validTransitions[task.State]
	valid := false
	for _, s := range allowed {
		if s == req.TargetState {
			valid = true
			break
		}
	}
	if !valid {
		return nil, fmt.Errorf("invalid transition from %s to %s", task.State, req.TargetState)
	}

	now := time.Now()
	updates := map[string]interface{}{}

	switch req.TargetState {
	case types.TaskStateCompiling:
		// No special validation needed

	case types.TaskStateCompiled:
		// Compilation validation
		if err := s.validateCompilation(ctx, task); err != nil {
			return nil, fmt.Errorf("compilation validation failed: %w", err)
		}
		updates["compiled_at"] = now

	case types.TaskStateInProgress:
		// In-progress validation
		if err := s.validateInProgress(ctx, userID, task, agentID); err != nil {
			return nil, fmt.Errorf("in-progress validation failed: %w", err)
		}
		updates["started_at"] = now
		if agentID != "" && task.AgentID == "" {
			updates["agent_id"] = agentID
		}

	case types.TaskStateCompleted:
		updates["completed_at"] = now
		if req.Results != nil {
			resultsJSON, err := json.Marshal(req.Results)
			if err != nil {
				return nil, fmt.Errorf("failed to marshal results: %w", err)
			}
			updates["results"] = resultsJSON
		}
		if req.CompletionNotes != "" {
			updates["completion_notes"] = req.CompletionNotes
		}
		if req.Artifacts != nil {
			artifactsJSON, err := json.Marshal(req.Artifacts)
			if err != nil {
				return nil, fmt.Errorf("failed to marshal artifacts: %w", err)
			}
			updates["artifacts"] = artifactsJSON
		}
		if req.ActualDuration != "" {
			updates["actual_duration"] = req.ActualDuration
		}

	case types.TaskStateFailed:
		if req.FailureType == nil {
			return nil, fmt.Errorf("failure_type is required when transitioning to failed")
		}
		updates["failure_type"] = string(*req.FailureType)
		updates["failure_reason"] = req.FailureReason
		updates["failure_at"] = now
		updates["retry_count"] = task.RetryCount + 1

	case types.TaskStateDefining:
		// Reset for retry
		updates["failure_type"] = nil
		updates["failure_reason"] = nil
		updates["failure_at"] = nil
		updates["compiled_at"] = nil
		updates["started_at"] = nil
	}

	if err := s.database.UpdateTaskState(ctx, userID, req.TaskID, req.TargetState, updates); err != nil {
		return nil, fmt.Errorf("failed to update task state: %w", err)
	}

	return s.GetTask(ctx, userID, req.TaskID)
}

// validateCompilation checks that a task can move to compiled state
func (s *Service) validateCompilation(ctx context.Context, task *types.Task) error {
	if task.Title == "" {
		return fmt.Errorf("task must have a title")
	}
	if task.Description == "" {
		return fmt.Errorf("task must have a description")
	}

	// Validate all context sources have required fields
	if len(task.ContextSources) > 0 {
		if err := ValidateAllContextSources(task.ContextSources); err != nil {
			return err
		}
	}

	// If task has dependencies, they must all exist
	deps, err := s.database.GetDependencies(ctx, task.ID)
	if err != nil {
		return fmt.Errorf("failed to check dependencies: %w", err)
	}
	for _, dep := range deps {
		state, err := s.database.GetTaskState(ctx, dep.DependsOnID)
		if err != nil {
			return fmt.Errorf("dependency %s not found", dep.DependsOnID)
		}
		_ = state // Dependencies don't need to be completed for compilation, just exist
	}

	return nil
}

// validateInProgress checks that a task can move to in_progress state
func (s *Service) validateInProgress(ctx context.Context, userID string, task *types.Task, agentID string) error {
	// All dependencies must be in completed state
	blockers, err := s.database.GetBlockers(ctx, task.ID)
	if err != nil {
		return fmt.Errorf("failed to check blockers: %w", err)
	}
	if len(blockers) > 0 {
		blockerIDs := make([]string, len(blockers))
		for i, b := range blockers {
			blockerIDs[i] = b.ID
		}
		return fmt.Errorf("task has %d incomplete dependencies: %v", len(blockers), blockerIDs)
	}

	// Parent task must be at least compiled (if parent exists)
	if task.ParentTaskID != nil && *task.ParentTaskID != "" {
		parent, err := s.database.GetTask(ctx, userID, *task.ParentTaskID)
		if err != nil {
			return fmt.Errorf("failed to check parent: %w", err)
		}
		if parent != nil {
			switch parent.State {
			case types.TaskStateDefining, types.TaskStateCompiling:
				return fmt.Errorf("parent task must be at least compiled (current: %s)", parent.State)
			case types.TaskStateCompiled, types.TaskStateInProgress, types.TaskStateCompleted, types.TaskStateFailed:
				// Parent is at least compiled; starting this task is allowed.
			}
		}
	}

	// Task must have an agent assigned (or we'll assign the requesting agent)
	if task.AgentID == "" && agentID == "" {
		return fmt.Errorf("task must be assigned to an agent before starting")
	}

	return nil
}

// --- Context Source Operations ---

// AddContext appends a context source to a task
func (s *Service) AddContext(ctx context.Context, userID, taskID string, source types.ContextSource) (*types.Task, error) {
	if err := ValidateContextSource(source); err != nil {
		return nil, err
	}

	task, err := s.database.GetTask(ctx, userID, taskID)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, fmt.Errorf("task not found")
	}

	task.ContextSources = append(task.ContextSources, source)
	if err := s.database.UpdateTaskContextSources(ctx, userID, taskID, task.ContextSources); err != nil {
		return nil, err
	}

	return s.GetTask(ctx, userID, taskID)
}

// UpdateContext replaces a context source at a given index
func (s *Service) UpdateContext(ctx context.Context, userID, taskID string, idx int, source types.ContextSource) (*types.Task, error) {
	if err := ValidateContextSource(source); err != nil {
		return nil, err
	}

	task, err := s.database.GetTask(ctx, userID, taskID)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, fmt.Errorf("task not found")
	}

	if idx < 0 || idx >= len(task.ContextSources) {
		return nil, fmt.Errorf("context source index %d out of range (0-%d)", idx, len(task.ContextSources)-1)
	}

	task.ContextSources[idx] = source
	if err := s.database.UpdateTaskContextSources(ctx, userID, taskID, task.ContextSources); err != nil {
		return nil, err
	}

	return s.GetTask(ctx, userID, taskID)
}

// RemoveContext removes a context source at a given index
func (s *Service) RemoveContext(ctx context.Context, userID, taskID string, idx int) (*types.Task, error) {
	task, err := s.database.GetTask(ctx, userID, taskID)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, fmt.Errorf("task not found")
	}

	if idx < 0 || idx >= len(task.ContextSources) {
		return nil, fmt.Errorf("context source index %d out of range (0-%d)", idx, len(task.ContextSources)-1)
	}

	task.ContextSources = append(task.ContextSources[:idx], task.ContextSources[idx+1:]...)
	if err := s.database.UpdateTaskContextSources(ctx, userID, taskID, task.ContextSources); err != nil {
		return nil, err
	}

	return s.GetTask(ctx, userID, taskID)
}

// --- Tree Navigation ---

// ListChildren returns direct children of a task
func (s *Service) ListChildren(ctx context.Context, userID, taskID string, limit, offset int) ([]types.Task, error) {
	return s.database.ListChildren(ctx, userID, taskID, limit, offset)
}

// ListSubtree returns the full subtree of a task
func (s *Service) ListSubtree(ctx context.Context, userID, taskID string) ([]types.Task, error) {
	return s.database.ListSubtree(ctx, userID, taskID)
}

// ListRoots returns top-level tasks (no parent)
func (s *Service) ListRoots(ctx context.Context, userID, teamID string, limit, offset int) ([]types.Task, error) {
	return s.database.ListRoots(ctx, userID, teamID, limit, offset)
}

// GetAncestors walks up the parent chain
func (s *Service) GetAncestors(ctx context.Context, userID, taskID string) ([]types.Task, error) {
	return s.database.GetAncestors(ctx, userID, taskID)
}

// ListTasks returns tasks matching filters
func (s *Service) ListTasks(ctx context.Context, userID, teamID string, req *types.TaskListRequest) ([]types.Task, error) {
	return s.database.ListTasks(ctx, userID, teamID, req)
}

// --- Dependency Operations ---

// AddDependency adds an ordering edge between tasks with cycle detection
func (s *Service) AddDependency(ctx context.Context, userID, taskID, dependsOnID string) error {
	if taskID == dependsOnID {
		return fmt.Errorf("task cannot depend on itself")
	}

	// Verify both tasks exist
	exists, err := s.database.TaskExists(ctx, userID, taskID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("task %s not found", taskID)
	}

	exists, err = s.database.TaskExists(ctx, userID, dependsOnID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("dependency task %s not found", dependsOnID)
	}

	// Cycle detection: check if dependsOnID already depends on taskID (directly or transitively)
	if err := s.detectCycle(ctx, taskID, dependsOnID); err != nil {
		return err
	}

	return s.database.InsertDependency(ctx, taskID, dependsOnID, "requires")
}

// RemoveDependency removes an ordering edge
func (s *Service) RemoveDependency(ctx context.Context, taskID, dependsOnID string) error {
	return s.database.DeleteDependency(ctx, taskID, dependsOnID)
}

// GetBlockers returns incomplete dependencies blocking a task
func (s *Service) GetBlockers(ctx context.Context, taskID string) ([]types.Task, error) {
	return s.database.GetBlockers(ctx, taskID)
}

// GetNextAvailable returns the next task ready to be worked on
func (s *Service) GetNextAvailable(ctx context.Context, userID, teamID, agentID string) (*types.Task, error) {
	return s.database.GetNextAvailable(ctx, userID, teamID, agentID)
}

// detectCycle checks if adding an edge from taskID → dependsOnID would create a cycle
// by verifying that dependsOnID does not transitively depend on taskID
func (s *Service) detectCycle(ctx context.Context, taskID, dependsOnID string) error {
	visited := map[string]bool{}
	return s.walkDependencies(ctx, dependsOnID, taskID, visited)
}

// walkDependencies recursively walks the dependency graph looking for target
func (s *Service) walkDependencies(ctx context.Context, current, target string, visited map[string]bool) error {
	if current == target {
		return fmt.Errorf("adding this dependency would create a cycle")
	}
	if visited[current] {
		return nil
	}
	visited[current] = true

	deps, err := s.database.GetDependencies(ctx, current)
	if err != nil {
		return err
	}

	for _, dep := range deps {
		if err := s.walkDependencies(ctx, dep.DependsOnID, target, visited); err != nil {
			return err
		}
	}
	return nil
}
