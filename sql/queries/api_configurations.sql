-- name: CreateAPIConfiguration :exec
INSERT INTO api_configurations (
    id, user_id, variation_name, model_name, system_prompt,
    temperature, max_tokens, top_p, top_k, safety_settings,
    generation_config, tools, tool_config
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    model_name = VALUES(model_name),
    system_prompt = VALUES(system_prompt),
    temperature = VALUES(temperature),
    max_tokens = VALUES(max_tokens),
    top_p = VALUES(top_p),
    top_k = VALUES(top_k),
    safety_settings = VALUES(safety_settings),
    generation_config = VALUES(generation_config),
    tools = VALUES(tools),
    tool_config = VALUES(tool_config),
    updated_at = CURRENT_TIMESTAMP;

-- name: GetAPIConfiguration :one
SELECT id, user_id, variation_name, model_name, system_prompt, temperature, max_tokens, top_p, top_k, 
       COALESCE(safety_settings, '{}') as safety_settings, 
       COALESCE(generation_config, '{}') as generation_config, 
       COALESCE(tools, '[]') as tools, 
       COALESCE(tool_config, '{}') as tool_config, 
       created_at, updated_at
FROM api_configurations
WHERE id = ? AND user_id = ?;

-- name: GetAPIConfigurationsByRun :many
SELECT ac.id, ac.user_id, ac.variation_name, ac.model_name, ac.system_prompt, ac.temperature, ac.max_tokens, ac.top_p, ac.top_k, 
       COALESCE(ac.safety_settings, '{}') as safety_settings, 
       COALESCE(ac.generation_config, '{}') as generation_config, 
       COALESCE(ac.tools, '[]') as tools, 
       COALESCE(ac.tool_config, '{}') as tool_config, 
       ac.created_at, ac.updated_at
FROM api_configurations ac
JOIN execution_configurations ec ON ac.id = ec.configuration_id
WHERE ec.execution_run_id = ? AND (ac.user_id = ? OR ac.user_id = 'system')
ORDER BY ac.variation_name;

-- name: GetAPIConfigurationByVariation :one
SELECT ac.id, ac.user_id, ac.variation_name, ac.model_name, ac.system_prompt, ac.temperature, ac.max_tokens, ac.top_p, ac.top_k, 
       COALESCE(ac.safety_settings, '{}') as safety_settings, 
       COALESCE(ac.generation_config, '{}') as generation_config, 
       COALESCE(ac.tools, '[]') as tools, 
       COALESCE(ac.tool_config, '{}') as tool_config, 
       ac.created_at, ac.updated_at
FROM api_configurations ac
JOIN execution_configurations ec ON ac.id = ec.configuration_id
WHERE ec.execution_run_id = ? AND ac.variation_name = ? AND (ac.user_id = ? OR ac.user_id = 'system');

-- name: ListAPIConfigurations :many
SELECT id, user_id, variation_name, model_name, system_prompt, temperature, max_tokens, top_p, top_k, 
       COALESCE(safety_settings, '{}') as safety_settings, 
       COALESCE(generation_config, '{}') as generation_config, 
       COALESCE(tools, '[]') as tools, 
       COALESCE(tool_config, '{}') as tool_config, 
       created_at, updated_at
FROM api_configurations
WHERE user_id = ?
ORDER BY updated_at DESC
LIMIT ? OFFSET ?;

-- name: ListAPIConfigurationsByUser :many
SELECT id, user_id, variation_name, model_name, system_prompt, temperature, max_tokens, top_p, top_k, 
       COALESCE(safety_settings, '{}') as safety_settings, 
       COALESCE(generation_config, '{}') as generation_config, 
       COALESCE(tools, '[]') as tools, 
       COALESCE(tool_config, '{}') as tool_config, 
       created_at, updated_at
FROM api_configurations
WHERE user_id = ?
ORDER BY updated_at DESC;

-- name: ListSystemConfigurations :many
SELECT id, user_id, variation_name, model_name, system_prompt, temperature, max_tokens, top_p, top_k, 
       COALESCE(safety_settings, '{}') as safety_settings, 
       COALESCE(generation_config, '{}') as generation_config, 
       COALESCE(tools, '[]') as tools, 
       COALESCE(tool_config, '{}') as tool_config, 
       created_at, updated_at
FROM api_configurations
WHERE user_id = 'system'
ORDER BY updated_at DESC;

-- name: UpdateAPIConfiguration :exec
UPDATE api_configurations
SET variation_name = ?, model_name = ?, system_prompt = ?,
    temperature = ?, max_tokens = ?, top_p = ?, top_k = ?,
    safety_settings = ?, generation_config = ?, tools = ?, tool_config = ?
WHERE id = ? AND user_id = ?;

-- name: DeleteAPIConfiguration :exec
DELETE FROM api_configurations
WHERE id = ? AND user_id = ?;

-- name: CountAPIConfigurationsByUser :one
SELECT COUNT(*) FROM api_configurations WHERE user_id = ?; 

-- Execution Configuration Mapping Queries

-- name: CreateExecutionConfiguration :exec
INSERT INTO execution_configurations (id, execution_run_id, configuration_id)
VALUES (?, ?, ?);

-- name: GetExecutionConfigurations :many
SELECT ec.id, ec.execution_run_id, ec.configuration_id, ec.created_at
FROM execution_configurations ec
WHERE ec.execution_run_id = ?;

-- name: DeleteExecutionConfigurations :exec
DELETE FROM execution_configurations
WHERE execution_run_id = ?; 