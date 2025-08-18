-- Add comprehensive user API key management
-- This migration creates a flexible system for storing various types of API keys with permissions and scopes

-- Main table for storing user API keys
CREATE TABLE user_api_keys (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    key_name VARCHAR(100) NOT NULL, -- e.g., 'gemini_primary', 'stripe_production', 'slack_webhook_alerts'
    service_name VARCHAR(100) NOT NULL, -- e.g., 'gemini', 'stripe', 'slack', 'github', 'openweather'
    key_type ENUM('api_key', 'access_token', 'bearer_token', 'oauth_token', 'webhook_url', 'connection_string') NOT NULL DEFAULT 'api_key',
    
    -- Encrypted storage of the actual key value
    encrypted_key_value TEXT NOT NULL,
    encryption_algorithm VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
    encryption_key_version INT NOT NULL DEFAULT 1,
    
    -- Key metadata and configuration
    display_name VARCHAR(255) NOT NULL, -- Human-readable name: 'Gemini Production API Key'
    description TEXT, -- Optional description of the key's purpose
    
    -- Access control and permissions
    access_level ENUM('read', 'write', 'admin', 'read_write') NOT NULL DEFAULT 'read_write',
    scopes JSON, -- Service-specific scopes: ["files:read", "issues:write"] for GitHub
    permissions JSON, -- Custom permission mapping: {"can_create_payments": true, "can_refund": false}
    
    -- Key lifecycle management
    expires_at TIMESTAMP NULL, -- When the key expires
    last_validated_at TIMESTAMP NULL, -- Last time we tested the key
    validation_status ENUM('valid', 'invalid', 'expired', 'untested', 'rate_limited') DEFAULT 'untested',
    validation_error TEXT, -- Error message from last validation attempt
    
    -- Usage tracking
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE, -- Is this the default key for this service?
    total_uses INT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    
    -- Service-specific configuration
    service_config JSON, -- Service-specific settings like rate limits, endpoints, etc.
    environment ENUM('production', 'staging', 'development', 'test') DEFAULT 'production',
    
    -- Rate limiting (optional per-key limits)
    rate_limit_per_hour INT NULL,
    rate_limit_per_day INT NULL,
    rate_limit_burst INT NULL,
    
    -- Audit trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255), -- User ID who created this key
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_user_api_keys_user_id (user_id),
    INDEX idx_user_api_keys_service_name (service_name),
    INDEX idx_user_api_keys_key_type (key_type),
    INDEX idx_user_api_keys_is_active (is_active),
    INDEX idx_user_api_keys_is_default (user_id, service_name, is_default),
    INDEX idx_user_api_keys_expires_at (expires_at),
    INDEX idx_user_api_keys_validation_status (validation_status),
    
    -- Ensure unique key names per user
    UNIQUE KEY unique_user_key_name (user_id, key_name)
);

-- Table to map API keys to specific functions/categories
CREATE TABLE api_key_function_mappings (
    id VARCHAR(255) PRIMARY KEY,
    api_key_id VARCHAR(255) NOT NULL,
    function_definition_id VARCHAR(255) NULL, -- NULL means applies to all functions in the function_group
    function_group VARCHAR(100) NULL, -- e.g., 'communication', 'ecommerce', 'ai_ml'
    
    -- Override settings for this specific mapping
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    access_level_override ENUM('read', 'write', 'admin', 'read_write') NULL, -- Override the key's default access level
    custom_config JSON, -- Function-specific configuration for this key
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (api_key_id) REFERENCES user_api_keys(id) ON DELETE CASCADE,
    FOREIGN KEY (function_definition_id) REFERENCES function_definitions(id) ON DELETE CASCADE,
    
    INDEX idx_api_key_function_mappings_api_key_id (api_key_id),
    INDEX idx_api_key_function_mappings_function_id (function_definition_id),
    INDEX idx_api_key_function_mappings_function_group (function_group),
    
    -- Ensure we don't have duplicate mappings
    UNIQUE KEY unique_key_function_mapping (api_key_id, function_definition_id),
    UNIQUE KEY unique_key_group_mapping (api_key_id, function_group),
    
    -- Either function_definition_id OR function_group must be set, not both
    CHECK ((function_definition_id IS NOT NULL AND function_group IS NULL) OR 
           (function_definition_id IS NULL AND function_group IS NOT NULL))
);

