-- Revert JSON columns to allow NULL values (if needed for rollback)

ALTER TABLE function_definitions 
MODIFY COLUMN parameters_schema JSON NULL,
MODIFY COLUMN mock_response JSON NULL,
MODIFY COLUMN headers JSON NULL,
MODIFY COLUMN auth_config JSON NULL,
MODIFY COLUMN fallback_data JSON NULL;