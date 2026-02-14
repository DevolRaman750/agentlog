package types

import (
	"encoding/json"
	"time"
)

// --- Task State Machine ---

// TaskState represents the lifecycle state of a structured task
type TaskState string

const (
	TaskStateDefining   TaskState = "defining"
	TaskStateCompiling  TaskState = "compiling"
	TaskStateCompiled   TaskState = "compiled"
	TaskStateInProgress TaskState = "in_progress"
	TaskStateCompleted  TaskState = "completed"
	TaskStateFailed     TaskState = "failed"
)

// TaskFailureType categorizes why a task failed
type TaskFailureType string

const (
	FailureContextInvalid   TaskFailureType = "context_invalid"
	FailureDefinitionError  TaskFailureType = "definition_error"
	FailureExecutionError   TaskFailureType = "execution_error"
	FailureDependencyFailed TaskFailureType = "dependency_failed"
)

// --- Context Sources (typed + extensible) ---

// ContextSourceType identifies the type of context attached to a task
type ContextSourceType string

const (
	ContextGitHub ContextSourceType = "github"
	ContextSlack  ContextSourceType = "slack"
	ContextJira   ContextSourceType = "jira"
	ContextCustom ContextSourceType = "custom"
)

// ContextSource represents a typed context source attached to a task
type ContextSource struct {
	Type ContextSourceType `json:"type"`
	Data json.RawMessage   `json:"data"` // Typed struct serialized as JSON
}

// GitHubContext holds GitHub-specific context for a task
type GitHubContext struct {
	Owner       string   `json:"owner"`
	Repo        string   `json:"repo"`
	IssueNumber *int     `json:"issue_number,omitempty"`
	PRNumber    *int     `json:"pr_number,omitempty"`
	Branch      string   `json:"branch,omitempty"`
	CommitSHA   string   `json:"commit_sha,omitempty"`
	IssueTitle  string   `json:"issue_title,omitempty"`
	IssueBody   string   `json:"issue_body,omitempty"`
	Labels      []string `json:"labels,omitempty"`
}

// SlackContext holds Slack-specific context for a task
type SlackContext struct {
	Channel     string `json:"channel"`
	ThreadTS    string `json:"thread_ts,omitempty"`
	MessageTS   string `json:"message_ts,omitempty"`
	MessageText string `json:"message_text,omitempty"`
	UserID      string `json:"user_id,omitempty"`
	Permalink   string `json:"permalink,omitempty"`
}

// JiraContext holds Jira-specific context for a task
type JiraContext struct {
	ProjectKey  string `json:"project_key"`
	IssueKey    string `json:"issue_key,omitempty"`
	IssueType   string `json:"issue_type,omitempty"`
	Summary     string `json:"summary,omitempty"`
	Description string `json:"description,omitempty"`
	Status      string `json:"status,omitempty"`
	Priority    string `json:"priority,omitempty"`
}

// CustomContext holds arbitrary context for extensibility
type CustomContext struct {
	Name   string                 `json:"name"`
	Fields map[string]interface{} `json:"fields"`
}

// --- Core Task Struct ---

