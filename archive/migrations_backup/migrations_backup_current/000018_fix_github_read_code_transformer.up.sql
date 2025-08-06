-- Fix github_read_code function to use proper result transformer
-- This enables proper base64 decoding and code analysis for file content

UPDATE function_definitions 
SET result_transformer = 'github_code_analyzer'
WHERE name = 'github_read_code'; 