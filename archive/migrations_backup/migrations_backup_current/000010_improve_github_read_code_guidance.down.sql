-- Revert GitHub Read Code function description improvements

UPDATE function_definitions
SET
    description = 'Read files and directory contents from a GitHub repository. Use this to access README files, source code, configuration files, or explore directory structures. Supports any public repository and specific file paths.',
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string',
                'description', 'GitHub username or organization name (e.g., "microsoft", "facebook", "google")'
            ),
            'repo', JSON_OBJECT(
                'type', 'string',
                'description', 'Repository name (e.g., "vscode", "react", "tensorflow")'
            ),
            'path', JSON_OBJECT(
                'type', 'string',
                'description', 'File or directory path within the repo. Examples: "README.md", "src/main.js", "docs/", "" (empty for root directory). Default is root.',
                'default', ''
            ),
            'ref', JSON_OBJECT(
                'type', 'string',
                'description', 'Branch, tag, or commit SHA. Examples: "main", "develop", "v1.0.0". Default is the default branch.',
                'default', ''
            )
        ),
        'required', JSON_ARRAY('owner', 'repo')
    )
WHERE name = 'github_read_code' AND user_id = 'system'; 