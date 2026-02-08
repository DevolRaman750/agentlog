-- Update GitHub App API key with correct PEM key
-- First, let's see what GitHub keys exist
SELECT id, service_name, auth_mode, created_at, 
       SUBSTRING(encrypted_key_value, 1, 50) as key_preview
FROM user_api_keys 
WHERE service_name = 'github' 
ORDER BY created_at DESC;

-- Update the GitHub App key with the correct PEM key
-- Replace 'YOUR_KEY_ID_HERE' with the actual key ID from the query above
-- UPDATE user_api_keys 
-- SET encrypted_key_value = 'YOUR_ENCRYPTED_PEM_KEY_HERE'
-- WHERE id = 'YOUR_KEY_ID_HERE' AND service_name = 'github' AND auth_mode = 'github_app';
