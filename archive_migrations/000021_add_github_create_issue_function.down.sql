-- Migration 000021 Down: Remove GitHub Create Issue Function

DELETE FROM function_definitions 
WHERE id = 'func-github-create-issue' AND user_id = 'system';