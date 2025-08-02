-- Delete and recreate GitHub functions with clean schemas (no examples fields)
-- This fixes the Gemini API errors caused by unsupported "examples" fields

-- Delete the problematic GitHub functions
DELETE FROM function_definitions WHERE name IN (
    'github_create_branch',
    'github_create_update_file'
);

-- Recreate github_create_branch with clean schema
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, parameters_schema, 
    required_api_keys, is_system_resource, function_group, created_at, updated_at
) VALUES (
    UUID(),
    'system',
    'github_create_branch',
    'Create GitHub Branch',
    'Create a new branch in a GitHub repository from an existing branch, tag, or commit',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'repo', JSON_OBJECT(
                'type', 'string',
                'description', 'Repository name in format "owner/repo"',
                'pattern', '^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$'
            ),
            'branch_name', JSON_OBJECT(
                'type', 'string',
                'description', 'Name of the new branch to create',
                'pattern', '^[a-zA-Z0-9._/-]+$',
                'minLength', 1,
                'maxLength', 255
            ),
            'source_branch', JSON_OBJECT(
                'type', 'string',
                'default', 'main',
                'description', 'Source branch, tag, or commit SHA to create the new branch from'
            )
        ),
        'required', JSON_ARRAY('repo', 'branch_name')
    ),
    JSON_ARRAY('github_token'),
    1,
    'github',
    NOW(),
    NOW()
);

-- Recreate github_create_update_file with clean schema
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, parameters_schema, 
    required_api_keys, is_system_resource, function_group, created_at, updated_at
) VALUES (
    UUID(),
    'system',
    'github_create_update_file',
    'Create/Update GitHub File',
    'Create or update a file in a GitHub repository',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'repo', JSON_OBJECT(
                'type', 'string',
                'description', 'Repository name in format "owner/repo"',
                'pattern', '^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$'
            ),
            'path', JSON_OBJECT(
                'type', 'string',
                'description', 'Path to the file in the repository',
                'minLength', 1
            ),
            'content', JSON_OBJECT(
                'type', 'string',
                'description', 'File content (will be base64 encoded automatically)'
            ),
            'message', JSON_OBJECT(
                'type', 'string',
                'description', 'Commit message for the file change'
            ),
            'branch', JSON_OBJECT(
                'type', 'string',
                'description', 'Branch to commit to',
                'default', 'main'
            ),
            'sha', JSON_OBJECT(
                'type', 'string',
                'description', 'SHA of the file being replaced (required for updates, omit for new files)'
            ),
            'committer', JSON_OBJECT(
                'type', 'object',
                'description', 'Committer information (optional)',
                'properties', JSON_OBJECT(
                    'name', JSON_OBJECT(
                        'type', 'string',
                        'description', 'Committer name'
                    ),
                    'email', JSON_OBJECT(
                        'type', 'string',
                        'description', 'Committer email address',
                        'format', 'email'
                    )
                )
            )
        ),
        'required', JSON_ARRAY('repo', 'path', 'content', 'message')
    ),
    JSON_ARRAY('github_token'),
    1,
    'github',
    NOW(),
    NOW()
); 