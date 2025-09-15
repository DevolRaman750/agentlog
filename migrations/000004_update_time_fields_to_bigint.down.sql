-- Rollback: Change time fields back from BIGINT to INT
-- WARNING: This may cause data loss if any values exceed INT range

-- Rollback api_responses table
ALTER TABLE api_responses MODIFY COLUMN response_time_ms INT DEFAULT NULL;

-- Rollback function_calls table
ALTER TABLE function_calls MODIFY COLUMN execution_time_ms INT DEFAULT NULL;

-- Rollback execution_template_executions table
ALTER TABLE execution_template_executions MODIFY COLUMN execution_time_ms INT DEFAULT NULL;

-- Rollback api_key_usage_logs table
ALTER TABLE api_key_usage_logs MODIFY COLUMN response_time_ms INT DEFAULT NULL;

-- Rollback execution_flow_events table
ALTER TABLE execution_flow_events MODIFY COLUMN duration_ms INT DEFAULT NULL;

-- Rollback execution_logs table
ALTER TABLE execution_logs MODIFY COLUMN duration_ms INT DEFAULT NULL;
