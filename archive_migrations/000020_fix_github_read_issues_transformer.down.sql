-- Revert github_read_issues function transformer to default
UPDATE function_definitions
SET result_transformer = 'default'
WHERE name = 'github_read_issues' AND user_id = 'system';