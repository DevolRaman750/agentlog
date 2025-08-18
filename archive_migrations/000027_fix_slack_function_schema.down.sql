-- Rollback Slack function schema fix
-- Restore the original (broken) schema with missing 'items' property

UPDATE function_definitions 
SET parameters_schema = JSON_OBJECT(
    'type', 'object', 
    'required', JSON_ARRAY('channel', 'text'),
    'properties', JSON_OBJECT(
        'channel', JSON_OBJECT(
            'type', 'string', 
            'description', 'Channel ID or name'
        ),
        'text', JSON_OBJECT(
            'type', 'string', 
            'description', 'Message text'
        ),
        'username', JSON_OBJECT(
            'type', 'string', 
            'description', 'Bot username (optional)'
        ),
        'attachments', JSON_OBJECT(
            'type', 'array', 
            'description', 'Message attachments (optional)'
        )
    )
),
endpoint_url = 'https://slack.com/api/chat.postMessage',
description = 'Send messages to Slack channels or users',
headers = JSON_OBJECT(),
mock_response = JSON_OBJECT(),
updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'system' AND name = 'slack_send_message';