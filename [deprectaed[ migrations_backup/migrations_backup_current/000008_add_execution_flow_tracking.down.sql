-- Revert execution flow tracking changes

-- Remove foreign key constraints first
ALTER TABLE execution_logs DROP FOREIGN KEY fk_execution_logs_flow_event;
ALTER TABLE function_calls DROP FOREIGN KEY fk_function_calls_parent;

-- Drop new tables
DROP TABLE execution_stats;
DROP TABLE execution_flow_events;

-- Remove added columns from execution_logs
ALTER TABLE execution_logs 
DROP COLUMN sequence_number,
DROP COLUMN duration_ms,
DROP COLUMN related_event_id;

-- Remove added columns from function_calls
ALTER TABLE function_calls 
DROP COLUMN sequence_number,
DROP COLUMN parent_call_id,
DROP COLUMN execution_depth; 