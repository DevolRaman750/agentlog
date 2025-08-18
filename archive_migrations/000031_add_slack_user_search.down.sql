-- Remove Slack user search and workspace functions

DELETE FROM function_definitions WHERE user_id = 'system' AND name IN (
    'slack_search_users',
    'slack_get_team_info',
    'slack_list_users',
    'slack_get_user_presence'
);