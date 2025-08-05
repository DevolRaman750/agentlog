-- Fix JSON format for github_read_issues function - wrap arrays in proper object structure

UPDATE function_definitions 
SET 
    mock_response = JSON_OBJECT(
        'issues', JSON_ARRAY(
            JSON_OBJECT(
                'id', 1,
                'number', 1,
                'title', 'Sample Issue',
                'body', 'This is a sample issue description for testing purposes',
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
        'total_count', 1,
        'status', 'success'
    ),
    fallback_data = JSON_OBJECT(
        'issues', JSON_ARRAY(
            JSON_OBJECT(
                'id', 0,
                'number', 0,
                'title', 'Unable to fetch issues - GitHub API unavailable',
                'body', 'GitHub API is currently unavailable. This is mock fallback data.',
                'state', 'open',
                'error', 'API_UNAVAILABLE'
            )
        ),
        'total_count', 0,
        'status', 'fallback',
        'message', 'GitHub API unavailable, showing mock data'
    )
WHERE name = 'github_read_issues'; 