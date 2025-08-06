-- Migration 000033 Down: Remove Team ID from Agents

-- 2. Recreate the original agent_execution_summary view without team info
DROP VIEW IF EXISTS agent_execution_summary;

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

-- 3. Remove team_id foreign key and column from agents
ALTER TABLE agents 
DROP FOREIGN KEY fk_agents_team_id,
DROP INDEX idx_agents_team_id,
DROP COLUMN team_id; 