-- Remove advanced automation functions added in 000015

DELETE FROM function_definitions WHERE id IN (
    'stripe_create_payment',
    'shopify_create_product',
    'woocommerce_get_orders',
    'twitter_post_tweet',
    'linkedin_create_post',
    'instagram_post_media',
    'openai_text_completion',
    'openai_image_generation',
    'google_vision_analyze',
    'monitor_website_uptime',
    'google_analytics_report',
    'apm_create_alert',
    'salesforce_create_lead',
    'hubspot_create_contact',
    'trello_create_card',
    'asana_create_task'
); 