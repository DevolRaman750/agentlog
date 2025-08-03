-- name: GetTemplate :one
SELECT 
    id, user_id, name, description, template_prompt, context_template,
    enable_function_calling, is_active, is_public, category, tags,
    execution_timeout_seconds, rate_limit_per_hour, rate_limit_per_day,
    rate_limit_burst, total_executions, last_executed_at, created_at, updated_at
FROM execution_templates 
WHERE id = ? LIMIT 1;

-- name: GetTemplatesByUser :many
-- NOTE: This query is deprecated - the service uses dynamic query building
-- Always includes system templates alongside user templates
SELECT 
    id, user_id, name, description, template_prompt, context_template,
    enable_function_calling, is_active, is_public, category, tags,
    execution_timeout_seconds, rate_limit_per_hour, rate_limit_per_day,
    rate_limit_burst, total_executions, last_executed_at, created_at, updated_at
FROM execution_templates 
WHERE (user_id = ? OR user_id = 'system') OR (is_public = TRUE AND ?)
ORDER BY created_at DESC
LIMIT ? OFFSET ?;

-- name: GetSystemTemplates :many
SELECT 
    id, user_id, name, description, template_prompt, context_template,
    enable_function_calling, is_active, is_public, category, tags,
    execution_timeout_seconds, rate_limit_per_hour, rate_limit_per_day,
    rate_limit_burst, total_executions, last_executed_at, created_at, updated_at
FROM execution_templates 
WHERE user_id = 'system' AND is_active = TRUE
ORDER BY created_at DESC;

-- name: CreateTemplate :exec
INSERT INTO execution_templates (
    id, user_id, name, description, template_prompt, context_template,
    enable_function_calling, is_active, is_public, category, tags,
    execution_timeout_seconds, rate_limit_per_hour, rate_limit_per_day,
    rate_limit_burst, total_executions, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: UpdateTemplate :exec
UPDATE execution_templates 
SET name = ?, description = ?, template_prompt = ?, context_template = ?,
    enable_function_calling = ?, category = ?, tags = ?,
    execution_timeout_seconds = ?, rate_limit_per_hour = ?, rate_limit_per_day = ?,
    rate_limit_burst = ?, updated_at = ?
WHERE id = ? AND user_id = ?;

-- name: DeleteTemplate :exec
DELETE FROM execution_templates WHERE id = ? AND user_id = ?;

-- name: GetTemplateFunctions :many
SELECT tf.template_id, tf.function_id, tf.is_required, tf.execution_order,
       f.name as function_name, f.display_name as function_display_name
FROM execution_template_functions tf
JOIN function_definitions f ON tf.function_id = f.id
WHERE tf.template_id = ?
ORDER BY tf.execution_order ASC;

-- name: CreateTemplateFunction :exec
INSERT INTO execution_template_functions (
    id, template_id, function_id, is_required, execution_order, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: DeleteTemplateFunctions :exec
DELETE FROM execution_template_functions WHERE template_id = ?;

-- name: GetTemplateParameters :many
SELECT 
    id, template_id, parameter_name, parameter_type, description,
    default_value, is_required, validation_rules, allowed_values,
    allow_sql_keywords, allow_special_chars, sanitize_html,
    display_order, ui_component, placeholder_text, help_text,
    created_at, updated_at
FROM execution_template_parameters 
WHERE template_id = ?
ORDER BY display_order ASC;

-- name: CreateTemplateParameter :exec
INSERT INTO execution_template_parameters (
    id, template_id, parameter_name, parameter_type, description,
    default_value, is_required, validation_rules, allowed_values,
    allow_sql_keywords, allow_special_chars, sanitize_html,
    display_order, ui_component, placeholder_text, help_text,
    created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: DeleteTemplateParameters :exec
DELETE FROM execution_template_parameters WHERE template_id = ?;

-- name: GetTemplateAuthTokens :many
SELECT 
    id, template_id, user_id, token_value, token_name, description,
    is_active, expires_at, custom_rate_limit_per_hour, custom_rate_limit_per_day,
    custom_rate_limit_burst, total_uses, last_used_at, last_used_ip,
    allowed_origins, allowed_ips, created_at, updated_at
FROM execution_template_auth_tokens 
WHERE template_id = ? AND is_active = ?
ORDER BY created_at DESC; 