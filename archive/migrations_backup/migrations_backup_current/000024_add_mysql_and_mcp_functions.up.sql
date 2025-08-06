-- Migration 000024: Add MySQL Data Reader and MCP GitHub Operations Functions
-- This migration adds two powerful new function types for the Software Engineer template

-- 1. MySQL Data Reader Function
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
    'func-mysql-data-reader',
    'system',
    'mysql_query_data',
    'MySQL Data Query',
    'database',
    'Execute secure MySQL SELECT queries to read data from configured databases. Supports read-only operations with built-in SQL injection prevention and result limiting.',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'query', JSON_OBJECT(
                'type', 'string',
                'description', 'SQL SELECT query to execute (read-only, no INSERT/UPDATE/DELETE allowed)',
                'pattern', '^\\s*SELECT\\s+.*',
                'minLength', 10,
                'maxLength', 5000
            ),
            'database', JSON_OBJECT(
                'type', 'string',
                'description', 'Target database name to query',
                'enum', JSON_ARRAY('main', 'analytics', 'logs', 'reporting'),
                'default', 'main'
            ),
            'limit', JSON_OBJECT(
                'type', 'integer',
                'description', 'Maximum number of rows to return',
                'minimum', 1,
                'maximum', 1000,
                'default', 100
            ),
            'timeout', JSON_OBJECT(
                'type', 'integer',
                'description', 'Query timeout in seconds',
                'minimum', 5,
                'maximum', 60,
                'default', 30
            ),
            'format', JSON_OBJECT(
                'type', 'string',
                'description', 'Output format for results',
                'enum', JSON_ARRAY('json', 'csv', 'table'),
                'default', 'json'
            )
        ),
        'required', JSON_ARRAY('query')
    ),
    JSON_OBJECT(
        'success', true,
        'rows_returned', 3,
        'execution_time_ms', 45,
        'data', JSON_ARRAY(
            JSON_OBJECT('id', 1, 'name', 'John Doe', 'email', 'john@example.com'),
            JSON_OBJECT('id', 2, 'name', 'Jane Smith', 'email', 'jane@example.com'),
            JSON_OBJECT('id', 3, 'name', 'Bob Johnson', 'email', 'bob@example.com')
        ),
        'metadata', JSON_OBJECT(
            'query_hash', 'abc123',
            'database', 'main',
            'source', 'mock'
        )
    ),
    NULL,
    'MYSQL',
    JSON_OBJECT(),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('mysql_connection_string'),
    JSON_OBJECT(
        'mysql_connection_string', JSON_OBJECT(
            'required', true,
            'description', 'MySQL connection string (mysql://user:password@host:port/database)',
            'pattern', '^mysql://.*'
        )
    ),
    NULL,
    'default',
    JSON_OBJECT(
        'success', false,
        'error', 'Database connection unavailable',
        'rows_returned', 0,
        'data', JSON_ARRAY(),
        'metadata', JSON_OBJECT(
            'source', 'fallback',
            'error_type', 'connection_failed'
        )
    ),
    NOW(),
    NOW()
);

-- 2. MCP GitHub Operations Function
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
    'func-mcp-github-ops',
    'system',
    'mcp_github_operations',
    'MCP GitHub Operations',
    'github_advanced',
    'Advanced GitHub operations via MCP server including branch creation, file commits, and pull request generation. Enables complete software development workflows.',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'operation', JSON_OBJECT(
                'type', 'string',
                'description', 'Type of GitHub operation to perform',
                'enum', JSON_ARRAY('create_branch', 'commit_files', 'create_pr', 'update_files', 'merge_pr')
            ),
            'repo', JSON_OBJECT(
                'type', 'string',
                'description', 'Repository in owner/repo format',
                'pattern', '^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$',
                'minLength', 3,
                'maxLength', 100
            ),
            'branch_name', JSON_OBJECT(
                'type', 'string',
                'description', 'Branch name for operations (required for create_branch, commit_files)',
                'pattern', '^[a-zA-Z0-9._/-]+$',
                'minLength', 1,
                'maxLength', 255
            ),
            'base_branch', JSON_OBJECT(
                'type', 'string',
                'description', 'Base branch to create new branch from',
                'default', 'main'
            ),
            'commit_message', JSON_OBJECT(
                'type', 'string',
                'description', 'Commit message for file operations',
                'minLength', 10,
                'maxLength', 500
            ),
            'files', JSON_OBJECT(
                'type', 'array',
                'description', 'Array of files to create or update',
                'items', JSON_OBJECT(
                    'type', 'object',
                    'properties', JSON_OBJECT(
                        'path', JSON_OBJECT('type', 'string', 'description', 'File path in repository'),
                        'content', JSON_OBJECT('type', 'string', 'description', 'File content'),
                        'encoding', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('utf-8', 'base64'), 'default', 'utf-8')
                    ),
                    'required', JSON_ARRAY('path', 'content')
                ),
                'maxItems', 50
            ),
            'pr_title', JSON_OBJECT(
                'type', 'string',
                'description', 'Pull request title (required for create_pr)',
                'minLength', 5,
                'maxLength', 200
            ),
            'pr_description', JSON_OBJECT(
                'type', 'string',
                'description', 'Pull request description',
                'maxLength', 5000
            ),
            'assignees', JSON_OBJECT(
                'type', 'array',
                'description', 'GitHub usernames to assign to PR',
                'items', JSON_OBJECT('type', 'string'),
                'maxItems', 10
            ),
            'labels', JSON_OBJECT(
                'type', 'array',
                'description', 'Labels to add to PR',
                'items', JSON_OBJECT('type', 'string'),
                'maxItems', 20
            )
        ),
        'required', JSON_ARRAY('operation', 'repo')
    ),
    JSON_OBJECT(
        'success', true,
        'operation', 'create_branch',
        'branch_name', 'feature/new-feature',
        'branch_url', 'https://github.com/owner/repo/tree/feature/new-feature',
        'commit_sha', 'abc123def456',
        'created_at', '2024-01-01T12:00:00Z',
        'metadata', JSON_OBJECT(
            'source', 'mock',
            'mcp_server', 'github-operations'
        )
    ),
    NULL,
    'MCP',
    JSON_OBJECT(
        'Content-Type', 'application/json',
        'Accept', 'application/json',
        'User-Agent', 'GoGent-MCP-Client'
    ),
    JSON_OBJECT(
        'mcp_server_url', 'http://localhost:3001',
        'timeout_seconds', 120
    ),
    true,
    true,
    JSON_ARRAY('github_token', 'mcp_server_endpoint'),
    JSON_OBJECT(
        'github_token', JSON_OBJECT(
            'required', true,
            'description', 'GitHub personal access token with repo permissions'
        ),
        'mcp_server_endpoint', JSON_OBJECT(
            'required', true,
            'description', 'MCP server endpoint URL for GitHub operations',
            'default', 'http://localhost:3001'
        )
    ),
    NULL,
    'default',
    JSON_OBJECT(
        'success', false,
        'error', 'MCP server unavailable or GitHub API rate limited',
        'operation', 'unknown',
        'metadata', JSON_OBJECT(
            'source', 'fallback',
            'error_type', 'service_unavailable'
        )
    ),
    NOW(),
    NOW()
);

