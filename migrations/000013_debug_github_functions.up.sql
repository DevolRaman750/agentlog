-- Migration 000003: Debug and Fix GitHub Functions
-- This migration fixes GitHub function issues and adds better debugging

-- Fix GitHub Read Issues function to include better parameter handling
UPDATE function_definitions SET
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string', 
                'description', 'GitHub username or organization (e.g., "microsoft", "facebook", "google")',
                'examples', JSON_ARRAY('microsoft', 'facebook', 'google', 'vercel')
            ),
            'repo', JSON_OBJECT(
                'type', 'string', 
                'description', 'Repository name (e.g., "vscode", "react", "typescript")',
                'examples', JSON_ARRAY('vscode', 'react', 'typescript', 'next.js')
            ),
            'state', JSON_OBJECT(
                'type', 'string', 
                'enum', JSON_ARRAY('open', 'closed', 'all'), 
                'default', 'open',
                'description', 'Filter issues by state'
            ),
            'per_page', JSON_OBJECT(
                'type', 'integer', 
                'default', 30, 
                'minimum', 1, 
                'maximum', 100,
                'description', 'Number of results per page'
            ),
            'sort', JSON_OBJECT(
                'type', 'string',
                'enum', JSON_ARRAY('created', 'updated', 'comments'),
                'default', 'created',
                'description', 'Sort field for issues'
            ),
            'direction', JSON_OBJECT(
                'type', 'string',
                'enum', JSON_ARRAY('asc', 'desc'),
                'default', 'desc',
                'description', 'Sort direction'
            )
        )
    ),
    description = 'Read and analyze issues from a GitHub repository. Provide valid owner/repo combinations like microsoft/vscode, facebook/react, or vercel/next.js. This helps understand bugs, feature requests, and project status.'
WHERE name = 'github_read_issues' AND user_id = 'system';

-- Fix GitHub Read Code function with better examples
UPDATE function_definitions SET
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string', 
                'description', 'GitHub username or organization (e.g., "microsoft", "facebook", "google")',
                'examples', JSON_ARRAY('microsoft', 'facebook', 'google', 'vercel')
            ),
            'repo', JSON_OBJECT(
                'type', 'string', 
                'description', 'Repository name (e.g., "vscode", "react", "typescript")',
                'examples', JSON_ARRAY('vscode', 'react', 'typescript', 'next.js')
            ),
            'path', JSON_OBJECT(
                'type', 'string', 
                'description', 'File or directory path (optional, defaults to repository root). Examples: "package.json", "src/", "README.md"',
                'default', '',
                'examples', JSON_ARRAY('package.json', 'src/', 'README.md', 'tsconfig.json')
            ),
            'ref', JSON_OBJECT(
                'type', 'string', 
                'description', 'Branch, tag, or commit SHA (optional, defaults to default branch)', 
                'default', 'main',
                'examples', JSON_ARRAY('main', 'master', 'develop', 'v1.0.0')
            )
        )
    ),
    description = 'Read files and directory contents from a GitHub repository. Provide valid owner/repo like microsoft/vscode. Use path parameter to specify files (e.g., "package.json") or directories (e.g., "src/").'
WHERE name = 'github_read_code' AND user_id = 'system';

-- Add debugging configuration for better error messages
INSERT INTO api_configurations (
    id, user_id, variation_name, model_name, system_prompt, 
    temperature, max_tokens, top_p, generation_config,
    created_at, updated_at
) VALUES 
(
    'system-config-github-debug', 
    'system', 
    'GitHub Function Debug', 
    'gemini-1.5-pro-latest', 
    'When using GitHub functions, ALWAYS provide valid owner/repo combinations. Use popular repositories like:
- microsoft/vscode (for VS Code editor)
- facebook/react (for React library)  
- vercel/next.js (for Next.js framework)
- google/tensorflow (for TensorFlow)
- microsoft/TypeScript (for TypeScript)

Before calling any GitHub function, think about what repository would be relevant to the user''s question. If they ask about a specific technology, choose a well-known repository for that technology.',
    0.3,
    4096,
    0.9,
    JSON_OBJECT('temperature', 0.3, 'maxOutputTokens', 4096, 'topP', 0.9),
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW(); 