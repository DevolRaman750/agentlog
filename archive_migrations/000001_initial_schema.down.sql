-- Migration 000001 Down: Drop Initial Schema
-- This migration drops all tables in reverse dependency order

SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS `api_responses`;
DROP TABLE IF EXISTS `api_requests`;
DROP TABLE IF EXISTS `execution_runs`;
DROP TABLE IF EXISTS `agents`;
DROP TABLE IF EXISTS `teams`;
DROP TABLE IF EXISTS `execution_templates`;
DROP TABLE IF EXISTS `api_configurations`;
DROP TABLE IF EXISTS `function_definitions`;
DROP TABLE IF EXISTS `user_api_keys`;
DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1; 