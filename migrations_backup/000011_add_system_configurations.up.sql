-- Add system configurations for testing and default usage
-- Create a system user first
INSERT IGNORE INTO users (id, email, password_hash, created_at)
VALUES ('system', 'system@gogent.local', '', NOW());

-- Create a default execution run for system configurations
INSERT IGNORE INTO execution_runs (id, user_id, name, description, base_prompt, enable_function_calling, status, created_at)
VALUES ('system-default-run', 'system', 'System Default Configurations', 'Default system configurations for testing', 'You are a helpful AI assistant.', 0, 'completed', NOW());

-- Add system configurations
INSERT IGNORE INTO api_configurations (
    id, 
    user_id, 
    execution_run_id, 
    variation_name, 
    model_name, 
    system_prompt, 
    temperature, 
    max_tokens, 
    top_p, 
    generation_config,
    created_at
) VALUES 
(
    'system-config-gemini-pro', 
    'system', 
    'system-default-run', 
    'Gemini Pro Default', 
    'gemini-1.5-pro-latest', 
    'You are a helpful AI assistant that provides accurate and concise responses.',
    0.7,
    2048,
    0.8,
    '{"temperature": 0.7, "maxOutputTokens": 2048, "topP": 0.8}',
    NOW()
),
(
    'system-config-gemini-flash', 
    'system', 
    'system-default-run', 
    'Gemini Flash Default', 
    'gemini-1.5-flash-latest', 
    'You are a helpful AI assistant optimized for quick responses.',
    0.5,
    1024,
    0.9,
    '{"temperature": 0.5, "maxOutputTokens": 1024, "topP": 0.9}',
    NOW()
); 