-- Migration 000002: Essential System Data
-- This migration adds essential system functions and configurations

-- 1. Create system user for system functions and configurations
INSERT INTO users (
    id, email, first_name, last_name, hashed_password, created_at, updated_at
) VALUES (
    'system',
    'system@gogent.local',
    'System',
    'User',
    '$2a$10$dummy.hash.for.system.user.no.login.allowed',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 2. Add essential GitHub functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, description, 
    parameters_schema, mock_response, endpoint_url, http_method, 
    headers, auth_config, is_active, is_system_resource, 
    required_api_keys, api_key_validation, fallback_data, 
    created_at, updated_at
) VALUES 
-- GitHub Read Code Function
(
    'func-github-read-code',
    'system',
    'github_read_code',
    'GitHub Read Code',
    'github',
    'Read files and directory contents from a GitHub repository to analyze code structure and implementation',
    JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'path', JSON_OBJECT('type', 'string', 'description', 'File or directory path (optional, defaults to root)', 'default', ''),
            'ref', JSON_OBJECT('type', 'string', 'description', 'Branch, tag, or commit SHA (optional, defaults to default branch)', 'default', 'main')
        )
    ),
    JSON_OBJECT(
        'type', 'file',
        'name', 'README.md',
        'path', 'README.md',
        'content', 'IyBTYW1wbGUgUmVhZG1l',
        'encoding', 'base64',
        'size', 1024,
        'sha', 'abc123',
        '_metadata', JSON_OBJECT('source', 'mock')
    ),
    'https://api.github.com/repos/{owner}/{repo}/contents/{path}',
    'GET',
    JSON_OBJECT('Accept', 'application/vnd.github.v3+json', 'User-Agent', 'GoGent-App'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('githubApiKey'),
    JSON_OBJECT('githubApiKey', JSON_OBJECT('required', true, 'description', 'GitHub API token')),
    JSON_OBJECT(
        'type', 'file',
        'name', 'README.md',
        'path', 'README.md',
        'content', 'IyBTYW1wbGUgUmVhZG1l',
        'encoding', 'base64',
        'size', 1024,
        'sha', 'abc123',
        '_metadata', JSON_OBJECT('source', 'fallback', 'error', 'GitHub API unavailable')
    ),
    NOW(),
    NOW()
),
-- GitHub Read Issues Function
(
    'func-github-read-issues',
    'system',
    'github_read_issues',
    'GitHub Read Issues',
    'github',
    'Read and analyze issues from a GitHub repository',
    JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('owner', 'repo'),
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'state', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('open', 'closed', 'all'), 'default', 'open'),
            'per_page', JSON_OBJECT('type', 'integer', 'default', 30, 'minimum', 1, 'maximum', 100)
        )
    ),
    JSON_OBJECT(
        'issues', JSON_ARRAY(JSON_OBJECT(
            'id', 1,
            'number', 1,
            'title', 'Sample Issue',
            'body', 'This is a sample issue',
            'state', 'open',
            'user', JSON_OBJECT('login', 'sample-user'),
            'created_at', '2023-01-01T00:00:00Z'
        )),
        'status', 'success',
        'total_count', 1
    ),
    'https://api.github.com/repos/{owner}/{repo}/issues',
    'GET',
    JSON_OBJECT('Accept', 'application/vnd.github+json', 'User-Agent', 'GoGent-App'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('githubApiKey'),
    JSON_OBJECT('githubApiKey', JSON_OBJECT('required', true, 'description', 'GitHub API token')),
    JSON_OBJECT(
        'issues', JSON_ARRAY(JSON_OBJECT(
            'id', 0,
            'number', 0,
            'title', 'Unable to fetch issues - GitHub API unavailable',
            'body', 'GitHub API is currently unavailable. This is mock fallback data.',
            'state', 'open'
        )),
        'status', 'fallback',
        'total_count', 0
    ),
    NOW(),
    NOW()
),
-- OpenWeather Function
(
    'func-openweather-current',
    'system',
    'get_current_weather',
    'Get Current Weather',
    'weather',
    'Get current weather information for a specific location using OpenWeather API',
    JSON_OBJECT(
        'type', 'object',
        'required', JSON_ARRAY('location'),
        'properties', JSON_OBJECT(
            'location', JSON_OBJECT(
                'type', 'string',
                'description', 'City name, state code (US only), and country code (ISO 3166) separated by comma'
            ),
            'units', JSON_OBJECT(
                'type', 'string',
                'enum', JSON_ARRAY('metric', 'imperial', 'kelvin'),
                'description', 'Units of measurement'
            )
        )
    ),
    JSON_OBJECT(
        'coord', JSON_OBJECT('lon', -122.08, 'lat', 37.39),
        'weather', JSON_ARRAY(JSON_OBJECT(
            'id', 800,
            'main', 'Clear',
            'description', 'clear sky',
            'icon', '01d'
        )),
        'main', JSON_OBJECT(
            'temp', 282.55,
            'feels_like', 281.86,
            'humidity', 100,
            'pressure', 1023
        ),
        'name', 'Mountain View',
        'cod', 200
    ),
    'https://api.openweathermap.org/data/2.5/weather',
    'GET',
    JSON_OBJECT('Accept', 'application/json'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('openWeatherApiKey'),
    JSON_OBJECT('openWeatherApiKey', JSON_OBJECT('required', true, 'description', 'OpenWeather API key from openweathermap.org')),
    JSON_OBJECT(
        'coord', JSON_OBJECT('lon', -122.08, 'lat', 37.39),
        'weather', JSON_ARRAY(JSON_OBJECT(
            'id', 800,
            'main', 'Clear',
            'description', 'clear sky',
            'icon', '01d'
        )),
        'main', JSON_OBJECT(
            'temp', 282.55,
            'feels_like', 281.86,
            'humidity', 100,
            'pressure', 1023
        ),
        'name', 'Mountain View',
        'cod', 200,
        '_metadata', JSON_OBJECT(
            'error', 'OpenWeather API unavailable, showing mock data',
            'source', 'fallback'
        )
    ),
    NOW(),
    NOW()
);

-- 3. Add essential API configurations
INSERT INTO api_configurations (
    id, user_id, variation_name, model_name, system_prompt, 
    temperature, max_tokens, top_p, generation_config, is_system_resource,
    created_at, updated_at
) VALUES 
(
    'system-config-gemini-pro', 
    'system', 
    'Gemini Pro Default', 
    'gemini-1.5-pro-latest', 
    'You are a helpful AI assistant that provides accurate and concise responses.',
    0.7,
    2048,
    0.8,
    JSON_OBJECT('temperature', 0.7, 'maxOutputTokens', 2048, 'topP', 0.8),
    true,
    NOW(),
    NOW()
),
(
    'system-config-gemini-flash', 
    'system', 
    'Gemini Flash Default', 
    'gemini-1.5-flash-latest', 
    'You are a helpful AI assistant optimized for quick responses.',
    0.5,
    1024,
    0.9,
    JSON_OBJECT('temperature', 0.5, 'maxOutputTokens', 1024, 'topP', 0.9),
    true,
    NOW(),
    NOW()
); 