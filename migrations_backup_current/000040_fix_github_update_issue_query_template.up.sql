-- Fix malformed JSON query_template for github_update_issue function
-- The original template had missing quotes around placeholder values causing JSON parsing errors

UPDATE function_definitions 
SET query_template = '{"state": "{{state}}"}'
WHERE name = 'github_update_issue'; 