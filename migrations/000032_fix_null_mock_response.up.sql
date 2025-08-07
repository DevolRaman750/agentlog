-- Fix NULL mock_response values that cause Go scanning errors
-- Set default JSON object for all functions with NULL mock_response

UPDATE function_definitions 
SET mock_response = JSON_OBJECT('error', 'Mock response not available')
WHERE mock_response IS NULL;