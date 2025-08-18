-- Remove the Slack channel name resolution function

DELETE FROM function_definitions 
WHERE user_id = 'system' 
AND name = 'slack_find_channel'
AND id = '00000000-0000-0000-0000-000000000095';