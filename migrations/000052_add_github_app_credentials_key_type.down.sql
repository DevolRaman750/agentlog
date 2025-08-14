-- Migration Rollback: Remove GitHub App Credentials Key Type
-- This migration removes 'github_app_credentials' from the key_type ENUM

-- First, update any existing github_app_credentials to access_token to avoid constraint violations
UPDATE user_api_keys 
SET key_type = 'access_token' 
WHERE key_type = 'github_app_credentials';

-- Remove github_app_credentials from the key_type ENUM
ALTER TABLE user_api_keys 
MODIFY COLUMN key_type ENUM(
    'api_key', 
    'access_token', 
    'bearer_token', 
    'oauth_token', 
    'webhook_url', 
    'connection_string'
) NOT NULL DEFAULT 'api_key';
