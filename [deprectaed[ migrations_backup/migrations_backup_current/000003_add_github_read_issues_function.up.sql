-- Add GitHub Read Issues system function

INSERT INTO function_definitions (
    id,
    user_id,
    name,
    display_name,
    function_group,
    description,
    parameters_schema,
    mock_response,
    endpoint_url,
    http_method,
    headers,
    auth_config,
    is_active,
    is_system_resource,
    required_api_keys,
    api_key_validation,
    fallback_data,
    created_at,
    updated_at
) VALUES (
    'func-github-read-issues',
    'system',
    'github_read_issues',
    'GitHub Read Issues',
    'github',
    'Read issues from a GitHub repository to analyze bugs, feature requests, and development tasks',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'state', JSON_OBJECT('type', 'string', 'description', 'Issue state filter', 'enum', JSON_ARRAY('open', 'closed', 'all'), 'default', 'open'),
            'labels', JSON_OBJECT('type', 'string', 'description', 'Comma-separated list of label names to filter by (optional)'),
            'assignee', JSON_OBJECT('type', 'string', 'description', 'Username to filter issues assigned to (optional)'),
            'creator', JSON_OBJECT('type', 'string', 'description', 'Username to filter issues created by (optional)'),
            'sort', JSON_OBJECT('type', 'string', 'description', 'Sort criteria', 'enum', JSON_ARRAY('created', 'updated', 'comments'), 'default', 'created'),
            'direction', JSON_OBJECT('type', 'string', 'description', 'Sort direction', 'enum', JSON_ARRAY('asc', 'desc'), 'default', 'desc'),
            'per_page', JSON_OBJECT('type', 'integer', 'description', 'Number of results per page (max 100)', 'minimum', 1, 'maximum', 100, 'default', 30)
        ),
        'required', JSON_ARRAY('owner', 'repo')
    ),
    JSON_OBJECT(
        'issues', JSON_ARRAY(
            JSON_OBJECT(
                'id', 1,
                'number', 1,
                'title', 'Sample Issue',
                'body', 'This is a sample issue description for testing purposes',
                'state', 'open',
                'user', JSON_OBJECT('login', 'sample-user'),
                'labels', JSON_ARRAY(
                    JSON_OBJECT('name', 'bug', 'color', 'f29513')
                ),
                'assignees', JSON_ARRAY(),
                'html_url', 'https://github.com/owner/repo/issues/1',
                'created_at', '2023-01-01T00:00:00Z',
                'updated_at', '2023-01-01T00:00:00Z'
            )
        ),
        'total_count', 1,
        'status', 'success'
    ),
    'https://api.github.com/repos/{owner}/{repo}/issues',
    'GET',
    JSON_OBJECT('Accept', 'application/vnd.github+json', 'X-GitHub-Api-Version', '2022-11-28', 'User-Agent', 'GoGent-App'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('githubApiKey'),
    JSON_OBJECT('githubApiKey', JSON_OBJECT('required', true, 'description', 'GitHub API token')),
    JSON_OBJECT(
        'issues', JSON_ARRAY(
            JSON_OBJECT(
                'id', 0,
                'number', 0,
                'title', 'Unable to fetch issues - GitHub API unavailable',
                'body', 'GitHub API is currently unavailable. This is mock fallback data.',
                'state', 'open',
                'error', 'API_UNAVAILABLE'
            )
        ),
        'total_count', 0,
        'status', 'fallback',
        'message', 'GitHub API unavailable, showing mock data'
    ),
    NOW(),
    NOW()
); 