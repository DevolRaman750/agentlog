-- MySQL dump 10.13  Distrib 9.3.0, for macos15.2 (arm64)
--
-- Host: localhost    Database: gogent
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Temporary view structure for view `agent_stats`
--

DROP TABLE IF EXISTS `agent_stats`;
/*!50001 DROP VIEW IF EXISTS `agent_stats`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `agent_stats` AS SELECT 
 1 AS `id`,
 1 AS `first_name`,
 1 AS `last_name`,
 1 AS `user_id`,
 1 AS `team_id`,
 1 AS `team_name`,
 1 AS `template_id`,
 1 AS `lifecycle_status`,
 1 AS `max_tokens_per_day`,
 1 AS `tokens_used_today`,
 1 AS `heartbeat_minutes`,
 1 AS `last_execution_at`,
 1 AS `next_scheduled_at`,
 1 AS `total_executions`,
 1 AS `created_at`,
 1 AS `updated_at`,
 1 AS `recent_executions`,
 1 AS `successful_executions`,
 1 AS `failed_executions`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `agents`
--

DROP TABLE IF EXISTS `agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agents` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `team_id` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `template_id` varchar(255) NOT NULL,
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
  `memory` json DEFAULT NULL COMMENT 'Agent memory storage for stateful execution',
  `memory_size_bytes` int NOT NULL DEFAULT '0' COMMENT 'Current memory size in bytes for optimization',
  `memory_updated_at` timestamp NULL DEFAULT NULL COMMENT 'Last time memory was updated',
  PRIMARY KEY (`id`),
  KEY `idx_agents_user_id` (`user_id`),
  KEY `idx_agents_template_id` (`template_id`),
  KEY `idx_agents_team_id` (`team_id`),
  KEY `idx_agents_lifecycle_status` (`lifecycle_status`),
  KEY `idx_agents_next_scheduled_at` (`next_scheduled_at`),
  KEY `idx_agents_created_at` (`created_at`),
  KEY `idx_agents_memory_updated_at` (`memory_updated_at`),
  KEY `idx_agents_memory_size` (`memory_size_bytes`),
  CONSTRAINT `agents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `agents_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `execution_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `agents_ibfk_3` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_heartbeat_minimum` CHECK ((`heartbeat_minutes` >= 5)),
  CONSTRAINT `chk_max_tokens_positive` CHECK ((`max_tokens_per_day` > 0)),
  CONSTRAINT `chk_memory_size_limit` CHECK ((`memory_size_bytes` <= 10485760))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `api_configurations`
--

DROP TABLE IF EXISTS `api_configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_configurations` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `variation_name` varchar(255) NOT NULL,
  `model_name` varchar(255) NOT NULL,
  `system_prompt` text,
  `temperature` decimal(3,2) DEFAULT NULL,
  `max_tokens` int DEFAULT NULL,
  `top_p` decimal(3,2) DEFAULT NULL,
  `top_k` int DEFAULT NULL,
  `safety_settings` json DEFAULT NULL,
  `generation_config` json DEFAULT NULL,
  `tools` json DEFAULT NULL,
  `tool_config` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_config` (`user_id`,`variation_name`),
  KEY `idx_api_configurations_user_id` (`user_id`),
  CONSTRAINT `api_configurations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `api_key_function_mappings`
--

DROP TABLE IF EXISTS `api_key_function_mappings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_key_function_mappings` (
  `id` varchar(255) NOT NULL,
  `api_key_id` varchar(255) NOT NULL,
  `function_definition_id` varchar(255) DEFAULT NULL,
  `function_group` varchar(100) DEFAULT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `access_level_override` enum('read','write','admin','read_write') DEFAULT NULL,
  `custom_config` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_key_function_mapping` (`api_key_id`,`function_definition_id`),
  UNIQUE KEY `unique_key_group_mapping` (`api_key_id`,`function_group`),
  KEY `idx_api_key_function_mappings_api_key_id` (`api_key_id`),
  KEY `idx_api_key_function_mappings_function_id` (`function_definition_id`),
  KEY `idx_api_key_function_mappings_function_group` (`function_group`),
  CONSTRAINT `api_key_function_mappings_ibfk_1` FOREIGN KEY (`api_key_id`) REFERENCES `user_api_keys` (`id`) ON DELETE CASCADE,
  CONSTRAINT `api_key_function_mappings_ibfk_2` FOREIGN KEY (`function_definition_id`) REFERENCES `function_definitions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `api_key_function_mappings_chk_1` CHECK ((((`function_definition_id` is not null) and (`function_group` is null)) or ((`function_definition_id` is null) and (`function_group` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `api_key_usage_logs`
--

DROP TABLE IF EXISTS `api_key_usage_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_key_usage_logs` (
  `id` varchar(255) NOT NULL,
  `api_key_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `function_name` varchar(100) DEFAULT NULL,
  `function_group` varchar(100) DEFAULT NULL,
  `execution_run_id` varchar(255) DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `success` tinyint(1) NOT NULL,
  `response_time_ms` int DEFAULT NULL,
  `error_message` text,
  `rate_limited` tinyint(1) DEFAULT '0',
  `http_status_code` int DEFAULT NULL,
  `response_size_bytes` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_api_key_usage_logs_api_key_id` (`api_key_id`),
  KEY `idx_api_key_usage_logs_user_id` (`user_id`),
  KEY `idx_api_key_usage_logs_used_at` (`used_at`),
  KEY `idx_api_key_usage_logs_function_name` (`function_name`),
  KEY `idx_api_key_usage_logs_success` (`success`),
  KEY `idx_api_key_usage_logs_execution_run_id` (`execution_run_id`),
  CONSTRAINT `api_key_usage_logs_ibfk_1` FOREIGN KEY (`api_key_id`) REFERENCES `user_api_keys` (`id`) ON DELETE CASCADE,
  CONSTRAINT `api_key_usage_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `api_key_usage_logs_ibfk_3` FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `api_requests`
--

DROP TABLE IF EXISTS `api_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_requests` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `execution_run_id` varchar(255) NOT NULL,
  `configuration_id` varchar(255) NOT NULL,
  `request_type` varchar(100) DEFAULT NULL,
  `prompt` text,
  `context` text,
  `function_name` varchar(100) DEFAULT NULL,
  `function_parameters` json DEFAULT NULL,
  `request_headers` json DEFAULT NULL,
  `request_body` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_api_requests_execution_run_id` (`execution_run_id`),
  KEY `idx_api_requests_configuration_id` (`configuration_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `api_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `api_requests_ibfk_2` FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `api_requests_ibfk_3` FOREIGN KEY (`configuration_id`) REFERENCES `api_configurations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `api_responses`
--

DROP TABLE IF EXISTS `api_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_responses` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `request_id` varchar(255) NOT NULL,
  `response_status` varchar(50) DEFAULT NULL,
  `response_text` text,
  `function_call_response` json DEFAULT NULL,
  `usage_metadata` json DEFAULT NULL,
  `safety_ratings` json DEFAULT NULL,
  `finish_reason` varchar(50) DEFAULT NULL,
  `error_message` text,
  `response_time_ms` int DEFAULT NULL,
  `response_headers` json DEFAULT NULL,
  `response_body` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_api_responses_request_id` (`request_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `api_responses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `api_responses_ibfk_2` FOREIGN KEY (`request_id`) REFERENCES `api_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `comparison_results`
--

DROP TABLE IF EXISTS `comparison_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comparison_results` (
  `id` varchar(255) NOT NULL,
  `execution_run_id` varchar(255) NOT NULL,
  `comparison_type` varchar(100) DEFAULT NULL,
  `metric_name` varchar(100) DEFAULT NULL,
  `configuration_scores` json DEFAULT NULL,
  `best_configuration_id` varchar(255) DEFAULT NULL,
  `best_configuration_data` json DEFAULT NULL,
  `all_configurations_data` json DEFAULT NULL,
  `analysis_notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `execution_run_id` (`execution_run_id`),
  KEY `best_configuration_id` (`best_configuration_id`),
  CONSTRAINT `comparison_results_ibfk_1` FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comparison_results_ibfk_2` FOREIGN KEY (`best_configuration_id`) REFERENCES `api_configurations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_configurations`
--

DROP TABLE IF EXISTS `execution_configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_configurations` (
  `id` varchar(255) NOT NULL,
  `execution_run_id` varchar(255) NOT NULL,
  `configuration_id` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_execution_config` (`execution_run_id`,`configuration_id`),
  KEY `configuration_id` (`configuration_id`),
  CONSTRAINT `execution_configurations_ibfk_1` FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_configurations_ibfk_2` FOREIGN KEY (`configuration_id`) REFERENCES `api_configurations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_flow_events`
--

DROP TABLE IF EXISTS `execution_flow_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_flow_events` (
  `id` varchar(255) NOT NULL,
  `execution_run_id` varchar(255) NOT NULL,
  `request_id` varchar(255) DEFAULT NULL,
  `event_type` enum('prompt_start','ai_model_call','function_call_start','function_call_end','ai_response','error_occurred','retry_attempt','execution_complete','api_request_start','api_request_end','function_execution_start','function_execution_end','configuration_start','configuration_end','gemini_api_call_start','gemini_api_call_end') NOT NULL,
  `sequence_number` int NOT NULL DEFAULT '0',
  `parent_event_id` varchar(255) DEFAULT NULL,
  `event_data` json DEFAULT NULL,
  `duration_ms` int DEFAULT NULL,
  `status` enum('pending','success','error','timeout') DEFAULT 'pending',
  `error_message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_execution_flow_events_request` (`request_id`),
  KEY `idx_execution_flow_events_execution_run` (`execution_run_id`),
  KEY `idx_execution_flow_events_sequence` (`execution_run_id`,`sequence_number`),
  KEY `idx_execution_flow_events_type` (`event_type`),
  KEY `idx_execution_flow_events_parent` (`parent_event_id`),
  CONSTRAINT `fk_execution_flow_events_execution_run` FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_execution_flow_events_parent` FOREIGN KEY (`parent_event_id`) REFERENCES `execution_flow_events` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_execution_flow_events_request` FOREIGN KEY (`request_id`) REFERENCES `api_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_function_configs`
--

DROP TABLE IF EXISTS `execution_function_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_function_configs` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `execution_run_id` varchar(255) NOT NULL,
  `function_definition_id` varchar(255) NOT NULL,
  `use_mock_response` tinyint(1) DEFAULT '0',
  `execution_order` int DEFAULT '0',
  `config` json NOT NULL DEFAULT (json_object()),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `function_definition_id` (`function_definition_id`),
  KEY `idx_execution_function_configs_user_id` (`user_id`),
  KEY `idx_execution_function_configs_execution_run_id` (`execution_run_id`),
  CONSTRAINT `execution_function_configs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_function_configs_ibfk_2` FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_function_configs_ibfk_3` FOREIGN KEY (`function_definition_id`) REFERENCES `function_definitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_logs`
--

DROP TABLE IF EXISTS `execution_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_logs` (
  `id` varchar(255) NOT NULL,
  `execution_run_id` varchar(255) NOT NULL,
  `configuration_id` varchar(255) DEFAULT NULL,
  `request_id` varchar(255) DEFAULT NULL,
  `log_level` varchar(20) DEFAULT 'INFO',
  `log_category` varchar(50) DEFAULT NULL,
  `message` text NOT NULL,
  `details` json DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sequence_number` int DEFAULT NULL,
  `duration_ms` int DEFAULT NULL,
  `related_event_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  KEY `idx_execution_logs_execution_run_id` (`execution_run_id`),
  KEY `idx_execution_logs_configuration_id` (`configuration_id`),
  KEY `idx_execution_logs_sequence` (`execution_run_id`,`sequence_number`),
  KEY `idx_execution_logs_event` (`related_event_id`),
  CONSTRAINT `execution_logs_ibfk_1` FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_logs_ibfk_2` FOREIGN KEY (`configuration_id`) REFERENCES `api_configurations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_logs_ibfk_3` FOREIGN KEY (`request_id`) REFERENCES `api_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_execution_logs_flow_event` FOREIGN KEY (`related_event_id`) REFERENCES `execution_flow_events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_runs`
--

DROP TABLE IF EXISTS `execution_runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_runs` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `base_prompt` text,
  `context_prompt` text,
  `enable_function_calling` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('pending','running','completed','failed') DEFAULT 'pending',
  `error_message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `agent_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_execution_runs_user_id` (`user_id`),
  KEY `idx_execution_runs_created_at` (`created_at`),
  KEY `idx_execution_runs_agent_id` (`agent_id`),
  CONSTRAINT `execution_runs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_execution_runs_agent_id` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_stats`
--

DROP TABLE IF EXISTS `execution_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_stats` (
  `id` varchar(255) NOT NULL,
  `execution_run_id` varchar(255) NOT NULL,
  `total_function_calls` int DEFAULT '0',
  `total_ai_model_calls` int DEFAULT '0',
  `total_errors` int DEFAULT '0',
  `total_retries` int DEFAULT '0',
  `total_execution_time_ms` int DEFAULT '0',
  `avg_function_call_time_ms` decimal(10,2) DEFAULT '0.00',
  `avg_ai_response_time_ms` decimal(10,2) DEFAULT '0.00',
  `max_execution_depth` int DEFAULT '0',
  `function_call_breakdown` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_execution_stats_execution_run` (`execution_run_id`),
  CONSTRAINT `fk_execution_stats_execution_run` FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_template_auth_tokens`
--

DROP TABLE IF EXISTS `execution_template_auth_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_template_auth_tokens` (
  `id` varchar(255) NOT NULL,
  `template_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `token_value` varchar(255) NOT NULL,
  `token_name` varchar(100) NOT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `expires_at` timestamp NULL DEFAULT NULL,
  `custom_rate_limit_per_hour` int DEFAULT NULL,
  `custom_rate_limit_per_day` int DEFAULT NULL,
  `custom_rate_limit_burst` int DEFAULT NULL,
  `total_uses` int DEFAULT '0',
  `last_used_at` timestamp NULL DEFAULT NULL,
  `last_used_ip` varchar(45) DEFAULT NULL,
  `allowed_origins` json DEFAULT NULL,
  `allowed_ips` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_value` (`token_value`),
  KEY `idx_execution_template_auth_tokens_template_id` (`template_id`),
  KEY `idx_execution_template_auth_tokens_user_id` (`user_id`),
  KEY `idx_execution_template_auth_tokens_token_value` (`token_value`),
  KEY `idx_execution_template_auth_tokens_is_active` (`is_active`),
  KEY `idx_execution_template_auth_tokens_expires_at` (`expires_at`),
  CONSTRAINT `execution_template_auth_tokens_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `execution_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_template_auth_tokens_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_template_executions`
--

DROP TABLE IF EXISTS `execution_template_executions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_template_executions` (
  `id` varchar(255) NOT NULL,
  `template_id` varchar(255) NOT NULL,
  `template_version_id` varchar(255) DEFAULT NULL,
  `auth_token_id` varchar(255) DEFAULT NULL,
  `execution_run_id` varchar(255) DEFAULT NULL,
  `parameters_provided` json NOT NULL,
  `resolved_prompt` text NOT NULL,
  `resolved_context` text,
  `request_ip` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `referer` varchar(500) DEFAULT NULL,
  `status` enum('pending','running','completed','failed','rate_limited') NOT NULL DEFAULT 'pending',
  `error_message` text,
  `execution_time_ms` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `template_version_id` (`template_version_id`),
  KEY `idx_execution_template_executions_template_id` (`template_id`),
  KEY `idx_execution_template_executions_auth_token_id` (`auth_token_id`),
  KEY `idx_execution_template_executions_status` (`status`),
  KEY `idx_execution_template_executions_created_at` (`created_at`),
  KEY `idx_execution_template_executions_execution_run_id` (`execution_run_id`),
  CONSTRAINT `execution_template_executions_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `execution_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_template_executions_ibfk_2` FOREIGN KEY (`template_version_id`) REFERENCES `execution_template_versions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `execution_template_executions_ibfk_3` FOREIGN KEY (`auth_token_id`) REFERENCES `execution_template_auth_tokens` (`id`) ON DELETE SET NULL,
  CONSTRAINT `execution_template_executions_ibfk_4` FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_template_functions`
--

DROP TABLE IF EXISTS `execution_template_functions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_template_functions` (
  `id` varchar(255) NOT NULL,
  `template_id` varchar(255) NOT NULL,
  `function_id` varchar(255) NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '0',
  `execution_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_template_function` (`template_id`,`function_id`),
  KEY `idx_execution_template_functions_template_id` (`template_id`),
  KEY `idx_execution_template_functions_function_id` (`function_id`),
  KEY `idx_execution_template_functions_execution_order` (`template_id`,`execution_order`),
  CONSTRAINT `execution_template_functions_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `execution_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_template_functions_ibfk_2` FOREIGN KEY (`function_id`) REFERENCES `function_definitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_template_parameter_versions`
--

DROP TABLE IF EXISTS `execution_template_parameter_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_template_parameter_versions` (
  `id` varchar(255) NOT NULL,
  `template_version_id` varchar(255) NOT NULL,
  `parameter_name` varchar(100) NOT NULL,
  `parameter_type` enum('string','number','boolean','array','object') NOT NULL,
  `description` text,
  `default_value` text,
  `is_required` tinyint(1) NOT NULL,
  `validation_rules` json DEFAULT NULL,
  `allowed_values` json DEFAULT NULL,
  `allow_sql_keywords` tinyint(1) NOT NULL DEFAULT '0',
  `allow_special_chars` tinyint(1) NOT NULL DEFAULT '1',
  `sanitize_html` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int DEFAULT '0',
  `ui_component` enum('text','textarea','select','multiselect','checkbox','number','date') DEFAULT 'text',
  `placeholder_text` varchar(255) DEFAULT NULL,
  `help_text` text,
  PRIMARY KEY (`id`),
  KEY `idx_execution_template_parameter_versions_template_version_id` (`template_version_id`),
  KEY `idx_execution_template_parameter_versions_display_order` (`template_version_id`,`display_order`),
  CONSTRAINT `execution_template_parameter_versions_ibfk_1` FOREIGN KEY (`template_version_id`) REFERENCES `execution_template_versions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_template_parameters`
--

DROP TABLE IF EXISTS `execution_template_parameters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_template_parameters` (
  `id` varchar(255) NOT NULL,
  `template_id` varchar(255) NOT NULL,
  `parameter_name` varchar(100) NOT NULL,
  `parameter_type` enum('string','number','boolean','array','object') NOT NULL DEFAULT 'string',
  `description` text,
  `default_value` text,
  `is_required` tinyint(1) NOT NULL DEFAULT '0',
  `validation_rules` json DEFAULT NULL,
  `allowed_values` json DEFAULT NULL,
  `allow_sql_keywords` tinyint(1) NOT NULL DEFAULT '0',
  `allow_special_chars` tinyint(1) NOT NULL DEFAULT '1',
  `sanitize_html` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int DEFAULT '0',
  `ui_component` enum('text','textarea','select','multiselect','checkbox','number','date') DEFAULT 'text',
  `placeholder_text` varchar(255) DEFAULT NULL,
  `help_text` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_template_parameter_name` (`template_id`,`parameter_name`),
  KEY `idx_execution_template_parameters_template_id` (`template_id`),
  KEY `idx_execution_template_parameters_display_order` (`template_id`,`display_order`),
  CONSTRAINT `execution_template_parameters_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `execution_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_template_rate_limits`
--

DROP TABLE IF EXISTS `execution_template_rate_limits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_template_rate_limits` (
  `id` varchar(255) NOT NULL,
  `template_id` varchar(255) NOT NULL,
  `auth_token_id` varchar(255) DEFAULT NULL,
  `window_start` timestamp NOT NULL,
  `window_type` enum('hour','day','burst') NOT NULL,
  `request_count` int NOT NULL DEFAULT '0',
  `last_request_at` timestamp NULL DEFAULT NULL,
  `platform_limit_hit` tinyint(1) DEFAULT '0',
  `platform_limit_reset_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_rate_limit_window` (`template_id`,`auth_token_id`,`window_start`,`window_type`),
  KEY `idx_execution_template_rate_limits_template_id` (`template_id`),
  KEY `idx_execution_template_rate_limits_auth_token_id` (`auth_token_id`),
  KEY `idx_execution_template_rate_limits_window_start` (`window_start`),
  KEY `idx_execution_template_rate_limits_window_type` (`window_type`),
  CONSTRAINT `execution_template_rate_limits_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `execution_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_template_rate_limits_ibfk_2` FOREIGN KEY (`auth_token_id`) REFERENCES `execution_template_auth_tokens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_template_version_functions`
--

DROP TABLE IF EXISTS `execution_template_version_functions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_template_version_functions` (
  `id` varchar(255) NOT NULL,
  `template_version_id` varchar(255) NOT NULL,
  `function_id` varchar(255) NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '0',
  `execution_order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_template_version_function` (`template_version_id`,`function_id`),
  KEY `idx_execution_template_version_functions_template_version_id` (`template_version_id`),
  KEY `idx_execution_template_version_functions_function_id` (`function_id`),
  CONSTRAINT `execution_template_version_functions_ibfk_1` FOREIGN KEY (`template_version_id`) REFERENCES `execution_template_versions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_template_version_functions_ibfk_2` FOREIGN KEY (`function_id`) REFERENCES `function_definitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_template_versions`
--

DROP TABLE IF EXISTS `execution_template_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_template_versions` (
  `id` varchar(255) NOT NULL,
  `template_id` varchar(255) NOT NULL,
  `version_number` int NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `template_prompt` text NOT NULL,
  `context_template` text,
  `enable_function_calling` tinyint(1) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `rate_limit_per_hour` int DEFAULT NULL,
  `rate_limit_per_day` int DEFAULT NULL,
  `rate_limit_burst` int DEFAULT NULL,
  `change_summary` varchar(500) DEFAULT NULL,
  `change_type` enum('create','update','restore') NOT NULL DEFAULT 'update',
  `is_current_version` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_template_version` (`template_id`,`version_number`),
  KEY `user_id` (`user_id`),
  KEY `idx_execution_template_versions_template_id` (`template_id`),
  KEY `idx_execution_template_versions_version_number` (`template_id`,`version_number` DESC),
  KEY `idx_execution_template_versions_is_current` (`template_id`,`is_current_version`),
  KEY `idx_execution_template_versions_created_at` (`created_at`),
  CONSTRAINT `execution_template_versions_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `execution_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_template_versions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `execution_templates`
--

DROP TABLE IF EXISTS `execution_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `execution_templates` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `template_prompt` text NOT NULL,
  `context_template` text,
  `enable_function_calling` tinyint(1) NOT NULL DEFAULT '0',
  `preferred_configuration_id` varchar(255) DEFAULT NULL,
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
  KEY `idx_execution_templates_user_id` (`user_id`),
  KEY `idx_execution_templates_is_active` (`is_active`),
  KEY `idx_execution_templates_is_public` (`is_public`),
  KEY `idx_execution_templates_category` (`category`),
  KEY `idx_execution_templates_created_at` (`created_at`),
  KEY `idx_execution_templates_enable_function_calling` (`enable_function_calling`),
  KEY `idx_execution_templates_preferred_config` (`preferred_configuration_id`),
  CONSTRAINT `execution_templates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_templates_preferred_config_fk` FOREIGN KEY (`preferred_configuration_id`) REFERENCES `api_configurations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `function_calls`
--

DROP TABLE IF EXISTS `function_calls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `function_calls` (
  `id` varchar(255) NOT NULL,
  `request_id` varchar(255) NOT NULL,
  `function_name` varchar(100) NOT NULL,
  `function_arguments` json DEFAULT NULL,
  `function_response` json DEFAULT NULL,
  `execution_status` varchar(50) DEFAULT 'pending',
  `execution_time_ms` int DEFAULT NULL,
  `error_details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sequence_number` int NOT NULL DEFAULT '0',
  `parent_call_id` varchar(255) DEFAULT NULL,
  `execution_depth` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_function_calls_request_id` (`request_id`),
  KEY `idx_function_calls_sequence` (`request_id`,`sequence_number`),
  KEY `idx_function_calls_parent` (`parent_call_id`),
  CONSTRAINT `fk_function_calls_parent` FOREIGN KEY (`parent_call_id`) REFERENCES `function_calls` (`id`) ON DELETE SET NULL,
  CONSTRAINT `function_calls_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `api_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `function_definitions`
--

DROP TABLE IF EXISTS `function_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `function_definitions` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `function_group` varchar(100) NOT NULL DEFAULT 'general',
  `function_type` varchar(20) NOT NULL DEFAULT 'api',
  `description` text,
  `parameters_schema` json NOT NULL DEFAULT (_utf8mb4'{}'),
  `mock_response` json NOT NULL DEFAULT (_utf8mb4'{}'),
  `endpoint_url` varchar(500) DEFAULT NULL,
  `http_method` varchar(10) DEFAULT 'POST',
  `headers` json NOT NULL DEFAULT (_utf8mb4'{}'),
  `auth_config` json NOT NULL DEFAULT (_utf8mb4'{}'),
  `is_active` tinyint(1) DEFAULT '1',
  `is_system_resource` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `required_api_keys` json NOT NULL DEFAULT (json_array()),
  `api_key_validation` json NOT NULL DEFAULT (json_object()),
  `query_template` text,
  `result_transformer` varchar(50) DEFAULT 'default',
  `api_source` varchar(50) DEFAULT 'api',
  `fallback_data` json NOT NULL DEFAULT (_utf8mb4'{}'),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_function` (`user_id`,`name`),
  KEY `idx_function_definitions_user_id` (`user_id`),
  CONSTRAINT `function_definitions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `provider_auth_modes`
--

DROP TABLE IF EXISTS `provider_auth_modes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provider_auth_modes` (
  `id` varchar(255) NOT NULL,
  `provider_id` varchar(100) NOT NULL,
  `auth_mode_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `is_default` tinyint(1) DEFAULT '0',
  `setup_instructions` text,
  `required_fields` json DEFAULT NULL,
  `capabilities` json DEFAULT NULL,
  `validation_endpoint` varchar(500) DEFAULT NULL,
  `rate_limit_info` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_provider_auth_mode` (`provider_id`,`auth_mode_id`),
  KEY `idx_provider_auth_modes_provider` (`provider_id`),
  KEY `idx_provider_auth_modes_default` (`provider_id`,`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Defines available authentication modes for each provider';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `version` bigint NOT NULL,
  `dirty` tinyint(1) NOT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `team_stats`
--

DROP TABLE IF EXISTS `team_stats`;
/*!50001 DROP VIEW IF EXISTS `team_stats`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `team_stats` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `description`,
 1 AS `user_id`,
 1 AS `max_tokens_per_day`,
 1 AS `tokens_used_today`,
 1 AS `tokens_reset_date`,
 1 AS `created_at`,
 1 AS `updated_at`,
 1 AS `total_agents`,
 1 AS `active_agents`,
 1 AS `paused_agents`,
 1 AS `standby_agents`,
 1 AS `killed_agents`,
 1 AS `total_team_executions`,
 1 AS `total_tokens_used_today`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `memory` json DEFAULT NULL COMMENT 'Team memory storage for collaborative agent state',
  `memory_size_bytes` int NOT NULL DEFAULT '0' COMMENT 'Current memory size in bytes for optimization',
  `memory_updated_at` timestamp NULL DEFAULT NULL COMMENT 'Last time memory was updated',
  PRIMARY KEY (`id`),
  KEY `idx_teams_user_id` (`user_id`),
  KEY `idx_teams_created_at` (`created_at`),
  KEY `idx_teams_memory_updated_at` (`memory_updated_at`),
  KEY `idx_teams_memory_size` (`memory_size_bytes`),
  CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_team_memory_size_limit` CHECK ((`memory_size_bytes` <= 20971520)),
  CONSTRAINT `chk_teams_max_tokens_positive` CHECK ((`max_tokens_per_day` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_api_keys`
--

DROP TABLE IF EXISTS `user_api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_api_keys` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `key_name` varchar(100) NOT NULL,
  `service_name` varchar(100) NOT NULL,
  `key_type` enum('api_key','access_token','bearer_token','oauth_token','webhook_url','connection_string','github_app_credentials') NOT NULL DEFAULT 'api_key',
  `auth_mode` varchar(50) DEFAULT 'personal_access_token',
  `auth_config` json DEFAULT NULL,
  `encrypted_key_value` text NOT NULL,
  `encryption_algorithm` varchar(50) NOT NULL DEFAULT 'AES-256-GCM',
  `encryption_key_version` int NOT NULL DEFAULT '1',
  `display_name` varchar(255) NOT NULL,
  `description` text,
  `access_level` enum('read','write','admin','read_write') NOT NULL DEFAULT 'read_write',
  `scopes` json DEFAULT NULL,
  `permissions` json DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `last_validated_at` timestamp NULL DEFAULT NULL,
  `validation_status` enum('valid','invalid','expired','untested','rate_limited') DEFAULT 'untested',
  `validation_error` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `total_uses` int DEFAULT '0',
  `last_used_at` timestamp NULL DEFAULT NULL,
  `service_config` json DEFAULT NULL,
  `environment` enum('production','staging','development','test') DEFAULT 'production',
  `rate_limit_per_hour` int DEFAULT NULL,
  `rate_limit_per_day` int DEFAULT NULL,
  `rate_limit_burst` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_key_name` (`user_id`,`key_name`),
  KEY `created_by` (`created_by`),
  KEY `idx_user_api_keys_user_id` (`user_id`),
  KEY `idx_user_api_keys_service_name` (`service_name`),
  KEY `idx_user_api_keys_key_type` (`key_type`),
  KEY `idx_user_api_keys_is_active` (`is_active`),
  KEY `idx_user_api_keys_is_default` (`user_id`,`service_name`,`is_default`),
  KEY `idx_user_api_keys_expires_at` (`expires_at`),
  KEY `idx_user_api_keys_validation_status` (`validation_status`),
  KEY `idx_user_api_keys_auth_mode` (`user_id`,`service_name`,`auth_mode`),
  CONSTRAINT `user_api_keys_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_api_keys_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores user API keys with support for multiple authentication modes per provider';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `token` varchar(500) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_user_sessions_user_id` (`user_id`),
  KEY `idx_user_sessions_token` (`token`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email_verified` tinyint(1) DEFAULT '0',
  `is_temporary` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'gogent'
--

--
-- Final view structure for view `agent_stats`
--

/*!50001 DROP VIEW IF EXISTS `agent_stats`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `agent_stats` AS select `a`.`id` AS `id`,`a`.`first_name` AS `first_name`,`a`.`last_name` AS `last_name`,`a`.`user_id` AS `user_id`,`a`.`team_id` AS `team_id`,`t`.`name` AS `team_name`,`a`.`template_id` AS `template_id`,`a`.`lifecycle_status` AS `lifecycle_status`,`a`.`max_tokens_per_day` AS `max_tokens_per_day`,`a`.`tokens_used_today` AS `tokens_used_today`,`a`.`heartbeat_minutes` AS `heartbeat_minutes`,`a`.`last_execution_at` AS `last_execution_at`,`a`.`next_scheduled_at` AS `next_scheduled_at`,`a`.`total_executions` AS `total_executions`,`a`.`created_at` AS `created_at`,`a`.`updated_at` AS `updated_at`,count(`er`.`id`) AS `recent_executions`,count((case when (`er`.`status` = 'completed') then 1 end)) AS `successful_executions`,count((case when (`er`.`status` = 'failed') then 1 end)) AS `failed_executions` from ((`agents` `a` left join `teams` `t` on((`a`.`team_id` = `t`.`id`))) left join `execution_runs` `er` on(((`a`.`id` = `er`.`agent_id`) and (`er`.`created_at` > (now() - interval 7 day))))) group by `a`.`id`,`a`.`first_name`,`a`.`last_name`,`a`.`user_id`,`a`.`team_id`,`t`.`name`,`a`.`template_id`,`a`.`lifecycle_status`,`a`.`max_tokens_per_day`,`a`.`tokens_used_today`,`a`.`heartbeat_minutes`,`a`.`last_execution_at`,`a`.`next_scheduled_at`,`a`.`total_executions`,`a`.`created_at`,`a`.`updated_at` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `team_stats`
--

/*!50001 DROP VIEW IF EXISTS `team_stats`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `team_stats` AS select `t`.`id` AS `id`,`t`.`name` AS `name`,`t`.`description` AS `description`,`t`.`user_id` AS `user_id`,`t`.`max_tokens_per_day` AS `max_tokens_per_day`,`t`.`tokens_used_today` AS `tokens_used_today`,`t`.`tokens_reset_date` AS `tokens_reset_date`,`t`.`created_at` AS `created_at`,`t`.`updated_at` AS `updated_at`,count(`a`.`id`) AS `total_agents`,count((case when (`a`.`lifecycle_status` = 'ACTIVE') then 1 end)) AS `active_agents`,count((case when (`a`.`lifecycle_status` = 'PAUSED') then 1 end)) AS `paused_agents`,count((case when (`a`.`lifecycle_status` = 'STANDBY') then 1 end)) AS `standby_agents`,count((case when (`a`.`lifecycle_status` = 'KILLED') then 1 end)) AS `killed_agents`,coalesce(sum(`a`.`total_executions`),0) AS `total_team_executions`,coalesce(sum(`a`.`tokens_used_today`),0) AS `total_tokens_used_today` from (`teams` `t` left join `agents` `a` on((`t`.`id` = `a`.`team_id`))) group by `t`.`id`,`t`.`name`,`t`.`description`,`t`.`user_id`,`t`.`max_tokens_per_day`,`t`.`tokens_used_today`,`t`.`tokens_reset_date`,`t`.`created_at`,`t`.`updated_at` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-16 11:55:12
