-- Fix GitHub Read Code function to be more clear and useful for AI

UPDATE function_definitions 
SET 
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo', 'path'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string',
                'description', 'GitHub username or organization name'
            ),
            'repo', JSON_OBJECT(
                'type', 'string', 
                'description', 'Repository name'
            ),
            'path', JSON_OBJECT(
                'type', 'string',
                'description', 'File or directory path to read. Examples: README.md, src/main.py, package.json, src/ (for directory listing). Use empty string for root directory'
            ),
            'ref', JSON_OBJECT(
                'type', 'string',
                'description', 'Branch, tag, or commit SHA (optional, defaults to main branch)',
                'default', 'main'
            )
        )
    ),
    description = 'Read file contents or list directory contents from a GitHub repository. For files, returns base64-encoded content that can be decoded. For directories, returns a list of files and subdirectories with their metadata. Essential for analyzing code structure, reading configuration files, and understanding repository layout.',
    mock_response = JSON_OBJECT(
        'name', 'example.py',
        'path', 'src/example.py', 
        'type', 'file',
        'size', 2048,
        'content', 'aW1wb3J0IG9zCgpkZWYgbWFpbigpOgogICAgcHJpbnQoIkhlbGxvLCBXb3JsZCEiKQoKaWYgX19uYW1lX18gPT0gIl9fbWFpbl9fIjoKICAgIG1haW4oKQ==',
        'encoding', 'base64',
        'sha', 'abc123def456',
        'html_url', 'https://github.com/owner/repo/blob/main/src/example.py',
        'download_url', 'https://raw.githubusercontent.com/owner/repo/main/src/example.py'
    )
WHERE name = 'github_read_code'; 