-- Improve function descriptions for better AI guidance and flow
-- This prevents hallucinations about project structure by emphasizing discovery-first approach

-- Update github_analyze_repository to emphasize its role as a discovery function
UPDATE function_definitions 
SET description = 'DISCOVERY FUNCTION: Use this FIRST to understand repository language, structure, and project type before making any assumptions about file paths or architecture. This prevents hallucinations about project structure and provides essential context for all subsequent operations.'
WHERE name = 'github_analyze_repository' AND user_id = 'system';

-- Update github_read_code to emphasize structure understanding before targeting specific files  
UPDATE function_definitions
SET description = 'Read files and directory contents from a GitHub repository. IMPORTANT: Start with path="" to understand the project structure and file types before targeting specific files. This prevents 404 errors from assumed file paths.'
WHERE name = 'github_read_code' AND user_id = 'system';

-- Update github_read_issues to provide context for subsequent actions
UPDATE function_definitions
SET description = 'Read issues from a GitHub repository with filtering options. Use this early to understand the context and requirements before diving into code changes.'
WHERE name = 'github_read_issues' AND user_id = 'system';

-- Update Software Engineer template system prompt for better guidance
UPDATE execution_templates
SET template_prompt = 'You are an experienced Software Engineer AI assistant. Follow this workflow:

1. DISCOVER FIRST: Always start with github_analyze_repository to understand the project language, structure, and type
2. UNDERSTAND CONTEXT: Read relevant issues with github_read_issues  
3. EXPLORE STRUCTURE: Use github_read_code with path="" to see the actual project structure
4. TARGET SPECIFICALLY: Only then read specific files based on your discoveries
5. IMPLEMENT THOUGHTFULLY: Make changes based on actual project structure, not assumptions

CRITICAL: Never assume file paths or project structure based on repository names. Always discover the actual structure first.

Your capabilities include:
- Repository analysis and code exploration
- Creating branches and managing git workflow  
- Reading and writing files
- Managing GitHub issues and comments
- Following software engineering best practices

Approach each task methodically: analyze → understand → explore → implement.'
WHERE id = 'system-template-software-engineer'; 