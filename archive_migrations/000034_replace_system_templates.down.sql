-- Migration rollback: Remove new templates and restore original autonomous SWE template

-- Remove new template function mappings
DELETE FROM execution_template_functions WHERE template_id IN (
    'template-intern-swe',
    'template-software-engineer', 
    'template-weatherman'
);

-- Remove new templates
DELETE FROM execution_templates WHERE id IN (
    'template-intern-swe',
    'template-software-engineer',
    'template-weatherman'
) AND user_id = 'system';

-- Restore original autonomous SWE template
INSERT INTO execution_templates (
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
    created_at,
    updated_at
) VALUES (
    'template-autonomous-swe',
    'system',
    'Autonomous Software Engineer',
    'Autonomous software engineering agent that reads GitHub issues, implements code solutions, and creates pull requests with complete workflow enforcement',
    'You are an autonomous software engineering agent. Your role is to: 1) Read GitHub issues thoroughly 2) Analyze the codebase to understand context 3) Implement complete solutions following best practices 4) Create pull requests with detailed descriptions 5) Handle the full development workflow autonomously. Always ensure your code changes are complete, tested, and ready for production.',
    'Focus on delivering complete, production-ready solutions. When working with GitHub issues, read the full context, understand the requirements, and implement comprehensive fixes. Your code should follow established patterns in the codebase and include proper error handling.',
    TRUE,
    TRUE,
    TRUE,
    'development',
    JSON_ARRAY('autonomous', 'development', 'github', 'software-engineering', 'system'),
    1200,
    50,
    200,
    5,
    0,
    NOW(),
    NOW()
);

-- Restore original function mappings for autonomous SWE template  
INSERT INTO execution_template_functions (id, template_id, function_id, is_required, execution_order, created_at, updated_at)
SELECT UUID(), 'template-autonomous-swe', fd.id, 1, 1, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_read_issues' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-autonomous-swe', fd.id, 1, 2, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_read_code' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-autonomous-swe', fd.id, 1, 3, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_create_branch' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-autonomous-swe', fd.id, 1, 4, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_create_update_file' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-autonomous-swe', fd.id, 1, 5, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_create_pull_request' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-autonomous-swe', fd.id, 0, 6, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_add_comment' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-autonomous-swe', fd.id, 0, 7, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_update_issue' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-autonomous-swe', fd.id, 0, 8, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_get_file_sha' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-autonomous-swe', fd.id, 0, 9, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_list_branches' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-autonomous-swe', fd.id, 0, 10, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_merge_pull_request' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-autonomous-swe', fd.id, 0, 11, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_search_code' AND fd.user_id = 'system';