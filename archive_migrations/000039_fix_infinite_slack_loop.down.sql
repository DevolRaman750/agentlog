-- Revert the infinite Slack loop fixes

-- Revert slack_read_messages
UPDATE function_definitions 
SET description = 'Read message history from a Slack channel or direct message. Returns messages with timestamps, user IDs, and content. If no messages are found or channel is empty, the response will indicate this clearly. Use the channel ID from slack_find_channel function.',
    mock_response = JSON_OBJECT(
        'ok', true,
        'messages', JSON_ARRAY(),
        'has_more', false,
        'pin_count', 0,
        'response_metadata', JSON_OBJECT('next_cursor', '')
    )
WHERE user_id = 'system' 
AND name = 'slack_read_messages';

-- Revert slack_find_channel
UPDATE function_definitions 
SET description = 'Find a Slack channel ID by channel name. Accepts channel names with or without # prefix (e.g., "ai-intern" or "#ai-intern"). Returns channel information including the ID needed for other Slack functions. If channel is not found, response will indicate this clearly.',
    mock_response = JSON_OBJECT(
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
        )
    )
WHERE user_id = 'system' 
AND name = 'slack_find_channel';