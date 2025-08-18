-- Remove api_source field from function_definitions

ALTER TABLE function_definitions 
DROP COLUMN api_source;