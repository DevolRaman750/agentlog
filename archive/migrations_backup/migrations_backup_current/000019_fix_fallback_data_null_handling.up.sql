-- Fix fallback_data NULL handling by setting a default empty JSON object for existing NULL values
-- This prevents the json.RawMessage scan errors

UPDATE function_definitions 
SET fallback_data = JSON_OBJECT()
WHERE fallback_data IS NULL;

-- Alter the column to have a default value going forward
ALTER TABLE function_definitions 
MODIFY COLUMN fallback_data JSON NOT NULL DEFAULT (JSON_OBJECT()); 