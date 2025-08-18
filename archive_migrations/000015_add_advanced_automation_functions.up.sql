-- Add advanced automation functions for e-commerce, social media, AI/ML, and monitoring

-- E-commerce Functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, endpoint_url, http_method, required_api_keys, is_system_resource
) VALUES 
-- Stripe payment processing
('stripe_create_payment', 'system', 'stripe_create_payment', 'Create Stripe Payment', 'ecommerce', 'api',
'Create payment intents and process payments through Stripe',
'{"type": "object", "properties": {"amount": {"type": "number", "description": "Payment amount in cents"}, "currency": {"type": "string", "description": "Currency code (e.g., usd, eur)"}, "customer_email": {"type": "string", "description": "Customer email address"}, "description": {"type": "string", "description": "Payment description"}, "metadata": {"type": "object", "description": "Additional metadata"}}, "required": ["amount", "currency"]}',
'https://api.stripe.com/v1/payment_intents', 'POST', '["STRIPE_SECRET_KEY"]', 1),

-- Shopify product management
('shopify_create_product', 'system', 'shopify_create_product', 'Create Shopify Product', 'ecommerce', 'api',
'Create products in Shopify store with variants and inventory',
'{"type": "object", "properties": {"title": {"type": "string", "description": "Product title"}, "description": {"type": "string", "description": "Product description"}, "price": {"type": "number", "description": "Product price"}, "sku": {"type": "string", "description": "Product SKU"}, "inventory_quantity": {"type": "number", "description": "Available quantity"}, "images": {"type": "array", "description": "Product image URLs"}}, "required": ["title", "price"]}',
'https://{shop}.myshopify.com/admin/api/2023-04/products.json', 'POST', '["SHOPIFY_ACCESS_TOKEN"]', 1),

-- WooCommerce order management
('woocommerce_get_orders', 'system', 'woocommerce_get_orders', 'Get WooCommerce Orders', 'ecommerce', 'api',
'Retrieve orders from WooCommerce store with filtering options',
'{"type": "object", "properties": {"status": {"type": "string", "enum": ["pending", "processing", "on-hold", "completed", "cancelled"], "description": "Order status filter"}, "customer_email": {"type": "string", "description": "Filter by customer email"}, "date_from": {"type": "string", "description": "Start date for order range"}, "date_to": {"type": "string", "description": "End date for order range"}, "limit": {"type": "number", "description": "Number of orders to retrieve (max 100)"}}, "required": []}',
'https://{domain}/wp-json/wc/v3/orders', 'GET', '["WOOCOMMERCE_CONSUMER_KEY", "WOOCOMMERCE_CONSUMER_SECRET"]', 1);

-- Social Media Functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, endpoint_url, http_method, required_api_keys, is_system_resource
) VALUES 
-- Twitter/X posting
('twitter_post_tweet', 'system', 'twitter_post_tweet', 'Post Tweet', 'social_media', 'api',
'Post tweets to Twitter/X with media attachments and hashtags',
'{"type": "object", "properties": {"text": {"type": "string", "description": "Tweet content (max 280 chars)"}, "media_urls": {"type": "array", "description": "URLs of media to attach"}, "reply_to_tweet_id": {"type": "string", "description": "ID of tweet to reply to"}, "poll_options": {"type": "array", "description": "Poll options if creating a poll"}}, "required": ["text"]}',
'https://api.twitter.com/2/tweets', 'POST', '["TWITTER_BEARER_TOKEN"]', 1),

-- LinkedIn content posting
('linkedin_create_post', 'system', 'linkedin_create_post', 'Create LinkedIn Post', 'social_media', 'api',
'Create posts on LinkedIn with rich media and targeting',
'{"type": "object", "properties": {"text": {"type": "string", "description": "Post content"}, "visibility": {"type": "string", "enum": ["PUBLIC", "CONNECTIONS"], "description": "Post visibility"}, "media_url": {"type": "string", "description": "Media URL to attach"}, "article_url": {"type": "string", "description": "Article URL to share"}}, "required": ["text"]}',
'https://api.linkedin.com/v2/ugcPosts', 'POST', '["LINKEDIN_ACCESS_TOKEN"]', 1),

