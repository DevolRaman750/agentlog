-- Add advanced automation functions for comprehensive agent capabilities
-- Part 2: E-commerce, Social Media, Content Generation, Monitoring, Data Processing

INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, description,
    parameters_schema, mock_response, endpoint_url, http_method, headers,
    is_active, is_system_resource, required_api_keys, api_key_validation,
    fallback_data, created_at, updated_at
) VALUES 

-- E-COMMERCE & PAYMENTS
(
    'func-stripe-payment', 'system', 'stripe_create_payment', 'Create Stripe Payment',
    'ecommerce', 'Create payment intents and process payments via Stripe',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'amount', JSON_OBJECT('type', 'integer', 'description', 'Payment amount in smallest currency unit (cents)'),
            'currency', JSON_OBJECT('type', 'string', 'default', 'usd', 'description', 'Three-letter currency code'),
            'customer_email', JSON_OBJECT('type', 'string', 'description', 'Customer email address'),
            'description', JSON_OBJECT('type', 'string', 'description', 'Payment description'),
            'metadata', JSON_OBJECT('type', 'object', 'description', 'Additional metadata')
        ),
        'required', JSON_ARRAY('amount', 'customer_email')
    ),
    JSON_OBJECT('payment_intent_id', 'pi_1234567890', 'status', 'requires_payment_method', 'client_secret', 'pi_123_secret_456', '_metadata', JSON_OBJECT('source', 'mock')),
    'https://api.stripe.com/v1/payment_intents', 'POST',
    JSON_OBJECT('Authorization', 'Bearer {{stripeSecretKey}}', 'Content-Type', 'application/x-www-form-urlencoded'),
    1, 1, JSON_ARRAY('stripeSecretKey'),
    JSON_OBJECT('stripeSecretKey', JSON_OBJECT('required', true, 'description', 'Stripe Secret Key')),
    JSON_OBJECT('error', 'Payment creation failed', 'payment_intent_id', null, '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),
(
    'func-shopify-product', 'system', 'shopify_create_product', 'Create Shopify Product',
    'ecommerce', 'Create and manage products in Shopify stores',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'title', JSON_OBJECT('type', 'string', 'description', 'Product title'),
            'description', JSON_OBJECT('type', 'string', 'description', 'Product description'),
            'price', JSON_OBJECT('type', 'number', 'description', 'Product price'),
            'inventory_quantity', JSON_OBJECT('type', 'integer', 'description', 'Available inventory'),
            'images', JSON_OBJECT('type', 'array', 'description', 'Product image URLs'),
            'tags', JSON_OBJECT('type', 'array', 'description', 'Product tags')
        ),
        'required', JSON_ARRAY('title', 'price')
    ),
    JSON_OBJECT('product_id', 123456789, 'handle', 'sample-product', 'status', 'active', '_metadata', JSON_OBJECT('source', 'mock')),
    'https://{{shop}}.myshopify.com/admin/api/2023-10/products.json', 'POST',
    JSON_OBJECT('X-Shopify-Access-Token', '{{shopifyAccessToken}}', 'Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('shopifyAccessToken', 'shopifyShopName'),
    JSON_OBJECT('shopifyAccessToken', JSON_OBJECT('required', true), 'shopifyShopName', JSON_OBJECT('required', true)),
    JSON_OBJECT('error', 'Product creation failed', 'product_id', null, '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),

-- SOCIAL MEDIA
(
    'func-twitter-post', 'system', 'twitter_post_tweet', 'Post Tweet',
    'social_media', 'Post tweets and manage Twitter content',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'text', JSON_OBJECT('type', 'string', 'description', 'Tweet text (max 280 characters)'),
            'media_ids', JSON_OBJECT('type', 'array', 'description', 'Media attachment IDs'),
            'reply_to_tweet_id', JSON_OBJECT('type', 'string', 'description', 'Tweet ID to reply to'),
            'thread', JSON_OBJECT('type', 'boolean', 'default', false, 'description', 'Part of a thread')
        ),
        'required', JSON_ARRAY('text')
    ),
    JSON_OBJECT('tweet_id', '1234567890123456789', 'url', 'https://twitter.com/user/status/1234567890123456789', '_metadata', JSON_OBJECT('source', 'mock')),
    'https://api.twitter.com/2/tweets', 'POST',
    JSON_OBJECT('Authorization', 'Bearer {{twitterBearerToken}}', 'Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('twitterBearerToken'),
    JSON_OBJECT('twitterBearerToken', JSON_OBJECT('required', true, 'description', 'Twitter API Bearer Token')),
    JSON_OBJECT('error', 'Tweet posting failed', 'tweet_id', null, '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),
(
    'func-linkedin-post', 'system', 'linkedin_share_post', 'Share LinkedIn Post',
    'social_media', 'Share posts and updates on LinkedIn',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'text', JSON_OBJECT('type', 'string', 'description', 'Post content'),
            'visibility', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('PUBLIC', 'CONNECTIONS'), 'default', 'PUBLIC'),
            'media_url', JSON_OBJECT('type', 'string', 'description', 'Image or video URL to attach'),
            'article_url', JSON_OBJECT('type', 'string', 'description', 'Article URL to share')
        ),
        'required', JSON_ARRAY('text')
    ),
    JSON_OBJECT('post_id', 'urn:li:share:1234567890', 'activity_url', 'https://linkedin.com/feed/update/urn:li:share:1234567890', '_metadata', JSON_OBJECT('source', 'mock')),
    'https://api.linkedin.com/v2/shares', 'POST',
    JSON_OBJECT('Authorization', 'Bearer {{linkedinAccessToken}}', 'Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('linkedinAccessToken'),
    JSON_OBJECT('linkedinAccessToken', JSON_OBJECT('required', true, 'description', 'LinkedIn Access Token')),
    JSON_OBJECT('error', 'LinkedIn post failed', 'post_id', null, '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),

-- CONTENT GENERATION
(
    'func-openai-text', 'system', 'openai_generate_text', 'Generate Text with OpenAI',
    'ai_processing', 'Generate text content using OpenAI GPT models',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'prompt', JSON_OBJECT('type', 'string', 'description', 'Text prompt for generation'),
            'model', JSON_OBJECT('type', 'string', 'default', 'gpt-3.5-turbo', 'description', 'OpenAI model to use'),
            'max_tokens', JSON_OBJECT('type', 'integer', 'default', 500, 'description', 'Maximum tokens to generate'),
            'temperature', JSON_OBJECT('type', 'number', 'default', 0.7, 'description', 'Creativity level (0-1)'),
            'system_message', JSON_OBJECT('type', 'string', 'description', 'System instruction for the AI')
        ),
        'required', JSON_ARRAY('prompt')
    ),
    JSON_OBJECT('generated_text', 'Generated content...', 'tokens_used', 245, 'model_used', 'gpt-3.5-turbo', '_metadata', JSON_OBJECT('source', 'mock')),
    'https://api.openai.com/v1/chat/completions', 'POST',
    JSON_OBJECT('Authorization', 'Bearer {{openaiApiKey}}', 'Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('openaiApiKey'),
    JSON_OBJECT('openaiApiKey', JSON_OBJECT('required', true, 'description', 'OpenAI API Key')),
    JSON_OBJECT('generated_text', '', 'error', 'Text generation failed', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),
(
    'func-image-generate', 'system', 'image_generate_dalle', 'Generate Image with DALL-E',
    'ai_processing', 'Generate images using DALL-E or similar AI image models',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'prompt', JSON_OBJECT('type', 'string', 'description', 'Description of image to generate'),
            'size', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('256x256', '512x512', '1024x1024'), 'default', '512x512'),
            'quality', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('standard', 'hd'), 'default', 'standard'),
            'style', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('vivid', 'natural'), 'default', 'vivid')
        ),
        'required', JSON_ARRAY('prompt')
    ),
    JSON_OBJECT('image_url', 'https://oaidalleapiprodscus.blob.core.windows.net/private/sample.png', 'revised_prompt', 'Enhanced prompt...', '_metadata', JSON_OBJECT('source', 'mock')),
    'https://api.openai.com/v1/images/generations', 'POST',
    JSON_OBJECT('Authorization', 'Bearer {{openaiApiKey}}', 'Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('openaiApiKey'),
    JSON_OBJECT('openaiApiKey', JSON_OBJECT('required', true, 'description', 'OpenAI API Key')),
    JSON_OBJECT('image_url', null, 'error', 'Image generation failed', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),

-- MONITORING & ANALYTICS
(
    'func-website-monitor', 'system', 'website_uptime_check', 'Website Uptime Check',
    'monitoring', 'Monitor website uptime and performance',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'url', JSON_OBJECT('type', 'string', 'description', 'Website URL to monitor'),
            'timeout', JSON_OBJECT('type', 'integer', 'default', 10, 'description', 'Request timeout in seconds'),
            'expected_status', JSON_OBJECT('type', 'integer', 'default', 200, 'description', 'Expected HTTP status code'),
            'check_ssl', JSON_OBJECT('type', 'boolean', 'default', true, 'description', 'Verify SSL certificate')
        ),
        'required', JSON_ARRAY('url')
    ),
    JSON_OBJECT('status', 'up', 'response_time_ms', 245, 'status_code', 200, 'ssl_valid', true, '_metadata', JSON_OBJECT('source', 'mock')),
    '{{url}}', 'GET', JSON_OBJECT('User-Agent', 'GoGent-Monitor/1.0'),
    1, 1, JSON_ARRAY(), JSON_OBJECT(),
    JSON_OBJECT('status', 'down', 'error', 'Connection timeout', 'response_time_ms', null, '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),
(
    'func-google-analytics', 'system', 'google_analytics_report', 'Google Analytics Report',
    'analytics', 'Fetch website analytics data from Google Analytics',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'property_id', JSON_OBJECT('type', 'string', 'description', 'GA4 Property ID'),
            'start_date', JSON_OBJECT('type', 'string', 'description', 'Start date (YYYY-MM-DD)'),
            'end_date', JSON_OBJECT('type', 'string', 'description', 'End date (YYYY-MM-DD)'),
            'metrics', JSON_OBJECT('type', 'array', 'description', 'Metrics to retrieve (sessions, users, etc.)'),
            'dimensions', JSON_OBJECT('type', 'array', 'description', 'Dimensions to group by')
        ),
        'required', JSON_ARRAY('property_id', 'start_date', 'end_date')
    ),
    JSON_OBJECT('sessions', 1500, 'users', 1200, 'page_views', 2800, 'bounce_rate', 0.35, '_metadata', JSON_OBJECT('source', 'mock')),
    'https://analyticsreporting.googleapis.com/v4/reports:batchGet', 'POST',
    JSON_OBJECT('Authorization', 'Bearer {{googleAnalyticsToken}}', 'Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('googleAnalyticsToken'),
    JSON_OBJECT('googleAnalyticsToken', JSON_OBJECT('required', true, 'description', 'Google Analytics API token')),
    JSON_OBJECT('error', 'Analytics data unavailable', 'sessions', 0, '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),

-- DATA PROCESSING
(
    'func-json-transform', 'system', 'json_transform', 'Transform JSON Data',
    'data_transform', 'Transform and manipulate JSON data with JQ-like operations',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'input_data', JSON_OBJECT('type', 'object', 'description', 'Input JSON data to transform'),
            'transformation', JSON_OBJECT('type', 'string', 'description', 'JQ-style transformation expression'),
            'output_format', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('json', 'csv', 'xml'), 'default', 'json')
        ),
        'required', JSON_ARRAY('input_data', 'transformation')
    ),
    JSON_OBJECT('transformed_data', JSON_OBJECT('result', 'transformed'), 'row_count', 1, '_metadata', JSON_OBJECT('source', 'mock')),
    null, null, JSON_OBJECT(), 1, 1, JSON_ARRAY(), JSON_OBJECT(),
    JSON_OBJECT('transformed_data', null, 'error', 'Transformation failed', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),
