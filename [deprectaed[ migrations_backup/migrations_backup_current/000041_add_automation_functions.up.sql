-- Add comprehensive automation functions for agent capabilities
-- Inspired by N8n, Zapier, and other automation platforms

-- EMAIL & NOTIFICATIONS
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, description,
    parameters_schema, mock_response, endpoint_url, http_method, headers,
    is_active, is_system_resource, required_api_keys, api_key_validation,
    fallback_data, created_at, updated_at
) VALUES 
(
    'func-email-send', 'system', 'email_send', 'Send Email',
    'communication', 'Send emails with attachments and HTML formatting',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'to', JSON_OBJECT('type', 'string', 'description', 'Recipient email address'),
            'subject', JSON_OBJECT('type', 'string', 'description', 'Email subject'),
            'body', JSON_OBJECT('type', 'string', 'description', 'Email body content'),
            'html', JSON_OBJECT('type', 'boolean', 'default', false, 'description', 'Send as HTML'),
            'attachments', JSON_OBJECT('type', 'array', 'description', 'File attachments')
        ),
        'required', JSON_ARRAY('to', 'subject', 'body')
    ),
    JSON_OBJECT('messageId', 'mock-123', 'status', 'sent', '_metadata', JSON_OBJECT('source', 'mock')),
    'https://api.sendgrid.com/v3/mail/send', 'POST',
    JSON_OBJECT('Authorization', 'Bearer {{sendgridApiKey}}', 'Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('sendgridApiKey'),
    JSON_OBJECT('sendgridApiKey', JSON_OBJECT('required', true, 'description', 'SendGrid API key')),
    JSON_OBJECT('messageId', 'fallback-123', 'status', 'failed', 'error', 'Email service unavailable'),
    NOW(), NOW()
),
(
    'func-slack-message', 'system', 'slack_send_message', 'Send Slack Message',
    'communication', 'Send messages to Slack channels or users',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'channel', JSON_OBJECT('type', 'string', 'description', 'Channel ID or name'),
            'text', JSON_OBJECT('type', 'string', 'description', 'Message text'),
            'blocks', JSON_OBJECT('type', 'array', 'description', 'Rich message blocks'),
            'thread_ts', JSON_OBJECT('type', 'string', 'description', 'Reply to thread timestamp')
        ),
        'required', JSON_ARRAY('channel', 'text')
    ),
    JSON_OBJECT('ok', true, 'ts', '1234567890.123456', '_metadata', JSON_OBJECT('source', 'mock')),
    'https://slack.com/api/chat.postMessage', 'POST',
    JSON_OBJECT('Authorization', 'Bearer {{slackBotToken}}', 'Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('slackBotToken'),
    JSON_OBJECT('slackBotToken', JSON_OBJECT('required', true, 'description', 'Slack Bot User OAuth Token')),
    JSON_OBJECT('ok', false, 'error', 'channel_not_found', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),

-- FILE OPERATIONS
(
    'func-file-upload', 'system', 'file_upload', 'Upload File',
    'files', 'Upload files to cloud storage (AWS S3, Google Drive, etc.)',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'file_content', JSON_OBJECT('type', 'string', 'description', 'File content (base64 encoded)'),
            'filename', JSON_OBJECT('type', 'string', 'description', 'Name of the file'),
            'bucket', JSON_OBJECT('type', 'string', 'description', 'Storage bucket/folder'),
            'content_type', JSON_OBJECT('type', 'string', 'description', 'MIME type of the file'),
            'public', JSON_OBJECT('type', 'boolean', 'default', false, 'description', 'Make file publicly accessible')
        ),
        'required', JSON_ARRAY('file_content', 'filename', 'bucket')
    ),
    JSON_OBJECT('file_url', 'https://storage.example.com/file.pdf', 'file_id', 'abc123', '_metadata', JSON_OBJECT('source', 'mock')),
    'https://s3.amazonaws.com', 'PUT',
    JSON_OBJECT('Authorization', 'AWS4-HMAC-SHA256 {{awsCredentials}}', 'Content-Type', '{{content_type}}'),
    1, 1, JSON_ARRAY('awsAccessKey', 'awsSecretKey'),
    JSON_OBJECT('awsAccessKey', JSON_OBJECT('required', true), 'awsSecretKey', JSON_OBJECT('required', true)),
    JSON_OBJECT('error', 'Upload failed', 'file_url', null, '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),
(
    'func-csv-parse', 'system', 'csv_parse', 'Parse CSV Data',
    'data_transform', 'Parse CSV content into structured JSON data',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'csv_content', JSON_OBJECT('type', 'string', 'description', 'CSV content to parse'),
            'delimiter', JSON_OBJECT('type', 'string', 'default', ',', 'description', 'CSV delimiter'),
            'has_header', JSON_OBJECT('type', 'boolean', 'default', true, 'description', 'First row contains headers'),
            'encoding', JSON_OBJECT('type', 'string', 'default', 'utf-8', 'description', 'Text encoding')
        ),
        'required', JSON_ARRAY('csv_content')
    ),
    JSON_OBJECT('rows', JSON_ARRAY(JSON_OBJECT('name', 'John', 'age', '30')), 'total_rows', 1, '_metadata', JSON_OBJECT('source', 'mock')),
    null, null, JSON_OBJECT(), 1, 1, JSON_ARRAY(), JSON_OBJECT(),
    JSON_OBJECT('rows', JSON_ARRAY(), 'total_rows', 0, 'error', 'Parse failed', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),

