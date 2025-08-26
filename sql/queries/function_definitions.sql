-- Function Definitions queries

-- name: CreateFunctionDefinition :exec
INSERT INTO function_definitions (
    id, user_id, name, display_name, function_group, function_type, description, parameters_schema, 
    mock_response, endpoint_url, http_method, headers, auth_config, is_active, is_system_resource,
    required_api_keys, api_key_validation, query_template, result_transformer, fallback_data
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: GetFunctionDefinition :one
SELECT * FROM function_definitions WHERE id = ? AND (user_id = ? OR user_id = 'system');

-- name: GetFunctionDefinitionByName :one
SELECT * FROM function_definitions WHERE name = ? AND (user_id = ? OR user_id = 'system');

-- name: ListFunctionDefinitions :many
SELECT * FROM function_definitions 
WHERE is_active = TRUE AND (user_id = ? OR user_id = 'system')
ORDER BY function_group ASC, function_type ASC, display_name ASC;

-- name: ListAllFunctionDefinitions :many
SELECT * FROM function_definitions 
WHERE user_id = ?
ORDER BY function_group ASC, function_type ASC, created_at DESC;

-- name: ListSystemFunctionDefinitions :many
SELECT * FROM function_definitions 
WHERE is_active = TRUE AND (is_system_resource = TRUE OR user_id = ?)
ORDER BY function_group ASC, function_type ASC, display_name ASC;

-- name: UpdateFunctionDefinition :exec
UPDATE function_definitions 
SET display_name = ?, function_group = ?, function_type = ?, description = ?, parameters_schema = ?, 
    mock_response = ?, endpoint_url = ?, http_method = ?, 
    headers = ?, auth_config = ?, is_active = ?, is_system_resource = ?,
    required_api_keys = ?, api_key_validation = ?, query_template = ?, result_transformer = ?, fallback_data = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND user_id = ?;

-- name: DeleteFunctionDefinition :exec
UPDATE function_definitions 
SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND user_id = ?;

-- name: PermanentDeleteFunctionDefinition :exec
DELETE FROM function_definitions WHERE id = ? AND user_id = ?;

-- name: SearchFunctionDefinitions :many
SELECT * FROM function_definitions 
WHERE is_active = TRUE AND user_id = ?
AND (display_name LIKE ? OR description LIKE ? OR name LIKE ?)
ORDER BY function_group ASC, function_type ASC, display_name ASC;

-- name: GetFunctionDefinitionsForExecution :many
SELECT fd.*, efc.use_mock_response, efc.execution_order
FROM function_definitions fd
JOIN execution_function_configs efc ON fd.id = efc.function_definition_id
WHERE efc.execution_run_id = ? AND (fd.user_id = ? OR fd.user_id = 'system')
AND fd.is_active = TRUE
ORDER BY efc.execution_order ASC, fd.display_name ASC;

-- name: CountFunctionDefinitionsByUser :one
SELECT COUNT(*) FROM function_definitions WHERE user_id = ? AND is_active = TRUE; 