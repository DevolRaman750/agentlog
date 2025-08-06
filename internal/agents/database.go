package agents

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"gogent/internal/types"
)

// ExecutionRunWithTokens extends ExecutionRun with token information
type ExecutionRunWithTokens struct {
	types.ExecutionRun
	TotalTokens      int     `json:"totalTokens,omitempty"`
	PromptTokens     int     `json:"promptTokens,omitempty"`
	CompletionTokens int     `json:"completionTokens,omitempty"`
	AvgResponseTime  float64 `json:"avgResponseTime,omitempty"`
}

// getAgents retrieves all agents for a user without statistics
func (h *AgentsHandler) getAgents(userID string) ([]types.Agent, error) {
	query := `
		SELECT a.id, a.user_id, a.first_name, a.last_name, a.template_id, a.team_id,
		       a.max_tokens_per_day, a.heartbeat_minutes, a.lifecycle_status,
		       a.tokens_used_today, a.tokens_reset_date, a.last_execution_at,
		       a.next_scheduled_at, a.total_executions, a.created_at, a.updated_at,
		       et.name, et.description, t.name
		FROM agents a
		LEFT JOIN execution_templates et ON a.template_id = et.id
		LEFT JOIN teams t ON a.team_id = t.id
		WHERE a.user_id = ?
		ORDER BY a.created_at DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var agents []types.Agent
	for rows.Next() {
		var agent types.Agent
		var lastExecutionAt, nextScheduledAt sql.NullTime
		var templateName, templateDescription sql.NullString
		var teamID, teamName sql.NullString

		err := rows.Scan(
			&agent.ID, &agent.UserID, &agent.FirstName, &agent.LastName, &agent.TemplateID, &teamID,
			&agent.MaxTokensPerDay, &agent.HeartbeatMinutes, &agent.LifecycleStatus,
			&agent.TokensUsedToday, &agent.TokensResetDate, &lastExecutionAt,
			&nextScheduledAt, &agent.TotalExecutions, &agent.CreatedAt, &agent.UpdatedAt,
			&templateName, &templateDescription, &teamName,
		)
		if err != nil {
			return nil, err
		}

		// Handle nullable fields
		if lastExecutionAt.Valid {
			agent.LastExecutionAt = &lastExecutionAt.Time
		}
		if nextScheduledAt.Valid {
			agent.NextScheduledAt = &nextScheduledAt.Time
		}
		if templateName.Valid {
			agent.TemplateName = templateName.String
		}
		if templateDescription.Valid {
			agent.TemplateDescription = templateDescription.String
		}
		if teamID.Valid {
			agent.TeamID = &teamID.String
		}
		if teamName.Valid {
			agent.TeamName = teamName.String
		}

		agents = append(agents, agent)
	}

	return agents, rows.Err()
}

// getAgentsWithStats retrieves all agents for a user with execution statistics
func (h *AgentsHandler) getAgentsWithStats(userID string) ([]types.Agent, error) {
	query := `
		SELECT 
			a.id, a.user_id, a.first_name, a.last_name, a.template_id, a.team_id,
			a.max_tokens_per_day, a.heartbeat_minutes, a.lifecycle_status,
			a.tokens_used_today, a.tokens_reset_date, a.last_execution_at,
			a.next_scheduled_at, a.total_executions, a.created_at, a.updated_at,
			et.name, et.description, t.name,
			COALESCE(COUNT(er.id), 0) as execution_count,
			MAX(er.created_at) as latest_execution_at,
			COALESCE(SUM(CASE WHEN er.status = 'completed' THEN 1 ELSE 0 END), 0) as successful_executions,
			COALESCE(SUM(CASE WHEN er.status = 'failed' THEN 1 ELSE 0 END), 0) as failed_executions
		FROM agents a
		LEFT JOIN execution_templates et ON a.template_id = et.id
		LEFT JOIN teams t ON a.team_id = t.id
		LEFT JOIN execution_runs er ON a.id = er.agent_id
		WHERE a.user_id = ?
		GROUP BY a.id, a.user_id, a.first_name, a.last_name, a.template_id, a.team_id,
		         a.max_tokens_per_day, a.heartbeat_minutes, a.lifecycle_status,
		         a.tokens_used_today, a.tokens_reset_date, a.last_execution_at,
		         a.next_scheduled_at, a.total_executions, a.created_at, a.updated_at,
		         et.name, et.description, t.name
		ORDER BY a.created_at DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var agents []types.Agent
	for rows.Next() {
		var agent types.Agent
		var lastExecutionAt, nextScheduledAt, latestExecutionAt sql.NullTime
		var templateName, templateDescription sql.NullString
		var teamID, teamName sql.NullString
		var executionCount, successfulExecutions, failedExecutions int32

		err := rows.Scan(
			&agent.ID, &agent.UserID, &agent.FirstName, &agent.LastName, &agent.TemplateID, &teamID,
			&agent.MaxTokensPerDay, &agent.HeartbeatMinutes, &agent.LifecycleStatus,
			&agent.TokensUsedToday, &agent.TokensResetDate, &lastExecutionAt,
			&nextScheduledAt, &agent.TotalExecutions, &agent.CreatedAt, &agent.UpdatedAt,
			&templateName, &templateDescription, &teamName,
			&executionCount, &latestExecutionAt, &successfulExecutions, &failedExecutions,
		)
		if err != nil {
			return nil, err
		}

		// Handle nullable fields
		if lastExecutionAt.Valid {
			agent.LastExecutionAt = &lastExecutionAt.Time
		}
		if nextScheduledAt.Valid {
			agent.NextScheduledAt = &nextScheduledAt.Time
		}
		if templateName.Valid {
			agent.TemplateName = templateName.String
		}
		if templateDescription.Valid {
			agent.TemplateDescription = templateDescription.String
		}
		if teamID.Valid {
			agent.TeamID = &teamID.String
		}
		if teamName.Valid {
			agent.TeamName = teamName.String
		}

		// Update agent with calculated statistics (real-time data from execution_runs)
		agent.TotalExecutions = executionCount
		if latestExecutionAt.Valid {
			agent.LastExecutionAt = &latestExecutionAt.Time
		}

		agents = append(agents, agent)
	}

	return agents, rows.Err()
}

