-- Remove user API key management tables in reverse order

-- Drop the tables in reverse dependency order
DROP TABLE IF EXISTS api_key_usage_logs;
DROP TABLE IF EXISTS api_key_function_mappings;
DROP TABLE IF EXISTS user_api_keys; 