-- Add proper API key management for external services
-- This ensures that API keys can be stored and managed securely

-- Create table for storing API keys if it doesn't exist
CREATE TABLE IF NOT EXISTS user_api_keys (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    api_key_name VARCHAR(100) NOT NULL,
    api_key_value_encrypted TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_service_key (user_id, service_name, api_key_name),
    INDEX idx_user_service (user_id, service_name)
);

-- Insert default GitHub API key entry for system user if not exists
INSERT INTO user_api_keys (
    id,
    user_id,
    service_name,
    api_key_name,
    api_key_value_encrypted,
    is_active
) VALUES (
    'system-github-api-key',
    'system',
    'github',
    'githubApiKey',
    'PLACEHOLDER_ENCRYPTED_KEY_NEEDS_CONFIGURATION',
    FALSE
) ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Add documentation for setting up GitHub API key
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
    'func-github-api-key-setup',
    'system',
    'github_api_key_setup',
    'GitHub API Key Setup Guide',
    'github',
    'Provides step-by-step instructions for setting up GitHub API access',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'step', JSON_OBJECT(
                'type', 'string',
                'description', 'Which setup step to show: "create", "configure", or "test"',
                'enum', JSON_ARRAY('create', 'configure', 'test'),
                'default', 'create'
            )
        ),
        'required', JSON_ARRAY()
    ),
    JSON_OBJECT(
        'instructions', JSON_OBJECT(
            'create', 'Go to https://github.com/settings/tokens and create a new Personal Access Token with "repo" scope',
            'configure', 'Add your GitHub API key to the system configuration',
            'test', 'Test the API key by calling a simple GitHub API endpoint'
        ),
        'troubleshooting', JSON_OBJECT(
            'http_404', 'Check if repository exists and is accessible with your API key',
            'http_403', 'API key may not have sufficient permissions',
            'http_401', 'API key is invalid or expired'
        )
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
        'setup_required', TRUE,
        'documentation_url', 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token'
    ),
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW(); 