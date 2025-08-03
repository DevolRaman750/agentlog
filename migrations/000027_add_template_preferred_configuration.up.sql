-- Migration 000027: Add Preferred Configuration Support to Templates
-- This migration adds the ability to associate templates with preferred configurations

-- Add preferred_configuration_id field to execution_templates table
ALTER TABLE execution_templates 
ADD COLUMN preferred_configuration_id VARCHAR(255) DEFAULT NULL AFTER enable_function_calling,
ADD INDEX idx_execution_templates_preferred_config (preferred_configuration_id),
ADD CONSTRAINT execution_templates_preferred_config_fk 
    FOREIGN KEY (preferred_configuration_id) REFERENCES api_configurations(id) ON DELETE SET NULL;

-- Update the Software Engineer template to use the Software Engineer configuration
UPDATE execution_templates 
SET preferred_configuration_id = 'system-config-software-engineer'
WHERE id = 'system-template-software-engineer'; 