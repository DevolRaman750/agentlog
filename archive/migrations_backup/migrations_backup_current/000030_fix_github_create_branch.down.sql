-- Revert github_create_branch function fixes back to original state

-- Revert github_create_branch query template to original broken state
UPDATE function_definitions 
SET 
    query_template = '{"ref": "refs/heads/{{branch_name}}", "sha": "{{source_sha}}"}',
    description = 'Create a new branch in a GitHub repository from an existing branch, tag, or commit'
WHERE name = 'github_create_branch' AND user_id = 'system';

-- Note: No result transformer changes to revert

-- Revert mcp_github_operations description
UPDATE function_definitions
SET description = '⚙️ WORKFLOW OPERATIONS: Advanced GitHub operations via MCP server including branch creation, file commits, and pull request generation. Enables complete software development workflows. Use this for multi-step development operations after thorough analysis and planning. Ideal for implementing changes based on your discoveries.'
WHERE name = 'mcp_github_operations' AND user_id = 'system'; 