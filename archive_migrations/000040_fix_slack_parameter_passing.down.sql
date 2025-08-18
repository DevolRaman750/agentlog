-- Revert the Slack parameter passing fixes

-- Revert slack_find_channel description
UPDATE function_definitions 
SET description = 'Find a Slack channel ID by channel name. CRITICAL WORKFLOW: After getting the channel ID from this function, you MUST immediately call slack_read_messages using that channel ID. DO NOT call slack_find_channel again. The workflow is: 1) slack_find_channel (once) → 2) slack_read_messages (with the channel ID).'
WHERE user_id = 'system' 
AND name = 'slack_find_channel';

-- Revert slack_read_messages description
UPDATE function_definitions 
SET description = 'Read message history from a Slack channel using the channel ID from slack_find_channel. This function completes the Slack workflow. If the response shows empty messages, the task is complete - report that no messages were found and STOP calling functions.'
WHERE user_id = 'system' 
AND name = 'slack_read_messages';