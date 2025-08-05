-- Add new flow event types to execution_flow_events table
-- This fixes the "Data truncated for column 'event_type'" error

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
    'gemini_api_call_start',
    'gemini_api_call_end'
) NOT NULL; 