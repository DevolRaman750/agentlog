-- Improve Slack function descriptions to provide better guidance for agents
-- This helps agents understand the workflow and when to stop iterating

-- Update slack_read_messages to be clearer about expected behavior
UPDATE function_definitions 
SET description = 'Read message history from a Slack channel or direct message. Returns messages with timestamps, user IDs, and content. If no messages are found or channel is empty, the response will indicate this clearly. Use the channel ID from slack_find_channel function.'
WHERE user_id = 'system' 
AND name = 'slack_read_messages';

-- Update slack_find_channel to be clearer about its purpose
UPDATE function_definitions 
SET description = 'Find a Slack channel ID by channel name. Accepts channel names with or without # prefix (e.g., "ai-intern" or "#ai-intern"). Returns channel information including the ID needed for slack_read_messages and other Slack functions. If channel is not found, response will indicate this clearly.'
WHERE user_id = 'system' 
AND name = 'slack_find_channel';

-- Add helpful mock response that shows what to expect when channel has no messages
UPDATE function_definitions 
SET mock_response = JSON_OBJECT(
    'ok', true,
    'messages', JSON_ARRAY(),
    'has_more', false,
    'pin_count', 0,
    'channel_actions_ts', null,
    'channel_actions_count', 0,
    'response_metadata', JSON_OBJECT(
        'next_cursor', ''
    )
)
WHERE user_id = 'system' 
AND name = 'slack_read_messages';