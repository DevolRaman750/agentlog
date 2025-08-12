-- Fix Kimi K2 model ID from incorrect 'moonshotai/kimi-k2-instruct' to correct 'moonshotai/kimi-k2'
UPDATE api_configurations 
SET model_name = 'moonshotai/kimi-k2' 
WHERE id = 'system-config-kimi-k2' AND model_name = 'moonshotai/kimi-k2-instruct';
