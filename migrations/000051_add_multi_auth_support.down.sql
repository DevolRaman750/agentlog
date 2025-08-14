-- Migration Rollback: Remove Multi-Authentication Mode Support
-- This migration removes the multi-auth support and reverts to the previous schema

-- Drop the provider_auth_modes table
DROP TABLE IF EXISTS provider_auth_modes;

-- Remove the indexes we added
ALTER TABLE user_api_keys 
DROP INDEX idx_user_api_keys_auth_mode;

-- Remove the auth_config column
ALTER TABLE user_api_keys 
DROP COLUMN auth_config;

-- Remove the auth_mode column
ALTER TABLE user_api_keys 
DROP COLUMN auth_mode;

-- Reset table comment
ALTER TABLE user_api_keys 
COMMENT = 'Stores user API keys for various services';
