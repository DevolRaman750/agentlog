-- Migration 000005: Fix GitHub Functions
-- This migration corrects the GitHub function endpoints and parameters to match GitHub API specs

-- Fix GitHub Create Branch function endpoint and parameters
UPDATE function_definitions SET 
    endpoint_url = 'https://api.github.com/repos/{owner}/{repo}/git/refs',
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo', 'branch_name'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'branch_name', JSON_OBJECT('type', 'string', 'description', 'Name of the new branch to create'),
            'source_branch', JSON_OBJECT('type', 'string', 'default', 'main', 'description', 'Source branch to create from')
        )
    ),
    required_api_keys = JSON_ARRAY('githubApiKey'),
    api_key_validation = JSON_OBJECT('githubApiKey', JSON_OBJECT('required', true, 'description', 'GitHub API token'))
WHERE name = 'github_create_branch';

-- Fix GitHub Create/Update File function endpoint and parameters  
UPDATE function_definitions SET
    endpoint_url = 'https://api.github.com/repos/{owner}/{repo}/contents/{path}',
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo', 'path', 'content', 'message'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'path', JSON_OBJECT('type', 'string', 'description', 'Path to the file in the repository'),
            'content', JSON_OBJECT('type', 'string', 'description', 'File content (will be base64 encoded automatically)'),
            'message', JSON_OBJECT('type', 'string', 'description', 'Commit message for the file change'),
            'branch', JSON_OBJECT('type', 'string', 'default', 'main', 'description', 'Branch to commit to'),
            'sha', JSON_OBJECT('type', 'string', 'description', 'SHA of the file being replaced (required for updates)')
        )
    ),
    required_api_keys = JSON_ARRAY('githubApiKey'),
    api_key_validation = JSON_OBJECT('githubApiKey', JSON_OBJECT('required', true, 'description', 'GitHub API token'))
WHERE name = 'github_create_update_file'; 