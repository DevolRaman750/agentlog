-- Migration 000005 Down: Revert GitHub Function Fixes

-- Revert GitHub Create Branch function (back to original incorrect values)
UPDATE function_definitions SET 
    endpoint_url = 'https://api.github.com/repos/{repo}/git/refs',
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('repo', 'branch_name'),
        'properties', JSON_OBJECT(
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name in format "owner/repo"'),
            'branch_name', JSON_OBJECT('type', 'string', 'description', 'Name of the new branch to create'),
            'source_branch', JSON_OBJECT('type', 'string', 'default', 'main', 'description', 'Source branch to create from')
        )
    ),
    required_api_keys = JSON_ARRAY('github_token'),
    api_key_validation = JSON_OBJECT('github_token', JSON_OBJECT('required', true, 'description', 'GitHub API token'))
WHERE name = 'github_create_branch';

-- Revert GitHub Create/Update File function
UPDATE function_definitions SET
    endpoint_url = 'https://api.github.com/repos/{repo}/contents/{path}',
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('repo', 'path', 'content', 'message'),
        'properties', JSON_OBJECT(
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name in format "owner/repo"'),
            'path', JSON_OBJECT('type', 'string', 'description', 'Path to the file in the repository'),
            'content', JSON_OBJECT('type', 'string', 'description', 'File content (will be base64 encoded automatically)'),
            'message', JSON_OBJECT('type', 'string', 'description', 'Commit message for the file change'),
            'branch', JSON_OBJECT('type', 'string', 'default', 'main', 'description', 'Branch to commit to'),
            'sha', JSON_OBJECT('type', 'string', 'description', 'SHA of the file being replaced (required for updates)')
        )
    ),
    required_api_keys = JSON_ARRAY('github_token'),
    api_key_validation = JSON_OBJECT('github_token', JSON_OBJECT('required', true, 'description', 'GitHub API token'))
WHERE name = 'github_create_update_file'; 