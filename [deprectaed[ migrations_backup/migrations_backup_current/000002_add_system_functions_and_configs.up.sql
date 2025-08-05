-- Add system functions and configurations that are essential for the application

-- 1. Add OpenWeather API function
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
    'func-openweather-current',
    'system',
    'get_current_weather',
    'Get Current Weather',
    'weather',
    'Get current weather information for a specific location using OpenWeather API',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'location', JSON_OBJECT(
                'type', 'string',
                'description', 'City name, state code (US only), and country code (ISO 3166) separated by comma. Format: "City,State,Country" or "City,Country"'
            ),
            'units', JSON_OBJECT(
                'type', 'string',
                'enum', JSON_ARRAY('metric', 'imperial', 'kelvin'),
                'description', 'Units of measurement. metric: Celsius, imperial: Fahrenheit, kelvin: Kelvin'
            ),
            'lang', JSON_OBJECT(
                'type', 'string',
                'description', 'Language code for weather description (e.g., en, es, fr)'
            )
        ),
        'required', JSON_ARRAY('location')
    ),
    JSON_OBJECT(
        'coord', JSON_OBJECT('lon', -122.08, 'lat', 37.39),
        'weather', JSON_ARRAY(JSON_OBJECT(
            'id', 800,
            'main', 'Clear',
            'description', 'clear sky',
            'icon', '01d'
        )),
        'base', 'stations',
        'main', JSON_OBJECT(
            'temp', 282.55,
            'feels_like', 281.86,
            'temp_min', 280.37,
            'temp_max', 284.26,
            'pressure', 1023,
            'humidity', 100
        ),
        'visibility', 10000,
        'wind', JSON_OBJECT('speed', 1.5, 'deg', 350),
        'clouds', JSON_OBJECT('all', 1),
        'dt', 1560350645,
        'sys', JSON_OBJECT(
            'type', 1,
            'id', 5122,
            'country', 'US',
            'sunrise', 1560343627,
            'sunset', 1560396563
        ),
        'timezone', -25200,
        'id', 420006353,
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
    NULL,
    'default',
    JSON_OBJECT(
        'coord', JSON_OBJECT('lon', -122.08, 'lat', 37.39),
        'weather', JSON_ARRAY(JSON_OBJECT(
            'id', 800,
            'main', 'Clear',
            'description', 'clear sky',
            'icon', '01d'
        )),
        'base', 'stations',
        'main', JSON_OBJECT(
            'temp', 282.55,
            'feels_like', 281.86,
            'temp_min', 280.37,
            'temp_max', 284.26,
            'pressure', 1023,
            'humidity', 100
        ),
        'visibility', 10000,
        'wind', JSON_OBJECT('speed', 1.5, 'deg', 350),
        'clouds', JSON_OBJECT('all', 1),
        'dt', 1560350645,
        'sys', JSON_OBJECT(
            'type', 1,
            'id', 5122,
            'country', 'US',
            'sunrise', 1560343627,
            'sunset', 1560396563
        ),
        'timezone', -25200,
        'id', 420006353,
        'name', 'Mountain View',
        'cod', 200,
        '_metadata', JSON_OBJECT(
            'error', 'OpenWeather API unavailable, showing mock data for Mountain View, CA',
            'source', 'fallback'
        )
    ),
    NOW(),
    NOW()
);

