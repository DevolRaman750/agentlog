-- Migration 000002 Down: Remove Essential System Data

-- Remove system API configurations
DELETE FROM api_configurations WHERE user_id = 'system';

-- Remove system function definitions
DELETE FROM function_definitions WHERE user_id = 'system';

-- Remove system user (this will cascade delete related data)
DELETE FROM users WHERE id = 'system'; 