// getAgentByID retrieves a specific agent by ID for a user
func (h *AgentsHandler) getAgentByID(userID, agentID string) (*types.Agent, error) {
	query := `
		SELECT a.id, a.user_id, a.first_name, a.last_name, a.template_id,
		       a.max_tokens_per_day, a.heartbeat_minutes, a.lifecycle_status,
		       a.tokens_used_today, a.tokens_reset_date, a.last_execution_at,
		       a.next_scheduled_at, a.total_executions, a.created_at, a.updated_at,
		       et.name, et.description
		FROM agents a
		LEFT JOIN execution_templates et ON a.template_id = et.id
		WHERE a.user_id = ? AND a.id = ?
	`

	var agent types.Agent
	var lastExecutionAt, nextScheduledAt sql.NullTime
	var templateName, templateDescription sql.NullString

	err := h.db.QueryRow(query, userID, agentID).Scan(
		&agent.ID, &agent.UserID, &agent.FirstName, &agent.LastName, &agent.TemplateID,
		&agent.MaxTokensPerDay, &agent.HeartbeatMinutes, &agent.LifecycleStatus,
		&agent.TokensUsedToday, &agent.TokensResetDate, &lastExecutionAt,
		&nextScheduledAt, &agent.TotalExecutions, &agent.CreatedAt, &agent.UpdatedAt,
		&templateName, &templateDescription,
	)
	if err != nil {
		return nil, err
	}

	// Handle nullable fields
	if lastExecutionAt.Valid {
		agent.LastExecutionAt = &lastExecutionAt.Time
	}
	if nextScheduledAt.Valid {
		agent.NextScheduledAt = &nextScheduledAt.Time
	}
	if templateName.Valid {
		agent.TemplateName = templateName.String
	}
	if templateDescription.Valid {
		agent.TemplateDescription = templateDescription.String
	}

	return &agent, nil
}

