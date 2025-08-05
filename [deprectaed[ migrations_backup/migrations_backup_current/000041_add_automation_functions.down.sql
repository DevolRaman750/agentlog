-- Remove automation functions added in 000041_add_automation_functions.up.sql

DELETE FROM function_definitions WHERE id IN (
    'func-email-send',
    'func-slack-message', 
    'func-file-upload',
    'func-csv-parse',
    'func-http-request',
    'func-webhook-trigger',
    'func-calendar-create-event',
    'func-mysql-query',
    'func-text-extract',
    'func-text-translate'
); 