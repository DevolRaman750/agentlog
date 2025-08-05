-- Fix GitHub commit function email format issue
-- Gemini API only supports 'enum' and 'date-time' formats for STRING type
-- Remove the unsupported 'email' format from committer.email field

UPDATE function_definitions 
SET parameters_schema = JSON_SET(
    parameters_schema,
    '$.properties.committer.properties.email',
    JSON_OBJECT(
        'type', 'string',
        'description', 'Committer email address'
    )
)
WHERE name = 'github_create_update_file'; 