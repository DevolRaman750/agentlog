-- Add api_source field to function_definitions to eliminate hardcoded mappings
-- This makes the API execution completely generic and data-driven

-- Add the api_source column
ALTER TABLE function_definitions 
ADD COLUMN api_source VARCHAR(50) DEFAULT 'api' AFTER result_transformer;

-- Update existing functions with appropriate api_source values
UPDATE function_definitions 
SET api_source = 'github_api' 
WHERE user_id = 'system' AND function_group = 'github';

UPDATE function_definitions 
SET api_source = 'slack_api' 
WHERE user_id = 'system' AND name = 'slack_send_message';

UPDATE function_definitions 
SET api_source = 'weather_api' 
WHERE user_id = 'system' AND function_group = 'weather';