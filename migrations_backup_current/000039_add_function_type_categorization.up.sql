-- Migration 000039: Add Function Type Categorization
-- This migration adds a function_type field to distinguish between API and MCP functions
-- and updates existing functions to use the new categorization system

-- 1. Add function_type column to function_definitions table
ALTER TABLE function_definitions 
ADD COLUMN function_type VARCHAR(20) NOT NULL DEFAULT 'api' 
AFTER function_group;

-- Add index for efficient filtering
ALTER TABLE function_definitions 
ADD INDEX idx_function_definitions_type_group (function_type, function_group);

-- 2. Update existing functions to set appropriate function_type based on http_method
-- MCP functions (use MCP protocol, CYPHER, MYSQL methods)
UPDATE function_definitions 
SET function_type = 'mcp' 
WHERE http_method IN ('MCP', 'CYPHER', 'MYSQL');

-- API functions (use standard HTTP methods)
UPDATE function_definitions 
SET function_type = 'api' 
WHERE http_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'MOCK');

-- 3. Update github_advanced group to just github for consistency
UPDATE function_definitions 
SET function_group = 'github' 
WHERE function_group = 'github_advanced'; 