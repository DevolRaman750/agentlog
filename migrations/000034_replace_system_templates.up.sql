-- Migration: Replace system templates with new role-based templates
-- Remove existing autonomous SWE template and create new role-based templates
-- for Intern Software Engineer, Software Engineer, and Weatherman

-- Remove existing autonomous SWE template and its function mappings
DELETE FROM execution_template_functions WHERE template_id = 'template-autonomous-swe';
DELETE FROM execution_templates WHERE id = 'template-autonomous-swe' AND user_id = 'system';

-- 1. Intern Software Engineer Template
-- Read-only GitHub access + basic Slack functions
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
    'template-intern-swe',
    'system',
    'Intern Software Engineer',
    'An entry-level software engineering assistant with read-only access to GitHub repositories and basic Slack communication. Perfect for code analysis, issue investigation, and team updates without modification permissions.',
    'You are an intern software engineer assistant. You can read and analyze code, investigate issues, and communicate findings through Slack. You have read-only access to GitHub repositories - you can examine code, read issues, and search for patterns, but you cannot modify files or create pull requests. Focus on learning, analysis, and clear communication of your findings.',
    'When investigating issues or analyzing code, be thorough but humble. Ask clarifying questions when needed and provide detailed explanations of your findings. Remember that you are in a learning role - focus on understanding and documenting rather than making changes.',
    TRUE,
    TRUE,
    TRUE,
    'development',
    JSON_ARRAY('intern', 'development', 'github', 'slack', 'read-only', 'system'),
    600,
    30,
    100,
    3,
    0,
    NOW(),
    NOW()
);

-- 2. Software Engineer Template  
-- Full GitHub access + full Slack functions
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
    'template-software-engineer',
    'system',
    'Software Engineer',
    'A full-featured software engineering assistant with complete access to GitHub development workflows and Slack communication. Can read code, create branches, modify files, create pull requests, merge changes, and manage team communication.',
    'You are a skilled software engineer assistant with full development capabilities. You can analyze issues, write and modify code, create branches, manage pull requests, and coordinate with team members through Slack. Approach problems systematically: understand requirements, plan solutions, implement changes, and communicate progress clearly.',
    'When working on development tasks, follow best practices: write clean, well-documented code, create meaningful commit messages, and test changes thoroughly. Communicate proactively with the team about progress, blockers, and decisions. Always consider the impact of changes on other team members and the overall codebase.',
    TRUE,
    TRUE,
    TRUE,
    'development',
    JSON_ARRAY('senior', 'development', 'github', 'slack', 'full-access', 'system'),
    1200,
    50,
    200,
    5,
    0,
    NOW(),
    NOW()
);

-- 3. Weatherman Template
-- Weather API + Slack communication
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
    'template-weatherman',
    'system',
    'Weatherman',
    'A weather specialist assistant that provides current weather information and forecasts for any location. Can fetch real-time weather data and share updates through Slack channels for team planning and outdoor activities.',
    'You are a helpful weather assistant. Provide accurate, up-to-date weather information for requested locations. Include relevant details like temperature, humidity, wind conditions, and any weather alerts. When sharing weather updates in Slack, format the information clearly and include practical advice when appropriate (umbrella reminders, outdoor activity suggestions, etc.).',
    'Focus on being informative and practical with weather information. Consider the context of requests - morning briefings, event planning, travel considerations, etc. Use clear, friendly language and always include the timestamp of weather data to ensure accuracy.',
    TRUE,
    TRUE,
    TRUE,
    'utility',
    JSON_ARRAY('weather', 'utility', 'slack', 'information', 'system'),
    300,
    100,
    500,
    10,
    0,
    NOW(),
    NOW()
);

-- Map functions to Intern Software Engineer Template (Read-only GitHub + Basic Slack)
INSERT INTO execution_template_functions (id, template_id, function_id, is_required, execution_order, created_at, updated_at)
SELECT UUID(), 'template-intern-swe', fd.id, 1, 1, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_read_issues' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-intern-swe', fd.id, 1, 2, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_read_code' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-intern-swe', fd.id, 0, 3, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_read_commits' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-intern-swe', fd.id, 0, 4, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_search_code' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-intern-swe', fd.id, 1, 5, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_send_message' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-intern-swe', fd.id, 1, 6, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_read_messages' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-intern-swe', fd.id, 0, 7, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_list_channels' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-intern-swe', fd.id, 0, 8, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_get_channel_info' AND fd.user_id = 'system';

-- Map functions to Software Engineer Template (Full GitHub + Full Slack)
INSERT INTO execution_template_functions (id, template_id, function_id, is_required, execution_order, created_at, updated_at)
-- All GitHub functions
SELECT UUID(), 'template-software-engineer', fd.id, 1, 1, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_read_issues' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 1, 2, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_read_code' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 1, 3, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_create_branch' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 1, 4, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_create_update_file' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 1, 5, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_create_pull_request' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 6, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_add_comment' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 7, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_update_issue' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 8, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_get_file_sha' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 9, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_list_branches' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 10, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_merge_pull_request' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 11, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_search_code' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 12, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_read_commits' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 13, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'github_create_issue' AND fd.user_id = 'system'
UNION ALL
-- All Slack functions
SELECT UUID(), 'template-software-engineer', fd.id, 1, 14, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_send_message' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 1, 15, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_read_messages' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 16, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_list_channels' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 17, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_get_channel_info' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 18, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_get_channel_members' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 19, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_get_user_info' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 20, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_search_messages' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 21, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_add_reaction' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 22, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_get_thread_replies' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 23, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_update_message' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 24, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_join_channel' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 25, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_search_users' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 26, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_get_team_info' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 27, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_list_users' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-software-engineer', fd.id, 0, 28, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_get_user_presence' AND fd.user_id = 'system';

-- Map functions to Weatherman Template (Weather + Basic Slack)
INSERT INTO execution_template_functions (id, template_id, function_id, is_required, execution_order, created_at, updated_at)
SELECT UUID(), 'template-weatherman', fd.id, 1, 1, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'get_current_weather' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-weatherman', fd.id, 1, 2, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_send_message' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-weatherman', fd.id, 0, 3, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_read_messages' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-weatherman', fd.id, 0, 4, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_list_channels' AND fd.user_id = 'system'
UNION ALL
SELECT UUID(), 'template-weatherman', fd.id, 0, 5, NOW(), NOW()
FROM function_definitions fd WHERE fd.name = 'slack_get_channel_info' AND fd.user_id = 'system';