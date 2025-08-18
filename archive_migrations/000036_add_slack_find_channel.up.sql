-- Add Slack channel name resolution function
-- This function allows agents to find channel IDs by channel names (e.g., #ai-intern)
-- Solves the issue where slack_read_messages requires channel ID but users want to use channel names

-- First delete any existing entry to avoid duplicate key errors
DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND name = 'slack_find_channel'
AND id = '00000000-0000-0000-0000-000000000095';

INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source, mock_response, auth_config
) VALUES (
    '00000000-0000-0000-0000-000000000095', 'system', 'slack_find_channel', 'Slack Find Channel',
    'Find a Slack channel ID by channel name. Accepts channel names with or without # prefix (e.g., "ai-intern" or "#ai-intern"). Returns channel information including the ID needed for other Slack functions.',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'channel_name', JSON_OBJECT(
                'type', 'string',
                'description', 'Channel name to search for. Can include or omit the # prefix (e.g., "ai-intern", "#ai-intern", "general")'
            ),
            'types', JSON_OBJECT(
                'type', 'string',
                'description', 'Comma-separated list of channel types to search in (public_channel, private_channel, mpim, im)',
                'default', 'public_channel,private_channel'
            ),
            'exclude_archived', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Exclude archived channels from search results',
                'default', true
            ),
            'exact_match', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Require exact name match (true) or allow partial matches (false)',
                'default', true
            )
        ),
        'required', JSON_ARRAY('channel_name')
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'GET',
    'https://slack.com/api/conversations.list',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT(
        'error', 'Slack API not available',
        'channels', JSON_ARRAY(),
        'message', 'Channel search functionality is currently unavailable'
    ),
    'slack_api',
    JSON_OBJECT(
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
    ),
    JSON_OBJECT()
);