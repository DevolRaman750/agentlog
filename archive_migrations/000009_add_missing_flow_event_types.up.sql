-- Migration 000009: Add Missing Flow Event Types
-- This migration adds gemini-specific event types that were missing from the enum

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
    'configuration_end',
    'gemini_api_call_start',
    'gemini_api_call_end'
) NOT NULL; 