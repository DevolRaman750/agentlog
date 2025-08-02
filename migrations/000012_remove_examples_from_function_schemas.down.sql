-- Rollback migration for removing "examples" fields
-- NOTE: This migration cannot restore the original "examples" content 
-- as it was not preserved during the removal process.

-- The original examples were removed to fix Gemini API compatibility issues.
-- If you need to rollback, you would need to manually restore the examples
-- from git history or backup data.

-- For reference, the affected functions were:
-- - github_add_comment
-- - github_analyze_repository  
-- - github_create_branch
-- - github_create_update_file
-- - github_read_issues
-- - github_update_issue
-- - normalize_attributes
-- - query_graph

-- To re-add examples (if needed for non-Gemini usage), you would need to:
-- 1. Check git history for the original schema content
-- 2. Manually update each function's parameters_schema
-- 3. Be aware this will break Gemini API compatibility

SELECT 'Rollback complete, but examples fields cannot be automatically restored' as warning; 