-- Reverse the separation of configurations from execution runs

-- Add back the execution_run_id column to api_configurations
ALTER TABLE api_configurations ADD COLUMN execution_run_id VARCHAR(255);

-- Populate execution_run_id from the mapping table (take the first one if multiple)
UPDATE api_configurations ac
SET execution_run_id = (
    SELECT ec.execution_run_id 
    FROM execution_configurations ec 
    WHERE ec.configuration_id = ac.id 
    LIMIT 1
);

-- Re-add the foreign key constraint
ALTER TABLE api_configurations 
ADD CONSTRAINT api_configurations_ibfk_2 
FOREIGN KEY (execution_run_id) REFERENCES execution_runs(id) ON DELETE CASCADE;

-- Drop the mapping table
DROP TABLE execution_configurations;
