-- Update duration fields from INT to BIGINT to prevent integer overflow
-- This migration changes duration_ms fields to BIGINT

-- Update execution_flow_events table
ALTER TABLE execution_flow_events MODIFY COLUMN duration_ms BIGINT DEFAULT NULL;

-- Update execution_logs table  
ALTER TABLE execution_logs MODIFY COLUMN duration_ms BIGINT DEFAULT NULL;
