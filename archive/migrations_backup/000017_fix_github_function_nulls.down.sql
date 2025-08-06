-- Revert the NOT NULL constraints
ALTER TABLE function_definitions 
MODIFY COLUMN required_api_keys JSON;

ALTER TABLE function_definitions 
MODIFY COLUMN api_key_validation JSON; 