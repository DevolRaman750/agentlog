-- Fix NULL mock_response values that cause Go scanning errors
-- The Go code expects valid JSON, but our automation functions have NULL values

-- Update all NULL mock_response values to empty JSON objects
UPDATE function_definitions 
SET mock_response = '{}' 
WHERE mock_response IS NULL;

-- Update all NULL headers values to empty JSON objects
UPDATE function_definitions 
SET headers = '{}' 
WHERE headers IS NULL;

-- Update all NULL auth_config values to empty JSON objects  
UPDATE function_definitions 
SET auth_config = '{}' 
WHERE auth_config IS NULL; 