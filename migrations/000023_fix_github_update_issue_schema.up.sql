-- Fix github_update_issue function schema to make body optional and handle title properly
UPDATE function_definitions 
SET 
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo', 'issue_number'),
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
                'description', 'Updated issue description/body content (optional)'
            ),
            'state', JSON_OBJECT(
                'type', 'string',
                'enum', JSON_ARRAY('open', 'closed'),
                'description', 'Issue state (optional)'
            )
        )
    ),
    query_template = '{"body": "{{body}}", "title": "{{title}}", "state": "{{state}}"}'
WHERE name = 'github_update_issue' AND user_id = 'system';