-- 3. Enhanced GitHub File Manager Function (extends existing capabilities)
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
    'func-github-file-manager',
    'system',
    'github_file_manager',
    'GitHub File Manager',
    'github_advanced',
    'Advanced file management operations for GitHub repositories including batch file operations, directory creation, and file tree analysis.',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'operation', JSON_OBJECT(
                'type', 'string',
                'description', 'File management operation to perform',
                'enum', JSON_ARRAY('list_files', 'create_directory', 'batch_upload', 'analyze_structure', 'search_files')
            ),
            'repo', JSON_OBJECT(
                'type', 'string',
                'description', 'Repository in owner/repo format',
                'pattern', '^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$'
            ),
            'path', JSON_OBJECT(
                'type', 'string',
                'description', 'Repository path to operate on',
                'default', ''
            ),
            'recursive', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Whether to operate recursively on directories',
                'default', false
            ),
            'file_types', JSON_OBJECT(
                'type', 'array',
                'description', 'File extensions to filter by (e.g., [".js", ".ts", ".go"])',
                'items', JSON_OBJECT('type', 'string'),
                'maxItems', 20
            ),
            'max_depth', JSON_OBJECT(
                'type', 'integer',
                'description', 'Maximum directory depth for recursive operations',
                'minimum', 1,
                'maximum', 10,
                'default', 3
            ),
            'search_pattern', JSON_OBJECT(
                'type', 'string',
                'description', 'Pattern to search for in file names or content',
                'maxLength', 200
            )
        ),
        'required', JSON_ARRAY('operation', 'repo')
    ),
    JSON_OBJECT(
        'success', true,
        'operation', 'list_files',
        'total_files', 25,
        'files', JSON_ARRAY(
            JSON_OBJECT('path', 'src/main.go', 'type', 'file', 'size', 1024),
            JSON_OBJECT('path', 'src/handlers/', 'type', 'directory', 'files', 5),
            JSON_OBJECT('path', 'README.md', 'type', 'file', 'size', 2048)
        ),
        'structure_analysis', JSON_OBJECT(
            'languages', JSON_OBJECT('Go', 15, 'JavaScript', 8, 'SQL', 2),
            'total_lines', 5230,
            'directories', 12
        ),
        'metadata', JSON_OBJECT(
            'source', 'mock',
            'scan_depth', 3
        )
    ),
    'https://api.github.com',
    'GET',
    JSON_OBJECT(
        'Accept', 'application/vnd.github.v3+json',
        'User-Agent', 'GoGent-FileManager'
    ),
    JSON_OBJECT(),
    true,
    true,
    JSON_ARRAY('github_token'),
    JSON_OBJECT(
        'github_token', JSON_OBJECT(
            'required', true,
            'description', 'GitHub personal access token with repo permissions'
        )
    ),
    NULL,
    'default',
    JSON_OBJECT(
        'success', false,
        'error', 'GitHub API unavailable or repository not accessible',
        'operation', 'unknown',
        'metadata', JSON_OBJECT(
            'source', 'fallback',
            'error_type', 'api_unavailable'
        )
    ),
    NOW(),
    NOW()
); 