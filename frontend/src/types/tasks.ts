// Task v2 Types - matches internal/types/task.go

export type TaskState = 'defining' | 'compiling' | 'compiled' | 'in_progress' | 'completed' | 'failed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskFailureType = 'context_invalid' | 'definition_error' | 'execution_error' | 'dependency_failed';

export type ContextSourceType = 'github' | 'slack' | 'jira' | 'custom';

export interface ContextSource {
  type: ContextSourceType;
  data: Record<string, any>;
}

export interface TaskArtifact {
  type: string;
  identifier: string;
  url?: string;
  description?: string;
}

export interface TaskDependency {
  task_id: string;
  depends_on_id: string;
  dependency_type: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  team_id?: string;
  agent_id?: string;
  created_by: string;

  // Tree structure
  parent_task_id?: string;
  depth: number;
  path: string;
  child_count?: number;

  // Core fields
  title: string;
  description?: string;
  priority: string;
  state: TaskState;

  // Failure tracking
  failure_type?: TaskFailureType;
  failure_reason?: string;
  failure_at?: string;
  retry_count: number;

  // Context sources
  context_sources?: ContextSource[];

  // Results & artifacts
  results?: Record<string, any>;
  artifacts?: TaskArtifact[];
  completion_notes?: string;

  // Metadata
  estimated_duration?: string;
  actual_duration?: string;
  deadline?: string;
  metadata?: Record<string, any>;

  // Dependencies
  dependencies?: string[];
  blockers?: string[];

  // Timestamps
  created_at: string;
  updated_at: string;
  compiled_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  parent_task_id?: string;
  priority?: string;
  context_sources?: ContextSource[];
  dependencies?: string[];
  estimated_duration?: string;
  deadline?: string;
  metadata?: Record<string, any>;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  priority?: string;
  agent_id?: string;
  estimated_duration?: string;
  deadline?: string;
  metadata?: Record<string, any>;
}

export interface TaskTransitionRequest {
  task_id: string;
  target_state: TaskState;
  failure_type?: TaskFailureType;
  failure_reason?: string;
  results?: Record<string, any>;
  completion_notes?: string;
  artifacts?: TaskArtifact[];
  actual_duration?: string;
}

export interface TaskListParams {
  states?: string[];
  priority?: string[];
  agent_id?: string;
  team_id?: string;
  parent_task_id?: string;
  limit?: number;
  offset?: number;
}

export interface TaskResponse {
  success: boolean;
  task?: Task;
  tasks?: Task[];
  error?: string;
  metadata?: Record<string, any>;
}

// Valid state transitions map
export const VALID_TRANSITIONS: Record<TaskState, TaskState[]> = {
  defining: ['compiling', 'compiled', 'failed'],
  compiling: ['compiled', 'failed', 'defining'],
  compiled: ['in_progress', 'failed'],
  in_progress: ['completed', 'failed', 'compiled'],
  failed: ['defining'],
  completed: [],
};
