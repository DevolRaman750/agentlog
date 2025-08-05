-- Migration 000031: Add Agents Feature
-- This migration adds the agents table and links it to execution runs

-- 1. Create agents table
CREATE TABLE agents (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
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
    
    -- Ensure heartbeat is at least 5 minutes
    CONSTRAINT chk_heartbeat_minimum CHECK (heartbeat_minutes >= 5),
    CONSTRAINT chk_max_tokens_positive CHECK (max_tokens_per_day > 0),
    
    -- Indexes
    INDEX idx_agents_user_id (user_id),
    INDEX idx_agents_template_id (template_id),
    INDEX idx_agents_lifecycle_status (lifecycle_status),
    INDEX idx_agents_next_scheduled_at (next_scheduled_at),
    INDEX idx_agents_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Add agent_id foreign key to execution_runs table
ALTER TABLE execution_runs 
ADD COLUMN agent_id VARCHAR(255) NULL,
ADD CONSTRAINT fk_execution_runs_agent_id 
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- Add index for agent_id lookups
CREATE INDEX idx_execution_runs_agent_id ON execution_runs(agent_id);

-- 3. Create agent execution history view for easy querying
CREATE VIEW agent_execution_summary AS
SELECT 
    a.id as agent_id,
    a.first_name,
    a.last_name,
    a.lifecycle_status,
    a.max_tokens_per_day,
    a.tokens_used_today,
    a.last_execution_at,
    a.total_executions,
    COUNT(er.id) as execution_count,
    MAX(er.created_at) as latest_execution_at,
    SUM(CASE WHEN er.status = 'completed' THEN 1 ELSE 0 END) as successful_executions,
    SUM(CASE WHEN er.status = 'failed' THEN 1 ELSE 0 END) as failed_executions
FROM agents a
LEFT JOIN execution_runs er ON a.id = er.agent_id
GROUP BY a.id, a.first_name, a.last_name, a.lifecycle_status, 
         a.max_tokens_per_day, a.tokens_used_today, a.last_execution_at, a.total_executions; 