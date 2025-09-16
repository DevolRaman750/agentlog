-- Rollback: Change duration fields back from BIGINT to INT
-- WARNING: This may cause data loss if any values exceed INT range

-- Rollback execution_flow_events table
ALTER TABLE execution_flow_events MODIFY COLUMN duration_ms INT DEFAULT NULL;

-- Rollback execution_logs table
ALTER TABLE execution_logs MODIFY COLUMN duration_ms INT DEFAULT NULL;
