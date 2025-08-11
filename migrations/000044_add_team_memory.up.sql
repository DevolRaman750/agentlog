-- Migration 000044: Add Team Memory Feature
-- This migration adds memory capabilities to teams for collaborative agent state

-- Add memory column to teams table
ALTER TABLE teams 
ADD COLUMN memory JSON NULL COMMENT 'Team memory storage for collaborative agent state',
ADD COLUMN memory_size_bytes INT NOT NULL DEFAULT 0 COMMENT 'Current memory size in bytes for optimization',
ADD COLUMN memory_updated_at TIMESTAMP NULL COMMENT 'Last time memory was updated';

-- Add indexes for memory queries
ALTER TABLE teams 
ADD INDEX idx_teams_memory_updated_at (memory_updated_at),
ADD INDEX idx_teams_memory_size (memory_size_bytes);

-- Add constraint to prevent excessive memory usage (20MB limit for teams)
ALTER TABLE teams 
ADD CONSTRAINT chk_team_memory_size_limit CHECK (memory_size_bytes <= 20971520);
