-- Remove automation functions added in 000014

DELETE FROM function_definitions WHERE id IN (
    'email_send',
    'slack_send_message', 
    'discord_send_message',
    'file_upload_cloud',
    'file_download_url',
    'csv_parse_process',
    'json_transform',
    'text_extract_document',
    'http_request_generic',
    'webhook_create_endpoint',
    'calendar_create_event',
    'schedule_task',
    'mysql_query_execute',
    'postgresql_query_execute',
    'text_translate',
    'text_sentiment_analysis'
); 