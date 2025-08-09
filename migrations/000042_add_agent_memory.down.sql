-- Migration 000042 Rollback: Remove Agent Memory Feature

-- Remove constraints first
ALTER TABLE agents 
DROP CONSTRAINT chk_memory_size_limit;

-- Remove indexes
ALTER TABLE agents 
DROP INDEX idx_agents_memory_updated_at,
DROP INDEX idx_agents_memory_size;

-- Remove memory columns
ALTER TABLE agents 
DROP COLUMN memory,
DROP COLUMN memory_size_bytes,
DROP COLUMN memory_updated_at;