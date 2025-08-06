-- Revert API key management changes

-- Remove the GitHub API key setup function
DELETE FROM function_definitions 
WHERE name = 'github_api_key_setup' AND user_id = 'system';

-- Remove the system GitHub API key entry
DELETE FROM user_api_keys 
WHERE id = 'system-github-api-key' AND user_id = 'system';

-- Drop the user_api_keys table (only if it's empty)
-- Note: This will only drop if no other data exists
DROP TABLE IF EXISTS user_api_keys; 