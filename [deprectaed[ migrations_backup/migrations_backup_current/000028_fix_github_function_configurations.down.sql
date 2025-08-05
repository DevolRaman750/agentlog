-- Reverse the GitHub function configuration fixes

-- Revert github_add_comment
UPDATE function_definitions 
SET query_template = NULL
WHERE name = 'github_add_comment';

-- Revert github_update_issue  
UPDATE function_definitions 
SET query_template = NULL
WHERE name = 'github_update_issue';

-- Revert github_create_branch
UPDATE function_definitions 
SET 
  endpoint_url = NULL,
  query_template = NULL
WHERE name = 'github_create_branch';

-- Revert github_create_update_file
UPDATE function_definitions 
SET 
  endpoint_url = NULL,
  http_method = 'GET',
  query_template = NULL
WHERE name = 'github_create_update_file';

-- Revert github_file_manager
UPDATE function_definitions 
SET 
  endpoint_url = NULL,
  http_method = 'GET'
WHERE name = 'github_file_manager'; 