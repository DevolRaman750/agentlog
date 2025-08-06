-- Add GitHub Repository Analysis function to demonstrate comprehensive analysis workflow

INSERT INTO function_definitions (
    id,
    user_id,
    name,
    display_name,
    function_group,
    description,
    parameters_schema,
    mock_response,
    endpoint_url,
    http_method,
    headers,
    auth_config,
    is_active,
    is_system_resource,
    required_api_keys,
    api_key_validation,
    query_template,
    result_transformer,
    fallback_data,
    created_at,
    updated_at
) VALUES (
    'func-github-analyze-repo',
    'system',
    'github_analyze_repository',
    'GitHub Analyze Repository',
    'github',
    'Comprehensive repository analysis that combines repository metadata, issues, and key files. This function provides a structured overview to help understand a repository before diving into specific files or issues. Use this as a starting point for repository analysis.',
    JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT(
                'type', 'string',
                'description', 'GitHub username or organization name'
            ),
            'repo', JSON_OBJECT(
                'type', 'string',
                'description', 'Repository name'
            ),
            'include_issues', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Whether to include recent issues in the analysis',
                'default', true
            ),
            'include_structure', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Whether to include repository file structure',
                'default', true
            )
        )
    ),
    JSON_OBJECT(
        'repository_info', JSON_OBJECT(
            'name', 'example-repo',
            'full_name', 'owner/example-repo',
            'description', 'An example repository for demonstration',
            'language', 'Python',
            'stargazers_count', 42,
            'forks_count', 12,
            'open_issues', 3
        ),
        'recent_issues', JSON_ARRAY(
            JSON_OBJECT(
                'number', 123,
                'title', 'Bug in authentication system',
                'state', 'open',
                'labels', JSON_ARRAY('bug', 'authentication')
            )
        ),
        'file_structure', JSON_ARRAY(
            JSON_OBJECT(
                'name', 'README.md',
                'type', 'file',
                'path', 'README.md'
            ),
            JSON_OBJECT(
                'name', 'src',
                'type', 'dir',
                'path', 'src'
            )
        ),
        'analysis_notes', 'This repository appears to be a Python project with an authentication system. There are open issues related to bugs that may need attention.'
    ),
    'https://api.github.com/repos/{owner}/{repo}',
    'GET',
    JSON_OBJECT(
        'Accept', 'application/vnd.github.v3+json',
        'User-Agent', 'GoGent-Analysis-Bot'
    ),
    JSON_OBJECT(
        'type', 'github_token',
        'header_name', 'Authorization',
        'header_prefix', 'token '
    ),
    true,
    true,
    JSON_ARRAY('github'),
    JSON_OBJECT(
        'github', JSON_OBJECT(
            'required', true,
            'description', 'GitHub API token for accessing repository data'
        )
    ),
    NULL,
    'github_repository_analysis',
    JSON_OBJECT(
        'overview', 'Provides structured analysis combining repository metadata, issues, and file structure',
        'workflow_guidance', 'Use this function first to understand a repository, then use github_read_code for specific files or github_read_issues for detailed issue analysis'
    ),
    NOW(),
    NOW()
); 