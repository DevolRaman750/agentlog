-- Set github_read_issues function to use the github_issues_analyzer transformer
UPDATE function_definitions
SET result_transformer = 'github_issues_analyzer'
WHERE name = 'github_read_issues' AND user_id = 'system';