-- Rollback migration: Remove non-working system functions
-- This rollback will restore the deleted functions from the original system data

-- NOTE: This rollback requires re-running the original system data migration
-- to restore all deleted functions. Since the functions were permanently deleted,
-- we cannot restore the exact data without the original INSERT statements.

-- To rollback this migration completely, you would need to:
-- 1. Run the down migration for all migrations after 000002_system_data
-- 2. Re-run 000002_system_data.up.sql to restore all original system functions
-- 3. Re-apply subsequent migrations

-- For now, this serves as a placeholder to indicate the migration can be rolled back
-- but requires manual restoration of the original system data.

-- The following would restore the original state:
-- SOURCE: migrations/000002_system_data.up.sql (contains all original function definitions)

SELECT 'To rollback this migration completely, re-run migrations/000002_system_data.up.sql' as rollback_instructions;