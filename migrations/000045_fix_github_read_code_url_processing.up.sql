-- Fix github_read_code function URL processing and headers
-- This addresses the 404 errors by updating headers to match GitHub's current API expectations
-- and ensuring the endpoint URL template is properly formatted

UPDATE function_definitions 
SET 
    headers = JSON_OBJECT(
        'Accept', 'application/vnd.github+json',
        'X-GitHub-Api-Version', '2022-11-28',
        'User-Agent', 'GoGent-App'
    ),
    endpoint_url = 'https://api.github.com/repos/{owner}/{repo}/contents/{path}',
    description = 'Read files and directory contents from a GitHub repository. IMPORTANT: Start by exploring the repository structure with path="" (empty) to see available directories and files, then navigate to specific paths. Use this to access README files, source code, configuration files, or explore directory structures. Always check directory contents before trying to read specific files.',
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
                'description', 'File or directory path within the repo. EXPLORATION STRATEGY: 1) Start with "" (empty) to see root contents, 2) Navigate to directories like "src/", "cmd/", 3) Then read specific files. Examples: "" (root directory), "src/" (explore src directory), "src/main.js" (read specific file), "README.md" (read readme)',
                'default', ''
            ),
            'ref', JSON_OBJECT(
                'type', 'string',
                'description', 'Branch, tag, or commit SHA. Examples: "main", "develop", "v1.0.0". Default is the default branch.',
                'default', ''
            )
        ),
        'required', JSON_ARRAY('owner', 'repo')
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'github_read_code' AND user_id = 'system';
