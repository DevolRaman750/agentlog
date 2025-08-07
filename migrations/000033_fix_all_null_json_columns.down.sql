-- Revert all JSON columns back to NULL (NOT RECOMMENDED - will cause scanning errors)

UPDATE function_definitions 
SET parameters_schema = NULL
WHERE parameters_schema = JSON_OBJECT('type', 'object', 'properties', JSON_OBJECT());

UPDATE function_definitions 
SET mock_response = NULL
WHERE mock_response = JSON_OBJECT('error', 'Mock response not available');

UPDATE function_definitions 
SET headers = NULL
WHERE headers = JSON_OBJECT();

UPDATE function_definitions 
SET auth_config = NULL
WHERE auth_config = JSON_OBJECT();

UPDATE function_definitions 
SET fallback_data = NULL
WHERE fallback_data = JSON_OBJECT('error', 'Service not available');