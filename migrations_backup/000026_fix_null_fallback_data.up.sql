-- Fix NULL values in function_definitions.fallback_data and enforce NOT NULL

-- 1) Update existing rows
UPDATE function_definitions
SET fallback_data = '{}'
WHERE fallback_data IS NULL;

-- 2) Alter column to NOT NULL with default '{}'
ALTER TABLE function_definitions
MODIFY fallback_data JSON NOT NULL DEFAULT ('{}'); 