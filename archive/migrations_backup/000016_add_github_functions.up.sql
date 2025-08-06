-- Insert GitHub Repo Info system function
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
    query_template,
    result_transformer,
    fallback_data
) VALUES (
    'func-github-repo-info',
    'system',
    'github_repo_info',
    'GitHub Repo Info',
    'github',
    'Fetch metadata about a public GitHub repository such as stars, forks and description',
    JSON_OBJECT(
        'type','object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type','string','description','GitHub username or organization'),
            'repo',  JSON_OBJECT('type','string','description','Repository name')
        ),
        'required', JSON_ARRAY('owner','repo')
    ),
    JSON_OBJECT(),
    'https://api.github.com/repos/{owner}/{repo}',
    'GET',
    JSON_OBJECT('Accept','application/vnd.github+json'),
    JSON_OBJECT(),
    TRUE,
    NULL,
    'default',
    JSON_OBJECT()
); 