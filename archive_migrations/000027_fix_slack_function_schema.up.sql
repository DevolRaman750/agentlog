-- Fix Slack function parameters schema
-- The attachments array parameter was missing the required 'items' property
-- causing Gemini API validation errors

-- Update the slack_send_message function with correct parameters schema
UPDATE function_definitions 
SET parameters_schema = JSON_OBJECT(
    'type', 'object',
    'required', JSON_ARRAY('channel', 'text'),
    'properties', JSON_OBJECT(
        'channel', JSON_OBJECT(
            'type', 'string',
            'description', 'Channel ID or name (#general) or user ID (@username)'
        ),
        'text', JSON_OBJECT(
            'type', 'string',
            'description', 'Message text content. Supports Slack markdown formatting'
        ),
        'username', JSON_OBJECT(
            'type', 'string',
            'description', 'Bot username to display (optional)'
        ),
        'icon_emoji', JSON_OBJECT(
            'type', 'string',
            'description', 'Emoji to use as bot icon (e.g. :robot_face:)'
        ),
        'thread_ts', JSON_OBJECT(
            'type', 'string',
            'description', 'Timestamp of parent message to reply in thread'
        ),
        'attachments', JSON_OBJECT(
            'type', 'array',
            'description', 'Rich message attachments (optional)',
            'items', JSON_OBJECT(
                'type', 'object',
                'properties', JSON_OBJECT(
                    'color', JSON_OBJECT('type', 'string', 'description', 'Attachment color bar'),
                    'title', JSON_OBJECT('type', 'string', 'description', 'Attachment title'),
                    'text', JSON_OBJECT('type', 'string', 'description', 'Attachment text'),
                    'image_url', JSON_OBJECT('type', 'string', 'description', 'Image URL to display'),
                    'footer', JSON_OBJECT('type', 'string', 'description', 'Footer text')
                )
            )
        )
    )
),
-- Also update endpoint_url to use the correct Slack API endpoint
endpoint_url = 'https://slack.com/api/chat.postMessage',
-- Update description with better details
description = 'Send messages to Slack channels or users with rich formatting and attachments',
-- Ensure proper headers are set
headers = JSON_OBJECT(
    'Content-Type', 'application/json; charset=utf-8',
    'Authorization', 'Bearer {SLACK_BOT_TOKEN}'
),
-- Set a proper mock response for testing
mock_response = JSON_OBJECT(
    'ok', true,
    'channel', 'C1234567890',
    'ts', '1234567890.123456',
    'message', JSON_OBJECT(
        'type', 'message',
        'subtype', 'bot_message',
        'text', 'Test message sent successfully',
        'ts', '1234567890.123456',
        'username', 'GoGent Bot',
        'bot_id', 'B1234567890'
    )
),
updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'system' AND name = 'slack_send_message';