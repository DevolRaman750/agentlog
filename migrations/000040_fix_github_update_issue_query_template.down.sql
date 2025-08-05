-- Revert github_update_issue query_template to original (broken) state
-- This reverts to the version that caused JSON parsing errors

UPDATE function_definitions 
SET query_template = '{"title": "{{title}}", "body": "{{body}}", "state": "{{state}}", "labels": {{labels}}, "assignees": {{assignees}}, "milestone": {{milestone}}}'
WHERE name = 'github_update_issue'; 