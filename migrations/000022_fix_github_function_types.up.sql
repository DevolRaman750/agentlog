-- Migration 000022: Fix GitHub Function Types
-- This migration fixes the function_type and http_method for GitHub functions to ensure proper routing

-- Update GitHub Read functions to be API type instead of MCP
UPDATE function_definitions SET 
    function_type = 'api',
    http_method = 'GET'
WHERE name IN ('github_read_issues', 'github_read_code', 'github_search_code') 
AND user_id = 'system';

-- Update GitHub write operations to be MCP type
UPDATE function_definitions SET 
    function_type = 'mcp',
    http_method = 'MCP'
WHERE name IN ('github_create_branch', 'github_commit_file', 'github_create_pull_request', 'github_create_update_file') 
AND user_id = 'system';

-- Ensure endpoints are properly set for API functions
UPDATE function_definitions SET 
    endpoint_url = 'https://api.github.com/repos/{owner}/{repo}/issues'
WHERE name = 'github_read_issues' AND user_id = 'system';

UPDATE function_definitions SET 
    endpoint_url = 'https://api.github.com/repos/{owner}/{repo}/contents/{path}'
WHERE name = 'github_read_code' AND user_id = 'system';

UPDATE function_definitions SET 
    endpoint_url = 'https://api.github.com/search/code'
WHERE name = 'github_search_code' AND user_id = 'system';