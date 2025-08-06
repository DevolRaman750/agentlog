-- Revert function description improvements back to original state

-- Revert github_analyze_repository description
UPDATE function_definitions 
SET description = 'Perform comprehensive analysis of a GitHub repository including metadata, statistics, languages used, and overall project insights. Use this first to understand a repository before diving into specific files or issues.'
WHERE name = 'github_analyze_repository' AND user_id = 'system';

-- Revert github_read_code description
UPDATE function_definitions
SET description = 'Read files and directory contents from a GitHub repository. This function retrieves file content, directory listings, or repository structure information from specified paths.'
WHERE name = 'github_read_code' AND user_id = 'system';

-- Revert github_read_issues description
UPDATE function_definitions
SET description = 'Read issues from a GitHub repository with filtering options like state, labels, assignees, and more.'
WHERE name = 'github_read_issues' AND user_id = 'system';

-- Revert Software Engineer template system prompt to original
UPDATE execution_templates
SET template_prompt = 'As an experienced Software Engineer, help with the Add comment to issue  for the imran31415/agentlog repository. I will analyze the codebase structure, create branches, commit changes, and manage the entire development workflow. My goal is to Look up issue https://github.com/imran31415/agentlog/issues/12 and any comments.  Based on that look into the code in detail and determine the best implementation path.  add a comment to the issue with this information.    while following best practices for code quality, testing, and documentation.'
WHERE id = 'system-template-software-engineer'; 