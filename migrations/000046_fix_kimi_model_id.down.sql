-- Revert Kimi K2 model ID back to incorrect 'moonshotai/kimi-k2-instruct'
UPDATE api_configurations 
SET model_name = 'moonshotai/kimi-k2-instruct' 
WHERE id = 'system-config-kimi-k2' AND model_name = 'moonshotai/kimi-k2';