(
    'func-excel-parse', 'system', 'excel_parse', 'Parse Excel File',
    'data_transform', 'Parse Excel (.xlsx) files and extract data',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'file_url', JSON_OBJECT('type', 'string', 'description', 'URL to Excel file'),
            'file_content', JSON_OBJECT('type', 'string', 'description', 'Base64 encoded Excel file'),
            'sheet_name', JSON_OBJECT('type', 'string', 'description', 'Specific sheet to parse'),
            'has_header', JSON_OBJECT('type', 'boolean', 'default', true, 'description', 'First row contains headers'),
            'range', JSON_OBJECT('type', 'string', 'description', 'Cell range to parse (e.g., A1:C10)')
        ),
        'required', JSON_ARRAY()
    ),
    JSON_OBJECT('sheets', JSON_ARRAY('Sheet1'), 'data', JSON_ARRAY(JSON_OBJECT('col1', 'value1')), 'total_rows', 100, '_metadata', JSON_OBJECT('source', 'mock')),
    null, null, JSON_OBJECT(), 1, 1, JSON_ARRAY(), JSON_OBJECT(),
    JSON_OBJECT('data', JSON_ARRAY(), 'error', 'Excel parsing failed', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),

-- CRM & CUSTOMER DATA
(
    'func-salesforce-lead', 'system', 'salesforce_create_lead', 'Create Salesforce Lead',
    'crm', 'Create and manage leads in Salesforce CRM',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'first_name', JSON_OBJECT('type', 'string', 'description', 'Lead first name'),
            'last_name', JSON_OBJECT('type', 'string', 'description', 'Lead last name'),
            'email', JSON_OBJECT('type', 'string', 'description', 'Lead email address'),
            'company', JSON_OBJECT('type', 'string', 'description', 'Lead company'),
            'phone', JSON_OBJECT('type', 'string', 'description', 'Lead phone number'),
            'lead_source', JSON_OBJECT('type', 'string', 'description', 'Source of the lead')
        ),
        'required', JSON_ARRAY('last_name', 'email', 'company')
    ),
    JSON_OBJECT('lead_id', '00Q1234567890ABC', 'success', true, '_metadata', JSON_OBJECT('source', 'mock')),
    'https://{{instance}}.salesforce.com/services/data/v58.0/sobjects/Lead', 'POST',
    JSON_OBJECT('Authorization', 'Bearer {{salesforceAccessToken}}', 'Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('salesforceAccessToken', 'salesforceInstance'),
    JSON_OBJECT('salesforceAccessToken', JSON_OBJECT('required', true), 'salesforceInstance', JSON_OBJECT('required', true)),
    JSON_OBJECT('lead_id', null, 'success', false, 'error', 'Lead creation failed', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),

-- TASK MANAGEMENT
(
    'func-trello-card', 'system', 'trello_create_card', 'Create Trello Card',
    'project_management', 'Create cards and manage Trello boards',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'list_id', JSON_OBJECT('type', 'string', 'description', 'Trello list ID'),
            'name', JSON_OBJECT('type', 'string', 'description', 'Card title'),
            'description', JSON_OBJECT('type', 'string', 'description', 'Card description'),
            'due_date', JSON_OBJECT('type', 'string', 'description', 'Due date (ISO 8601)'),
            'labels', JSON_OBJECT('type', 'array', 'description', 'Label IDs to assign'),
            'members', JSON_OBJECT('type', 'array', 'description', 'Member IDs to assign')
        ),
        'required', JSON_ARRAY('list_id', 'name')
    ),
    JSON_OBJECT('card_id', '1234567890abcdef', 'url', 'https://trello.com/c/abc123', '_metadata', JSON_OBJECT('source', 'mock')),
    'https://api.trello.com/1/cards', 'POST',
    JSON_OBJECT('Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('trelloApiKey', 'trelloToken'),
    JSON_OBJECT('trelloApiKey', JSON_OBJECT('required', true), 'trelloToken', JSON_OBJECT('required', true)),
    JSON_OBJECT('card_id', null, 'error', 'Card creation failed', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
);

-- Set query templates for functions that need them
UPDATE function_definitions SET query_template = '{"amount": {{amount}}, "currency": "{{currency}}", "receipt_email": "{{customer_email}}", "description": "{{description}}"}' WHERE name = 'stripe_create_payment';
UPDATE function_definitions SET query_template = '{"product": {"title": "{{title}}", "body_html": "{{description}}", "vendor": "Default", "product_type": "General", "variants": [{"price": "{{price}}", "inventory_quantity": {{inventory_quantity}}}]}}' WHERE name = 'shopify_create_product';
UPDATE function_definitions SET query_template = '{"text": "{{text}}"}' WHERE name = 'twitter_post_tweet';
UPDATE function_definitions SET query_template = '{"author": "urn:li:person:{{person_id}}", "lifecycleState": "PUBLISHED", "specificContent": {"com.linkedin.ugc.ShareContent": {"shareCommentary": {"text": "{{text}}"}, "shareMediaCategory": "NONE"}}, "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "{{visibility}}"}}' WHERE name = 'linkedin_share_post'; 