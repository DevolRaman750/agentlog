-- Revert mock_response to NULL (this will cause scanning errors)
-- This rollback is not recommended

UPDATE function_definitions 
SET mock_response = NULL
WHERE mock_response = JSON_OBJECT('error', 'Mock response not available');