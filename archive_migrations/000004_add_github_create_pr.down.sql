-- Migration 000004 Down: Remove GitHub Create Pull Request Function

DELETE FROM function_definitions WHERE id = 'func-github-create-pr'; 