// insertAgent creates a new agent in the database
func (h *AgentsHandler) insertAgent(agent *types.Agent) error {
	query := `
		INSERT INTO agents (
			id, user_id, first_name, last_name, template_id,
			max_tokens_per_day, heartbeat_minutes, lifecycle_status,
			tokens_used_today, tokens_reset_date, total_executions,
			created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := h.db.Exec(query,
		agent.ID, agent.UserID, agent.FirstName, agent.LastName, agent.TemplateID,
		agent.MaxTokensPerDay, agent.HeartbeatMinutes, agent.LifecycleStatus,
		agent.TokensUsedToday, agent.TokensResetDate, agent.TotalExecutions,
		agent.CreatedAt, agent.UpdatedAt,
	)
	return err
}

// updateAgentFields updates specific fields of an agent
func (h *AgentsHandler) updateAgentFields(userID, agentID string, req *types.AgentUpdateRequest) error {
	var setParts []string
	var args []interface{}

	if req.FirstName != nil {
		setParts = append(setParts, "first_name = ?")
		args = append(args, *req.FirstName)
	}
	if req.LastName != nil {
		setParts = append(setParts, "last_name = ?")
		args = append(args, *req.LastName)
	}
	if req.MaxTokensPerDay != nil {
		setParts = append(setParts, "max_tokens_per_day = ?")
		args = append(args, *req.MaxTokensPerDay)
	}
	if req.HeartbeatMinutes != nil {
		setParts = append(setParts, "heartbeat_minutes = ?")
		args = append(args, *req.HeartbeatMinutes)
	}
	if req.LifecycleStatus != nil {
		setParts = append(setParts, "lifecycle_status = ?")
		args = append(args, *req.LifecycleStatus)
	}

	if len(setParts) == 0 {
		return nil // No fields to update
	}

	// Always update the updated_at timestamp
	setParts = append(setParts, "updated_at = ?")
	args = append(args, time.Now())

	// Add WHERE clause parameters
	args = append(args, userID, agentID)

	query := fmt.Sprintf(`
		UPDATE agents 
		SET %s
		WHERE user_id = ? AND id = ?
	`, strings.Join(setParts, ", "))

	result, err := h.db.Exec(query, args...)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// deleteAgentByID deletes an agent
func (h *AgentsHandler) deleteAgentByID(userID, agentID string) error {
	query := `DELETE FROM agents WHERE user_id = ? AND id = ?`

	result, err := h.db.Exec(query, userID, agentID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// verifyTemplateAccess checks if a template exists and is accessible to the user
// Follows the same pattern as the templates endpoint
func (h *AgentsHandler) verifyTemplateAccess(userID, templateID string) error {
	query := `
		SELECT id, user_id, is_public FROM execution_templates 
		WHERE id = ?
	`

	var id, templateUserID string
	var isPublic bool
	err := h.db.QueryRow(query, templateID).Scan(&id, &templateUserID, &isPublic)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("template not found")
		}
		return fmt.Errorf("failed to get template: %w", err)
	}

	// Check permissions: user must own the template OR template must be public
	if templateUserID != userID && !isPublic {
		return fmt.Errorf("access denied")
	}

	return nil
}

// getExecutionsByAgentID retrieves executions for an agent with pagination
func (h *AgentsHandler) getExecutionsByAgentID(agentID string, limit, offset int) ([]ExecutionRunWithTokens, error) {
	query := `
		SELECT 
			er.id, er.name, er.description, er.base_prompt, er.context_prompt,
			er.enable_function_calling, er.status, er.error_message,
			er.created_at, er.updated_at,
			COALESCE(SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(resp.usage_metadata, '$.total_tokens')) AS UNSIGNED)), 0) as total_tokens,
			COALESCE(SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(resp.usage_metadata, '$.prompt_tokens')) AS UNSIGNED)), 0) as prompt_tokens,
			COALESCE(SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(resp.usage_metadata, '$.completion_tokens')) AS UNSIGNED)), 0) as completion_tokens,
			COALESCE(AVG(req.response_time_ms), 0) as avg_response_time
		FROM execution_runs er
		LEFT JOIN api_requests req ON er.id = req.execution_run_id
		LEFT JOIN api_responses resp ON req.id = resp.request_id
		WHERE er.agent_id = ?
		GROUP BY er.id, er.name, er.description, er.base_prompt, er.context_prompt,
		         er.enable_function_calling, er.status, er.error_message,
		         er.created_at, er.updated_at
		ORDER BY er.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := h.db.Query(query, agentID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var executions []ExecutionRunWithTokens
	for rows.Next() {
		var exec ExecutionRunWithTokens
		var description, basePrompt, contextPrompt, errorMessage sql.NullString
		var totalTokens, promptTokens, completionTokens sql.NullInt64
		var avgResponseTime sql.NullFloat64

		err := rows.Scan(
			&exec.ExecutionRun.ID, &exec.ExecutionRun.Name, &description, &basePrompt, &contextPrompt,
			&exec.ExecutionRun.EnableFunctionCalling, &exec.ExecutionRun.Status, &errorMessage,
			&exec.ExecutionRun.CreatedAt, &exec.ExecutionRun.UpdatedAt,
			&totalTokens, &promptTokens, &completionTokens, &avgResponseTime,
		)
		if err != nil {
			return nil, err
		}

		// Handle nullable fields
		if description.Valid {
			exec.ExecutionRun.Description = description.String
		}
		if basePrompt.Valid {
			exec.ExecutionRun.BasePrompt = basePrompt.String
		}
		if contextPrompt.Valid {
			exec.ExecutionRun.ContextPrompt = contextPrompt.String
		}
		if errorMessage.Valid {
			exec.ExecutionRun.ErrorMessage = errorMessage.String
		}

		// Set token information
		if totalTokens.Valid {
			exec.TotalTokens = int(totalTokens.Int64)
		}
		if promptTokens.Valid {
			exec.PromptTokens = int(promptTokens.Int64)
		}
		if completionTokens.Valid {
			exec.CompletionTokens = int(completionTokens.Int64)
		}
		if avgResponseTime.Valid {
			exec.AvgResponseTime = avgResponseTime.Float64
		}

		executions = append(executions, exec)
	}

	return executions, rows.Err()
}

// removeAgentFromTeam removes an agent from its team
func (h *AgentsHandler) removeAgentFromTeam(agentID, userID string) error {
	updateQuery := `UPDATE agents SET team_id = NULL, updated_at = ? WHERE id = ? AND user_id = ?`
	result, err := h.db.Exec(updateQuery, time.Now(), agentID, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