-- Instagram media posting
('instagram_post_media', 'system', 'instagram_post_media', 'Post Instagram Media', 'social_media', 'api',
'Post photos and videos to Instagram with captions and hashtags',
'{"type": "object", "properties": {"media_url": {"type": "string", "description": "URL of media to post"}, "caption": {"type": "string", "description": "Post caption"}, "media_type": {"type": "string", "enum": ["IMAGE", "VIDEO"], "description": "Type of media"}, "location_id": {"type": "string", "description": "Location tag ID (optional)"}}, "required": ["media_url", "media_type"]}',
'https://graph.facebook.com/v18.0/{instagram-account-id}/media', 'POST', '["INSTAGRAM_ACCESS_TOKEN"]', 1);

-- AI/ML Services Functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, endpoint_url, http_method, required_api_keys, is_system_resource
) VALUES 
-- OpenAI text completion
('openai_text_completion', 'system', 'openai_text_completion', 'OpenAI Text Completion', 'ai_ml', 'api',
'Generate text completions using OpenAI GPT models',
'{"type": "object", "properties": {"prompt": {"type": "string", "description": "Text prompt for completion"}, "model": {"type": "string", "enum": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"], "description": "Model to use"}, "max_tokens": {"type": "number", "description": "Maximum tokens to generate"}, "temperature": {"type": "number", "description": "Creativity level (0-1)"}, "system_prompt": {"type": "string", "description": "System instructions"}}, "required": ["prompt"]}',
'https://api.openai.com/v1/chat/completions', 'POST', '["OPENAI_API_KEY"]', 1),

-- OpenAI image generation
('openai_image_generation', 'system', 'openai_image_generation', 'Generate Image with DALL-E', 'ai_ml', 'api',
'Generate images using OpenAI DALL-E models',
'{"type": "object", "properties": {"prompt": {"type": "string", "description": "Image description prompt"}, "model": {"type": "string", "enum": ["dall-e-2", "dall-e-3"], "description": "Model version to use"}, "size": {"type": "string", "enum": ["256x256", "512x512", "1024x1024"], "description": "Image size"}, "quality": {"type": "string", "enum": ["standard", "hd"], "description": "Image quality"}, "n": {"type": "number", "description": "Number of images to generate (1-4)"}}, "required": ["prompt"]}',
'https://api.openai.com/v1/images/generations', 'POST', '["OPENAI_API_KEY"]', 1),

-- Google Vision AI
('google_vision_analyze', 'system', 'google_vision_analyze', 'Analyze Image with Google Vision', 'ai_ml', 'api',
'Analyze images for objects, text, faces, and other features using Google Vision AI',
'{"type": "object", "properties": {"image_url": {"type": "string", "description": "URL of image to analyze"}, "features": {"type": "array", "description": "Features to detect (LABEL_DETECTION, TEXT_DETECTION, FACE_DETECTION, etc.)"}, "max_results": {"type": "number", "description": "Maximum results per feature"}}, "required": ["image_url", "features"]}',
'https://vision.googleapis.com/v1/images:annotate', 'POST', '["GOOGLE_VISION_API_KEY"]', 1);

-- Monitoring and Analytics Functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, endpoint_url, http_method, required_api_keys, is_system_resource
) VALUES 
-- Website uptime monitoring
('monitor_website_uptime', 'system', 'monitor_website_uptime', 'Monitor Website Uptime', 'monitoring', 'api',
'Monitor website availability and response times with alerts',
'{"type": "object", "properties": {"url": {"type": "string", "description": "Website URL to monitor"}, "check_interval": {"type": "number", "description": "Check interval in minutes"}, "timeout": {"type": "number", "description": "Request timeout in seconds"}, "expected_status": {"type": "number", "description": "Expected HTTP status code"}, "alert_email": {"type": "string", "description": "Email for downtime alerts"}}, "required": ["url"]}',
'https://api.uptimerobot.com/v2/newMonitor', 'POST', '["UPTIME_ROBOT_API_KEY"]', 1),

-- Google Analytics reporting
('google_analytics_report', 'system', 'google_analytics_report', 'Get Google Analytics Report', 'monitoring', 'api',
'Retrieve analytics data and reports from Google Analytics',
'{"type": "object", "properties": {"view_id": {"type": "string", "description": "Google Analytics view ID"}, "start_date": {"type": "string", "description": "Report start date (YYYY-MM-DD)"}, "end_date": {"type": "string", "description": "Report end date (YYYY-MM-DD)"}, "metrics": {"type": "array", "description": "Metrics to retrieve (sessions, users, pageviews, etc.)"}, "dimensions": {"type": "array", "description": "Dimensions to group by (country, source, etc.)"}}, "required": ["view_id", "start_date", "end_date", "metrics"]}',
'https://analyticsreporting.googleapis.com/v4/reports:batchGet', 'POST', '["GOOGLE_ANALYTICS_API_KEY"]', 1),

