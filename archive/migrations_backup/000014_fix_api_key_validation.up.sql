-- Ensure api_key_validation is non-NULL and has a default value

-- 1. Update existing rows
UPDATE function_definitions
SET api_key_validation = '{}'
WHERE api_key_validation IS NULL;

-- 2. Change column to NOT NULL with default {}
ALTER TABLE function_definitions
MODIFY api_key_validation JSON NOT NULL DEFAULT (_utf8mb4'{}'); 