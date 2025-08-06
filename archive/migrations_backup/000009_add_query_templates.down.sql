-- Remove query template and result transformation support

ALTER TABLE function_definitions 
DROP COLUMN query_template,
DROP COLUMN result_transformer,
DROP COLUMN fallback_data; 