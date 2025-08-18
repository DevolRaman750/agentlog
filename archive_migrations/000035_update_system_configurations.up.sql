-- Migration: Update system configurations and add template preferred configuration support
-- 1. Add preferred_configuration_id to execution_templates
-- 2. Remove old system configurations  
-- 3. Create new optimized system configurations
-- 4. Link system templates to appropriate configurations

-- Step 1: Add preferred_configuration_id field to execution_templates
ALTER TABLE execution_templates 
ADD COLUMN preferred_configuration_id VARCHAR(255) DEFAULT NULL AFTER enable_function_calling,
ADD INDEX idx_execution_templates_preferred_config (preferred_configuration_id),
ADD CONSTRAINT execution_templates_preferred_config_fk 
    FOREIGN KEY (preferred_configuration_id) REFERENCES api_configurations(id) ON DELETE SET NULL;

-- Step 2: Remove existing system configurations
DELETE FROM api_configurations WHERE user_id = 'system';

-- Step 3: Create new optimized system configurations

-- Configuration 1: Gemini Flash (Fast & Efficient)
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
) VALUES (
    'system-config-gemini-flash',
    'system',
    'Fast & Efficient',
    'gemini-1.5-flash',
    'You are a fast and efficient AI assistant optimized for quick responses. Provide concise, accurate answers while maintaining quality. Focus on speed and clarity.',
    0.3,
    2048,
    0.8,
    JSON_OBJECT(),
    JSON_OBJECT('temperature', 0.3, 'maxOutputTokens', 2048, 'topP', 0.8),
    JSON_ARRAY(),
    JSON_OBJECT(),
    NOW(),
    NOW()
);

-- Configuration 2: Gemini Pro (Advanced & Capable)  
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
) VALUES (
    'system-config-gemini-pro',
    'system',
    'Advanced & Capable',
    'gemini-1.5-pro',
    'You are an advanced AI assistant with superior reasoning capabilities. Handle complex multi-step workflows, provide detailed analysis, and tackle challenging problems with thoroughness and precision.',
    0.5,
    4096,
    0.9,
    JSON_OBJECT(),
    JSON_OBJECT('temperature', 0.5, 'maxOutputTokens', 4096, 'topP', 0.9),
    JSON_ARRAY(),
    JSON_OBJECT(),
    NOW(),
    NOW()
);

-- Configuration 3: Gemini Stable (Balanced & Reliable)
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
) VALUES (
    'system-config-gemini-stable',
    'system',
    'Balanced & Reliable',
    'gemini-1.0-pro',
    'You are a reliable AI assistant providing balanced, well-tested responses. Focus on stability, consistency, and proven performance for production workloads.',
    0.4,
    3072,
    0.85,
    JSON_OBJECT(),
    JSON_OBJECT('temperature', 0.4, 'maxOutputTokens', 3072, 'topP', 0.85),
    JSON_ARRAY(),
    JSON_OBJECT(),
    NOW(),
    NOW()
);

-- Configuration 4: Kimi K2 (Tool Use & Coding)
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
) VALUES (
    'system-config-kimi-k2',
    'system',
    'Tool Use & Coding',
    'moonshotai/kimi-k2',
    'You are an expert AI assistant specialized in tool use and coding tasks. Excel at function calling, code analysis, and complex agentic workflows. Provide precise, technical solutions.',
    0.6,
    4096,
    0.9,
    JSON_OBJECT(),
    JSON_OBJECT('temperature', 0.6, 'maxOutputTokens', 4096, 'topP', 0.9),
    JSON_ARRAY(),
    JSON_OBJECT(),
    NOW(),
    NOW()
);

-- Step 4: Update system templates to use appropriate configurations

-- Intern Software Engineer → Fast & Efficient (Gemini Flash)
UPDATE execution_templates 
SET preferred_configuration_id = 'system-config-gemini-flash'
WHERE id = 'template-intern-swe' AND user_id = 'system';

-- Software Engineer → Advanced & Capable (Gemini Pro)
UPDATE execution_templates 
SET preferred_configuration_id = 'system-config-gemini-pro'
WHERE id = 'template-software-engineer' AND user_id = 'system';

-- Weatherman → Fast & Efficient (Gemini Flash) 
UPDATE execution_templates 
SET preferred_configuration_id = 'system-config-gemini-flash'
WHERE id = 'template-weatherman' AND user_id = 'system';