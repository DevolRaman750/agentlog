-- Revert parameter dependencies changes

-- Revert slack_read_messages schema
UPDATE function_definitions 
SET parameters_schema = JSON_OBJECT(
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
)
WHERE user_id = 'system' 
AND name = 'slack_read_messages';

-- Revert slack_find_channel description
UPDATE function_definitions 
SET description = 'Find a Slack channel ID by channel name. Returns channel information including the ID needed for other Slack functions.'
WHERE user_id = 'system' 
AND name = 'slack_find_channel';