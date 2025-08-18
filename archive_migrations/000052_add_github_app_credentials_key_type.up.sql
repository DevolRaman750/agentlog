-- Migration: Add GitHub App Credentials Key Type
-- This migration adds 'github_app_credentials' to the key_type ENUM
-- to support GitHub App authentication with App ID, Installation ID, and Private Key

-- Add github_app_credentials to the key_type ENUM
ALTER TABLE user_api_keys 
MODIFY COLUMN key_type ENUM(
    'api_key', 
    'access_token', 
    'bearer_token', 
    'oauth_token', 
    'webhook_url', 
    'connection_string',
    'github_app_credentials'
) NOT NULL DEFAULT 'api_key';
