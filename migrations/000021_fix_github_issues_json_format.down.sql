-- Revert JSON format for github_read_issues function back to array format

UPDATE function_definitions 
SET 
    mock_response = JSON_ARRAY(
        JSON_OBJECT(
            'id', 1,
            'number', 1,
            'title', 'Sample Issue',
            'body', 'This is a sample issue description',
            'state', 'open',
            'user', JSON_OBJECT('login', 'sample-user'),
            'labels', JSON_ARRAY(
                JSON_OBJECT('name', 'bug', 'color', 'f29513')
            ),
            'assignees', JSON_ARRAY(),
            'html_url', 'https://github.com/owner/repo/issues/1',
            'created_at', '2023-01-01T00:00:00Z',
            'updated_at', '2023-01-01T00:00:00Z'
        )
    ),
    fallback_data = JSON_ARRAY(
        JSON_OBJECT(
            'id', 0,
            'number', 0,
            'title', 'Unable to fetch issues',
            'body', 'GitHub API unavailable - using mock data',
            'state', 'open',
            'error', 'API_UNAVAILABLE'
        )
    )
WHERE name = 'github_read_issues'; 