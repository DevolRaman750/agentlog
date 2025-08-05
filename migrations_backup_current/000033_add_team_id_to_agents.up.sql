-- Migration 000033: Add Team ID to Agents
-- This migration adds team support to the agents table

-- 1. Add team_id column to agents table
ALTER TABLE agents 
ADD COLUMN team_id VARCHAR(255) NULL AFTER template_id,
ADD CONSTRAINT fk_agents_team_id 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- 2. Add index for team_id lookups
CREATE INDEX idx_agents_team_id ON agents(team_id);

-- 3. Update the agent_execution_summary view to include team information
DROP VIEW IF EXISTS agent_execution_summary;

CREATE VIEW agent_execution_summary AS
SELECT 
    a.id as agent_id,
    a.first_name,
    a.last_name,
    a.team_id,
    t.name as team_name,
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
LEFT JOIN teams t ON a.team_id = t.id
LEFT JOIN execution_runs er ON a.id = er.agent_id
GROUP BY a.id, a.first_name, a.last_name, a.team_id, t.name, a.lifecycle_status, 
         a.max_tokens_per_day, a.tokens_used_today, a.last_execution_at, a.total_executions;

-- Note: Team statistics will be maintained by triggers, but for golang-migrate compatibility,
-- we'll handle statistics updates in the application code instead of database triggers. 