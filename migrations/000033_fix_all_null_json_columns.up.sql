-- Fix ALL NULL JSON columns that cause Go scanning errors
-- Set default JSON values for all nullable JSON columns

-- Fix parameters_schema (should be empty object for functions without parameters)
UPDATE function_definitions 
SET parameters_schema = JSON_OBJECT('type', 'object', 'properties', JSON_OBJECT())
WHERE parameters_schema IS NULL;

-- Fix mock_response (should be default error object)
UPDATE function_definitions 
SET mock_response = JSON_OBJECT('error', 'Mock response not available')
WHERE mock_response IS NULL;

-- Fix headers (should be empty object for functions without custom headers)
UPDATE function_definitions 
SET headers = JSON_OBJECT()
WHERE headers IS NULL;

-- Fix auth_config (should be empty object for functions without auth config)
UPDATE function_definitions 
SET auth_config = JSON_OBJECT()
WHERE auth_config IS NULL;

-- Fix fallback_data (should be default error object)
UPDATE function_definitions 
SET fallback_data = JSON_OBJECT('error', 'Service not available')
WHERE fallback_data IS NULL;