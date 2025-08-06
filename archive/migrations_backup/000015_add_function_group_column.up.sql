-- Add function_group column and populate groups for existing system functions
BEGIN;

ALTER TABLE function_definitions
ADD COLUMN function_group VARCHAR(100) NOT NULL DEFAULT 'general' AFTER display_name;

-- Group existing system functions
UPDATE function_definitions SET function_group = 'graph' WHERE name IN ('neo4j_node_lookup', 'sales_summary', 'normalize_attributes');
UPDATE function_definitions SET function_group = 'weather' WHERE name = 'get_current_weather';

COMMIT; 