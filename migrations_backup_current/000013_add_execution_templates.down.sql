-- Rollback execution templates feature
-- This removes all tables and triggers created in the up migration

-- Drop triggers first
DROP TRIGGER IF EXISTS execution_templates_version_trigger;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS execution_template_executions;
DROP TABLE IF EXISTS execution_template_rate_limits;
DROP TABLE IF EXISTS execution_template_parameter_versions;
DROP TABLE IF EXISTS execution_template_versions;
DROP TABLE IF EXISTS execution_template_auth_tokens;
DROP TABLE IF EXISTS execution_template_parameters;
DROP TABLE IF EXISTS execution_templates; 