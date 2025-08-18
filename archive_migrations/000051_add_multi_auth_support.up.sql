-- Migration: Add Multi-Authentication Mode Support
-- This migration adds support for multiple authentication modes per provider
-- while maintaining backward compatibility with existing API keys

-- Add auth_mode column with default value for backward compatibility
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'user_api_keys' 
     AND COLUMN_NAME = 'auth_mode') = 0,
    'ALTER TABLE user_api_keys ADD COLUMN auth_mode VARCHAR(50) DEFAULT "personal_access_token" AFTER key_type',
    'SELECT "Column auth_mode already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add auth_config for mode-specific configuration (JSON field)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'user_api_keys' 
     AND COLUMN_NAME = 'auth_config') = 0,
    'ALTER TABLE user_api_keys ADD COLUMN auth_config JSON NULL AFTER auth_mode',
    'SELECT "Column auth_config already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for efficient auth mode queries (only if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'user_api_keys' 
     AND INDEX_NAME = 'idx_user_api_keys_auth_mode') = 0,
    'ALTER TABLE user_api_keys ADD INDEX idx_user_api_keys_auth_mode (user_id, service_name, auth_mode)',
    'SELECT "Index already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing GitHub keys to have explicit auth_mode
UPDATE user_api_keys 
SET auth_mode = 'personal_access_token' 
WHERE service_name = 'github' AND (auth_mode IS NULL OR auth_mode = '');

-- Update existing keys for other services to have default auth_mode
UPDATE user_api_keys 
SET auth_mode = CASE 
    WHEN service_name = 'slack' THEN 'bot_token'
    WHEN service_name = 'gemini' THEN 'api_key'
    WHEN service_name = 'openweather' THEN 'api_key'
    WHEN service_name = 'googledrive' THEN 'service_account'
    ELSE 'api_key'
END
WHERE auth_mode IS NULL OR auth_mode = '';

-- Create table for provider authentication modes configuration
CREATE TABLE IF NOT EXISTS provider_auth_modes (
    id VARCHAR(255) PRIMARY KEY,
    provider_id VARCHAR(100) NOT NULL,
    auth_mode_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    setup_instructions TEXT,
    required_fields JSON,
    capabilities JSON,
    validation_endpoint VARCHAR(500),
    rate_limit_info JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_provider_auth_mode (provider_id, auth_mode_id),
    INDEX idx_provider_auth_modes_provider (provider_id),
    INDEX idx_provider_auth_modes_default (provider_id, is_default)
);

-- Insert GitHub authentication modes
INSERT IGNORE INTO provider_auth_modes (
    id, provider_id, auth_mode_id, name, description, is_default,
    setup_instructions, required_fields, capabilities, validation_endpoint, rate_limit_info
) VALUES 
(
    'github-pat-mode',
    'github',
    'personal_access_token',
    'Personal Access Token',
    'Use your personal GitHub token for API access',
    TRUE,
    'Generate a Personal Access Token at https://github.com/settings/tokens with appropriate scopes',
    JSON_OBJECT(
        'token', JSON_OBJECT(
            'type', 'password',
            'label', 'GitHub Personal Access Token',
            'placeholder', 'ghp_xxxxxxxxxxxxxxxxxxxx',
            'required', true,
            'validation', '^ghp_[A-Za-z0-9]{36}$'
        )
    ),
    JSON_OBJECT(
        'rateLimit', '1000 requests/hour (5000 for authenticated)',
        'permissions', 'User-level access to authorized repositories',
        'scopes', JSON_ARRAY('repo', 'read:user', 'read:org')
    ),
    'https://api.github.com/user',
    JSON_OBJECT(
        'hourly', 5000,
        'resetTime', 'top of the hour'
    )
),
(
    'github-app-mode',
    'github',
    'github_app',
    'GitHub App',
    'Authenticate as a GitHub App installation for enhanced permissions and rate limits',
    FALSE,
    'Create a GitHub App at https://github.com/settings/apps and install it to your repositories',
    JSON_OBJECT(
        'app_id', JSON_OBJECT(
            'type', 'number',
            'label', 'GitHub App ID',
            'placeholder', '123456',
            'required', true
        ),
        'private_key', JSON_OBJECT(
            'type', 'file',
            'label', 'Private Key (.pem file)',
            'accept', '.pem',
            'required', true
        ),
        'installation_id', JSON_OBJECT(
            'type', 'number',
            'label', 'Installation ID',
            'placeholder', '12345678',
            'required', true,
            'help', 'Found in the GitHub App installation URL'
        )
    ),
    JSON_OBJECT(
        'rateLimit', '5000 requests/hour per installation',
        'permissions', 'Repository-level access with fine-grained permissions',
        'benefits', JSON_ARRAY(
            'Higher rate limits',
            'Fine-grained permissions',
            'Organization audit logs',
            'Can act on behalf of the app'
        )
    ),
    'https://api.github.com/app/installations/{installation_id}',
    JSON_OBJECT(
        'hourly', 5000,
        'resetTime', 'top of the hour',
        'perInstallation', true
    )
);

-- Insert authentication modes for other existing providers
INSERT IGNORE INTO provider_auth_modes (
    id, provider_id, auth_mode_id, name, description, is_default,
    setup_instructions, required_fields, capabilities, rate_limit_info
) VALUES 
(
    'slack-bot-token-mode',
    'slack',
    'bot_token',
    'Bot Token',
    'Use a Slack Bot Token for API access',
    TRUE,
    'Create a Slack App and install it to your workspace to get a Bot Token',
    JSON_OBJECT(
        'token', JSON_OBJECT(
            'type', 'password',
            'label', 'Slack Bot Token',
            'placeholder', 'xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx',
            'required', true,
            'validation', '^xoxb-[0-9]+-[0-9]+-[A-Za-z0-9]+$'
        )
    ),
    JSON_OBJECT(
        'rateLimit', 'Tier-based rate limits',
        'permissions', 'Bot-level access to authorized channels and users'
    ),
    JSON_OBJECT(
        'tier1', 1,
        'tier2', 20,
        'tier3', 50,
        'tier4', 100
    )
),
(
    'gemini-api-key-mode',
    'gemini',
    'api_key',
    'API Key',
    'Use Google AI Studio API Key for Gemini access',
    TRUE,
    'Generate an API key at https://makersuite.google.com/app/apikey',
    JSON_OBJECT(
        'api_key', JSON_OBJECT(
            'type', 'password',
            'label', 'Gemini API Key',
            'placeholder', 'AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            'required', true,
            'validation', '^AIza[A-Za-z0-9_-]{35}$'
        )
    ),
    JSON_OBJECT(
        'rateLimit', '60 requests per minute',
        'permissions', 'Text generation, function calling, and chat completions'
    ),
    JSON_OBJECT(
        'perMinute', 60,
        'perDay', 1500
    )
);

-- Add comment to document the migration
ALTER TABLE user_api_keys 
COMMENT = 'Stores user API keys with support for multiple authentication modes per provider';

ALTER TABLE provider_auth_modes 
COMMENT = 'Defines available authentication modes for each provider';