-- 2. Add Neo4j node lookup function
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
    fallback_data,
    created_at,
    updated_at
) VALUES (
    'func-neo4j-lookup',
    'system',
    'neo4j_node_lookup',
    'Neo4j Node Lookup',
    'database',
    'Look up nodes in a Neo4j graph database by label and properties',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'node_label', JSON_OBJECT(
                'type', 'string',
                'description', 'The node label to search for (e.g., Person, Company, Product)'
            ),
            'properties', JSON_OBJECT(
                'type', 'object',
                'description', 'Key-value pairs to match against node properties'
            ),
            'limit', JSON_OBJECT(
                'type', 'integer',
                'description', 'Maximum number of nodes to return',
                'minimum', 1,
                'maximum', 100,
                'default', 25
            )
        ),
        'required', JSON_ARRAY('node_label')
    ),
    JSON_OBJECT(
        'nodes', JSON_ARRAY(JSON_OBJECT(
            'id', 'mock_node_1',
            'labels', JSON_ARRAY('MockNode'),
            'properties', JSON_OBJECT(
                'name', 'Sample Node',
                'category', 'Mock Data'
            )
        )),
        'summary', JSON_OBJECT(
            'totalNodes', 1,
            'executionTime', '0ms',
            'source', 'mock'
        )
    ),
    'neo4j://localhost:7687',
    'CYPHER',
    JSON_OBJECT('Content-Type', 'application/json', 'Accept', 'application/json'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('neo4jUrl', 'neo4jUsername', 'neo4jPassword'),
    JSON_OBJECT(
        'neo4jUrl', JSON_OBJECT('required', true, 'description', 'Neo4j database URL'),
        'neo4jUsername', JSON_OBJECT('required', true, 'description', 'Neo4j username'),
        'neo4jPassword', JSON_OBJECT('required', true, 'description', 'Neo4j password')
    ),
    JSON_OBJECT(
        'nodes', JSON_ARRAY(JSON_OBJECT(
            'id', 'mock_node_1',
            'labels', JSON_ARRAY('MockNode'),
            'properties', JSON_OBJECT(
                'name', 'Sample Node',
                'category', 'Mock Data'
            )
        )),
        'summary', JSON_OBJECT(
            'totalNodes', 1,
            'executionTime', '0ms',
            'source', 'fallback'
        )
    ),
    NOW(),
    NOW()
);

-- 3. Add GitHub Read Code function
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
    fallback_data,
    created_at,
    updated_at
) VALUES (
    'func-github-read-code',
    'system',
    'github_read_code',
    'GitHub Read Code',
    'github',
    'Read files and directory contents from a GitHub repository to analyze code structure and implementation',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'owner', JSON_OBJECT('type', 'string', 'description', 'GitHub username or organization'),
            'repo', JSON_OBJECT('type', 'string', 'description', 'Repository name'),
            'path', JSON_OBJECT('type', 'string', 'description', 'File or directory path (optional, defaults to root)', 'default', ''),
            'ref', JSON_OBJECT('type', 'string', 'description', 'Branch, tag, or commit SHA (optional, defaults to default branch)', 'default', 'main')
        ),
        'required', JSON_ARRAY('owner', 'repo')
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
    'https://api.github.com',
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
);

-- 4. Add GitHub Analyze Repository function  
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
    fallback_data,
    created_at,
    updated_at
) VALUES (
    'func-github-analyze-repository',
    'system',
    'github_analyze_repository',
    'GitHub Analyze Repository',
    'github',
    'Perform comprehensive analysis of a GitHub repository including code structure, dependencies, and insights',
    JSON_OBJECT(
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
    JSON_OBJECT(
        'repository_info', JSON_OBJECT(
            'name', 'sample-repo',
            'description', 'A sample repository',
            'language', 'JavaScript',
            'stars', 42,
            'forks', 8
        ),
        'code_analysis', JSON_OBJECT(
            'total_files', 25,
            'languages', JSON_OBJECT('JavaScript', 60, 'CSS', 25, 'HTML', 15),
            'structure', 'Standard web application structure'
        ),
        '_metadata', JSON_OBJECT('source', 'mock', 'analysis_time', '2.5s')
    ),
    'https://api.github.com',
    'GET',
    JSON_OBJECT('Accept', 'application/vnd.github.v3+json', 'User-Agent', 'GoGent-App'),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('githubApiKey'),
    JSON_OBJECT('githubApiKey', JSON_OBJECT('required', true, 'description', 'GitHub API token')),
    JSON_OBJECT(
        'repository_info', JSON_OBJECT(
            'name', 'sample-repo',
            'description', 'A sample repository',
            'language', 'JavaScript',
            'stars', 42,
            'forks', 8
        ),
        'code_analysis', JSON_OBJECT(
            'total_files', 25,
            'languages', JSON_OBJECT('JavaScript', 60, 'CSS', 25, 'HTML', 15),
            'structure', 'Standard web application structure'
        ),
        '_metadata', JSON_OBJECT('source', 'fallback', 'error', 'GitHub API unavailable', 'analysis_time', '0ms')
    ),
    NOW(),
    NOW()
);

-- 5. Add system API configurations
INSERT INTO api_configurations (
    id, 
    user_id, 
    variation_name, 
    model_name, 
    system_prompt, 
    temperature, 
    max_tokens, 
    top_p, 
    generation_config,
    created_at,
    updated_at
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
    NOW(),
    NOW()
); 