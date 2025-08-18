-- Migration 000008: Fix Execution Flow Issues
-- This migration fixes event type enum and config column issues

-- 1. Add missing event types to execution_flow_events enum
ALTER TABLE execution_flow_events 
MODIFY COLUMN event_type ENUM(
    'prompt_start',
    'ai_model_call', 
    'function_call_start',
    'function_call_end',
    'ai_response',
    'error_occurred',
    'retry_attempt',
    'execution_complete',
    'api_request_start',
    'api_request_end',
    'function_execution_start',
    'function_execution_end',
    'configuration_start',
    'configuration_end'
) NOT NULL;

-- 2. Update any existing NULL config values to empty JSON objects first
UPDATE execution_function_configs 
SET config = JSON_OBJECT() 
WHERE config IS NULL;

-- 3. Set default empty JSON object for config column to prevent NULL scan errors
ALTER TABLE execution_function_configs 
MODIFY COLUMN config JSON NOT NULL DEFAULT (JSON_OBJECT()); 