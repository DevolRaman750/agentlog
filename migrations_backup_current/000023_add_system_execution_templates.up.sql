-- Add system execution templates
-- This migration creates system templates that all users can view and use

-- First, ensure we have system user (should already exist)
INSERT IGNORE INTO users (id, username, email, password_hash, email_verified, is_temporary, created_at, updated_at)
VALUES ('system', 'system', NULL, '', 1, 0, NOW(), NOW());

-- 1. Weatherman Template
INSERT IGNORE INTO execution_templates (
    id,
    user_id,
    name,
    description,
    template_prompt,
    context_template,
    enable_function_calling,
    is_active,
    is_public,
    category,
    tags,
    execution_timeout_seconds,
    rate_limit_per_hour,
    rate_limit_per_day,
    rate_limit_burst,
    total_executions,
    last_executed_at,
    created_at
) VALUES (
    'system-template-weatherman',
    'system',
    'Weatherman',
    'A helpful weather assistant that provides current weather information for any location. Uses template parameters for personalized responses.',
    'Hello {{name}}! Let me get the current weather for {{city}}, {{state}} for you. I will provide detailed weather information including temperature, humidity, wind conditions, and any weather alerts.',
    'You are a friendly weather assistant. Provide clear, helpful weather information and include any relevant weather tips or recommendations based on the current conditions.',
    TRUE,
    TRUE,
    TRUE,
    'weather',
    JSON_ARRAY('system', 'weather', 'assistant', 'template'),
    300,
    50,
    200,
    5,
    0,
    NULL,
    NOW()
);

-- Add parameters for Weatherman template
INSERT IGNORE INTO execution_template_parameters (
    id,
    template_id,
    parameter_name,
    parameter_type,
    description,
    default_value,
    is_required,
    validation_rules,
    allowed_values,
    allow_sql_keywords,
    allow_special_chars,
    sanitize_html,
    display_order,
    ui_component,
    placeholder_text,
    help_text,
    created_at
) VALUES 
(
    'param-weatherman-name',
    'system-template-weatherman',
    'name',
    'string',
    'Name of the person requesting weather information',
    'User',
    TRUE,
    JSON_OBJECT('min_length', 1, 'max_length', 50, 'pattern', '^[a-zA-Z\\s]+$'),
    NULL,
    FALSE,
    FALSE,
    TRUE,
    1,
    'text',
    'Enter your name',
    'Provide your name for a personalized weather response',
    NOW()
),
(
    'param-weatherman-city',
    'system-template-weatherman',
    'city',
    'string',
    'City name for weather lookup',
    'San Francisco',
    TRUE,
    JSON_OBJECT('min_length', 2, 'max_length', 100, 'pattern', '^[a-zA-Z\\s,.-]+$'),
    NULL,
    FALSE,
    TRUE,
    TRUE,
    2,
    'text',
    'Enter city name',
    'City name where you want to check the weather',
    NOW()
),
(
    'param-weatherman-state',
    'system-template-weatherman',
    'state',
    'string',
    'State or region for weather lookup',
    'CA',
    TRUE,
    JSON_OBJECT('min_length', 2, 'max_length', 50, 'pattern', '^[a-zA-Z\\s,.-]+$'),
    NULL,
    FALSE,
    TRUE,
    TRUE,
    3,
    'text',
    'Enter state or region',
    'State, province, or region for more accurate weather data',
    NOW()
);

-- Link get_current_weather function to Weatherman template
INSERT IGNORE INTO execution_template_functions (
    id,
    template_id,
    function_id,
    is_required,
    execution_order,
    created_at
)
SELECT 
    'tf-weatherman-weather',
    'system-template-weatherman',
    f.id,
    TRUE,
    1,
    NOW()
FROM function_definitions f 
WHERE f.name = 'get_current_weather' AND f.user_id = 'system'
LIMIT 1;

-- 2. Scrum Master - Issue Analyzer Template
INSERT IGNORE INTO execution_templates (
    id,
    user_id,
    name,
    description,
    template_prompt,
    context_template,
    enable_function_calling,
    is_active,
    is_public,
    category,
    tags,
    execution_timeout_seconds,
    rate_limit_per_hour,
    rate_limit_per_day,
    rate_limit_burst,
    total_executions,
    last_executed_at,
    created_at
) VALUES (
    'system-template-scrum-master',
    'system',
    'Scrum Master - Issue Analyzer',
    'An AI Scrum Master that analyzes GitHub repository issues, prioritizes them based on risk and estimated effort, and provides detailed analysis for sprint planning.',
    'As an experienced Scrum Master, analyze all open issues in the {{repo}} repository owned by {{owner}}. Provide a comprehensive analysis including: 1) Issue prioritization based on risk and estimated effort, 2) Sprint planning recommendations, 3) Identification of blockers and dependencies, 4) Resource allocation suggestions, and 5) Timeline estimates for resolution.',
    'You are an experienced Scrum Master and project manager. Your role is to analyze GitHub issues systematically and provide actionable insights for development teams. Focus on practical recommendations that help teams deliver value efficiently. Consider technical debt, user impact, and team capacity in your analysis.',
    TRUE,
    TRUE,
    TRUE,
    'project-management',
    JSON_ARRAY('system', 'scrum', 'project-management', 'github', 'analysis', 'template'),
    600,
    30,
    100,
    3,
    0,
    NULL,
    NOW()
);

-- Add parameters for Scrum Master template
INSERT IGNORE INTO execution_template_parameters (
    id,
    template_id,
    parameter_name,
    parameter_type,
    description,
    default_value,
    is_required,
    validation_rules,
    allowed_values,
    allow_sql_keywords,
    allow_special_chars,
    sanitize_html,
    display_order,
    ui_component,
    placeholder_text,
    help_text,
    created_at
) VALUES 
(
    'param-scrum-owner',
    'system-template-scrum-master',
    'owner',
    'string',
    'GitHub repository owner (username or organization)',
    'microsoft',
    TRUE,
    JSON_OBJECT('min_length', 1, 'max_length', 100, 'pattern', '^[a-zA-Z0-9._-]+$'),
    NULL,
    FALSE,
    TRUE,
    TRUE,
    1,
    'text',
    'Enter GitHub username or org',
    'The GitHub username or organization that owns the repository',
    NOW()
),
(
    'param-scrum-repo',
    'system-template-scrum-master',
    'repo',
    'string',
    'GitHub repository name to analyze',
    'vscode',
    TRUE,
    JSON_OBJECT('min_length', 1, 'max_length', 100, 'pattern', '^[a-zA-Z0-9._-]+$'),
    NULL,
    FALSE,
    TRUE,
    TRUE,
    2,
    'text',
    'Enter repository name',
    'The name of the GitHub repository to analyze for issue prioritization',
    NOW()
);

-- Link GitHub functions to Scrum Master template
INSERT IGNORE INTO execution_template_functions (
    id,
    template_id,
    function_id,
    is_required,
    execution_order,
    created_at
)
SELECT 
    CONCAT('tf-scrum-', f.name),
    'system-template-scrum-master',
    f.id,
    TRUE,
    CASE 
        WHEN f.name = 'github_analyze_repository' THEN 1
        WHEN f.name = 'github_read_issues' THEN 2
        ELSE 3
    END,
    NOW()
FROM function_definitions f 
WHERE f.name IN ('github_analyze_repository', 'github_read_issues') 
    AND f.user_id = 'system'
    AND f.is_active = TRUE;

-- Note: Version records will be created automatically by the application when needed 