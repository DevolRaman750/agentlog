-- Migration 000031 Down: Remove Agents Feature

-- 1. Drop the agent execution summary view
DROP VIEW IF EXISTS agent_execution_summary;

-- 2. Remove agent_id foreign key and column from execution_runs
ALTER TABLE execution_runs 
DROP FOREIGN KEY fk_execution_runs_agent_id,
DROP INDEX idx_execution_runs_agent_id,
DROP COLUMN agent_id;

-- 3. Drop agents table
DROP TABLE IF EXISTS agents; 