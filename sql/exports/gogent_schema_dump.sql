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
-- Table structure for table `api_configurations`
--

DROP TABLE IF EXISTS `api_configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_configurations` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `execution_run_id` varchar(255) DEFAULT NULL,
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
  PRIMARY KEY (`id`),
  KEY `execution_run_id` (`execution_run_id`),
  KEY `idx_api_configurations_user_id` (`user_id`),
  CONSTRAINT `api_configurations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
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
  KEY `user_id` (`user_id`),
  KEY `idx_api_requests_execution_run_id` (`execution_run_id`),
  KEY `idx_api_requests_configuration_id` (`configuration_id`),
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
  KEY `user_id` (`user_id`),
  KEY `idx_api_responses_request_id` (`request_id`),
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
  `config` json NOT NULL DEFAULT (_utf8mb4'{}'),
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
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  KEY `idx_execution_logs_execution_run_id` (`execution_run_id`),
  KEY `idx_execution_logs_configuration_id` (`configuration_id`),
  CONSTRAINT `execution_logs_ibfk_1` FOREIGN KEY (`execution_run_id`) REFERENCES `execution_runs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_logs_ibfk_2` FOREIGN KEY (`configuration_id`) REFERENCES `api_configurations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `execution_logs_ibfk_3` FOREIGN KEY (`request_id`) REFERENCES `api_requests` (`id`) ON DELETE CASCADE
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
  PRIMARY KEY (`id`),
  KEY `idx_execution_runs_user_id` (`user_id`),
  KEY `idx_execution_runs_created_at` (`created_at`),
  CONSTRAINT `execution_runs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
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
  PRIMARY KEY (`id`),
  KEY `idx_function_calls_request_id` (`request_id`),
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
  `required_api_keys` json DEFAULT NULL COMMENT 'Array of required API key names for this function',
  `api_key_validation` json DEFAULT NULL COMMENT 'Validation rules for each API key (optional patterns, descriptions)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_function` (`user_id`,`name`),
  KEY `idx_function_definitions_user_id` (`user_id`),
  CONSTRAINT `function_definitions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-28 10:53:48
