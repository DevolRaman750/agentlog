-- Fix GitHub Read Code function comprehensively for proper GitHub API and Gemini compatibility
-- This addresses HTTP 404 errors and ensures proper function calling

-- Update the github_read_code function with correct headers and enhanced schema
UPDATE function_definitions 
SET 
    endpoint_url = 'https://api.github.com/repos/{owner}/{repo}/contents/{path}',
    description = 'Read files and directory contents from a GitHub repository. This function retrieves file contents, directory listings, or repository structure information. IMPORTANT: Start by exploring the repository structure with path="" (empty) to see available directories and files, then navigate to specific paths.',
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
                'description', 'File or directory path within the repo. Use empty string "" for root directory, "src/" for src directory, or "README.md" for specific files.',
                'default', ''
            ),
            'ref', JSON_OBJECT(
                'type', 'string', 
                'description', 'Branch, tag, or commit SHA. Examples: "main", "develop", "v1.0.0". If not specified, uses the default branch.',
                'default', ''
            )
        ),
        'required', JSON_ARRAY('owner', 'repo')
    ),
    headers = JSON_OBJECT(
        'Accept', 'application/vnd.github+json',
        'X-GitHub-Api-Version', '2022-11-28',
        'User-Agent', 'GoGent-App'
    ),
    auth_config = JSON_OBJECT(),
    required_api_keys = JSON_ARRAY('githubApiKey'),
    http_method = 'GET',
    result_transformer = 'github_code_analyzer',
    updated_at = NOW()
WHERE name = 'github_read_code' AND user_id = 'system';

-- Ensure the function is active and properly configured
UPDATE function_definitions 
SET 
    is_active = TRUE,
    is_system_resource = TRUE
WHERE name = 'github_read_code' AND user_id = 'system';

-- Add helpful system configuration documentation
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
    query_template,
    result_transformer,
    fallback_data,
    created_at,
    updated_at
) VALUES (
    'func-github-setup-helper',
    'system',
    'github_setup_info',
    'GitHub Setup Information',
    'github',
    'Provides information about setting up GitHub API access',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(),
        'required', JSON_ARRAY()
    ),
    JSON_OBJECT(
        'setup_info', 'To use GitHub functions, you need to configure a GitHub API key. You can generate one at https://github.com/settings/tokens with repo access permissions.',
        'configuration_needed', 'Set the githubApiKey in your API configurations',
        'troubleshooting', 'If you get 404 errors, check: 1) API key is valid, 2) Repository exists and is accessible, 3) Path parameter is correct'
    ),
    '',
    'MOCK',
    JSON_OBJECT(),
    JSON_OBJECT(),
    TRUE,
    TRUE,
    JSON_ARRAY(),
    JSON_OBJECT(),
    NULL,
    'default',
    JSON_OBJECT(
        'setup_info', 'GitHub API key configuration required',
        'status', 'configuration_needed'
    ),
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW(); 