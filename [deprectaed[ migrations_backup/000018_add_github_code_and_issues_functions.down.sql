-- Remove GitHub Code Reading and Issues Reading system functions

DELETE FROM function_definitions WHERE id = 'func-github-read-code';
DELETE FROM function_definitions WHERE id = 'func-github-read-issues'; 