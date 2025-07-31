-- Revert GitHub Read Code function improvements

UPDATE function_definitions 
SET 
    parameters_schema = JSON_OBJECT(
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
            'path', JSON_OBJECT(
                'type', 'string',
                'description', 'File or directory path (optional, defaults to root)',
                'default', ''
            ),
            'ref', JSON_OBJECT(
                'type', 'string',
                'description', 'Branch, tag, or commit SHA (optional, defaults to default branch)',
                'default', 'main'
            )
        )
    ),
    description = 'Read files and directory contents from a GitHub repository to analyze code structure and implementation',
    mock_response = JSON_OBJECT(
        'sha', 'abc123',
        'name', 'README.md',
        'path', 'README.md',
        'size', 1024,
        'type', 'file',
        'content', 'IyBTYW1wbGUgUmVhZG1l',
        'encoding', 'base64',
        'html_url', 'https://github.com/owner/repo/blob/main/README.md',
        'download_url', 'https://raw.githubusercontent.com/owner/repo/main/README.md'
    )
WHERE name = 'github_read_code'; 