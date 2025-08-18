-- Revert Migration 000022: Fix GitHub Function Types

-- Revert all GitHub functions back to their original types
UPDATE function_definitions SET 
    function_type = 'github',
    http_method = 'GET'
WHERE name IN ('github_read_issues', 'github_read_code', 'github_search_code', 'github_create_branch', 'github_commit_file', 'github_create_pull_request', 'github_create_update_file') 
AND user_id = 'system';