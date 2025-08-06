-- Rollback function associations for execution templates

-- 1. Drop the template function summary view
DROP VIEW IF EXISTS template_function_summary;

-- 2. Remove the index added to execution_templates
ALTER TABLE execution_templates 
DROP INDEX IF EXISTS idx_execution_templates_enable_function_calling;

-- 3. Drop the version function associations table
DROP TABLE IF EXISTS execution_template_version_functions;

-- 4. Drop the main template function associations table
DROP TABLE IF EXISTS execution_template_functions;

-- 5. Revert the auth tokens last_used_ip column change
-- Note: We keep the NULL default since it's better than the original issue
-- The original issue was with Go struct handling, not the column definition 