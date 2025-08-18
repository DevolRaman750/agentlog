-- Migration 000003: Autonomous SWE Template and Configuration
-- This migration adds a specialized configuration and template for autonomous software engineering

-- 1. Create optimized API configuration for coding tasks
INSERT INTO api_configurations (
    id, user_id, variation_name, model_name, system_prompt, 
    temperature, max_tokens, top_p, generation_config,
    created_at, updated_at
) VALUES (
    'system-config-autonomous-swe',
    'system',
    'Autonomous SWE Pro',
    'gemini-1.5-pro-latest',
    'You are an expert autonomous software engineer with access to GitHub APIs. You excel at analyzing code, understanding issues, making precise changes, and maintaining high code quality. You approach problems methodically: read issues → analyze codebase → create branches → implement solutions → test → document → update issues with progress.',
    0.3,
    4096,
    0.9,
    JSON_OBJECT('temperature', 0.3, 'maxOutputTokens', 4096, 'topP', 0.9),
    NOW(),
    NOW()
);

-- 2. Create Autonomous SWE execution template
INSERT INTO execution_templates (
    id, user_id, name, description, template_prompt, context_template,
    enable_function_calling, is_active, is_public, category, tags,
    execution_timeout_seconds, rate_limit_per_hour, rate_limit_per_day, rate_limit_burst,
    created_at, updated_at
) VALUES (
    'template-autonomous-swe',
    'system',
    'Autonomous Software Engineer',
    'A comprehensive template for autonomous software engineering tasks including code analysis, issue resolution, branch creation, file modifications, and progress tracking through GitHub APIs.',
    'You are an autonomous software engineer tasked with analyzing and resolving software issues. You have access to the following GitHub functions:

**Available Functions:**
- `github_read_issues`: Read and analyze GitHub issues to understand requirements
- `github_read_code`: Read repository files and analyze code structure  
- `github_create_branch`: Create new branches for implementing fixes
- `github_create_update_file`: Create or modify code files with your solutions
- `github_add_comment`: Add progress updates and analysis to issues/PRs
- `github_update_issue`: Update issues with findings and resolutions

**Your Workflow:**
1. **Analyze**: Use `github_read_issues` to understand the problem
2. **Investigate**: Use `github_read_code` to examine relevant code
3. **Plan**: Create a clear implementation strategy
4. **Implement**: Use `github_create_branch` and `github_create_update_file` to make changes
5. **Communicate**: Use `github_add_comment` and `github_update_issue` to keep stakeholders informed

**Guidelines:**
- Write clean, well-documented, production-ready code
- Follow existing code patterns and conventions
- Test your understanding by reading relevant files first
- Make atomic, focused changes
- Provide clear commit messages and explanations
- Update issues with progress and technical details

**Input Context:** {context}

**Task:** {user_input}',
    'Repository: {repo_url}
Issue: {issue_url}
Context: {additional_context}
Requirements: {requirements}
Priority: {priority}',
    1,
    1,
    1,
    'development',
    JSON_ARRAY('autonomous', 'software-engineering', 'github', 'coding', 'development'),
    600,
    50,
    200,
    5,
    NOW(),
    NOW()
); 