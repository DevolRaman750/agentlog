-- Fix NULL values in required_api_keys and api_key_validation columns
-- This prevents "sql: Scan error" when trying to scan NULL into json.RawMessage

-- Update github_repo_info function specifically
UPDATE function_definitions 
SET required_api_keys = JSON_ARRAY('githubApiKey')
WHERE name = 'github_repo_info' AND required_api_keys IS NULL;

-- Fix any other functions that might have NULL required_api_keys
UPDATE function_definitions 
SET required_api_keys = JSON_ARRAY()
WHERE required_api_keys IS NULL;

-- Fix any functions that might have NULL api_key_validation
UPDATE function_definitions 
SET api_key_validation = JSON_OBJECT()
WHERE api_key_validation IS NULL;

-- Ensure the columns cannot be NULL in the future
ALTER TABLE function_definitions 
MODIFY COLUMN required_api_keys JSON NOT NULL DEFAULT (JSON_ARRAY());

ALTER TABLE function_definitions 
MODIFY COLUMN api_key_validation JSON NOT NULL DEFAULT (JSON_OBJECT()); 