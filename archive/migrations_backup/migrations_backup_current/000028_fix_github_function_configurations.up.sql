-- Fix GitHub function configurations that are missing proper endpoints and request bodies

-- Fix github_add_comment - ensure it has proper request body template
UPDATE function_definitions 
SET query_template = '{"body": "{{body}}"}'
WHERE name = 'github_add_comment' AND (query_template IS NULL OR query_template = '');

-- Fix github_update_issue - add proper request body template for PATCH requests
UPDATE function_definitions 
SET query_template = '{"title": "{{title}}", "body": "{{body}}", "state": "{{state}}", "labels": {{labels}}, "assignees": {{assignees}}, "milestone": {{milestone}}}'
WHERE name = 'github_update_issue' AND (query_template IS NULL OR query_template = '');

-- Fix github_create_branch - add endpoint and request body
UPDATE function_definitions 
SET 
  endpoint_url = 'https://api.github.com/repos/{owner}/{repo}/git/refs',
  query_template = '{"ref": "refs/heads/{{branch_name}}", "sha": "{{source_sha}}"}'
WHERE name = 'github_create_branch' AND (endpoint_url IS NULL OR endpoint_url = '');

-- Fix github_create_update_file - add endpoint and request body  
UPDATE function_definitions 
SET 
  endpoint_url = 'https://api.github.com/repos/{owner}/{repo}/contents/{path}',
  http_method = 'PUT',
  query_template = '{"message": "{{message}}", "content": "{{content_base64}}", "branch": "{{branch}}", "sha": "{{sha}}", "committer": {{committer}}}'
WHERE name = 'github_create_update_file' AND (endpoint_url IS NULL OR endpoint_url = '');

-- Fix github_file_manager - ensure it has proper endpoint and method
UPDATE function_definitions 
SET 
  endpoint_url = 'https://api.github.com/repos/{owner}/{repo}/contents/{path}',
  http_method = 'GET'
WHERE name = 'github_file_manager' AND (endpoint_url IS NULL OR endpoint_url = '');

-- Note: MCP functions (mcp_github_operations, mysql_query_data) use different execution paths
-- and don't need HTTP endpoint configurations - they communicate with MCP server directly 