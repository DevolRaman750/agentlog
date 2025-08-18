-- Revert the fix for NULL JSON values
-- Note: This will restore NULL values for functions that had them originally

-- Revert mock_response back to NULL for automation functions added in migrations 014 and 015
UPDATE function_definitions 
SET mock_response = NULL
WHERE id IN (
    'email_send', 'slack_send_message', 'discord_send_message',
    'file_upload_cloud', 'file_download_url', 'csv_parse_process',
    'json_transform', 'text_extract_document', 'http_request_generic',
    'webhook_create_endpoint', 'calendar_create_event', 'schedule_task',
    'mysql_query_execute', 'postgresql_query_execute', 'text_translate',
    'text_sentiment_analysis', 'stripe_create_payment', 'shopify_create_product',
    'woocommerce_get_orders', 'twitter_post_tweet', 'linkedin_create_post',
    'instagram_post_media', 'openai_text_completion', 'openai_image_generation',
    'google_vision_analyze', 'monitor_website_uptime', 'google_analytics_report',
    'apm_create_alert', 'salesforce_create_lead', 'hubspot_create_contact',
    'trello_create_card', 'asana_create_task'
);

-- Revert headers back to NULL for automation functions  
UPDATE function_definitions 
SET headers = NULL
WHERE id IN (
    'email_send', 'slack_send_message', 'discord_send_message',
    'file_upload_cloud', 'file_download_url', 'csv_parse_process',
    'json_transform', 'text_extract_document', 'http_request_generic',
    'webhook_create_endpoint', 'calendar_create_event', 'schedule_task',
    'mysql_query_execute', 'postgresql_query_execute', 'text_translate',
    'text_sentiment_analysis', 'stripe_create_payment', 'shopify_create_product',
    'woocommerce_get_orders', 'twitter_post_tweet', 'linkedin_create_post',
    'instagram_post_media', 'openai_text_completion', 'openai_image_generation',
    'google_vision_analyze', 'monitor_website_uptime', 'google_analytics_report',
    'apm_create_alert', 'salesforce_create_lead', 'hubspot_create_contact',
    'trello_create_card', 'asana_create_task'
);

-- Revert auth_config back to NULL for automation functions
UPDATE function_definitions 
SET auth_config = NULL
WHERE id IN (
    'email_send', 'slack_send_message', 'discord_send_message',
    'file_upload_cloud', 'file_download_url', 'csv_parse_process',
    'json_transform', 'text_extract_document', 'http_request_generic',
    'webhook_create_endpoint', 'calendar_create_event', 'schedule_task',
    'mysql_query_execute', 'postgresql_query_execute', 'text_translate',
    'text_sentiment_analysis', 'stripe_create_payment', 'shopify_create_product',
    'woocommerce_get_orders', 'twitter_post_tweet', 'linkedin_create_post',
    'instagram_post_media', 'openai_text_completion', 'openai_image_generation',
    'google_vision_analyze', 'monitor_website_uptime', 'google_analytics_report',
    'apm_create_alert', 'salesforce_create_lead', 'hubspot_create_contact',
    'trello_create_card', 'asana_create_task'
); 