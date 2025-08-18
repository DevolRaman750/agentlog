-- Drop all views first
DROP VIEW IF EXISTS `team_stats`;
DROP VIEW IF EXISTS `agent_stats`;

-- Remove system user
DELETE FROM users WHERE id = 'system';

-- Drop all tables in reverse dependency order
-- NOTE: schema_migrations table is managed by the migration tool and should not be dropped here
DROP TABLE IF EXISTS `provider_auth_modes`;
DROP TABLE IF EXISTS `execution_template_version_functions`;
DROP TABLE IF EXISTS `execution_template_rate_limits`;
DROP TABLE IF EXISTS `execution_template_parameters`;
DROP TABLE IF EXISTS `execution_template_parameter_versions`;
DROP TABLE IF EXISTS `execution_template_functions`;
DROP TABLE IF EXISTS `execution_template_executions`;
DROP TABLE IF EXISTS `execution_template_versions`;
DROP TABLE IF EXISTS `execution_template_auth_tokens`;
DROP TABLE IF EXISTS `execution_stats`;
DROP TABLE IF EXISTS `execution_logs`;
DROP TABLE IF EXISTS `execution_function_configs`;
DROP TABLE IF EXISTS `execution_configurations`;
DROP TABLE IF EXISTS `comparison_results`;
DROP TABLE IF EXISTS `api_key_usage_logs`;
DROP TABLE IF EXISTS `api_key_function_mappings`;
DROP TABLE IF EXISTS `execution_flow_events`;
DROP TABLE IF EXISTS `function_calls`;
DROP TABLE IF EXISTS `api_responses`;
DROP TABLE IF EXISTS `api_requests`;
DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `user_api_keys`;
DROP TABLE IF EXISTS `function_definitions`;
DROP TABLE IF EXISTS `execution_runs`;
DROP TABLE IF EXISTS `agents`;
DROP TABLE IF EXISTS `teams`;
DROP TABLE IF EXISTS `execution_templates`;
DROP TABLE IF EXISTS `api_configurations`;
DROP TABLE IF EXISTS `users`;
