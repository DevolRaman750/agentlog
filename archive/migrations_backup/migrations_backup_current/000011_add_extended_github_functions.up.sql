-- Add Extended GitHub Functions: Comments, Branches, and File Operations

-- 1. GitHub Add Comment function
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
    'func-github-add-comment',
    'system',
    'github_add_comment',
    'GitHub Add Comment',
    'github',
    'Add a comment to a GitHub issue or pull request. Perfect for AI agents to provide analysis, updates, or additional information to ongoing discussions.',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string',
                'description', 'GitHub username or organization name (e.g., "microsoft", "facebook", "google")',
                'examples', JSON_ARRAY('microsoft', 'facebook', 'google', 'openai')
            ),
            'repo', JSON_OBJECT(
                'type', 'string',
                'description', 'Repository name (e.g., "vscode", "react", "agentlog")',
                'examples', JSON_ARRAY('vscode', 'react', 'tensorflow', 'agentlog')
            ),
            'issue_number', JSON_OBJECT(
                'type', 'integer',
                'description', 'The issue or pull request number to comment on',
                'minimum', 1,
                'examples', JSON_ARRAY(123, 456, 789)
            ),
            'body', JSON_OBJECT(
                'type', 'string',
                'description', 'The comment content. Supports full GitHub Markdown formatting including code blocks, tables, and links.',
                'examples', JSON_ARRAY(
                    'I analyzed the code and found the issue is in the authentication logic.',
                    '## Code Analysis Results\n\nThe bug appears to be in `src/auth.js` at line 45:\n\n```javascript\nif (user.isValid) {\n  // Missing return statement\n}\n```',
                    'This issue seems related to #123. The root cause is the same database connection pooling problem.'
                )
            ),
            'reaction', JSON_OBJECT(
                'type', 'string',
                'description', 'Optional reaction to add to your own comment',
                'enum', JSON_ARRAY('+1', '-1', 'laugh', 'hooray', 'confused', 'heart', 'rocket', 'eyes'),
                'examples', JSON_ARRAY('rocket', 'eyes', '+1')
            )
        ),
        'required', JSON_ARRAY('owner', 'repo', 'issue_number', 'body')
    ),
    JSON_OBJECT(
        'id', 987654321,
        'node_id', 'IC_abcd1234',
        'url', 'https://api.github.com/repos/owner/repo/issues/comments/987654321',
        'html_url', 'https://github.com/owner/repo/issues/123#issuecomment-987654321',
        'body', 'I analyzed the code and found the issue is in the authentication logic.',
        'user', JSON_OBJECT(
            'login', 'gogent-ai',
            'id', 12345,
            'avatar_url', 'https://avatars.githubusercontent.com/u/12345?v=4',
            'type', 'User'
        ),
        'created_at', '2025-01-30T15:45:00Z',
        'updated_at', '2025-01-30T15:45:00Z',
        'issue_url', 'https://api.github.com/repos/owner/repo/issues/123',
        '_metadata', JSON_OBJECT(
            'source', 'mock',
            'comment_type', 'analysis'
        )
    ),
    'https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}/comments',
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
            'description', 'GitHub API token with repository write access and issues scope'
        )
    ),
    JSON_OBJECT(
        'id', 987654321,
        'url', 'https://api.github.com/repos/owner/repo/issues/comments/987654321',
        'html_url', 'https://github.com/owner/repo/issues/123#issuecomment-987654321',
        'body', 'Comment added successfully but GitHub API is currently unavailable.',
        'created_at', '2025-01-30T15:45:00Z',
        '_metadata', JSON_OBJECT(
            'source', 'fallback',
            'error', 'GitHub API unavailable - comment not posted'
        )
    ),
    NOW(),
    NOW()
);

-- 2. GitHub Create Branch function
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
    'func-github-create-branch',
    'system',
    'github_create_branch',
    'GitHub Create Branch',
    'github',
    'Create a new branch in a GitHub repository from an existing branch, tag, or commit. Useful for starting new features, bug fixes, or experiments.',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string',
                'description', 'GitHub username or organization name (e.g., "microsoft", "facebook", "google")',
                'examples', JSON_ARRAY('microsoft', 'facebook', 'google', 'openai')
            ),
            'repo', JSON_OBJECT(
                'type', 'string',
                'description', 'Repository name (e.g., "vscode", "react", "agentlog")',
                'examples', JSON_ARRAY('vscode', 'react', 'tensorflow', 'agentlog')
            ),
            'branch_name', JSON_OBJECT(
                'type', 'string',
                'description', 'Name for the new branch. Use descriptive names like "feature/auth-fix" or "bugfix/issue-123"',
                'pattern', '^[a-zA-Z0-9._/-]+$',
                'examples', JSON_ARRAY('feature/new-auth-system', 'bugfix/issue-123', 'hotfix/security-patch', 'experiment/ai-integration')
            ),
            'source_branch', JSON_OBJECT(
                'type', 'string',
                'description', 'Source branch, tag, or commit SHA to create the new branch from',
                'default', 'main',
                'examples', JSON_ARRAY('main', 'develop', 'v1.0.0', 'abc123def456')
            )
        ),
        'required', JSON_ARRAY('owner', 'repo', 'branch_name')
    ),
    JSON_OBJECT(
        'ref', 'refs/heads/feature/new-auth-system',
        'node_id', 'REF_abcd1234',
        'url', 'https://api.github.com/repos/owner/repo/git/refs/heads/feature/new-auth-system',
        'object', JSON_OBJECT(
            'sha', 'abc123def456789',
            'type', 'commit',
            'url', 'https://api.github.com/repos/owner/repo/git/commits/abc123def456789'
        ),
        '_metadata', JSON_OBJECT(
            'source', 'mock',
            'branch_created', true,
            'created_from', 'main'
        )
    ),
    'https://api.github.com/repos/{owner}/{repo}/git/refs',
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
            'description', 'GitHub API token with repository write access'
        )
    ),
    JSON_OBJECT(
        'ref', 'refs/heads/feature/new-branch',
        'url', 'https://api.github.com/repos/owner/repo/git/refs/heads/feature/new-branch',
        'object', JSON_OBJECT(
            'sha', 'fallback123456789',
            'type', 'commit'
        ),
        '_metadata', JSON_OBJECT(
            'source', 'fallback',
            'error', 'GitHub API unavailable - branch not created',
            'branch_created', false
        )
    ),
    NOW(),
    NOW()
);

