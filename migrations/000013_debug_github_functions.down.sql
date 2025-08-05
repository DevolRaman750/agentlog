-- Migration 000003 Down: Revert GitHub Function Debugging Changes

-- Remove the debugging configuration
DELETE FROM api_configurations WHERE id = 'system-config-github-debug';

-- Revert GitHub Read Issues function to original
UPDATE function_definitions SET
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'state', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('open', 'closed', 'all'), 'default', 'open'),
            'per_page', JSON_OBJECT('type', 'integer', 'default', 30, 'minimum', 1, 'maximum', 100)
        )
    ),
    description = 'Read and analyze issues from a GitHub repository'
WHERE name = 'github_read_issues' AND user_id = 'system';

-- Revert GitHub Read Code function to original  
UPDATE function_definitions SET
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'path', JSON_OBJECT('type', 'string', 'description', 'File or directory path (optional, defaults to root)', 'default', ''),
            'ref', JSON_OBJECT('type', 'string', 'description', 'Branch, tag, or commit SHA (optional, defaults to default branch)', 'default', 'main')
        )
    ),
    description = 'Read files and directory contents from a GitHub repository to analyze code structure and implementation'
WHERE name = 'github_read_code' AND user_id = 'system'; 