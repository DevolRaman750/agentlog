-- Ensure required_api_keys column is never NULL for system functions
UPDATE function_definitions
SET required_api_keys = '[]'
WHERE required_api_keys IS NULL; 