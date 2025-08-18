-- Fix JSON columns to be NOT NULL with default values
-- This eliminates all NULL scanning issues with json.RawMessage

-- Update existing NULL values to empty JSON objects/arrays first
UPDATE function_definitions SET parameters_schema = '{}' WHERE parameters_schema IS NULL;
UPDATE function_definitions SET mock_response = '{}' WHERE mock_response IS NULL;
UPDATE function_definitions SET headers = '{}' WHERE headers IS NULL;
UPDATE function_definitions SET auth_config = '{}' WHERE auth_config IS NULL;
UPDATE function_definitions SET fallback_data = '{}' WHERE fallback_data IS NULL;

-- Now alter the columns to be NOT NULL with defaults
ALTER TABLE function_definitions 
MODIFY COLUMN parameters_schema JSON NOT NULL DEFAULT ('{}'),
MODIFY COLUMN mock_response JSON NOT NULL DEFAULT ('{}'),
MODIFY COLUMN headers JSON NOT NULL DEFAULT ('{}'),
MODIFY COLUMN auth_config JSON NOT NULL DEFAULT ('{}'),
MODIFY COLUMN fallback_data JSON NOT NULL DEFAULT ('{}');