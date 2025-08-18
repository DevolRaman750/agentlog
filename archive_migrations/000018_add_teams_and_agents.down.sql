-- Migration 000018 Down: Remove Teams and Agents Tables
-- This migration removes the teams and agents tables

-- 1. Drop views first
DROP VIEW IF EXISTS agent_stats;
DROP VIEW IF EXISTS team_stats;

-- 2. Remove foreign key constraint from execution_runs
ALTER TABLE execution_runs DROP FOREIGN KEY IF EXISTS fk_execution_runs_agent_id;

-- 3. Remove agent_id column from execution_runs
ALTER TABLE execution_runs DROP COLUMN IF EXISTS agent_id;

-- 4. Drop agents table (will cascade foreign key constraints)
DROP TABLE IF EXISTS agents;

-- 5. Drop teams table
DROP TABLE IF EXISTS teams;