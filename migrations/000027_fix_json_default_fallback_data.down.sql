-- Revert NOT NULL constraint on fallback_data
ALTER TABLE function_definitions 
MODIFY fallback_data JSON NULL; 