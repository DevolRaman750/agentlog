-- Revert new flow event types from execution_flow_events table
-- Warning: This will delete any existing events with the new types

-- First, delete any events that use the new types (to avoid constraint violations)
DELETE FROM execution_flow_events 
WHERE event_type IN ('api_request_start', 'api_request_end', 'gemini_api_call_start', 'gemini_api_call_end');

-- Then revert to original ENUM
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