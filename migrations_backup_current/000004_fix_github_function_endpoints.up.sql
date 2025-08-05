-- Fix GitHub function endpoint URLs that are causing 404 errors

-- Update github_read_code function endpoint URL
UPDATE function_definitions 
SET 
    endpoint_url = 'https://api.github.com/repos/{owner}/{repo}/contents/{path}',
    updated_at = NOW()
WHERE name = 'github_read_code';

-- Update github_analyze_repository function endpoint URL  
UPDATE function_definitions 
SET 
    endpoint_url = 'https://api.github.com/repos/{owner}/{repo}',
    updated_at = NOW()
WHERE name = 'github_analyze_repository'; 