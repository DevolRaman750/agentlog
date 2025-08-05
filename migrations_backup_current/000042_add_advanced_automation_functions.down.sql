-- Remove advanced automation functions added in 000042_add_advanced_automation_functions.up.sql

DELETE FROM function_definitions WHERE id IN (
    'func-stripe-payment',
    'func-shopify-product',
    'func-twitter-post',
    'func-linkedin-post',
    'func-openai-text',
    'func-image-generate',
    'func-website-monitor',
    'func-google-analytics',
    'func-json-transform',
    'func-excel-parse',
    'func-salesforce-lead',
    'func-trello-card'
); 