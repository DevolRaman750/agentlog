-- Migration 000010: Fix GitHub Create Branch Parameters
-- This migration fixes the github_create_branch function to include required ref and sha parameters

UPDATE function_definitions 
SET parameters_schema = JSON_OBJECT(
    'type', 'object',
    'required', JSON_ARRAY('owner', 'repo', 'ref', 'sha'),
    'properties', JSON_OBJECT(
        'owner', JSON_OBJECT(
            'type', 'string',
            'description', 'GitHub username or organization'
        ),
        'repo', JSON_OBJECT(
            'type', 'string', 
            'description', 'Repository name'
        ),
        'ref', JSON_OBJECT(
            'type', 'string',
            'description', 'The name of the fully qualified reference (e.g., refs/heads/feature-branch). Must start with refs/heads/ for branches.'
        ),
        'sha', JSON_OBJECT(
            'type', 'string',
            'description', 'The SHA1 value to set this reference to. Usually the SHA of the latest commit on the base branch.'
        )
    )
),
description = 'Create a new branch in a GitHub repository. Requires the target SHA (usually from the base branch) and full ref name (refs/heads/branch-name).'
WHERE id = 'func-github-create-branch'; 