-- Migration: Remove non-working system functions
-- Keep only Github, Weather, and Slack functions
-- Delete all other system function categories that are not working

-- Delete AI/ML functions (3 functions)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'ai_ml';

-- Delete Calendar functions (2 functions)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'calendar';

-- Delete Communication functions except Slack (2 functions: discord and email)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'communication' 
AND name NOT LIKE '%slack%';

-- Delete CRM functions (2 functions)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'crm';

-- Delete Data Processing functions (3 functions)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'data_processing';

-- Delete Database functions (2 functions)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'database';

-- Delete E-commerce functions (3 functions)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'ecommerce';

-- Delete File Management functions (2 functions)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'file_management';

-- Delete HTTP API functions (2 functions)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'http_api';

-- Delete Monitoring functions (3 functions)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'monitoring';

-- Delete Project Management functions (2 functions)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'project_management';

-- Delete Social Media functions (3 functions)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'social_media';

-- Delete Text Processing functions (2 functions)
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND function_group = 'text_processing';

-- Verify results: This query should show only Github (13), Weather (1), and Slack (1) functions remaining
-- SELECT function_group, COUNT(*) as count 
-- FROM function_definitions 
-- WHERE user_id = 'system' 
-- GROUP BY function_group 
-- ORDER BY function_group;