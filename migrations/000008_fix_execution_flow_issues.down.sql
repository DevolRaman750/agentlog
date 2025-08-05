-- Migration 000008 Down: Revert Execution Flow Fixes

-- 1. Revert event_type enum to original values
ALTER TABLE execution_flow_events 
MODIFY COLUMN event_type ENUM(
    'prompt_start',
    'ai_model_call',
    'function_call_start',
    'function_call_end',
    'ai_response',
    'error_occurred',
    'retry_attempt',
    'execution_complete'
) NOT NULL;

-- 2. Revert config column to allow NULL
ALTER TABLE execution_function_configs 
MODIFY COLUMN config JSON NULL; 