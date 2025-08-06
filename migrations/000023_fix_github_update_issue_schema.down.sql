-- Revert github_update_issue function schema changes
UPDATE function_definitions 
SET parameters_schema = JSON_OBJECT(
    'type', 'object',
    'required', JSON_ARRAY('owner', 'repo', 'issue_number', 'body'),
    'properties', JSON_OBJECT(
        'owner', JSON_OBJECT(
            'type', 'string',
            'description', 'GitHub username or organization name'
        ),
        'repo', JSON_OBJECT(
            'type', 'string', 
            'description', 'Repository name'
        ),
        'issue_number', JSON_OBJECT(
            'type', 'integer',
            'minimum', 1,
            'description', 'The issue number to update'
        ),
        'title', JSON_OBJECT(
            'type', 'string',
            'description', 'New title for the issue (optional)'
        ),
        'body', JSON_OBJECT(
            'type', 'string',
            'description', 'Updated issue description/body content'
        ),
        'state', JSON_OBJECT(
            'type', 'string',
            'enum', JSON_ARRAY('open', 'closed'),
            'description', 'Issue state (optional)'
        )
    )
)
WHERE name = 'github_update_issue' AND user_id = 'system';