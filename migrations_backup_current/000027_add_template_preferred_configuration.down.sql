-- Migration 000027 Down: Remove Preferred Configuration Support from Templates

-- Remove the preferred_configuration_id field and constraints
ALTER TABLE execution_templates 
DROP FOREIGN KEY execution_templates_preferred_config_fk,
DROP INDEX idx_execution_templates_preferred_config,
DROP COLUMN preferred_configuration_id; 