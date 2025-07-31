-- Revert JSON columns back to nullable
-- This allows NULL values again (rollback)

ALTER TABLE function_definitions 
MODIFY COLUMN parameters_schema JSON NULL,
MODIFY COLUMN mock_response JSON NULL,
MODIFY COLUMN headers JSON NULL,
MODIFY COLUMN auth_config JSON NULL;

ALTER TABLE execution_function_configs
MODIFY COLUMN config JSON NULL; 