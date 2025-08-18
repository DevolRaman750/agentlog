-- Remove comprehensive Slack API functions

DELETE FROM function_definitions WHERE user_id = 'system' AND name IN (
    'slack_read_messages',
    'slack_list_channels', 
    'slack_get_channel_info',
    'slack_get_channel_members',
    'slack_get_user_info',
    'slack_search_messages',
    'slack_add_reaction',
    'slack_get_thread_replies',
    'slack_update_message',
    'slack_join_channel'
);