-- Migration 000025 Down: Remove GitHub Read Commits Function
-- This removes the github_read_commits function

DELETE FROM function_definitions WHERE name = 'github_read_commits' AND user_id = 'system';