-- Revert GitHub Read Code function to original state

UPDATE function_definitions 
SET 
    endpoint_url = 'https://api.github.com',
    description = 'Read files and directory contents from a GitHub repository to analyze code structure and implementation',
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'path', JSON_OBJECT('type', 'string', 'description', 'File or directory path (optional, defaults to root)', 'default', ''),
            'ref', JSON_OBJECT('type', 'string', 'description', 'Branch, tag, or commit SHA (optional, defaults to default branch)', 'default', 'main')
        ),
        'required', JSON_ARRAY('owner', 'repo')
    )
WHERE name = 'github_read_code' AND user_id = 'system'; 