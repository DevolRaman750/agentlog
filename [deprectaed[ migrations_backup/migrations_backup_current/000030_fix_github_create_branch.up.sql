-- Fix github_create_branch function to properly handle branch name to SHA resolution
-- This enables both HTTP and MCP versions of branch creation to work correctly

-- Update github_create_branch to use the GitHub refs API correctly
-- Change the query template to handle automatic branch resolution
UPDATE function_definitions 
SET 
    query_template = '{"ref": "refs/heads/{{branch_name}}", "sha": "{{resolved_sha}}"}',
    description = 'Create a new branch in a GitHub repository from an existing branch, tag, or commit. The system automatically resolves the source branch to get the required SHA for GitHub API compatibility.'
WHERE name = 'github_create_branch' AND user_id = 'system';

-- Note: SHA resolution is now handled in the HTTP execution logic, not via result transformer

-- Update mcp_github_operations description to emphasize it as the recommended method
UPDATE function_definitions
SET description = '⚙️ RECOMMENDED WORKFLOW: Advanced GitHub operations via MCP server including branch creation, file commits, and pull request generation. Enables complete software development workflows. This is the PREFERRED method for branch creation as it handles all complexity automatically. Use this for multi-step development operations after thorough analysis and planning.'
WHERE name = 'mcp_github_operations' AND user_id = 'system'; 