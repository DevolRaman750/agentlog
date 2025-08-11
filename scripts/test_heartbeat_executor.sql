-- Test script to create sample data for HeartbeatExecutor testing
-- Run this against your local database to create test agents

-- First, ensure we have a test user
INSERT IGNORE INTO users (id, username, email, email_verified, created_at, updated_at) 
VALUES ('test-user-heartbeat', 'heartbeat_test', 'heartbeat@test.com', 1, NOW(), NOW());

-- Create a simple test template
INSERT IGNORE INTO execution_templates (
    id, user_id, name, description, template_prompt, context_template,
    enable_function_calling, is_active, created_at, updated_at
) VALUES (
    'test-template-heartbeat',
    'test-user-heartbeat',
    'Heartbeat Test Template',
    'A simple template for testing the HeartbeatExecutor',
    'Hello! I am an autonomous agent. Current time: {{current_time}}. Please respond with a friendly greeting.',
    'You are a helpful AI assistant running as an autonomous agent.',
    0, -- Disable function calling for simplicity
    1,
    NOW(),
    NOW()
);

-- Create test agents with different configurations
INSERT IGNORE INTO agents (
    id, user_id, first_name, last_name, template_id,
    max_tokens_per_day, heartbeat_minutes, lifecycle_status,
    tokens_used_today, tokens_reset_date, total_executions,
    created_at, updated_at
) VALUES 
-- Agent 1: Never executed, should be picked up immediately
(
    'agent-heartbeat-1',
    'test-user-heartbeat',
    'Test',
    'Agent One',
    'test-template-heartbeat',
    1000,
    5, -- 5 minute heartbeat
    'ACTIVE',
    0,
    CURDATE(),
    0,
    NOW(),
    NOW()
),
-- Agent 2: Last executed 10 minutes ago, should be overdue (heartbeat = 5 min)
(
    'agent-heartbeat-2',
    'test-user-heartbeat',
    'Test',
    'Agent Two',
    'test-template-heartbeat',
    2000,
    5, -- 5 minute heartbeat
    'ACTIVE',
    50,
    CURDATE(),
    3,
    DATE_SUB(NOW(), INTERVAL 20 MINUTE),
    NOW()
),
-- Agent 3: Paused, should not be executed
(
    'agent-heartbeat-3',
    'test-user-heartbeat',
    'Test',
    'Agent Three',
    'test-template-heartbeat',
    1000,
    5,
    'PAUSED',
    0,
    CURDATE(),
    0,
    NOW(),
    NOW()
),
-- Agent 4: Hit token limit, should not be executed
(
    'agent-heartbeat-4',
    'test-user-heartbeat',
    'Test',
    'Agent Four',
    'test-template-heartbeat',
    100, -- Low limit
    5,
    'ACTIVE',
    100, -- At limit
    CURDATE(),
    10,
    DATE_SUB(NOW(), INTERVAL 10 MINUTE),
    NOW()
),
-- Agent 5: Long heartbeat, should not be executed yet
(
    'agent-heartbeat-5',
    'test-user-heartbeat',
    'Test',
    'Agent Five',
    'test-template-heartbeat',
    1000,
    60, -- 60 minute heartbeat
    'ACTIVE',
    200,
    CURDATE(),
    2,
    DATE_SUB(NOW(), INTERVAL 30 MINUTE), -- Only 30 min ago
    NOW()
);

-- Update last_execution_at for agent 2
UPDATE agents 
SET last_execution_at = DATE_SUB(NOW(), INTERVAL 10 MINUTE)
WHERE id = 'agent-heartbeat-2';

-- Update last_execution_at for agent 5
UPDATE agents 
SET last_execution_at = DATE_SUB(NOW(), INTERVAL 30 MINUTE)
WHERE id = 'agent-heartbeat-5';

-- Display current agent status
SELECT 
    id,
    CONCAT(first_name, ' ', last_name) as agent_name,
    lifecycle_status,
    heartbeat_minutes,
    tokens_used_today,
    max_tokens_per_day,
    last_execution_at,
    CASE 
        WHEN last_execution_at IS NULL THEN 'Never executed'
        WHEN last_execution_at <= DATE_SUB(NOW(), INTERVAL heartbeat_minutes MINUTE) THEN 'OVERDUE'
        ELSE 'Current'
    END as execution_status,
    CASE 
        WHEN tokens_used_today >= max_tokens_per_day THEN 'LIMIT_REACHED'
        ELSE 'OK'
    END as token_status,
    total_executions
FROM agents 
WHERE user_id = 'test-user-heartbeat'
ORDER BY created_at;

-- Expected results:
-- agent-heartbeat-1: OVERDUE (never executed), OK tokens -> SHOULD EXECUTE
-- agent-heartbeat-2: OVERDUE (10 min ago), OK tokens -> SHOULD EXECUTE  
-- agent-heartbeat-3: PAUSED -> SHOULD NOT EXECUTE
-- agent-heartbeat-4: OVERDUE (10 min ago), LIMIT_REACHED -> SHOULD NOT EXECUTE
-- agent-heartbeat-5: Current (30 min ago, 60 min heartbeat), OK tokens -> SHOULD NOT EXECUTE
