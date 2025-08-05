-- Rollback: Delete the clean GitHub functions and restore the original ones with examples fields
-- This restores the state before migration 000015

-- Delete the clean versions
DELETE FROM function_definitions WHERE name IN (
    'github_create_branch',
    'github_create_update_file'
);

-- Note: This down migration doesn't restore the exact original functions with examples
-- as that would just recreate the Gemini API errors. Instead, it removes the functions
-- entirely, allowing the previous migration state to be restored through a full migration reset. 