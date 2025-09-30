-- Remove indexes added for agent execution query optimization

DROP INDEX IF EXISTS `idx_execution_runs_agent_id_created_at` ON `execution_runs`;
DROP INDEX IF EXISTS `idx_api_requests_execution_run_id` ON `api_requests`;  
DROP INDEX IF EXISTS `idx_api_responses_request_id` ON `api_responses`;
DROP INDEX IF EXISTS `idx_execution_runs_agent_status_created` ON `execution_runs`;
DROP INDEX IF EXISTS `idx_execution_runs_user_agent` ON `execution_runs`;
