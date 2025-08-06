-- Migration 000025: Add GitHub Read Commits Function
-- This migration adds the github_read_commits function for getting commit history from GitHub repositories

INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, mock_response, endpoint_url, http_method,
    headers, auth_config, is_active, is_system_resource,
    required_api_keys, api_key_validation, fallback_data,
    created_at, updated_at
) VALUES (
    'func-github-read-commits',
    'system',
    'github_read_commits', 
    'GitHub Read Commits',
    'github',
    'api',
    'Read commit history from a GitHub repository. Get the latest commits, commit messages, authors, dates, and changed files. Perfect for understanding recent changes and project activity.',
    JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string', 
                'description', 'GitHub username or organization name (e.g., "microsoft", "facebook", "google")'
            ),
            'repo', JSON_OBJECT(
                'type', 'string', 
                'description', 'Repository name (e.g., "vscode", "react", "tensorflow")'
            ),
            'sha', JSON_OBJECT(
                'type', 'string', 
                'description', 'SHA or branch to start listing commits from. Use branch names like "main" or specific commit SHAs.',
                'default', ''
            ),
            'path', JSON_OBJECT(
                'type', 'string', 
                'description', 'Only commits containing this file path will be returned. Leave empty for all commits.',
                'default', ''
            ),
            'per_page', JSON_OBJECT(
                'type', 'integer', 
                'description', 'Number of commits to return (1-100). Default is 30.',
                'default', 30,
                'minimum', 1,
                'maximum', 100
            ),
            'since', JSON_OBJECT(
                'type', 'string', 
                'description', 'ISO 8601 date string. Only commits after this date will be returned.',
                'default', ''
            ),
            'until', JSON_OBJECT(
                'type', 'string', 
                'description', 'ISO 8601 date string. Only commits before this date will be returned.',
                'default', ''
            )
        )
    ),
    JSON_OBJECT(
        'commits', JSON_ARRAY(
            JSON_OBJECT(
                'sha', 'abc123def456ghi789jkl012mno345pqr678stu901',
                'commit', JSON_OBJECT(
                    'author', JSON_OBJECT(
                        'name', 'John Developer',
                        'email', 'john@example.com',
                        'date', '2025-01-15T10:30:00Z'
                    ),
                    'committer', JSON_OBJECT(
                        'name', 'John Developer', 
                        'email', 'john@example.com',
                        'date', '2025-01-15T10:30:00Z'
                    ),
                    'message', 'Fix authentication bug in login flow\n\n- Resolved token validation issue\n- Added better error handling\n- Updated tests',
                    'tree', JSON_OBJECT('sha', 'tree123abc456def789')
                ),
                'author', JSON_OBJECT(
                    'login', 'johndeveloper',
                    'avatar_url', 'https://github.com/images/error/johndeveloper_happy.gif'
                ),
                'committer', JSON_OBJECT(
                    'login', 'johndeveloper',
                    'avatar_url', 'https://github.com/images/error/johndeveloper_happy.gif'
                ),
                'parents', JSON_ARRAY(
                    JSON_OBJECT('sha', 'parent123abc456def789')
                ),
                'stats', JSON_OBJECT(
                    'total', 45,
                    'additions', 32,
                    'deletions', 13
                ),
                'files', JSON_ARRAY(
                    JSON_OBJECT(
                        'filename', 'src/auth/login.js',
                        'status', 'modified',
                        'additions', 15,
                        'deletions', 3,
                        'changes', 18
                    ),
                    JSON_OBJECT(
                        'filename', 'tests/auth.test.js',
                        'status', 'modified', 
                        'additions', 17,
                        'deletions', 10,
                        'changes', 27
                    )
                )
            )
        ),
        'total_count', 1,
        '_metadata', JSON_OBJECT('source', 'mock', 'note', 'This is sample commit data for testing')
    ),
    'https://api.github.com/repos/{owner}/{repo}/commits',
    'GET',
    JSON_OBJECT(
        'Accept', 'application/vnd.github+json',
        'X-GitHub-Api-Version', '2022-11-28',
        'User-Agent', 'GoGent-App'
    ),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('githubApiKey'),
    JSON_OBJECT('githubApiKey', JSON_OBJECT('required', true, 'description', 'GitHub API token for repository access')),
    JSON_OBJECT(
        'commits', JSON_ARRAY(
            JSON_OBJECT(
                'sha', 'fallback123',
                'commit', JSON_OBJECT(
                    'message', 'GitHub API unavailable - using fallback data',
                    'author', JSON_OBJECT('name', 'Unknown', 'date', '2025-01-01T00:00:00Z')
                ),
                'error', 'GitHub API unavailable'
            )
        ),
        '_metadata', JSON_OBJECT('source', 'fallback', 'error', 'GitHub API unavailable')
    ),
    NOW(),
    NOW()
);