-- Revert github_read_code function transformer back to default

UPDATE function_definitions 
SET result_transformer = 'default' 
WHERE name = 'github_read_code' AND user_id = 'system';