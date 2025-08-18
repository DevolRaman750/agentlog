-- Add parameter dependencies to function schemas to guide parameter extraction
-- This eliminates the need for hardcoded synthesis logic

-- Update slack_read_messages to include parameter dependency information
UPDATE function_definitions 
SET parameters_schema = JSON_OBJECT(
    'type', 'object',
    'properties', JSON_OBJECT(
        'channel', JSON_OBJECT(
            'type', 'string',
            'description', 'Channel ID to read messages from (e.g., C1234567890 for channel, D1234567890 for DM). EXTRACT from slack_find_channel result: result.channels[0].id',
            'parameter_source', JSON_OBJECT(
                'function', 'slack_find_channel',
                'path', 'channels[0].id',
                'description', 'Extract the channel ID from slack_find_channel results'
            )
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
    'required', JSON_ARRAY('channel'),
    'parameter_dependencies', JSON_OBJECT(
        'channel', JSON_OBJECT(
            'source_function', 'slack_find_channel',
            'extraction_path', 'channels[0].id',
            'example', 'For channel named "ai-intern", extract: result.channels.find(c => c.name === "ai-intern").id'
        )
    )
)
WHERE user_id = 'system' 
AND name = 'slack_read_messages';

-- Update slack_find_channel to be explicit about its output
UPDATE function_definitions 
SET description = 'Find a Slack channel ID by channel name. Returns channel information with "id" field that should be used as the "channel" parameter for slack_read_messages. Example output: {"channels": [{"id": "C099KTQE1L5", "name": "ai-intern"}]}'
WHERE user_id = 'system' 
AND name = 'slack_find_channel';