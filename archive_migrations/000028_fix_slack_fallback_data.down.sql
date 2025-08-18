-- Rollback Slack function fallback_data fix
-- Restore NULL fallback_data (which causes the original scanning error)

UPDATE function_definitions 
SET fallback_data = NULL,
updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'system' AND name = 'slack_send_message';