-- Fix Slack function fallback_data NULL issue
-- The fallback_data column is NULL which causes Go scanning errors

UPDATE function_definitions 
SET fallback_data = JSON_OBJECT(
    'ok', false,
    'error', 'slack_api_unavailable',
    'message', 'Slack API is currently unavailable. Message was not sent.',
    'channel', '#fallback',
    'ts', '0000000000.000000',
    '_metadata', JSON_OBJECT(
        'source', 'fallback',
        'note', 'This is fallback data when Slack API is unavailable'
    )
),
updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'system' AND name = 'slack_send_message' AND fallback_data IS NULL;