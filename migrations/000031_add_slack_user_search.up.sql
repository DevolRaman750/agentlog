-- Add Slack user search function to handle ambiguous user references
-- This helps resolve cases like "send message to John" when there are multiple Johns

INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000091', 'system', 'slack_search_users', 'Slack Search Users',
    'Search for users in the Slack workspace by name, email, or display name. Useful for resolving ambiguous user references.',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'query', JSON_OBJECT(
                'type', 'string',
                'description', 'Search term to find users (name, email, display name, or real name)'
            ),
            'limit', JSON_OBJECT(
                'type', 'integer',
                'description', 'Maximum number of users to return (1-1000, default 50)',
                'minimum', 1,
                'maximum', 1000,
                'default', 50
            ),
            'include_locale', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Include locale information for users',
                'default', false
            )
        ),
        'required', JSON_ARRAY('query')
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'GET',
    'https://slack.com/api/users.list',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);

-- Also add a function to get the current workspace/team info
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000092', 'system', 'slack_get_team_info', 'Slack Get Team Info',
    'Get information about the current Slack workspace/team',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'include_locale', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Include locale information',
                'default', false
            )
        ),
        'required', JSON_ARRAY()
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'GET',
    'https://slack.com/api/team.info',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);

-- Add a function to list all users in the workspace (more comprehensive than search)
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000093', 'system', 'slack_list_users', 'Slack List Users',
    'List all users in the Slack workspace. Useful for getting a complete user directory.',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'limit', JSON_OBJECT(
                'type', 'integer',
                'description', 'Maximum number of users to return (1-1000, default 1000)',
                'minimum', 1,
                'maximum', 1000,
                'default', 1000
            ),
            'include_locale', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Include locale information for users',
                'default', false
            ),
            'presence', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Include presence information (active/away)',
                'default', false
            )
        ),
        'required', JSON_ARRAY()
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'GET',
    'https://slack.com/api/users.list',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);

-- Add a function to get user presence/status
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000094', 'system', 'slack_get_user_presence', 'Slack Get User Presence',
    'Get the presence/status information for a specific user (active, away, etc.)',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'user', JSON_OBJECT(
                'type', 'string',
                'description', 'User ID to get presence for (e.g., U1234567890)'
            )
        ),
        'required', JSON_ARRAY('user')
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'GET',
    'https://slack.com/api/users.getPresence',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);