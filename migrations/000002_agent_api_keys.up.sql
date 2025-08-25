-- Agent API Keys Migration
-- Adds support for agent-specific API key configurations

-- Create table to link agents to API keys
CREATE TABLE `agent_api_keys` (
  `id` varchar(255) NOT NULL,
  `agent_id` varchar(255) NOT NULL,
  `api_key_id` varchar(255) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `use_global_default` tinyint(1) NOT NULL DEFAULT '1',
  `priority` int NOT NULL DEFAULT '100',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_agent_api_key` (`agent_id`, `api_key_id`),
  KEY `idx_agent_api_keys_agent_id` (`agent_id`),
  KEY `idx_agent_api_keys_api_key_id` (`api_key_id`),
  KEY `idx_agent_api_keys_is_default` (`agent_id`, `is_default`),
  KEY `idx_agent_api_keys_use_global_default` (`use_global_default`),
  KEY `idx_agent_api_keys_priority` (`agent_id`, `priority`),
  CONSTRAINT `agent_api_keys_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `agent_api_keys_ibfk_2` FOREIGN KEY (`api_key_id`) REFERENCES `user_api_keys` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Maps agents to specific API keys, allowing agents to use custom keys instead of global defaults';

-- Create index for efficient lookups
CREATE INDEX `idx_agent_api_keys_lookup` ON `agent_api_keys` (`agent_id`, `use_global_default`, `priority`);