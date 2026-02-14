-- Revert GPT model
UPDATE api_configurations SET model_name = 'openai/gpt-4o-2024-08-06' WHERE model_name = 'openai/gpt-4.1';

-- Revert claude model
UPDATE api_configurations SET model_name = 'anthropic/claude-3.5-sonnet-20241022' WHERE model_name = 'anthropic/claude-sonnet-4';

-- Revert gemini-2.5-pro back to gemini-1.5-pro (only for rows that were migrated)
-- Note: This may revert rows that were already gemini-2.5-pro before migration
-- In practice, down migrations are rarely run and this is acceptable
UPDATE api_configurations SET model_name = 'gemini-1.5-pro' WHERE model_name = 'gemini-2.5-pro';

-- Revert execution templates back to old config
UPDATE execution_templates SET preferred_configuration_id = 'system-config-gemini-pro'
WHERE preferred_configuration_id = 'system-config-gemini-2-5-pro';

-- Re-insert the old gemini-1.5-pro system config
INSERT INTO api_configurations (id, user_id, model_name, variation_name, is_system)
VALUES ('system-config-gemini-pro', 'system', 'gemini-1.5-pro', 'Advanced & Capable', true);
