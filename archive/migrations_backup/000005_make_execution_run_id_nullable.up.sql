-- Remove foreign key constraint for execution_run_id in api_configurations table
-- This allows standalone configurations that aren't tied to specific execution runs

-- Drop the foreign key constraint
ALTER TABLE api_configurations 
DROP FOREIGN KEY api_configurations_ibfk_2;

-- Make execution_run_id nullable (optional)
ALTER TABLE api_configurations 
MODIFY COLUMN execution_run_id VARCHAR(255) NULL;

-- Note: Skipping index recreation as it may not exist and isn't critical for this fix 