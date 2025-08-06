-- Revert GitHub commit function email format fix
-- This restores the original 'email' format (which causes Gemini API issues)

UPDATE function_definitions 
SET parameters_schema = JSON_SET(
    parameters_schema,
    '$.properties.committer.properties.email',
    JSON_OBJECT(
        'type', 'string',
        'format', 'email',
        'description', 'Committer email address'
    )
)
WHERE name = 'github_create_update_file'; 