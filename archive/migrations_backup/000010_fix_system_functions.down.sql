-- Reverse system function configuration fixes

-- Note: We cannot restore deleted test functions, this is intentional cleanup
-- Note: We cannot easily restore the old "examples" fields as they were invalid

-- 1. Remove fallback data from get_current_weather function
UPDATE function_definitions 
SET 
    fallback_data = NULL
WHERE name = 'get_current_weather';

-- 2. Revert endpoint URLs for Neo4j functions to original values if needed
-- (This is optional since the new URLs are correct)

-- 3. Clear mock_response fields that were added
UPDATE function_definitions 
SET mock_response = JSON_OBJECT()
WHERE name IN ('neo4j_node_lookup', 'sales_summary', 'normalize_attributes', 'get_current_weather'); 