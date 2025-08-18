-- Fix Slack parameter passing between functions
-- The issue is that Gemini gets channel info but doesn't pass the channel ID to slack_read_messages

-- Update slack_find_channel description to be explicit about the channel ID field
UPDATE function_definitions 
SET description = 'Find a Slack channel ID by channel name. Returns channel information including the "id" field (e.g., "C099KTQE1L5"). Use this "id" value as the "channel" parameter for slack_read_messages.'
WHERE user_id = 'system' 
AND name = 'slack_find_channel';

-- Update slack_read_messages description to be explicit about the channel parameter
UPDATE function_definitions 
SET description = 'Read message history from a Slack channel. REQUIRED: Pass the channel ID (e.g., "C099KTQE1L5") from slack_find_channel as the "channel" parameter.'
WHERE user_id = 'system' 
AND name = 'slack_read_messages';