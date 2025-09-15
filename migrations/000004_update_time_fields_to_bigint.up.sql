-- Update time fields from INT to BIGINT to prevent integer overflow
-- This migration changes response_time_ms and execution_time_ms fields to BIGINT

-- Update api_responses table
ALTER TABLE api_responses MODIFY COLUMN response_time_ms BIGINT DEFAULT NULL;

-- Update function_calls table  
ALTER TABLE function_calls MODIFY COLUMN execution_time_ms BIGINT DEFAULT NULL;

-- Update execution_template_executions table
ALTER TABLE execution_template_executions MODIFY COLUMN execution_time_ms BIGINT DEFAULT NULL;

-- Update api_key_usage_logs table
ALTER TABLE api_key_usage_logs MODIFY COLUMN response_time_ms BIGINT DEFAULT NULL;
