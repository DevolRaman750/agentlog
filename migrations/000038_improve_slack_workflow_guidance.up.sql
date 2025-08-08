-- Improve Slack function workflow guidance to prevent agents from stopping prematurely
-- Make the function descriptions more directive about the complete workflow

-- Make slack_find_channel description more action-oriented
UPDATE function_definitions 
SET description = 'STEP 1: Find a Slack channel ID by channel name. Accepts channel names with or without # prefix (e.g., "ai-intern" or "#ai-intern"). Once you get the channel ID from this function, immediately use it with slack_read_messages to read the channel messages. Do not stop after getting the channel ID - continue to read messages.'
WHERE user_id = 'system' 
AND name = 'slack_find_channel';

-- Make slack_read_messages description clearer about when to use it
UPDATE function_definitions 
SET description = 'STEP 2: Read message history from a Slack channel using the channel ID from slack_find_channel. This function will return actual messages with text content, timestamps, user information, and reactions. Always call this function after getting a channel ID from slack_find_channel. If the channel is empty or has no messages, the response will clearly indicate this with an empty messages array.'
WHERE user_id = 'system' 
AND name = 'slack_read_messages';

-- Update the slack_find_channel mock response to show what the agent should do next
UPDATE function_definitions 
SET mock_response = JSON_OBJECT(
    'ok', true,
    'channels', JSON_ARRAY(
        JSON_OBJECT(
            'id', 'C1234567890',
            'name', 'ai-intern',
            'is_channel', true,
            'is_group', false,
            'is_im', false,
            'is_private', false,
            'is_archived', false,
            'created', 1234567890,
            'creator', 'U1234567890',
            'purpose', JSON_OBJECT('value', 'AI intern channel for testing'),
            'topic', JSON_OBJECT('value', 'Channel topic'),
            'num_members', 5
        )
    ),
    'next_action', 'Now use the channel ID (C1234567890) with slack_read_messages to get the messages'
)
WHERE user_id = 'system' 
AND name = 'slack_find_channel';