-- Migration 000025: Add Software Engineer Execution Template
-- This migration adds the Software Engineer template with comprehensive development capabilities

-- Ensure we have system user (should already exist)
INSERT IGNORE INTO users (id, username, email, password_hash, email_verified, is_temporary, created_at, updated_at)
VALUES ('system', 'system', NULL, '', 1, 0, NOW(), NOW());

-- Add Software Engineer Template
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
    'system-template-software-engineer',
    'system',
    'Software Engineer',
    'An AI Software Engineer that can analyze codebases, create branches, commit code changes, and manage GitHub repositories through advanced operations. Perfect for code analysis, bug fixes, and feature development.',
    'As an experienced Software Engineer, help with the {{task_type}} for the {{repo}} repository. I will analyze the codebase structure, create branches, commit changes, and manage the entire development workflow. My goal is to {{objective}} while following best practices for code quality, testing, and documentation.',
    'You are an experienced Software Engineer with expertise in full-stack development, database management, and DevOps practices. You have access to advanced tools including GitHub repository management and MCP server operations. Always prioritize code quality, security, and maintainability. Provide clear explanations of your actions and include relevant code examples.',
    TRUE,
    TRUE,
    TRUE,
    'development',
    JSON_ARRAY('system', 'software-engineer', 'development', 'github', 'mcp', 'template'),
    1800,
    20,
    50,
    2,
    0,
    NULL,
    NOW()
);

-- Add parameters for Software Engineer template
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
    'param-software-engineer-repo',
    'system-template-software-engineer',
    'repo',
    'string',
    'GitHub repository in owner/repo format for the development work',
    'microsoft/vscode',
    TRUE,
    JSON_OBJECT('min_length', 3, 'max_length', 100, 'pattern', '^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$'),
    NULL,
    FALSE,
    TRUE,
    TRUE,
    1,
    'text',
    'owner/repository',
    'The GitHub repository where development work will be performed',
    NOW()
),
(
    'param-software-engineer-task-type',
    'system-template-software-engineer',
    'task_type',
    'string',
    'Type of development task to perform',
    'feature development',
    TRUE,
    JSON_OBJECT('min_length', 5, 'max_length', 200),
    JSON_ARRAY('feature development', 'bug fix', 'code refactoring', 'performance optimization', 'security enhancement', 'code analysis', 'documentation'),
    FALSE,
    TRUE,
    TRUE,
    2,
    'select',
    'Select task type',
    'Choose the type of development task you need assistance with',
    NOW()
),
(
    'param-software-engineer-objective',
    'system-template-software-engineer',
    'objective',
    'string',
    'Specific objective or goal for the development task',
    'implement a new user authentication system',
    TRUE,
    JSON_OBJECT('min_length', 10, 'max_length', 500),
    NULL,
    FALSE,
    TRUE,
    TRUE,
    3,
    'textarea',
    'Describe the objective...',
    'Provide a clear description of what you want to achieve with this development task',
    NOW()
);

-- Link MCP and GitHub functions to Software Engineer template
INSERT IGNORE INTO execution_template_functions (
    id,
    template_id,
    function_id,
    is_required,
    execution_order,
    created_at
)
SELECT 
    CONCAT('tf-software-engineer-', f.name),
    'system-template-software-engineer',
    f.id,
    CASE 
        WHEN f.name IN ('github_read_code', 'github_analyze_repository') THEN TRUE
        ELSE FALSE
    END,
    CASE 
        WHEN f.name = 'github_analyze_repository' THEN 1
        WHEN f.name = 'github_read_code' THEN 2
        WHEN f.name = 'mcp_github_operations' THEN 3
        WHEN f.name = 'github_file_manager' THEN 4
        WHEN f.name = 'github_create_branch' THEN 5
        WHEN f.name = 'github_create_update_file' THEN 6
        ELSE 7
    END,
    NOW()
FROM function_definitions f 
WHERE f.name IN (
    'mcp_github_operations', 
    'github_file_manager',
    'github_analyze_repository',
    'github_read_code',
    'github_create_branch',
    'github_create_update_file',
    'github_read_issues'
) 
    AND f.user_id = 'system'
    AND f.is_active = TRUE; 