-- Revert GitHub function descriptions back to original state

-- Revert github_read_code function description and parameters
UPDATE function_definitions 
SET 
    description = 'Read files and directory contents from a GitHub repository to analyze code structure and implementation',
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'path', JSON_OBJECT('type', 'string', 'description', 'File or directory path (optional, defaults to root)', 'default', ''),
            'ref', JSON_OBJECT('type', 'string', 'description', 'Branch, tag, or commit SHA (optional, defaults to default branch)', 'default', 'main')
        ),
        'required', JSON_ARRAY('owner', 'repo')
    ),
    updated_at = NOW()
WHERE name = 'github_read_code';

-- Revert github_read_issues function description and parameters
UPDATE function_definitions 
SET 
    description = 'Read issues from a GitHub repository to analyze bugs, feature requests, and development tasks',
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'state', JSON_OBJECT('type', 'string', 'description', 'Issue state filter', 'enum', JSON_ARRAY('open', 'closed', 'all'), 'default', 'open'),
            'labels', JSON_OBJECT('type', 'string', 'description', 'Comma-separated list of label names to filter by (optional)'),
            'assignee', JSON_OBJECT('type', 'string', 'description', 'Username to filter issues assigned to (optional)'),
            'creator', JSON_OBJECT('type', 'string', 'description', 'Username to filter issues created by (optional)'),
            'sort', JSON_OBJECT('type', 'string', 'description', 'Sort criteria', 'enum', JSON_ARRAY('created', 'updated', 'comments'), 'default', 'created'),
            'direction', JSON_OBJECT('type', 'string', 'description', 'Sort direction', 'enum', JSON_ARRAY('asc', 'desc'), 'default', 'desc'),
            'per_page', JSON_OBJECT('type', 'integer', 'description', 'Number of results per page (max 100)', 'minimum', 1, 'maximum', 100, 'default', 30)
        ),
        'required', JSON_ARRAY('owner', 'repo')
    ),
    updated_at = NOW()
WHERE name = 'github_read_issues';

-- Revert github_analyze_repository function description and parameters
UPDATE function_definitions 
SET 
    description = 'Perform comprehensive analysis of a GitHub repository including code structure, dependencies, and insights',
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'analysis_depth', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('basic', 'detailed', 'comprehensive'), 'default', 'basic', 'description', 'Level of analysis depth'),
            'include_dependencies', JSON_OBJECT('type', 'boolean', 'default', true, 'description', 'Whether to analyze dependencies'),
            'include_readme', JSON_OBJECT('type', 'boolean', 'default', true, 'description', 'Whether to include README analysis'),
            'max_files', JSON_OBJECT('type', 'integer', 'minimum', 10, 'maximum', 200, 'default', 50, 'description', 'Maximum number of files to analyze')
        ),
        'required', JSON_ARRAY('owner', 'repo')
    ),
    updated_at = NOW()
WHERE name = 'github_analyze_repository'; 