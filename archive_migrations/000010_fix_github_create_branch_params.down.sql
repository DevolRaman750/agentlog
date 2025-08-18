-- Migration 000010 Down: Revert GitHub Create Branch Parameters

UPDATE function_definitions 
SET parameters_schema = JSON_OBJECT(
    'type', 'object',
    'required', JSON_ARRAY('owner', 'repo'),
    'properties', JSON_OBJECT(
        'owner', JSON_OBJECT(
            'type', 'string',
            'description', 'GitHub username or organization'
        ),
        'repo', JSON_OBJECT(
            'type', 'string', 
            'description', 'Repository name'
        ),
        'branch', JSON_OBJECT(
            'type', 'string',
            'description', 'Name of the new branch to create'
        )
    )
),
description = 'Create a new branch in a GitHub repository'
WHERE id = 'func-github-create-branch'; 