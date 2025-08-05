-- Improve GitHub Read Code function to encourage proper directory exploration
-- This addresses the issue where Gemini guesses incorrect file paths

UPDATE function_definitions
SET
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
    )
WHERE name = 'github_read_code' AND user_id = 'system'; 