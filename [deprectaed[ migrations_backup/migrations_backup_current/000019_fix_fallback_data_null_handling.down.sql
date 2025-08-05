-- Revert fallback_data column to allow NULL values
-- This reverts the fix for json.RawMessage scan errors

ALTER TABLE function_definitions 
MODIFY COLUMN fallback_data JSON NULL; 