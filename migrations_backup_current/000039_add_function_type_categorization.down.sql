-- Migration 000039 Down: Remove Function Type Categorization
-- This migration reverses the function_type field and categorization changes

-- 1. Restore github_advanced group for MCP functions (if needed)
UPDATE function_definitions 
SET function_group = 'github_advanced' 
WHERE function_group = 'github' AND http_method = 'MCP';

-- 2. Remove the index
DROP INDEX idx_function_definitions_type_group ON function_definitions;

-- 3. Remove function_type column
ALTER TABLE function_definitions 
DROP COLUMN function_type; 