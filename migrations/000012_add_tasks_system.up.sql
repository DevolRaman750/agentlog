-- Structured task system: first-class tasks with state machine, tree hierarchy, and typed context sources

CREATE TABLE tasks (
    id              VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id         VARCHAR(255) NOT NULL,
    team_id         VARCHAR(255),
    agent_id        VARCHAR(255),
    created_by      VARCHAR(255) NOT NULL,

    -- Tree structure (adjacency list)
    parent_task_id  VARCHAR(255),
    depth           INT NOT NULL DEFAULT 0,
    path            VARCHAR(2048) DEFAULT '',

    -- Core fields
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    priority        ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    state           ENUM('defining','compiling','compiled','in_progress','completed','failed') NOT NULL DEFAULT 'defining',

    -- Failure tracking
    failure_type    ENUM('context_invalid','definition_error','execution_error','dependency_failed') DEFAULT NULL,
    failure_reason  TEXT,
    failure_at      TIMESTAMP NULL,
    retry_count     INT NOT NULL DEFAULT 0,

    -- Context sources (typed + extensible, stored as JSON array)
    context_sources JSON DEFAULT NULL,

    -- Results & artifacts
    results         JSON DEFAULT NULL,
    artifacts       JSON DEFAULT NULL,
    completion_notes TEXT,

    -- Metadata
    estimated_duration VARCHAR(100),
    actual_duration    VARCHAR(100),
    deadline           TIMESTAMP NULL,
    metadata           JSON DEFAULT NULL,

    -- Timestamps
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    compiled_at     TIMESTAMP NULL,
    started_at      TIMESTAMP NULL,
    completed_at    TIMESTAMP NULL,

    -- Foreign keys
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),

    -- Indexes
    INDEX idx_tasks_user (user_id),
    INDEX idx_tasks_team (team_id),
    INDEX idx_tasks_agent (agent_id),
    INDEX idx_tasks_parent (parent_task_id),
    INDEX idx_tasks_state (state),
    INDEX idx_tasks_priority (priority),
    INDEX idx_tasks_created_by (created_by),
    INDEX idx_tasks_path (path(255)),
    INDEX idx_tasks_depth (depth),
    INDEX idx_tasks_team_state (team_id, state),
    INDEX idx_tasks_agent_state (agent_id, state)
);

CREATE TABLE task_dependencies (
    task_id         VARCHAR(255) NOT NULL,
    depends_on_id   VARCHAR(255) NOT NULL,
    dependency_type ENUM('blocks','requires') NOT NULL DEFAULT 'requires',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (task_id, depends_on_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_deps_depends_on (depends_on_id)
);
