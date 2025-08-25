-- Rollback Agent API Keys Migration
-- Removes agent-specific API key configurations

-- Drop indexes
DROP INDEX IF EXISTS `idx_agent_api_keys_lookup` ON `agent_api_keys`;

-- Drop the agent API keys table
DROP TABLE IF EXISTS `agent_api_keys`;