-- Remove Extended GitHub Functions

DELETE FROM function_definitions WHERE id = 'func-github-add-comment';
DELETE FROM function_definitions WHERE id = 'func-github-create-branch';
DELETE FROM function_definitions WHERE id = 'func-github-create-update-file'; 