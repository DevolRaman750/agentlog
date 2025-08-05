-- Migration 000001: Initial Schema
-- This migration creates the complete working schema for the GoGent application

-- Disable foreign key checks for clean setup
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create users table
CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Create user_sessions table
CREATE TABLE `user_sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_user_sessions_expires_at` (`expires_at`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Create user_api_keys table
CREATE TABLE `user_api_keys` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `provider` varchar(50) NOT NULL,
  `key_name` varchar(100) NOT NULL,
  `encrypted_key_value` text NOT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_provider_key_name` (`user_id`,`provider`,`key_name`),
  KEY `idx_user_api_keys_user_id` (`user_id`),
  KEY `idx_user_api_keys_provider` (`provider`),
  KEY `idx_user_api_keys_is_active` (`is_active`),
  CONSTRAINT `user_api_keys_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Create function_definitions table
CREATE TABLE `function_definitions` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `function_group` varchar(100) DEFAULT 'general',
  `description` text,
  `parameters_schema` json DEFAULT NULL,
  `mock_response` json DEFAULT NULL,
  `endpoint_url` varchar(500) DEFAULT NULL,
  `http_method` enum('GET','POST','PUT','DELETE','PATCH','CYPHER') DEFAULT 'POST',
  `headers` json DEFAULT NULL,
  `auth_config` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_system_resource` tinyint(1) NOT NULL DEFAULT '0',
  `required_api_keys` json DEFAULT NULL,
  `api_key_validation` json DEFAULT NULL,
  `query_template` text,
  `result_transformer` enum('default','custom','passthrough') DEFAULT 'default',
  `fallback_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_function_name` (`user_id`,`name`),
  KEY `function_definitions_ibfk_1` (`user_id`),
  KEY `idx_function_definitions_user_id` (`user_id`),
  KEY `idx_function_definitions_is_active` (`is_active`),
  KEY `idx_function_definitions_is_system` (`is_system_resource`),
  KEY `idx_function_definitions_function_group` (`function_group`),
  CONSTRAINT `function_definitions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. Create api_configurations table
CREATE TABLE `api_configurations` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `variation_name` varchar(255) NOT NULL,
  `model_name` varchar(100) NOT NULL,
  `system_prompt` text NOT NULL,
  `temperature` decimal(3,2) NOT NULL DEFAULT '0.70',
  `max_tokens` int NOT NULL DEFAULT '1024',
  `top_p` decimal(3,2) DEFAULT '1.00',
  `generation_config` json DEFAULT NULL,
  `is_system_resource` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_variation_name` (`user_id`,`variation_name`),
  KEY `api_configurations_ibfk_1` (`user_id`),
  KEY `idx_api_configurations_user_id` (`user_id`),
  KEY `idx_api_configurations_model_name` (`model_name`),
  KEY `idx_api_configurations_is_system` (`is_system_resource`),
  CONSTRAINT `api_configurations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. Create execution_templates table
CREATE TABLE `execution_templates` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `template_prompt` text NOT NULL,
  `context_template` text,
  `enable_function_calling` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_public` tinyint(1) NOT NULL DEFAULT '0',
  `category` varchar(100) DEFAULT 'general',
  `tags` json DEFAULT NULL,
  `execution_timeout_seconds` int DEFAULT '300',
  `rate_limit_per_hour` int DEFAULT '100',
  `rate_limit_per_day` int DEFAULT '1000',
  `rate_limit_burst` int DEFAULT '10',
  `total_executions` int DEFAULT '0',
  `last_executed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_template_name` (`user_id`,`name`),
  KEY `execution_templates_ibfk_1` (`user_id`),
  KEY `idx_execution_templates_user_id` (`user_id`),
  KEY `idx_execution_templates_is_active` (`is_active`),
  KEY `idx_execution_templates_is_public` (`is_public`),
  KEY `idx_execution_templates_category` (`category`),
  KEY `idx_execution_templates_created_at` (`created_at`),
  CONSTRAINT `execution_templates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. Create teams table
CREATE TABLE `teams` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `max_tokens_per_day` int NOT NULL DEFAULT '50000',
  `tokens_used_today` int NOT NULL DEFAULT '0',
  `tokens_reset_date` date NOT NULL DEFAULT (curdate()),
  `agent_count` int NOT NULL DEFAULT '0',
  `active_agent_count` int NOT NULL DEFAULT '0',
  `total_executions` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_teams_user_name` (`user_id`,`name`),
  KEY `teams_ibfk_1` (`user_id`),
  KEY `idx_teams_user_id` (`user_id`),
  KEY `idx_teams_name` (`name`),
  KEY `idx_teams_created_at` (`created_at`),
  CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_team_active_agent_count_non_negative` CHECK ((`active_agent_count` >= 0)),
  CONSTRAINT `chk_team_agent_count_non_negative` CHECK ((`agent_count` >= 0)),
  CONSTRAINT `chk_team_max_tokens_positive` CHECK ((`max_tokens_per_day` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8. Create agents table (depends on teams and execution_templates)
CREATE TABLE `agents` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `template_id` varchar(255) NOT NULL,
  `team_id` varchar(255) DEFAULT NULL,
  `max_tokens_per_day` int NOT NULL DEFAULT '10000',
  `heartbeat_minutes` int NOT NULL DEFAULT '5',
  `lifecycle_status` enum('STANDBY','ACTIVE','PAUSED','KILLED') NOT NULL DEFAULT 'STANDBY',
  `tokens_used_today` int NOT NULL DEFAULT '0',
  `tokens_reset_date` date NOT NULL DEFAULT (curdate()),
  `last_execution_at` timestamp NULL DEFAULT NULL,
  `next_scheduled_at` timestamp NULL DEFAULT NULL,
  `total_executions` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `agents_ibfk_1` (`user_id`),
  KEY `agents_ibfk_2` (`template_id`),
  KEY `idx_agents_team_id` (`team_id`),
  KEY `idx_agents_user_id` (`user_id`),
  KEY `idx_agents_lifecycle_status` (`lifecycle_status`),
  KEY `idx_agents_next_scheduled_at` (`next_scheduled_at`),
  KEY `idx_agents_created_at` (`created_at`),
  CONSTRAINT `agents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `agents_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `execution_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_agents_team_id` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_agent_heartbeat_positive` CHECK ((`heartbeat_minutes` > 0)),
  CONSTRAINT `chk_agent_max_tokens_positive` CHECK ((`max_tokens_per_day` > 0)),
  CONSTRAINT `chk_agent_tokens_non_negative` CHECK ((`tokens_used_today` >= 0)),
  CONSTRAINT `chk_agent_total_executions_non_negative` CHECK ((`total_executions` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9. Create execution_runs table
CREATE TABLE `execution_runs` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `agent_id` varchar(255) DEFAULT NULL,
  `template_id` varchar(255) DEFAULT NULL,
  `configuration_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  `prompt` text NOT NULL,
  `response` text,
  `error_message` text,
  `execution_time_ms` int DEFAULT NULL,
  `tokens_used` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `execution_runs_ibfk_1` (`user_id`),
  KEY `execution_runs_ibfk_2` (`agent_id`),
  KEY `execution_runs_ibfk_3` (`template_id`),
  KEY `execution_runs_ibfk_4` (`configuration_id`),
  KEY `idx_execution_runs_user_id` (`user_id`),
  KEY `idx_execution_runs_status` (`status`),
  KEY `idx_execution_runs_created_at` (`created_at`),
  CONSTRAINT `execution_runs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_runs_ibfk_2` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE SET NULL,
  CONSTRAINT `execution_runs_ibfk_3` FOREIGN KEY (`template_id`) REFERENCES `execution_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `execution_runs_ibfk_4` FOREIGN KEY (`configuration_id`) REFERENCES `api_configurations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_execution_time_non_negative` CHECK ((`execution_time_ms` >= 0)),
  CONSTRAINT `chk_tokens_used_non_negative` CHECK ((`tokens_used` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 10. Create other essential tables...
CREATE TABLE `api_requests` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `endpoint` varchar(255) NOT NULL,
  `method` varchar(10) NOT NULL,
  `headers` json DEFAULT NULL,
  `body` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `api_requests_ibfk_1` (`user_id`),
  KEY `idx_api_requests_user_id` (`user_id`),
  KEY `idx_api_requests_endpoint` (`endpoint`),
  KEY `idx_api_requests_created_at` (`created_at`),
  CONSTRAINT `api_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `api_responses` (
  `id` varchar(255) NOT NULL,
  `request_id` varchar(255) NOT NULL,
  `status_code` int NOT NULL,
  `headers` json DEFAULT NULL,
  `body` text,
  `response_time_ms` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_id` (`request_id`),
  KEY `idx_api_responses_status_code` (`status_code`),
  KEY `idx_api_responses_created_at` (`created_at`),
  CONSTRAINT `api_responses_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `api_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1; 