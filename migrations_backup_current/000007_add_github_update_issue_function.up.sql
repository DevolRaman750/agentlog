-- Add GitHub Update Issue function for automated issue enhancement

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
    'func-github-update-issue',
    'system',
    'github_update_issue',
    'GitHub Update Issue',
    'github',
    'Update a GitHub issue with additional analysis, insights, or findings. Perfect for AI agents to enhance issues with code analysis, related information, or progress updates after examining the codebase.',
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
                'description', 'The issue number to update (e.g., 123, 456)',
                'minimum', 1,
                'examples', JSON_ARRAY(123, 456, 789)
            ),
            'title', JSON_OBJECT(
                'type', 'string',
                'description', 'New title for the issue (optional - leave empty to keep existing title)',
                'maxLength', 256
            ),
            'body', JSON_OBJECT(
                'type', 'string',
                'description', 'Updated issue description/body content. Can include markdown formatting, code blocks, analysis results, etc.',
                'examples', JSON_ARRAY(
                    'After analyzing the codebase, I found that this issue is related to...',
                    '## Analysis Results\n\nThe error occurs in `src/utils/parser.js` line 45...',
                    'Updated with code analysis findings:\n\n```javascript\n// Problematic code found\n```'
                )
            ),
            'state', JSON_OBJECT(
                'type', 'string',
                'description', 'Issue state (optional - leave empty to keep current state)',
                'enum', JSON_ARRAY('open', 'closed'),
                'examples', JSON_ARRAY('open', 'closed')
            ),
            'labels', JSON_OBJECT(
                'type', 'array',
                'description', 'Array of label names to set on the issue (optional - replaces existing labels)',
                'items', JSON_OBJECT('type', 'string'),
                'examples', JSON_ARRAY(
                    JSON_ARRAY('bug', 'analyzed'),
                    JSON_ARRAY('enhancement', 'ai-analysis', 'needs-review'),
                    JSON_ARRAY('documentation', 'code-analysis')
                )
            ),
            'assignees', JSON_OBJECT(
                'type', 'array',
                'description', 'Array of usernames to assign to the issue (optional)',
                'items', JSON_OBJECT('type', 'string'),
                'examples', JSON_ARRAY(
                    JSON_ARRAY('john-doe', 'jane-smith'),
                    JSON_ARRAY('maintainer-user')
                )
            ),
            'milestone', JSON_OBJECT(
                'type', 'integer',
                'description', 'Milestone number to assign (optional)',
                'minimum', 1
            ),
            'append_mode', JSON_OBJECT(
                'type', 'boolean',
                'description', 'If true, append new content to existing body instead of replacing it. Recommended for AI analysis updates.',
                'default', true
            ),
            'analysis_section_title', JSON_OBJECT(
                'type', 'string',
                'description', 'Title for the analysis section when appending (only used if append_mode is true)',
                'default', 'AI Analysis',
                'examples', JSON_ARRAY('Code Analysis', 'Automated Analysis', 'Agent Findings', 'Investigation Results')
            )
        ),
        'required', JSON_ARRAY('owner', 'repo', 'issue_number', 'body')
    ),
    JSON_OBJECT(
        'id', 123,
        'number', 123,
        'title', 'Sample Bug Report - Enhanced with Analysis',
        'body', 'Original issue description\n\n---\n\n## AI Analysis\n\nAfter examining the codebase, I found several relevant files and potential causes for this issue...',
        'state', 'open',
        'user', JSON_OBJECT(
            'login', 'issue-creator',
            'id', 12345
        ),
        'labels', JSON_ARRAY(
            JSON_OBJECT(
                'name', 'bug',
                'color', 'd73a4a'
            ),
            JSON_OBJECT(
                'name', 'analyzed',
                'color', '0075ca'
            )
        ),
        'assignees', JSON_ARRAY(
            JSON_OBJECT(
                'login', 'maintainer-user',
                'id', 67890
            )
        ),
        'updated_at', '2025-01-30T15:30:00Z',
        'html_url', 'https://github.com/owner/repo/issues/123',
        '_metadata', JSON_OBJECT(
            'source', 'mock',
            'update_type', 'analysis_appended'
        )
    ),
    'https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}',
    'PATCH',
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
        'id', 123,
        'number', 123,
        'title', 'Issue Updated Successfully',
        'body', 'Issue has been updated with analysis findings.',
        'state', 'open',
        'updated_at', '2025-01-30T15:30:00Z',
        'html_url', 'https://github.com/owner/repo/issues/123',
        '_metadata', JSON_OBJECT(
            'source', 'fallback',
            'error', 'GitHub API unavailable - update not applied',
            'update_type', 'simulated'
        )
    ),
    NOW(),
    NOW()
); 