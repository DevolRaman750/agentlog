-- Update gemini-1.5-pro references to gemini-2.5-pro
UPDATE api_configurations SET model_name = 'gemini-2.5-pro' WHERE model_name = 'gemini-1.5-pro';

-- Update claude model
UPDATE api_configurations SET model_name = 'anthropic/claude-sonnet-4' WHERE model_name = 'anthropic/claude-3.5-sonnet-20241022';

-- Update GPT model
UPDATE api_configurations SET model_name = 'openai/gpt-4.1' WHERE model_name = 'openai/gpt-4o-2024-08-06';

-- Delete the old gemini-1.5-pro system config
DELETE FROM api_configurations WHERE id = 'system-config-gemini-pro' AND user_id = 'system';

-- Update agent configs that reference the deleted config
UPDATE execution_templates SET preferred_configuration_id = 'system-config-gemini-2-5-pro'
WHERE preferred_configuration_id = 'system-config-gemini-pro';