-- HTTP & API
(
    'func-http-request', 'system', 'http_request', 'HTTP Request',
    'http', 'Make HTTP requests to any API endpoint',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'url', JSON_OBJECT('type', 'string', 'description', 'Target URL'),
            'method', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('GET', 'POST', 'PUT', 'DELETE', 'PATCH'), 'default', 'GET'),
            'headers', JSON_OBJECT('type', 'object', 'description', 'Request headers'),
            'body', JSON_OBJECT('type', 'string', 'description', 'Request body'),
            'query_params', JSON_OBJECT('type', 'object', 'description', 'URL query parameters'),
            'timeout', JSON_OBJECT('type', 'integer', 'default', 30, 'description', 'Request timeout in seconds')
        ),
        'required', JSON_ARRAY('url')
    ),
    JSON_OBJECT('status_code', 200, 'body', '{"result": "success"}', 'headers', JSON_OBJECT(), '_metadata', JSON_OBJECT('source', 'mock')),
    '{{url}}', '{{method}}', JSON_OBJECT('Content-Type', 'application/json'),
    1, 1, JSON_ARRAY(), JSON_OBJECT(),
    JSON_OBJECT('status_code', 500, 'error', 'Request failed', 'body', null, '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),
(
    'func-webhook-trigger', 'system', 'webhook_trigger', 'Trigger Webhook',
    'http', 'Send webhook notifications with payload',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'webhook_url', JSON_OBJECT('type', 'string', 'description', 'Webhook endpoint URL'),
            'payload', JSON_OBJECT('type', 'object', 'description', 'Data to send'),
            'secret', JSON_OBJECT('type', 'string', 'description', 'Webhook secret for HMAC signature'),
            'retry_count', JSON_OBJECT('type', 'integer', 'default', 3, 'description', 'Number of retry attempts')
        ),
        'required', JSON_ARRAY('webhook_url', 'payload')
    ),
    JSON_OBJECT('delivered', true, 'response_time_ms', 150, '_metadata', JSON_OBJECT('source', 'mock')),
    '{{webhook_url}}', 'POST',
    JSON_OBJECT('Content-Type', 'application/json', 'X-Signature', 'sha256={{signature}}'),
    1, 1, JSON_ARRAY(), JSON_OBJECT(),
    JSON_OBJECT('delivered', false, 'error', 'Webhook delivery failed', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),

