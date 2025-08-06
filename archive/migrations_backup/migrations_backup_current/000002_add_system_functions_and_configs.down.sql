-- Remove system functions and configurations

-- Remove system API configurations
DELETE FROM api_configurations WHERE id IN ('system-config-gemini-pro', 'system-config-gemini-flash');

-- Remove system function definitions
DELETE FROM function_definitions WHERE id IN (
    'func-openweather-current',
    'func-neo4j-lookup', 
    'func-github-read-code',
    'func-github-analyze-repository'
); 