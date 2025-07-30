-- Separate configurations from execution runs
-- This fixes the fundamental issue where configurations were tied to specific runs

-- Clean up orphaned configurations first
DELETE FROM api_configurations 
WHERE execution_run_id IS NOT NULL 
AND execution_run_id NOT IN (SELECT id FROM execution_runs);

-- Drop the table if it exists from a previous failed migration
DROP TABLE IF EXISTS execution_configurations;

-- First, create the new execution_configurations mapping table
CREATE TABLE execution_configurations (
    id VARCHAR(255) PRIMARY KEY,
    execution_run_id VARCHAR(255) NOT NULL,
    configuration_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (execution_run_id) REFERENCES execution_runs(id) ON DELETE CASCADE,
    FOREIGN KEY (configuration_id) REFERENCES api_configurations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_execution_config (execution_run_id, configuration_id)
);

-- Migrate existing data: Create mapping entries for existing configurations
-- Only migrate configurations where the execution_run_id actually exists
INSERT INTO execution_configurations (id, execution_run_id, configuration_id)
SELECT 
    CONCAT('exec_config_', SUBSTRING(MD5(CONCAT(ac.execution_run_id, ac.id)), 1, 12)) as id,
    ac.execution_run_id,
    ac.id as configuration_id
FROM api_configurations ac
INNER JOIN execution_runs er ON ac.execution_run_id = er.id
WHERE ac.execution_run_id IS NOT NULL;

-- Remove the foreign key constraint from api_configurations (try different possible names)
SET @constraint_name = (
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'gogent' 
    AND TABLE_NAME = 'api_configurations' 
    AND REFERENCED_TABLE_NAME = 'execution_runs'
    LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL, 
    CONCAT('ALTER TABLE api_configurations DROP FOREIGN KEY ', @constraint_name), 
    'SELECT "No foreign key constraint found" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remove the execution_run_id column from api_configurations
ALTER TABLE api_configurations DROP COLUMN execution_run_id;

-- Add indexes for better performance
CREATE INDEX idx_execution_configurations_run ON execution_configurations(execution_run_id);
CREATE INDEX idx_execution_configurations_config ON execution_configurations(configuration_id);
