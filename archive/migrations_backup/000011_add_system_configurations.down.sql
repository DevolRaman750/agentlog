-- Remove system configurations
DELETE FROM api_configurations WHERE user_id = 'system';

-- Remove system execution run
DELETE FROM execution_runs WHERE id = 'system-default-run';

-- Remove system user
DELETE FROM users WHERE id = 'system'; 