-- Add comprehensive Slack API functions for bot capabilities
-- These functions use the generic API approach and are fully data-driven

-- 1. Read messages from a channel/DM
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000081', 'system', 'slack_read_messages', 'Slack Read Messages',
    'Read message history from a Slack channel or direct message',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'channel', JSON_OBJECT(
                'type', 'string',
                'description', 'Channel ID to read messages from (e.g., C1234567890 for channel, D1234567890 for DM)'
            ),
            'limit', JSON_OBJECT(
                'type', 'integer',
                'description', 'Number of messages to retrieve (1-1000, default 100)',
                'minimum', 1,
                'maximum', 1000,
                'default', 100
            ),
            'oldest', JSON_OBJECT(
                'type', 'string',
                'description', 'Start of time range of messages to include (timestamp)'
            ),
            'latest', JSON_OBJECT(
                'type', 'string', 
                'description', 'End of time range of messages to include (timestamp)'
            ),
            'inclusive', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Include messages with latest or oldest timestamps in results',
                'default', false
            )
        ),
        'required', JSON_ARRAY('channel')
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'GET',
    'https://slack.com/api/conversations.history',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);

-- 2. List all channels the bot has access to
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000082', 'system', 'slack_list_channels', 'Slack List Channels',
    'List all channels (public, private, DMs) that the bot has access to',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'types', JSON_OBJECT(
                'type', 'string',
                'description', 'Comma-separated list of channel types (public_channel, private_channel, mpim, im)',
                'default', 'public_channel,private_channel'
            ),
            'limit', JSON_OBJECT(
                'type', 'integer',
                'description', 'Maximum number of channels to return (1-1000, default 1000)',
                'minimum', 1,
                'maximum', 1000,
                'default', 1000
            ),
            'exclude_archived', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Exclude archived channels',
                'default', true
            )
        ),
        'required', JSON_ARRAY()
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'GET',
    'https://slack.com/api/conversations.list',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);

-- 3. Get information about a specific channel
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000083', 'system', 'slack_get_channel_info', 'Slack Get Channel Info',
    'Get detailed information about a specific Slack channel',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'channel', JSON_OBJECT(
                'type', 'string',
                'description', 'Channel ID to get information about'
            ),
            'include_locale', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Set to true to include the locale for this conversation',
                'default', false
            )
        ),
        'required', JSON_ARRAY('channel')
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'GET',
    'https://slack.com/api/conversations.info',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);

-- 4. Get list of users in a channel
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000084', 'system', 'slack_get_channel_members', 'Slack Get Channel Members',
    'Get list of users who are members of a conversation',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'channel', JSON_OBJECT(
                'type', 'string',
                'description', 'Channel ID to get members from'
            ),
            'limit', JSON_OBJECT(
                'type', 'integer',
                'description', 'Maximum number of users to return (1-1000, default 1000)',
                'minimum', 1,
                'maximum', 1000,
                'default', 1000
            )
        ),
        'required', JSON_ARRAY('channel')
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'GET',
    'https://slack.com/api/conversations.members',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);

-- 5. Get user information
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000085', 'system', 'slack_get_user_info', 'Slack Get User Info',
    'Get information about a Slack user by their user ID',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'user', JSON_OBJECT(
                'type', 'string',
                'description', 'User ID to get information about (e.g., U1234567890)'
            ),
            'include_locale', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Set to true to include the locale for this user',
                'default', false
            )
        ),
        'required', JSON_ARRAY('user')
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'GET',
    'https://slack.com/api/users.info',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);