-- Table to track API key usage and performance
CREATE TABLE api_key_usage_logs (
    id VARCHAR(255) PRIMARY KEY,
    api_key_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    
    -- Usage context
    function_name VARCHAR(100),
    function_group VARCHAR(100),
    execution_run_id VARCHAR(255) NULL,
    
    -- Usage details
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    response_time_ms INT NULL,
    error_message TEXT NULL,
    rate_limited BOOLEAN DEFAULT FALSE,
    
    -- API response metadata
    http_status_code INT NULL,
    response_size_bytes INT NULL,
    
    FOREIGN KEY (api_key_id) REFERENCES user_api_keys(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (execution_run_id) REFERENCES execution_runs(id) ON DELETE SET NULL,
    
    INDEX idx_api_key_usage_logs_api_key_id (api_key_id),
    INDEX idx_api_key_usage_logs_user_id (user_id),
    INDEX idx_api_key_usage_logs_used_at (used_at),
    INDEX idx_api_key_usage_logs_function_name (function_name),
    INDEX idx_api_key_usage_logs_success (success),
    INDEX idx_api_key_usage_logs_execution_run_id (execution_run_id)
);

-- Insert default service configurations for known services
INSERT INTO user_api_keys (id, user_id, key_name, service_name, key_type, encrypted_key_value, display_name, description, access_level, scopes, is_active, is_default, created_by) 
VALUES 
-- System placeholder entries to define service types (these will be used as templates)
('system_template_gemini', 'system', 'gemini_template', 'gemini', 'api_key', 'TEMPLATE_ENCRYPTED_VALUE', 'Google Gemini API Key Template', 'Template for Gemini API keys - supports text generation, function calling, and chat completions', 'read_write', JSON_ARRAY('generate', 'chat', 'function_calling'), FALSE, FALSE, 'system'),

('system_template_openweather', 'system', 'openweather_template', 'openweather', 'api_key', 'TEMPLATE_ENCRYPTED_VALUE', 'OpenWeather API Key Template', 'Template for OpenWeather API keys - provides weather data and forecasts', 'read', JSON_ARRAY('current_weather', 'forecasts', 'historical'), FALSE, FALSE, 'system'),

('system_template_stripe', 'system', 'stripe_template', 'stripe', 'api_key', 'TEMPLATE_ENCRYPTED_VALUE', 'Stripe API Key Template', 'Template for Stripe API keys - enables payment processing and financial operations', 'read_write', JSON_ARRAY('payments:read', 'payments:write', 'customers:read', 'customers:write'), FALSE, FALSE, 'system'),

('system_template_github', 'system', 'github_template', 'github', 'access_token', 'TEMPLATE_ENCRYPTED_VALUE', 'GitHub API Token Template', 'Template for GitHub API tokens - enables repository and issue management', 'read_write', JSON_ARRAY('repo', 'issues', 'pull_requests'), FALSE, FALSE, 'system'),

('system_template_slack', 'system', 'slack_template', 'slack', 'bearer_token', 'TEMPLATE_ENCRYPTED_VALUE', 'Slack Bot Token Template', 'Template for Slack bot tokens - enables messaging and workspace integration', 'write', JSON_ARRAY('chat:write', 'channels:read'), FALSE, FALSE, 'system'),

('system_template_openai', 'system', 'openai_template', 'openai', 'api_key', 'TEMPLATE_ENCRYPTED_VALUE', 'OpenAI API Key Template', 'Template for OpenAI API keys - supports GPT models and DALL-E image generation', 'read_write', JSON_ARRAY('completions', 'images', 'models'), FALSE, FALSE, 'system'),

('system_template_neo4j', 'system', 'neo4j_template', 'neo4j', 'connection_string', 'TEMPLATE_ENCRYPTED_VALUE', 'Neo4j Connection Template', 'Template for Neo4j database connections - enables graph database operations', 'read_write', JSON_ARRAY('read', 'write', 'admin'), FALSE, FALSE, 'system'); 