-- Revert GitHub function endpoint URLs back to the previous state

-- Revert github_read_code function endpoint URL
UPDATE function_definitions 
SET 
    endpoint_url = 'https://api.github.com',
    updated_at = NOW()
WHERE name = 'github_read_code';

-- Revert github_analyze_repository function endpoint URL  
UPDATE function_definitions 
SET 
    endpoint_url = 'https://api.github.com',
    updated_at = NOW()
WHERE name = 'github_analyze_repository'; 