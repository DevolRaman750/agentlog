-- Migration 000018: Add Teams and Agents Tables
-- This migration adds the teams and agents tables for the agent management feature

-- 1. Create teams table
CREATE TABLE teams (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Basic team info
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    -- Token management for the team
    max_tokens_per_day INT NOT NULL DEFAULT 50000,
    tokens_used_today INT NOT NULL DEFAULT 0,
    tokens_reset_date DATE NOT NULL DEFAULT (CURDATE()),
    
    -- Team statistics (calculated fields)
    agent_count INT NOT NULL DEFAULT 0,
    active_agent_count INT NOT NULL DEFAULT 0,
    total_executions INT NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure positive token limits
    CONSTRAINT chk_teams_max_tokens_positive CHECK (max_tokens_per_day > 0),
    
    -- Indexes
    INDEX idx_teams_user_id (user_id),
    INDEX idx_teams_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Create agents table
CREATE TABLE agents (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    team_id VARCHAR(255) NULL,
    
    -- Basic agent info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    template_id VARCHAR(255) NOT NULL,
    
    -- Agent behavior configuration
    max_tokens_per_day INT NOT NULL DEFAULT 10000,
    heartbeat_minutes INT NOT NULL DEFAULT 5, -- Minimum 5 minutes
    lifecycle_status ENUM('STANDBY', 'ACTIVE', 'PAUSED', 'KILLED') NOT NULL DEFAULT 'STANDBY',
    
    -- Token usage tracking (reset daily)
    tokens_used_today INT NOT NULL DEFAULT 0,
    tokens_reset_date DATE NOT NULL DEFAULT (CURDATE()),
    
    -- Execution tracking
    last_execution_at TIMESTAMP NULL,
    next_scheduled_at TIMESTAMP NULL,
    total_executions INT NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES execution_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Ensure heartbeat is at least 5 minutes
    CONSTRAINT chk_heartbeat_minimum CHECK (heartbeat_minutes >= 5),
    CONSTRAINT chk_max_tokens_positive CHECK (max_tokens_per_day > 0),
    
    -- Indexes
    INDEX idx_agents_user_id (user_id),
    INDEX idx_agents_template_id (template_id),
    INDEX idx_agents_team_id (team_id),
    INDEX idx_agents_lifecycle_status (lifecycle_status),
    INDEX idx_agents_next_scheduled_at (next_scheduled_at),
    INDEX idx_agents_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. The agent_id column already exists in execution_runs from the initial schema
-- The foreign key constraint may also already exist, so we'll skip this step
-- since the constraint was already defined in the initial schema

-- 4. Create team statistics view
CREATE VIEW team_stats AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.user_id,
    t.max_tokens_per_day,
    t.tokens_used_today,
    t.tokens_reset_date,
    t.created_at,
    t.updated_at,
    COUNT(a.id) as total_agents,
    COUNT(CASE WHEN a.lifecycle_status = 'ACTIVE' THEN 1 END) as active_agents,
    COUNT(CASE WHEN a.lifecycle_status = 'PAUSED' THEN 1 END) as paused_agents,
    COUNT(CASE WHEN a.lifecycle_status = 'STANDBY' THEN 1 END) as standby_agents,
    COUNT(CASE WHEN a.lifecycle_status = 'KILLED' THEN 1 END) as killed_agents,
    COALESCE(SUM(a.total_executions), 0) as total_team_executions,
    COALESCE(SUM(a.tokens_used_today), 0) as total_tokens_used_today
FROM teams t
LEFT JOIN agents a ON t.id = a.team_id
GROUP BY t.id, t.name, t.description, t.user_id, t.max_tokens_per_day, 
         t.tokens_used_today, t.tokens_reset_date, t.created_at, t.updated_at;

-- 5. Create agent statistics view
CREATE VIEW agent_stats AS
SELECT 
    a.id,
    a.first_name,
    a.last_name,
    a.user_id,
    a.team_id,
    t.name as team_name,
    a.template_id,
    a.lifecycle_status,
    a.max_tokens_per_day,
    a.tokens_used_today,
    a.heartbeat_minutes,
    a.last_execution_at,
    a.next_scheduled_at,
    a.total_executions,
    a.created_at,
    a.updated_at,
    COUNT(er.id) as recent_executions,
    COUNT(CASE WHEN er.status = 'completed' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN er.status = 'failed' THEN 1 END) as failed_executions
FROM agents a
LEFT JOIN teams t ON a.team_id = t.id
LEFT JOIN execution_runs er ON a.id = er.agent_id 
    AND er.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY a.id, a.first_name, a.last_name, a.user_id, a.team_id, t.name,
         a.template_id, a.lifecycle_status, a.max_tokens_per_day, a.tokens_used_today,
         a.heartbeat_minutes, a.last_execution_at, a.next_scheduled_at, 
         a.total_executions, a.created_at, a.updated_at;