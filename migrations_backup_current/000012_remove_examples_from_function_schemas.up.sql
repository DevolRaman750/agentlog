-- Remove "examples" fields from function parameter schemas for Gemini API compatibility
-- The "examples" field is not supported by Gemini API and causes 400 errors

-- Fix github_add_comment function
UPDATE function_definitions 
SET parameters_schema = JSON_REMOVE(parameters_schema, '$.examples')
WHERE name = 'github_add_comment' AND JSON_EXTRACT(parameters_schema, '$.examples') IS NOT NULL;

-- Fix github_analyze_repository function  
UPDATE function_definitions 
SET parameters_schema = JSON_REMOVE(parameters_schema, '$.examples')
WHERE name = 'github_analyze_repository' AND JSON_EXTRACT(parameters_schema, '$.examples') IS NOT NULL;

-- Fix github_create_branch function
UPDATE function_definitions 
SET parameters_schema = JSON_REMOVE(parameters_schema, '$.examples')
WHERE name = 'github_create_branch' AND JSON_EXTRACT(parameters_schema, '$.examples') IS NOT NULL;

-- Fix github_create_update_file function
UPDATE function_definitions 
SET parameters_schema = JSON_REMOVE(parameters_schema, '$.examples')
WHERE name = 'github_create_update_file' AND JSON_EXTRACT(parameters_schema, '$.examples') IS NOT NULL;

-- Fix github_read_issues function
UPDATE function_definitions 
SET parameters_schema = JSON_REMOVE(parameters_schema, '$.examples')
WHERE name = 'github_read_issues' AND JSON_EXTRACT(parameters_schema, '$.examples') IS NOT NULL;

-- Fix github_update_issue function
UPDATE function_definitions 
SET parameters_schema = JSON_REMOVE(parameters_schema, '$.examples')
WHERE name = 'github_update_issue' AND JSON_EXTRACT(parameters_schema, '$.examples') IS NOT NULL;

-- Fix normalize_attributes function
UPDATE function_definitions 
SET parameters_schema = JSON_REMOVE(parameters_schema, '$.examples')
WHERE name = 'normalize_attributes' AND JSON_EXTRACT(parameters_schema, '$.examples') IS NOT NULL;

-- Fix query_graph function
UPDATE function_definitions 
SET parameters_schema = JSON_REMOVE(parameters_schema, '$.examples')
WHERE name = 'query_graph' AND JSON_EXTRACT(parameters_schema, '$.examples') IS NOT NULL;

-- Also remove examples from nested properties if they exist
-- Remove examples from property-level schemas
UPDATE function_definitions 
SET parameters_schema = JSON_REMOVE(
    parameters_schema, 
    '$.properties.repo.examples',
    '$.properties.owner.examples', 
    '$.properties.path.examples',
    '$.properties.issue_number.examples',
    '$.properties.title.examples',
    '$.properties.body.examples',
    '$.properties.branch_name.examples',
    '$.properties.file_path.examples',
    '$.properties.content.examples',
    '$.properties.commit_message.examples',
    '$.properties.query.examples',
    '$.properties.node_label.examples',
    '$.properties.attribute_name.examples'
)
WHERE parameters_schema LIKE '%examples%';

-- Validate that all examples have been removed
SELECT 
    name,
    CASE 
        WHEN parameters_schema LIKE '%examples%' THEN 'STILL HAS EXAMPLES'
        ELSE 'CLEAN'
    END as status
FROM function_definitions 
WHERE name IN (
    'github_add_comment', 
    'github_analyze_repository', 
    'github_create_branch', 
    'github_create_update_file', 
    'github_read_issues', 
    'github_update_issue', 
    'normalize_attributes', 
    'query_graph'
); 