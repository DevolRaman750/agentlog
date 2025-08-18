-- Migration 000009 Down: Remove Missing Flow Event Types

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