-- 3. GitHub Create/Update File function
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
    'func-github-create-update-file',
    'system',
    'github_create_update_file',
    'GitHub Create/Update File',
    'github',
    'Create a new file or update an existing file in a GitHub repository. This automatically creates a commit with the changes. Perfect for AI agents to make code changes, documentation updates, or configuration modifications.',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string',
                'description', 'GitHub username or organization name (e.g., "microsoft", "facebook", "google")',
                'examples', JSON_ARRAY('microsoft', 'facebook', 'google', 'openai')
            ),
            'repo', JSON_OBJECT(
                'type', 'string',
                'description', 'Repository name (e.g., "vscode", "react", "agentlog")',
                'examples', JSON_ARRAY('vscode', 'react', 'tensorflow', 'agentlog')
            ),
            'path', JSON_OBJECT(
                'type', 'string',
                'description', 'File path within the repository (e.g., "src/main.js", "README.md", "config/settings.json")',
                'examples', JSON_ARRAY('README.md', 'src/utils/helper.js', 'docs/api.md', 'config/database.json')
            ),
            'content', JSON_OBJECT(
                'type', 'string',
                'description', 'File content as a string. Will be automatically base64 encoded for the API.',
                'examples', JSON_ARRAY(
                    '# My Project\n\nThis is a sample README file.',
                    'console.log("Hello, World!");',
                    '{\n  "name": "my-project",\n  "version": "1.0.0"\n}'
                )
            ),
            'message', JSON_OBJECT(
                'type', 'string',
                'description', 'Commit message describing the changes',
                'examples', JSON_ARRAY('Add new authentication module', 'Fix bug in user validation', 'Update API documentation', 'AI-generated code improvement')
            ),
            'branch', JSON_OBJECT(
                'type', 'string',
                'description', 'Branch to commit to (defaults to repository default branch)',
                'default', 'main',
                'examples', JSON_ARRAY('main', 'develop', 'feature/new-feature')
            ),
            'sha', JSON_OBJECT(
                'type', 'string',
                'description', 'SHA of the file being replaced (required when updating existing files). Use github_read_code first to get the current SHA.',
                'examples', JSON_ARRAY('abc123def456789')
            ),
            'committer', JSON_OBJECT(
                'type', 'object',
                'description', 'Committer information (optional, defaults to authenticated user)',
                'properties', JSON_OBJECT(
                    'name', JSON_OBJECT('type', 'string', 'examples', JSON_ARRAY('AI Agent', 'GoGent Bot')),
                    'email', JSON_OBJECT('type', 'string', 'examples', JSON_ARRAY('ai@example.com', 'bot@company.com'))
                )
            )
        ),
        'required', JSON_ARRAY('owner', 'repo', 'path', 'content', 'message')
    ),
    JSON_OBJECT(
        'content', JSON_OBJECT(
            'name', 'README.md',
            'path', 'README.md',
            'sha', 'def789abc123456',
            'size', 2048,
            'url', 'https://api.github.com/repos/owner/repo/contents/README.md',
            'html_url', 'https://github.com/owner/repo/blob/main/README.md',
            'git_url', 'https://api.github.com/repos/owner/repo/git/blobs/def789abc123456',
            'download_url', 'https://raw.githubusercontent.com/owner/repo/main/README.md',
            'type', 'file'
        ),
        'commit', JSON_OBJECT(
            'sha', 'xyz789abc123def',
            'node_id', 'C_abcd1234',
            'url', 'https://api.github.com/repos/owner/repo/git/commits/xyz789abc123def',
            'html_url', 'https://github.com/owner/repo/commit/xyz789abc123def',
            'author', JSON_OBJECT(
                'name', 'AI Agent',
                'email', 'ai@example.com',
                'date', '2025-01-30T16:00:00Z'
            ),
            'committer', JSON_OBJECT(
                'name', 'AI Agent',
                'email', 'ai@example.com',
                'date', '2025-01-30T16:00:00Z'
            ),
            'message', 'AI-generated code improvement'
        ),
        '_metadata', JSON_OBJECT(
            'source', 'mock',
            'operation', 'file_updated',
            'file_size_bytes', 2048
        )
    ),
    'https://api.github.com/repos/{owner}/{repo}/contents/{path}',
    'PUT',
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
            'description', 'GitHub API token with repository write access and contents scope'
        )
    ),
    JSON_OBJECT(
        'content', JSON_OBJECT(
            'name', 'file.txt',
            'path', 'file.txt',
            'sha', 'fallback123456789',
            'url', 'https://api.github.com/repos/owner/repo/contents/file.txt'
        ),
        'commit', JSON_OBJECT(
            'sha', 'fallbackcommit123',
            'message', 'Fallback commit - changes not applied',
            'author', JSON_OBJECT(
                'name', 'Fallback',
                'email', 'fallback@example.com'
            )
        ),
        '_metadata', JSON_OBJECT(
            'source', 'fallback',
            'error', 'GitHub API unavailable - file not updated',
            'operation', 'simulated'
        )
    ),
    NOW(),
    NOW()
); 