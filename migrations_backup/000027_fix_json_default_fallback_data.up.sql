-- Correctly enforce NOT NULL and set default on function_definitions.fallback_data

-- Ensure no NULLs remain
UPDATE function_definitions
SET fallback_data = '{}' 
WHERE fallback_data IS NULL;

-- Modify column (JSON default literal without parentheses works on MySQL ≥8.0.13)
ALTER TABLE function_definitions 
MODIFY fallback_data JSON NOT NULL DEFAULT '{}'; 