-- Migration 000032: Create Teams Table
-- This migration adds the teams table for organizing agents

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
    CONSTRAINT chk_team_max_tokens_positive CHECK (max_tokens_per_day > 0),
    CONSTRAINT chk_team_agent_count_non_negative CHECK (agent_count >= 0),
    CONSTRAINT chk_team_active_agent_count_non_negative CHECK (active_agent_count >= 0),
    
    -- Unique team name per user
    UNIQUE KEY uk_teams_user_name (user_id, name),
    
    -- Indexes
    INDEX idx_teams_user_id (user_id),
    INDEX idx_teams_name (name),
    INDEX idx_teams_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Create team statistics view for easy querying
CREATE VIEW team_stats AS
SELECT 
    t.id as team_id,
    t.name,
    t.description,
    t.max_tokens_per_day,
    t.tokens_used_today,
    t.tokens_reset_date,
    t.created_at,
    t.updated_at,
    COUNT(a.id) as total_agents,
    COUNT(CASE WHEN a.lifecycle_status = 'ACTIVE' THEN 1 END) as active_agents,
    COUNT(CASE WHEN a.lifecycle_status = 'PAUSED' THEN 1 END) as paused_agents,
    COUNT(CASE WHEN a.lifecycle_status = 'STANDBY' THEN 1 END) as standby_agents,
    SUM(a.tokens_used_today) as team_tokens_used_today,
    SUM(a.total_executions) as team_total_executions,
    MAX(a.last_execution_at) as last_execution_at
FROM teams t
LEFT JOIN agents a ON t.id = a.team_id
GROUP BY t.id, t.name, t.description, t.max_tokens_per_day, 
         t.tokens_used_today, t.tokens_reset_date, t.created_at, t.updated_at; 