-- CALENDAR & SCHEDULING  
(
    'func-calendar-create-event', 'system', 'calendar_create_event', 'Create Calendar Event',
    'calendar', 'Create events in Google Calendar or Outlook',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'title', JSON_OBJECT('type', 'string', 'description', 'Event title'),
            'description', JSON_OBJECT('type', 'string', 'description', 'Event description'),
            'start_time', JSON_OBJECT('type', 'string', 'format', 'date-time', 'description', 'Start time (ISO 8601)'),
            'end_time', JSON_OBJECT('type', 'string', 'format', 'date-time', 'description', 'End time (ISO 8601)'),
            'attendees', JSON_OBJECT('type', 'array', 'description', 'List of attendee emails'),
            'location', JSON_OBJECT('type', 'string', 'description', 'Event location'),
            'reminder_minutes', JSON_OBJECT('type', 'integer', 'default', 15, 'description', 'Reminder before event')
        ),
        'required', JSON_ARRAY('title', 'start_time', 'end_time')
    ),
    JSON_OBJECT('event_id', 'evt_123', 'link', 'https://calendar.google.com/event?eid=123', '_metadata', JSON_OBJECT('source', 'mock')),
    'https://www.googleapis.com/calendar/v3/calendars/primary/events', 'POST',
    JSON_OBJECT('Authorization', 'Bearer {{googleCalendarToken}}', 'Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('googleCalendarToken'),
    JSON_OBJECT('googleCalendarToken', JSON_OBJECT('required', true, 'description', 'Google Calendar API token')),
    JSON_OBJECT('event_id', null, 'error', 'Calendar access denied', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),

-- DATABASE OPERATIONS
(
    'func-mysql-query', 'system', 'mysql_execute_query', 'Execute MySQL Query',
    'database', 'Execute SELECT, INSERT, UPDATE, DELETE queries on MySQL databases',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'query', JSON_OBJECT('type', 'string', 'description', 'SQL query to execute'),
            'parameters', JSON_OBJECT('type', 'array', 'description', 'Query parameters for prepared statements'),
            'database', JSON_OBJECT('type', 'string', 'description', 'Target database name'),
            'timeout', JSON_OBJECT('type', 'integer', 'default', 30, 'description', 'Query timeout in seconds')
        ),
        'required', JSON_ARRAY('query')
    ),
    JSON_OBJECT('rows', JSON_ARRAY(JSON_OBJECT('id', 1, 'name', 'test')), 'affected_rows', 1, '_metadata', JSON_OBJECT('source', 'mock')),
    null, null, JSON_OBJECT(), 1, 1,
    JSON_ARRAY('mysqlHost', 'mysqlUsername', 'mysqlPassword'),
    JSON_OBJECT('mysqlHost', JSON_OBJECT('required', true), 'mysqlUsername', JSON_OBJECT('required', true), 'mysqlPassword', JSON_OBJECT('required', true)),
    JSON_OBJECT('rows', JSON_ARRAY(), 'error', 'Database connection failed', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),

-- TEXT & AI PROCESSING
(
    'func-text-extract', 'system', 'text_extract_from_document', 'Extract Text from Document',
    'ai_processing', 'Extract text from PDFs, images, and documents using OCR',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'file_url', JSON_OBJECT('type', 'string', 'description', 'URL or path to document'),
            'file_content', JSON_OBJECT('type', 'string', 'description', 'Base64 encoded file content'),
            'document_type', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('pdf', 'image', 'docx'), 'description', 'Type of document'),
            'language', JSON_OBJECT('type', 'string', 'default', 'en', 'description', 'Document language for OCR')
        ),
        'required', JSON_ARRAY()
    ),
    JSON_OBJECT('text', 'Extracted document text...', 'confidence', 0.95, 'pages', 3, '_metadata', JSON_OBJECT('source', 'mock')),
    'https://api.textract.amazonaws.com', 'POST',
    JSON_OBJECT('Authorization', 'AWS4-HMAC-SHA256 {{awsCredentials}}', 'Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('awsAccessKey', 'awsSecretKey'),
    JSON_OBJECT('awsAccessKey', JSON_OBJECT('required', true), 'awsSecretKey', JSON_OBJECT('required', true)),
    JSON_OBJECT('text', '', 'error', 'Text extraction failed', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
),
(
    'func-text-translate', 'system', 'text_translate', 'Translate Text',
    'ai_processing', 'Translate text between languages using Google Translate or similar services',
    JSON_OBJECT(
        'type', 'object',
        'properties', JSON_OBJECT(
            'text', JSON_OBJECT('type', 'string', 'description', 'Text to translate'),
            'source_language', JSON_OBJECT('type', 'string', 'description', 'Source language code (e.g., en, es, fr)'),
            'target_language', JSON_OBJECT('type', 'string', 'description', 'Target language code'),
            'format', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('text', 'html'), 'default', 'text')
        ),
        'required', JSON_ARRAY('text', 'target_language')
    ),
    JSON_OBJECT('translated_text', 'Texto traducido', 'detected_language', 'en', 'confidence', 0.98, '_metadata', JSON_OBJECT('source', 'mock')),
    'https://translation.googleapis.com/language/translate/v2', 'POST',
    JSON_OBJECT('Authorization', 'Bearer {{googleTranslateKey}}', 'Content-Type', 'application/json'),
    1, 1, JSON_ARRAY('googleTranslateKey'),
    JSON_OBJECT('googleTranslateKey', JSON_OBJECT('required', true, 'description', 'Google Translate API key')),
    JSON_OBJECT('translated_text', '', 'error', 'Translation service unavailable', '_metadata', JSON_OBJECT('source', 'fallback')),
    NOW(), NOW()
);

-- Add more categories in the next section... 