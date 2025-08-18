-- Migration 000006 Down: Remove Missing GitHub Functions

DELETE FROM function_definitions WHERE id IN (
    'func-github-list-branches',
    'func-github-get-file-sha', 
    'func-github-merge-pr',
    'func-github-search-code'
); 