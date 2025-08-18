-- Migration 000021: Add GitHub Create Issue Function
-- This migration adds the github_create_issue function for creating new GitHub issues

INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, mock_response, endpoint_url, http_method,
    headers, auth_config, is_active, is_system_resource,
    required_api_keys, api_key_validation, fallback_data,
    result_transformer, created_at, updated_at
) VALUES (
    'func-github-create-issue',
    'system',
    'github_create_issue', 
    'GitHub Create Issue',
    'github',
    'api',
    'Create a new issue in a GitHub repository. Essential for tracking bugs, feature requests, and project tasks.',
    JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo', 'title'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string', 
                'description', 'GitHub username or organization name'
            ),
            'repo', JSON_OBJECT(
                'type', 'string', 
                'description', 'Repository name'
            ),
            'title', JSON_OBJECT(
                'type', 'string', 
                'description', 'Issue title'
            ),
            'body', JSON_OBJECT(
                'type', 'string', 
                'description', 'Issue description/body content. Supports full GitHub Markdown formatting'
            ),
            'labels', JSON_OBJECT(
                'type', 'array',
                'items', JSON_OBJECT('type', 'string'),
                'description', 'Array of label names to assign to the issue'
            ),
            'assignees', JSON_OBJECT(
                'type', 'array',
                'items', JSON_OBJECT('type', 'string'),
                'description', 'Array of usernames to assign to the issue'
            ),
            'milestone', JSON_OBJECT(
                'type', 'integer',
                'description', 'Milestone number to associate with the issue'
            )
        )
    ),
    JSON_OBJECT(
        'id', 1347,
        'node_id', 'MDU6SXNzdWUxMzQ3',
        'number', 42,
        'title', 'Sample Issue Title',
        'body', 'This is a sample issue created for testing purposes.',
        'state', 'open',
        'locked', false,
        'user', JSON_OBJECT(
            'login', 'testuser',
            'id', 583231,
            'avatar_url', 'https://avatars.githubusercontent.com/u/583231?v=4'
        ),
        'labels', JSON_ARRAY(
            JSON_OBJECT(
                'id', 208045946,
                'name', 'bug',
                'color', 'd73a4a'
            )
        ),
        'assignees', JSON_ARRAY(),
        'milestone', null,
        'comments', 0,
        'created_at', '2023-01-01T12:00:00Z',
        'updated_at', '2023-01-01T12:00:00Z',
        'closed_at', null,
        'html_url', 'https://github.com/owner/repo/issues/42',
        '_metadata', JSON_OBJECT('source', 'mock')
    ),
    'https://api.github.com/repos/{owner}/{repo}/issues',
    'POST',
    JSON_OBJECT(
        'Accept', 'application/vnd.github.v3+json',
        'User-Agent', 'GoGent-App',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('githubApiKey'),
    JSON_OBJECT(
        'githubApiKey', JSON_OBJECT(
            'required', true, 
            'description', 'GitHub API token with repo access'
        )
    ),
    JSON_OBJECT(
        'id', 999999,
        'number', 99,
        'title', 'Fallback Issue',
        'state', 'open',
        'html_url', 'https://github.com/fallback/repo/issues/99',
        '_metadata', JSON_OBJECT('source', 'fallback')
    ),
    'default',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);