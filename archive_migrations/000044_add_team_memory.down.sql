-- Migration 000044 Down: Remove Team Memory Feature
-- This migration removes memory capabilities from teams

-- Remove constraint first
ALTER TABLE teams 
DROP CONSTRAINT IF EXISTS chk_team_memory_size_limit;

-- Remove indexes
ALTER TABLE teams 
DROP INDEX IF EXISTS idx_teams_memory_size,
DROP INDEX IF EXISTS idx_teams_memory_updated_at;

-- Remove memory columns
ALTER TABLE teams 
DROP COLUMN IF EXISTS memory_updated_at,
DROP COLUMN IF EXISTS memory_size_bytes,
DROP COLUMN IF EXISTS memory;