// Task represents a first-class structured task backed by a dedicated DB table
type Task struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	TeamID    string `json:"team_id,omitempty"`
	AgentID   string `json:"agent_id,omitempty"`
	CreatedBy string `json:"created_by"`

	// Tree structure (adjacency list)
	ParentTaskID *string `json:"parent_task_id,omitempty"`
	Depth        int     `json:"depth"`
	Path         string  `json:"path"`
	ChildCount   int     `json:"child_count,omitempty"` // computed, not stored

	// Core fields
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	Priority    string    `json:"priority"`
	State       TaskState `json:"state"`

	// Failure tracking
	FailureType   *TaskFailureType `json:"failure_type,omitempty"`
	FailureReason string           `json:"failure_reason,omitempty"`
	FailureAt     *time.Time       `json:"failure_at,omitempty"`
	RetryCount    int              `json:"retry_count"`

	// Context sources
	ContextSources []ContextSource `json:"context_sources,omitempty"`

	// Results & artifacts
	Results         map[string]interface{} `json:"results,omitempty"`
	Artifacts       []TaskArtifact         `json:"artifacts,omitempty"`
	CompletionNotes string                 `json:"completion_notes,omitempty"`

	// Metadata
	EstimatedDuration string                 `json:"estimated_duration,omitempty"`
	ActualDuration    string                 `json:"actual_duration,omitempty"`
	Deadline          *time.Time             `json:"deadline,omitempty"`
	Metadata          map[string]interface{} `json:"metadata,omitempty"`

	// Dependencies (loaded separately from task_dependencies table)
	Dependencies []string `json:"dependencies,omitempty"` // IDs this task depends on
	Blockers     []string `json:"blockers,omitempty"`     // IDs blocking this task (not completed)

	// Timestamps
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	CompiledAt  *time.Time `json:"compiled_at,omitempty"`
	StartedAt   *time.Time `json:"started_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

// --- Task Dependency ---

// TaskDependency represents an ordering edge between tasks (separate from tree hierarchy)
type TaskDependency struct {
	TaskID         string    `json:"task_id"`
	DependsOnID    string    `json:"depends_on_id"`
	DependencyType string    `json:"dependency_type"` // "blocks" or "requires"
	CreatedAt      time.Time `json:"created_at"`
}

// --- Request/Response Types ---

// TaskCreateRequest is the request body for creating a new structured task
type TaskCreateRequest struct {
	Title             string                 `json:"title" validate:"required"`
	Description       string                 `json:"description,omitempty"`
	ParentTaskID      *string                `json:"parent_task_id,omitempty"`
	Priority          string                 `json:"priority,omitempty"` // defaults to "medium"
	ContextSources    []ContextSource        `json:"context_sources,omitempty"`
	Dependencies      []string               `json:"dependencies,omitempty"`
	EstimatedDuration string                 `json:"estimated_duration,omitempty"`
	Deadline          *time.Time             `json:"deadline,omitempty"`
	Metadata          map[string]interface{} `json:"metadata,omitempty"`
}

// TaskUpdateRequest is the request body for updating a structured task's mutable fields
type TaskUpdateRequest struct {
	Title             *string                `json:"title,omitempty"`
	Description       *string                `json:"description,omitempty"`
	Priority          *string                `json:"priority,omitempty"`
	AgentID           *string                `json:"agent_id,omitempty"`
	EstimatedDuration *string                `json:"estimated_duration,omitempty"`
	Deadline          *time.Time             `json:"deadline,omitempty"`
	Metadata          map[string]interface{} `json:"metadata,omitempty"`
}

// TaskTransitionRequest is the request body for transitioning a task between states
type TaskTransitionRequest struct {
	TaskID          string                 `json:"task_id" validate:"required"`
	TargetState     TaskState              `json:"target_state" validate:"required"`
	FailureType     *TaskFailureType       `json:"failure_type,omitempty"`
	FailureReason   string                 `json:"failure_reason,omitempty"`
	Results         map[string]interface{} `json:"results,omitempty"`
	CompletionNotes string                 `json:"completion_notes,omitempty"`
	Artifacts       []TaskArtifact         `json:"artifacts,omitempty"`
	ActualDuration  string                 `json:"actual_duration,omitempty"`
}

// TaskListRequest is the request body for listing/filtering structured tasks
type TaskListRequest struct {
	ParentTaskID   *string  `json:"parent_task_id,omitempty"`
	States         []string `json:"states,omitempty"`
	Priority       []string `json:"priority,omitempty"`
	AgentID        string   `json:"agent_id,omitempty"`
	IncludeSubtree bool     `json:"include_subtree,omitempty"`
	Limit          int      `json:"limit,omitempty"`
	Offset         int      `json:"offset,omitempty"`
}

// TaskResponse is the standard response for structured task operations
type TaskResponse struct {
	Success  bool                   `json:"success"`
	Task     *Task                  `json:"task,omitempty"`
	Tasks    []Task                 `json:"tasks,omitempty"`
	Error    string                 `json:"error,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}
