-- Migration 000042: Add Agent Memory Feature
-- This migration adds memory capabilities to agents for stateful execution

-- Add memory column to agents table
ALTER TABLE agents 
ADD COLUMN memory JSON NULL COMMENT 'Agent memory storage for stateful execution',
ADD COLUMN memory_size_bytes INT NOT NULL DEFAULT 0 COMMENT 'Current memory size in bytes for optimization',
ADD COLUMN memory_updated_at TIMESTAMP NULL COMMENT 'Last time memory was updated';

-- Add indexes for memory queries
ALTER TABLE agents 
ADD INDEX idx_agents_memory_updated_at (memory_updated_at),
ADD INDEX idx_agents_memory_size (memory_size_bytes);

-- Add constraint to prevent excessive memory usage (10MB limit)
ALTER TABLE agents 
ADD CONSTRAINT chk_memory_size_limit CHECK (memory_size_bytes <= 10485760);