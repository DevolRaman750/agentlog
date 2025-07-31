-- Improve GitHub function descriptions and parameters for better AI model discoverability

-- Update github_read_code function with better description and examples
UPDATE function_definitions 
SET 
    description = 'Read files and directory contents from a GitHub repository. Use this to access README files, source code, configuration files, or explore directory structures. Supports any public repository and specific file paths.',
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string', 
                'description', 'GitHub username or organization name (e.g., "microsoft", "facebook", "google")'
            ),
            'repo', JSON_OBJECT(
                'type', 'string', 
                'description', 'Repository name (e.g., "vscode", "react", "tensorflow")'
            ),
            'path', JSON_OBJECT(
                'type', 'string', 
                'description', 'File or directory path within the repo. Examples: "README.md", "src/main.js", "docs/", "" (empty for root directory). Default is root.',
                'default', ''
            ),
            'ref', JSON_OBJECT(
                'type', 'string', 
                'description', 'Branch, tag, or commit SHA. Examples: "main", "develop", "v1.0.0". Default is the default branch.',
                'default', 'main'
            )
        ),
        'required', JSON_ARRAY('owner', 'repo'),
        'examples', JSON_ARRAY(
            JSON_OBJECT('owner', 'microsoft', 'repo', 'vscode', 'path', 'README.md'),
            JSON_OBJECT('owner', 'facebook', 'repo', 'react', 'path', 'src/'),
            JSON_OBJECT('owner', 'imran31415', 'repo', 'agentlog', 'path', '')
        )
    ),
    updated_at = NOW()
WHERE name = 'github_read_code';

-- Update github_read_issues function with better description and examples
UPDATE function_definitions 
SET 
    description = 'Read and analyze issues from a GitHub repository. Use this to understand bugs, feature requests, development tasks, and project status. Great for getting insights into project challenges and roadmaps.',
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string', 
                'description', 'GitHub username or organization name (e.g., "microsoft", "facebook", "google")'
            ),
            'repo', JSON_OBJECT(
                'type', 'string', 
                'description', 'Repository name (e.g., "vscode", "react", "tensorflow")'
            ),
            'state', JSON_OBJECT(
                'type', 'string', 
                'description', 'Filter by issue state: "open" (active issues), "closed" (resolved issues), "all" (everything)',
                'enum', JSON_ARRAY('open', 'closed', 'all'), 
                'default', 'open'
            ),
            'labels', JSON_OBJECT(
                'type', 'string', 
                'description', 'Filter by labels (comma-separated). Examples: "bug", "enhancement", "bug,help-wanted"'
            ),
            'assignee', JSON_OBJECT(
                'type', 'string', 
                'description', 'Filter issues assigned to a specific user (username)'
            ),
            'creator', JSON_OBJECT(
                'type', 'string', 
                'description', 'Filter issues created by a specific user (username)'
            ),
            'sort', JSON_OBJECT(
                'type', 'string', 
                'description', 'Sort criteria: "created" (newest first), "updated" (recently modified), "comments" (most discussed)',
                'enum', JSON_ARRAY('created', 'updated', 'comments'), 
                'default', 'created'
            ),
            'direction', JSON_OBJECT(
                'type', 'string', 
                'description', 'Sort direction: "desc" (newest/highest first), "asc" (oldest/lowest first)',
                'enum', JSON_ARRAY('asc', 'desc'), 
                'default', 'desc'
            ),
            'per_page', JSON_OBJECT(
                'type', 'integer', 
                'description', 'Number of issues to return (1-100). Default 30 is usually good for analysis.',
                'minimum', 1, 
                'maximum', 100, 
                'default', 30
            )
        ),
        'required', JSON_ARRAY('owner', 'repo'),
        'examples', JSON_ARRAY(
            JSON_OBJECT('owner', 'microsoft', 'repo', 'vscode', 'state', 'open', 'per_page', 10),
            JSON_OBJECT('owner', 'facebook', 'repo', 'react', 'labels', 'bug', 'state', 'open'),
            JSON_OBJECT('owner', 'imran31415', 'repo', 'agentlog', 'state', 'all')
        )
    ),
    updated_at = NOW()
WHERE name = 'github_read_issues';

-- Update github_analyze_repository function with better description
UPDATE function_definitions 
SET 
    description = 'Perform comprehensive analysis of a GitHub repository including metadata, statistics, languages used, and overall project insights. Use this first to understand a repository before diving into specific files or issues.',
    parameters_schema = JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string', 
                'description', 'GitHub username or organization name (e.g., "microsoft", "facebook", "google")'
            ),
            'repo', JSON_OBJECT(
                'type', 'string', 
                'description', 'Repository name (e.g., "vscode", "react", "tensorflow")'
            ),
            'analysis_depth', JSON_OBJECT(
                'type', 'string', 
                'description', 'Level of analysis: "basic" (quick overview), "detailed" (thorough analysis), "comprehensive" (full deep-dive)',
                'enum', JSON_ARRAY('basic', 'detailed', 'comprehensive'), 
                'default', 'basic'
            ),
            'include_dependencies', JSON_OBJECT(
                'type', 'boolean', 
                'description', 'Whether to analyze project dependencies and package files',
                'default', true
            ),
            'include_readme', JSON_OBJECT(
                'type', 'boolean', 
                'description', 'Whether to include README analysis in the results',
                'default', true
            ),
            'max_files', JSON_OBJECT(
                'type', 'integer', 
                'description', 'Maximum number of files to analyze for code structure insights',
                'minimum', 10, 
                'maximum', 200, 
                'default', 50
            )
        ),
        'required', JSON_ARRAY('owner', 'repo'),
        'examples', JSON_ARRAY(
            JSON_OBJECT('owner', 'microsoft', 'repo', 'vscode', 'analysis_depth', 'basic'),
            JSON_OBJECT('owner', 'facebook', 'repo', 'react', 'analysis_depth', 'detailed'),
            JSON_OBJECT('owner', 'imran31415', 'repo', 'agentlog', 'analysis_depth', 'comprehensive')
        )
    ),
    updated_at = NOW()
WHERE name = 'github_analyze_repository'; 