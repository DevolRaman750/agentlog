-- Migration 000024 Down: Remove MySQL Data Reader and MCP GitHub Operations Functions

-- Remove GitHub File Manager Function
DELETE FROM function_definitions 
WHERE id = 'func-github-file-manager' 
AND user_id = 'system' 
AND name = 'github_file_manager';

-- Remove MCP GitHub Operations Function
DELETE FROM function_definitions 
WHERE id = 'func-mcp-github-ops' 
AND user_id = 'system' 
AND name = 'mcp_github_operations';

-- Remove MySQL Data Reader Function
DELETE FROM function_definitions 
WHERE id = 'func-mysql-data-reader' 
AND user_id = 'system' 
AND name = 'mysql_query_data'; 