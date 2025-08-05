-- Revert github_read_code function transformer to default
-- This reverts the change that enables proper content decoding

UPDATE function_definitions 
SET result_transformer = 'default'
WHERE name = 'github_read_code'; 