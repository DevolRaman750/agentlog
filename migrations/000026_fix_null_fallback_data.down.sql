-- Revert fallback_data column to allow NULL values

ALTER TABLE function_definitions
MODIFY fallback_data JSON NULL; 