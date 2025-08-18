-- Fix infinite Slack function loop by improving function descriptions and responses
-- The issue is that agents don't understand when to stop the workflow when channels are empty

-- Update slack_read_messages to be very explicit about empty responses and when to stop
UPDATE function_definitions 
SET description = 'STEP 2: Read message history from a Slack channel using the channel ID from slack_find_channel. Returns messages with timestamps, user IDs, and content. IMPORTANT: If the response shows an empty messages array or no recent messages, this means there are NO messages to process - you should STOP the workflow and report that no messages were found. Do not call this function again if you get an empty result.',
    mock_response = JSON_OBJECT(
        'ok', true,
        'messages', JSON_ARRAY(),
        'has_more', false,
        'pin_count', 0,
        'response_metadata', JSON_OBJECT('next_cursor', ''),
        'workflow_guidance', 'EMPTY RESPONSE MEANS STOP - No messages found in channel. Do not call slack functions again.'
    )
WHERE user_id = 'system' 
AND name = 'slack_read_messages';

-- Update slack_find_channel to include workflow guidance
UPDATE function_definitions 
SET description = 'STEP 1: Find a Slack channel ID by channel name. Once you get the channel ID, use it ONCE with slack_read_messages. If slack_read_messages returns empty or no recent messages, STOP the workflow - do not repeat these function calls.',
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
        ),
        'workflow_guidance', 'SUCCESS - Use the channel ID with slack_read_messages ONCE. If it returns empty, stop the workflow.'
    )
WHERE user_id = 'system' 
AND name = 'slack_find_channel';