-- Migration rollback: Restore previous system configurations and remove preferred configuration support

-- Step 1: Remove preferred configuration links from templates
UPDATE execution_templates 
SET preferred_configuration_id = NULL
WHERE user_id = 'system';

-- Step 2: Remove new system configurations
DELETE FROM api_configurations WHERE id IN (
    'system-config-gemini-flash',
    'system-config-gemini-pro', 
    'system-config-gemini-stable',
    'system-config-kimi-k2'
) AND user_id = 'system';

-- Step 3: Restore original system configurations
INSERT INTO api_configurations (
    id,
    user_id,
    variation_name,
    model_name,
    system_prompt,
    temperature,
    max_tokens,
    top_p,
    safety_settings,
    generation_config,
    tools,
    tool_config,
    created_at,
    updated_at
) VALUES 
(
    'system-config-autonomous-swe',
    'system',
    'Autonomous SWE Pro',
    'gemini-1.5-pro-latest',
    'You are an autonomous software engineering agent. Your role is to read GitHub issues, implement complete solutions, and create pull requests with detailed descriptions.',
    0.50,
    4096,
    0.80,
    JSON_OBJECT(),
    JSON_OBJECT('temperature', 0.50, 'maxOutputTokens', 4096, 'topP', 0.80),
    JSON_ARRAY(),
    JSON_OBJECT(),
    NOW(),
    NOW()
),
(
    'system-config-gemini-flash',
    'system',
    'Gemini Flash Default',
    'gemini-1.5-flash-latest',
    'You are a helpful AI assistant optimized for quick responses.',
    0.50,
    1024,
    0.90,
    JSON_OBJECT(),
    JSON_OBJECT('temperature', 0.50, 'maxOutputTokens', 1024, 'topP', 0.90),
    JSON_ARRAY(),
    JSON_OBJECT(),
    NOW(),
    NOW()
),
(
    'system-config-gemini-pro',
    'system',
    'Gemini Pro Default',
    'gemini-1.5-pro-latest',
    'You are a helpful AI assistant that provides accurate and concise responses.',
    0.70,
    2048,
    0.80,
    JSON_OBJECT(),
    JSON_OBJECT('temperature', 0.70, 'maxOutputTokens', 2048, 'topP', 0.80),
    JSON_ARRAY(),
    JSON_OBJECT(),
    NOW(),
    NOW()
),
(
    'system-config-github-debug',
    'system',
    'GitHub Function Debug',
    'gemini-1.5-pro-latest',
    'You are a GitHub debugging specialist. Focus on analyzing GitHub API responses and function calling behavior.',
    0.30,
    4096,
    0.80,
    JSON_OBJECT(),
    JSON_OBJECT('temperature', 0.30, 'maxOutputTokens', 4096, 'topP', 0.80),
    JSON_ARRAY(),
    JSON_OBJECT(),
    NOW(),
    NOW()
);

-- Step 4: Remove preferred_configuration_id field and constraints from execution_templates
ALTER TABLE execution_templates 
DROP FOREIGN KEY execution_templates_preferred_config_fk,
DROP INDEX idx_execution_templates_preferred_config,
DROP COLUMN preferred_configuration_id;