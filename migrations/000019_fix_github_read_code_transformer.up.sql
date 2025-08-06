-- Fix github_read_code function to use proper transformer for directory analysis
-- This ensures directory responses get processed by transformDirectoryListing

UPDATE function_definitions 
SET result_transformer = 'github_code_analyzer' 
WHERE name = 'github_read_code' AND user_id = 'system';