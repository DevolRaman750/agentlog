-- name: CreateExecutionFlowEvent :exec
INSERT INTO execution_flow_events (
    id,
    execution_run_id,
    request_id,
    event_type,
    sequence_number,
    parent_event_id,
    event_data,
    duration_ms,
    status,
    error_message,
    created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());

-- name: GetExecutionFlowEventsByRun :many
SELECT id, execution_run_id, request_id, event_type, sequence_number, 
       parent_event_id, event_data, duration_ms, status, error_message, created_at
FROM execution_flow_events
WHERE execution_run_id = ?
ORDER BY created_at ASC, sequence_number ASC, id ASC;

-- name: GetExecutionFlowEventsByConfiguration :many
SELECT efe.id, efe.execution_run_id, efe.request_id, efe.event_type, efe.sequence_number, 
       efe.parent_event_id, efe.event_data, efe.duration_ms, efe.status, efe.error_message, efe.created_at
FROM execution_flow_events efe
JOIN api_requests ar ON efe.request_id = ar.id
WHERE efe.execution_run_id = ? AND ar.configuration_id = ?
ORDER BY efe.created_at ASC, efe.sequence_number ASC, efe.id ASC;

-- name: DeleteExecutionFlowEventsByRun :exec
DELETE FROM execution_flow_events 
WHERE execution_run_id = ?;