-- Add comprehensive automation functions for enhanced agent capabilities

-- Communication Functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, endpoint_url, http_method, required_api_keys, is_system_resource
) VALUES 
-- Email sending
('email_send', 'system', 'email_send', 'Send Email', 'communication', 'api', 
'Send emails via SMTP or email service providers',
'{"type": "object", "properties": {"to": {"type": "string", "description": "Recipient email address"}, "subject": {"type": "string", "description": "Email subject"}, "body": {"type": "string", "description": "Email body content"}, "cc": {"type": "string", "description": "CC recipients (optional)"}, "bcc": {"type": "string", "description": "BCC recipients (optional)"}}, "required": ["to", "subject", "body"]}',
'https://api.sendgrid.v3/mail/send', 'POST', '["SENDGRID_API_KEY"]', 1),

-- Slack messaging
('slack_send_message', 'system', 'slack_send_message', 'Send Slack Message', 'communication', 'api',
'Send messages to Slack channels or users',
'{"type": "object", "properties": {"channel": {"type": "string", "description": "Channel ID or name"}, "text": {"type": "string", "description": "Message text"}, "username": {"type": "string", "description": "Bot username (optional)"}, "attachments": {"type": "array", "description": "Message attachments (optional)"}}, "required": ["channel", "text"]}',
'https://slack.com/api/chat.postMessage', 'POST', '["SLACK_BOT_TOKEN"]', 1),

-- Discord messaging
('discord_send_message', 'system', 'discord_send_message', 'Send Discord Message', 'communication', 'api',
'Send messages to Discord channels',
'{"type": "object", "properties": {"channel_id": {"type": "string", "description": "Discord channel ID"}, "content": {"type": "string", "description": "Message content"}, "username": {"type": "string", "description": "Webhook username (optional)"}, "embeds": {"type": "array", "description": "Message embeds (optional)"}}, "required": ["channel_id", "content"]}',
'https://discord.com/api/webhooks/{webhook_id}/{webhook_token}', 'POST', '["DISCORD_WEBHOOK_URL"]', 1);

-- File Management Functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, endpoint_url, http_method, required_api_keys, is_system_resource
) VALUES 
-- File upload to cloud storage
('file_upload_cloud', 'system', 'file_upload_cloud', 'Upload File to Cloud', 'file_management', 'api',
'Upload files to cloud storage services like AWS S3, Google Drive, or Dropbox',
'{"type": "object", "properties": {"file_content": {"type": "string", "description": "Base64 encoded file content"}, "filename": {"type": "string", "description": "Target filename"}, "folder_path": {"type": "string", "description": "Destination folder path"}, "storage_provider": {"type": "string", "enum": ["s3", "gdrive", "dropbox"], "description": "Cloud storage provider"}}, "required": ["file_content", "filename", "storage_provider"]}',
'https://api.storage.provider.com/upload', 'POST', '["CLOUD_STORAGE_API_KEY"]', 1),

-- File download
('file_download_url', 'system', 'file_download_url', 'Download File from URL', 'file_management', 'api',
'Download files from URLs and optionally save to cloud storage',
'{"type": "object", "properties": {"url": {"type": "string", "description": "File URL to download"}, "filename": {"type": "string", "description": "Save filename (optional)"}, "save_to_cloud": {"type": "boolean", "description": "Whether to save to cloud storage"}}, "required": ["url"]}',
'https://api.fileprocessor.com/download', 'POST', '[]', 1);

-- Data Processing Functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, endpoint_url, http_method, required_api_keys, is_system_resource
) VALUES 
-- CSV parsing and processing
('csv_parse_process', 'system', 'csv_parse_process', 'Parse CSV Data', 'data_processing', 'api',
'Parse and process CSV data with filtering and transformation options',
'{"type": "object", "properties": {"csv_content": {"type": "string", "description": "CSV content to parse"}, "delimiter": {"type": "string", "description": "CSV delimiter (default: comma)"}, "has_headers": {"type": "boolean", "description": "Whether CSV has headers"}, "filter_column": {"type": "string", "description": "Column to filter on (optional)"}, "filter_value": {"type": "string", "description": "Value to filter for (optional)"}}, "required": ["csv_content"]}',
'https://api.dataprocessor.com/csv/parse', 'POST', '[]', 1),

-- JSON transformation
('json_transform', 'system', 'json_transform', 'Transform JSON Data', 'data_processing', 'api',
'Transform JSON data using JSONPath expressions and mapping rules',
'{"type": "object", "properties": {"input_json": {"type": "string", "description": "JSON data to transform"}, "transformation_rules": {"type": "object", "description": "Mapping rules for transformation"}, "output_format": {"type": "string", "enum": ["json", "csv", "xml"], "description": "Output format"}}, "required": ["input_json", "transformation_rules"]}',
'https://api.dataprocessor.com/json/transform', 'POST', '[]', 1),

-- Text extraction from documents
('text_extract_document', 'system', 'text_extract_document', 'Extract Text from Document', 'data_processing', 'api',
'Extract text content from various document formats (PDF, DOC, etc.)',
'{"type": "object", "properties": {"document_url": {"type": "string", "description": "URL of document to process"}, "document_type": {"type": "string", "enum": ["pdf", "doc", "docx", "txt"], "description": "Document type"}, "extract_images": {"type": "boolean", "description": "Whether to extract images as well"}}, "required": ["document_url", "document_type"]}',
'https://api.documentprocessor.com/extract', 'POST', '["DOCUMENT_API_KEY"]', 1);

