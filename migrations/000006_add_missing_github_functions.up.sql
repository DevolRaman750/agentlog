-- Migration 000006: Add Missing GitHub Functions
-- This migration adds essential GitHub functions for complete autonomous development workflow

INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, description,
    parameters_schema, mock_response, endpoint_url, http_method,
    headers, auth_config, is_active, is_system_resource,
    required_api_keys, api_key_validation, fallback_data,
    created_at, updated_at
) VALUES 

-- GitHub List Branches - essential for branch management
(
    'func-github-list-branches',
    'system',
    'github_list_branches', 
    'GitHub List Branches',
    'github',
    'List all branches in a GitHub repository. Useful for checking existing branches before creating new ones.',
    JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'protected', JSON_OBJECT('type', 'boolean', 'description', 'Filter to protected branches only', 'default', false),
            'per_page', JSON_OBJECT('type', 'integer', 'default', 30, 'minimum', 1, 'maximum', 100)
        )
    ),
    JSON_OBJECT(
        'branches', JSON_ARRAY(
            JSON_OBJECT('name', 'main', 'commit', JSON_OBJECT('sha', 'abc123'), 'protected', true),
            JSON_OBJECT('name', 'develop', 'commit', JSON_OBJECT('sha', 'def456'), 'protected', false)
        ),
        '_metadata', JSON_OBJECT('source', 'mock')
    ),
    'https://api.github.com/repos/{owner}/{repo}/branches',
    'GET',
    JSON_OBJECT('Accept', 'application/vnd.github.v3+json', 'User-Agent', 'GoGent-App'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('githubApiKey'),
    JSON_OBJECT('githubApiKey', JSON_OBJECT('required', true, 'description', 'GitHub API token')),
    JSON_OBJECT(
        'branches', JSON_ARRAY(JSON_OBJECT('name', 'main', 'commit', JSON_OBJECT('sha', 'fallback123'))),
        '_metadata', JSON_OBJECT('error', 'GitHub API unavailable', 'source', 'fallback')
    ),
    NOW(),
    NOW()
),

-- GitHub Get File SHA - needed for updating files
(
    'func-github-get-file-sha',
    'system',
    'github_get_file_sha',
    'GitHub Get File SHA',
    'github', 
    'Get the SHA hash of a specific file in a GitHub repository. Required for updating existing files.',
    JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo', 'path'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'path', JSON_OBJECT('type', 'string', 'description', 'Path to the file'),
            'ref', JSON_OBJECT('type', 'string', 'description', 'Branch, tag, or commit SHA', 'default', 'main')
        )
    ),
    JSON_OBJECT(
        'sha', 'abc123def456',
        'size', 1024,
        'name', 'example.js',
        'path', 'src/example.js',
        'download_url', 'https://raw.githubusercontent.com/owner/repo/main/src/example.js',
        '_metadata', JSON_OBJECT('source', 'mock')
    ),
    'https://api.github.com/repos/{owner}/{repo}/contents/{path}',
    'GET',
    JSON_OBJECT('Accept', 'application/vnd.github.v3+json', 'User-Agent', 'GoGent-App'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('githubApiKey'),
    JSON_OBJECT('githubApiKey', JSON_OBJECT('required', true, 'description', 'GitHub API token')),
    JSON_OBJECT(
        'sha', 'fallback123',
        'error', 'File not found or API unavailable',
        '_metadata', JSON_OBJECT('source', 'fallback')
    ),
    NOW(),
    NOW()
),

-- GitHub Merge Pull Request - complete the development cycle
(
    'func-github-merge-pr',
    'system',
    'github_merge_pull_request',
    'GitHub Merge Pull Request',
    'github',
    'Merge a pull request in a GitHub repository. Completes the autonomous development workflow.',
    JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo', 'pull_number'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'pull_number', JSON_OBJECT('type', 'integer', 'description', 'Pull request number to merge'),
            'commit_title', JSON_OBJECT('type', 'string', 'description', 'Custom merge commit title'),
            'commit_message', JSON_OBJECT('type', 'string', 'description', 'Custom merge commit message'),
            'merge_method', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('merge', 'squash', 'rebase'), 'default', 'merge', 'description', 'Merge method to use')
        )
    ),
    JSON_OBJECT(
        'sha', 'merge123abc',
        'merged', true,
        'message', 'Pull request successfully merged',
        '_metadata', JSON_OBJECT('source', 'mock')
    ),
    'https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}/merge',
    'PUT',
    JSON_OBJECT('Accept', 'application/vnd.github.v3+json', 'User-Agent', 'GoGent-App', 'Content-Type', 'application/json'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('githubApiKey'),
    JSON_OBJECT('githubApiKey', JSON_OBJECT('required', true, 'description', 'GitHub API token with repository write access')),
    JSON_OBJECT(
        'merged', false,
        'message', 'Pull request merge failed - API unavailable',
        '_metadata', JSON_OBJECT('error', 'GitHub API unavailable', 'source', 'fallback')
    ),
    NOW(),
    NOW()
),

-- GitHub Search Code - find specific code patterns
(
    'func-github-search-code',
    'system',
    'github_search_code',
    'GitHub Search Code',
    'github',
    'Search for code patterns within a GitHub repository. Useful for finding specific functions, classes, or patterns.',
    JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo', 'query'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'query', JSON_OBJECT('type', 'string', 'description', 'Search query (code pattern, function name, etc.)'),
            'per_page', JSON_OBJECT('type', 'integer', 'default', 30, 'minimum', 1, 'maximum', 100)
        )
    ),
    JSON_OBJECT(
        'total_count', 1,
        'items', JSON_ARRAY(JSON_OBJECT(
            'name', 'example.js',
            'path', 'src/example.js', 
            'sha', 'abc123',
            'html_url', 'https://github.com/owner/repo/blob/main/src/example.js',
            'text_matches', JSON_ARRAY(JSON_OBJECT('fragment', 'function example() {'))
        )),
        '_metadata', JSON_OBJECT('source', 'mock')
    ),
    'https://api.github.com/search/code',
    'GET',
    JSON_OBJECT('Accept', 'application/vnd.github.v3+json', 'User-Agent', 'GoGent-App'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('githubApiKey'),
    JSON_OBJECT('githubApiKey', JSON_OBJECT('required', true, 'description', 'GitHub API token')),
    JSON_OBJECT(
        'total_count', 0,
        'items', JSON_ARRAY(),
        'error', 'Search unavailable',
        '_metadata', JSON_OBJECT('source', 'fallback')
    ),
    NOW(),
    NOW()
); 