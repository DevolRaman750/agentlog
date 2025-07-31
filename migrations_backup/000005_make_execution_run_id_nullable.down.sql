-- Reverse the changes: make execution_run_id NOT NULL and add back foreign key constraint

-- First make execution_run_id NOT NULL (this may fail if there are NULL values)
ALTER TABLE api_configurations 
MODIFY COLUMN execution_run_id VARCHAR(255) NOT NULL;

-- Add back the foreign key constraint
ALTER TABLE api_configurations 
ADD CONSTRAINT api_configurations_ibfk_2 
FOREIGN KEY (execution_run_id) REFERENCES execution_runs(id) ON DELETE CASCADE; 