-- HTTP/API Functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, endpoint_url, http_method, required_api_keys, is_system_resource
) VALUES 
-- Generic HTTP request
('http_request_generic', 'system', 'http_request_generic', 'Make HTTP Request', 'http_api', 'api',
'Make generic HTTP requests to any API endpoint with custom headers and authentication',
'{"type": "object", "properties": {"url": {"type": "string", "description": "Target URL"}, "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"], "description": "HTTP method"}, "headers": {"type": "object", "description": "Request headers"}, "body": {"type": "string", "description": "Request body"}, "auth_type": {"type": "string", "enum": ["none", "bearer", "basic", "api_key"], "description": "Authentication type"}}, "required": ["url", "method"]}',
'{{url}}', '{{method}}', '[]', 1),

-- Webhook receiver
('webhook_create_endpoint', 'system', 'webhook_create_endpoint', 'Create Webhook Endpoint', 'http_api', 'api',
'Create temporary webhook endpoints to receive data from external services',
'{"type": "object", "properties": {"webhook_name": {"type": "string", "description": "Unique webhook identifier"}, "expiry_hours": {"type": "number", "description": "Webhook expiry in hours (default: 24)"}, "response_template": {"type": "string", "description": "Custom response template"}}, "required": ["webhook_name"]}',
'https://api.webhooks.com/create', 'POST', '[]', 1);

-- Calendar and Scheduling Functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, endpoint_url, http_method, required_api_keys, is_system_resource
) VALUES 
-- Google Calendar integration
('calendar_create_event', 'system', 'calendar_create_event', 'Create Calendar Event', 'calendar', 'api',
'Create events in Google Calendar or other calendar services',
'{"type": "object", "properties": {"title": {"type": "string", "description": "Event title"}, "description": {"type": "string", "description": "Event description"}, "start_time": {"type": "string", "description": "Start time (ISO format)"}, "end_time": {"type": "string", "description": "End time (ISO format)"}, "attendees": {"type": "array", "description": "List of attendee emails"}, "location": {"type": "string", "description": "Event location"}}, "required": ["title", "start_time", "end_time"]}',
'https://www.googleapis.com/calendar/v3/calendars/primary/events', 'POST', '["GOOGLE_CALENDAR_API_KEY"]', 1),

-- Schedule task execution
('schedule_task', 'system', 'schedule_task', 'Schedule Task Execution', 'calendar', 'api',
'Schedule tasks or workflows to run at specific times or intervals',
'{"type": "object", "properties": {"task_name": {"type": "string", "description": "Unique task identifier"}, "schedule_type": {"type": "string", "enum": ["once", "daily", "weekly", "monthly"], "description": "Schedule frequency"}, "execute_at": {"type": "string", "description": "Execution time (ISO format for once, cron for recurring)"}, "task_payload": {"type": "object", "description": "Data to pass to the scheduled task"}}, "required": ["task_name", "schedule_type", "execute_at"]}',
'https://api.scheduler.com/tasks', 'POST', '["SCHEDULER_API_KEY"]', 1);

-- Database Functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, endpoint_url, http_method, required_api_keys, is_system_resource
) VALUES 
-- MySQL query execution
('mysql_query_execute', 'system', 'mysql_query_execute', 'Execute MySQL Query', 'database', 'api',
'Execute SELECT, INSERT, UPDATE, DELETE queries on MySQL databases',
'{"type": "object", "properties": {"query": {"type": "string", "description": "SQL query to execute"}, "parameters": {"type": "array", "description": "Query parameters for prepared statements"}, "database_connection": {"type": "string", "description": "Database connection identifier"}, "query_type": {"type": "string", "enum": ["select", "insert", "update", "delete"], "description": "Type of query"}}, "required": ["query", "query_type"]}',
'https://api.dbconnector.com/mysql/execute', 'POST', '["DATABASE_CONNECTION_STRING"]', 1),

-- PostgreSQL query execution
('postgresql_query_execute', 'system', 'postgresql_query_execute', 'Execute PostgreSQL Query', 'database', 'api',
'Execute queries on PostgreSQL databases with transaction support',
'{"type": "object", "properties": {"query": {"type": "string", "description": "SQL query to execute"}, "parameters": {"type": "array", "description": "Query parameters"}, "database_connection": {"type": "string", "description": "Database connection identifier"}, "use_transaction": {"type": "boolean", "description": "Whether to use transaction"}}, "required": ["query"]}',
'https://api.dbconnector.com/postgresql/execute', 'POST', '["POSTGRESQL_CONNECTION_STRING"]', 1);

-- Text Processing Functions
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description,
    parameters_schema, endpoint_url, http_method, required_api_keys, is_system_resource
) VALUES 
-- Text translation
('text_translate', 'system', 'text_translate', 'Translate Text', 'text_processing', 'api',
'Translate text between different languages using Google Translate or similar services',
'{"type": "object", "properties": {"text": {"type": "string", "description": "Text to translate"}, "source_language": {"type": "string", "description": "Source language code (auto-detect if not specified)"}, "target_language": {"type": "string", "description": "Target language code"}, "provider": {"type": "string", "enum": ["google", "deepl", "azure"], "description": "Translation provider"}}, "required": ["text", "target_language"]}',
'https://translation.googleapis.com/language/translate/v2', 'POST', '["GOOGLE_TRANSLATE_API_KEY"]', 1),

-- Text sentiment analysis
('text_sentiment_analysis', 'system', 'text_sentiment_analysis', 'Analyze Text Sentiment', 'text_processing', 'api',
'Analyze sentiment and emotion in text content',
'{"type": "object", "properties": {"text": {"type": "string", "description": "Text to analyze"}, "language": {"type": "string", "description": "Text language (optional)"}, "return_emotions": {"type": "boolean", "description": "Whether to return detailed emotion analysis"}}, "required": ["text"]}',
'https://api.textanalytics.com/sentiment', 'POST', '["TEXT_ANALYTICS_API_KEY"]', 1); 