-- 6. Search for messages
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000086', 'system', 'slack_search_messages', 'Slack Search Messages',
    'Search for messages across all channels the bot has access to',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'query', JSON_OBJECT(
                'type', 'string',
                'description', 'Search query terms'
            ),
            'sort', JSON_OBJECT(
                'type', 'string',
                'description', 'Sort results by timestamp or score',
                'enum', JSON_ARRAY('timestamp', 'score'),
                'default', 'score'
            ),
            'sort_dir', JSON_OBJECT(
                'type', 'string',
                'description', 'Sort direction',
                'enum', JSON_ARRAY('asc', 'desc'),
                'default', 'desc'
            ),
            'count', JSON_OBJECT(
                'type', 'integer',
                'description', 'Number of items to return (1-1000, default 20)',
                'minimum', 1,
                'maximum', 1000,
                'default', 20
            )
        ),
        'required', JSON_ARRAY('query')
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'GET',
    'https://slack.com/api/search.messages',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);

-- 7. React to a message
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000087', 'system', 'slack_add_reaction', 'Slack Add Reaction',
    'Add an emoji reaction to a message',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'channel', JSON_OBJECT(
                'type', 'string',
                'description', 'Channel containing the message'
            ),
            'timestamp', JSON_OBJECT(
                'type', 'string',
                'description', 'Timestamp of the message to react to'
            ),
            'name', JSON_OBJECT(
                'type', 'string',
                'description', 'Emoji name (without colons, e.g., "thumbsup")'
            )
        ),
        'required', JSON_ARRAY('channel', 'timestamp', 'name')
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'POST',
    'https://slack.com/api/reactions.add',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);

-- 8. Get thread replies
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000088', 'system', 'slack_get_thread_replies', 'Slack Get Thread Replies',
    'Retrieve thread replies for a message',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'channel', JSON_OBJECT(
                'type', 'string',
                'description', 'Channel containing the message'
            ),
            'ts', JSON_OBJECT(
                'type', 'string',
                'description', 'Timestamp of the parent message'
            ),
            'limit', JSON_OBJECT(
                'type', 'integer',
                'description', 'Maximum number of replies to return (1-1000, default 1000)',
                'minimum', 1,
                'maximum', 1000,
                'default', 1000
            ),
            'inclusive', JSON_OBJECT(
                'type', 'boolean',
                'description', 'Include the parent message in results',
                'default', false
            )
        ),
        'required', JSON_ARRAY('channel', 'ts')
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'GET',
    'https://slack.com/api/conversations.replies',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);

-- 9. Update message
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000089', 'system', 'slack_update_message', 'Slack Update Message',
    'Update/edit a message that was previously sent',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'channel', JSON_OBJECT(
                'type', 'string',
                'description', 'Channel containing the message'
            ),
            'ts', JSON_OBJECT(
                'type', 'string',
                'description', 'Timestamp of the message to update'
            ),
            'text', JSON_OBJECT(
                'type', 'string',
                'description', 'New text for the message'
            ),
            'blocks', JSON_OBJECT(
                'type', 'array',
                'description', 'Structured blocks to replace the message content',
                'items', JSON_OBJECT('type', 'object')
            ),
            'attachments', JSON_OBJECT(
                'type', 'array',
                'description', 'Secondary attachments for the message',
                'items', JSON_OBJECT('type', 'object')
            )
        ),
        'required', JSON_ARRAY('channel', 'ts')
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'POST',
    'https://slack.com/api/chat.update',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);

-- 10. Join a channel
INSERT INTO function_definitions (
    id, user_id, name, display_name, description, function_group, is_system_resource, is_active,
    parameters_schema, required_api_keys, result_transformer, http_method,
    endpoint_url, headers, fallback_data, api_source
) VALUES (
    '00000000-0000-0000-0000-000000000090', 'system', 'slack_join_channel', 'Slack Join Channel',
    'Join an existing conversation/channel',
    'communication', true, true,
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'channel', JSON_OBJECT(
                'type', 'string',
                'description', 'Channel ID to join'
            )
        ),
        'required', JSON_ARRAY('channel')
    ),
    JSON_ARRAY('SLACK_BOT_TOKEN'),
    NULL,
    'POST',
    'https://slack.com/api/conversations.join',
    JSON_OBJECT(
        'Authorization', 'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type', 'application/json'
    ),
    JSON_OBJECT('error', 'Slack API not available'),
    'slack_api'
);