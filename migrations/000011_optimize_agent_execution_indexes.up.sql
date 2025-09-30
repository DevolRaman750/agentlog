-- Add indexes to optimize agent execution queries
-- These indexes will significantly improve performance for agents with many executions

-- Index for execution_runs by agent_id (most critical)
CREATE INDEX IF NOT EXISTS `idx_execution_runs_agent_id_created_at` ON `execution_runs` (`agent_id`, `created_at` DESC);

-- Index for api_requests by execution_run_id
CREATE INDEX IF NOT EXISTS `idx_api_requests_execution_run_id` ON `api_requests` (`execution_run_id`);

-- Index for api_responses by request_id  
CREATE INDEX IF NOT EXISTS `idx_api_responses_request_id` ON `api_responses` (`request_id`);

-- Composite index for the common JOIN pattern
CREATE INDEX IF NOT EXISTS `idx_execution_runs_agent_status_created` ON `execution_runs` (`agent_id`, `status`, `created_at` DESC);

-- Index for user_id + agent_id lookups (for authorization checks)
CREATE INDEX IF NOT EXISTS `idx_execution_runs_user_agent` ON `execution_runs` (`user_id`, `agent_id`);