-- Application performance monitoring
('apm_create_alert', 'system', 'apm_create_alert', 'Create Performance Alert', 'monitoring', 'api',
'Create performance monitoring alerts for applications and infrastructure',
'{"type": "object", "properties": {"alert_name": {"type": "string", "description": "Unique alert identifier"}, "metric": {"type": "string", "description": "Metric to monitor (cpu, memory, response_time, error_rate)"}, "threshold": {"type": "number", "description": "Alert threshold value"}, "condition": {"type": "string", "enum": ["above", "below"], "description": "Alert condition"}, "duration": {"type": "number", "description": "Duration in minutes before alerting"}, "notification_channels": {"type": "array", "description": "Alert notification channels"}}, "required": ["alert_name", "metric", "threshold", "condition"]}',
'https://api.monitoring.service.com/alerts', 'POST', '["MONITORING_API_KEY"]', 1);

-- CRM and Business Functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, endpoint_url, http_method, required_api_keys, is_system_resource
) VALUES 
-- Salesforce CRM integration
('salesforce_create_lead', 'system', 'salesforce_create_lead', 'Create Salesforce Lead', 'crm', 'api',
'Create leads in Salesforce CRM with contact information and lead source',
'{"type": "object", "properties": {"first_name": {"type": "string", "description": "Lead first name"}, "last_name": {"type": "string", "description": "Lead last name"}, "email": {"type": "string", "description": "Lead email address"}, "company": {"type": "string", "description": "Lead company"}, "phone": {"type": "string", "description": "Lead phone number"}, "lead_source": {"type": "string", "description": "Lead source (Web, Email, etc.)"}, "status": {"type": "string", "description": "Lead status"}}, "required": ["last_name", "company"]}',
'https://{instance}.salesforce.com/services/data/v58.0/sobjects/Lead/', 'POST', '["SALESFORCE_ACCESS_TOKEN"]', 1),

-- HubSpot contact management
('hubspot_create_contact', 'system', 'hubspot_create_contact', 'Create HubSpot Contact', 'crm', 'api',
'Create contacts in HubSpot CRM with properties and lifecycle stage',
'{"type": "object", "properties": {"email": {"type": "string", "description": "Contact email address"}, "firstname": {"type": "string", "description": "Contact first name"}, "lastname": {"type": "string", "description": "Contact last name"}, "phone": {"type": "string", "description": "Contact phone number"}, "company": {"type": "string", "description": "Contact company"}, "website": {"type": "string", "description": "Contact website"}, "lifecyclestage": {"type": "string", "description": "Contact lifecycle stage"}}, "required": ["email"]}',
'https://api.hubapi.com/crm/v3/objects/contacts', 'POST', '["HUBSPOT_API_KEY"]', 1),

-- Trello project management
('trello_create_card', 'system', 'trello_create_card', 'Create Trello Card', 'project_management', 'api',
'Create cards in Trello boards with descriptions, due dates, and labels',
'{"type": "object", "properties": {"list_id": {"type": "string", "description": "Trello list ID where card will be created"}, "name": {"type": "string", "description": "Card title"}, "desc": {"type": "string", "description": "Card description"}, "due": {"type": "string", "description": "Due date (ISO format)"}, "pos": {"type": "string", "description": "Card position (top, bottom, or number)"}, "labels": {"type": "array", "description": "Array of label IDs"}}, "required": ["list_id", "name"]}',
'https://api.trello.com/1/cards', 'POST', '["TRELLO_API_KEY", "TRELLO_API_TOKEN"]', 1),

-- Asana task management
('asana_create_task', 'system', 'asana_create_task', 'Create Asana Task', 'project_management', 'api',
'Create tasks in Asana projects with assignees, due dates, and dependencies',
'{"type": "object", "properties": {"name": {"type": "string", "description": "Task name"}, "notes": {"type": "string", "description": "Task description"}, "projects": {"type": "array", "description": "Array of project IDs"}, "assignee": {"type": "string", "description": "User ID of assignee"}, "due_on": {"type": "string", "description": "Due date (YYYY-MM-DD)"}, "completed": {"type": "boolean", "description": "Task completion status"}}, "required": ["name"]}',
'https://app.asana.com/api/1.0/tasks', 'POST', '["ASANA_ACCESS_TOKEN"]', 1); 