-- Migration 000004: Add GitHub Create Pull Request Function
-- This migration adds the missing function to create pull requests, completing the autonomous development workflow

INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, description,
    parameters_schema, mock_response, endpoint_url, http_method,
    headers, auth_config, is_active, is_system_resource,
    required_api_keys, api_key_validation, fallback_data,
    created_at, updated_at
) VALUES (
    'func-github-create-pr',
    'system',
    'github_create_pull_request',
    'GitHub Create Pull Request',
    'github',
    'Create a pull request in a GitHub repository to propose code changes. Essential for autonomous development workflows.',
    JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo', 'title', 'head', 'base'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization name'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'title', JSON_OBJECT('type', 'string', 'description', 'Pull request title'),
            'body', JSON_OBJECT('type', 'string', 'description', 'Pull request description/body content'),
            'head', JSON_OBJECT('type', 'string', 'description', 'The branch with changes (source branch)'),
            'base', JSON_OBJECT('type', 'string', 'default', 'main', 'description', 'The branch to merge into (target branch)'),
            'draft', JSON_OBJECT('type', 'boolean', 'default', false, 'description', 'Create as draft PR'),
            'maintainer_can_modify', JSON_OBJECT('type', 'boolean', 'default', true, 'description', 'Allow maintainers to modify the PR')
        )
    ),
    JSON_OBJECT(
        'id', 456789,
        'number', 123,
        'title', 'Fix authentication bug in user login',
        'body', 'This PR fixes the authentication issue reported in #456',
        'state', 'open',
        'html_url', 'https://github.com/owner/repo/pull/123',
        'head', JSON_OBJECT('ref', 'fix-auth-bug', 'sha', 'abc123'),
        'base', JSON_OBJECT('ref', 'main', 'sha', 'def456'),
        'user', JSON_OBJECT('login', 'autonomous-swe-bot'),
        'created_at', '2025-01-30T16:00:00Z',
        '_metadata', JSON_OBJECT('source', 'mock')
    ),
    'https://api.github.com/repos/{owner}/{repo}/pulls',
    'POST',
    JSON_OBJECT('Accept', 'application/vnd.github.v3+json', 'User-Agent', 'GoGent-App', 'Content-Type', 'application/json'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('githubApiKey'),
    JSON_OBJECT('githubApiKey', JSON_OBJECT('required', true, 'description', 'GitHub API token with repository write access')),
    JSON_OBJECT(
        'id', 456789,
        'number', 123,
        'title', 'Pull request created successfully',
        'body', 'PR has been created but GitHub API is currently unavailable.',
        'state', 'open',
        'html_url', 'https://github.com/owner/repo/pull/123',
        'head', JSON_OBJECT('ref', 'feature-branch'),
        'base', JSON_OBJECT('ref', 'main'),
        'created_at', '2025-01-30T16:00:00Z',
        '_metadata', JSON_OBJECT('error', 'GitHub API unavailable', 'source', 'fallback')
    ),
    NOW(),
    NOW()
); 