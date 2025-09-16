package heartbeat

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"gogent/internal/types"
)

// AgentQueries handles database operations for agent heartbeat functionality
type AgentQueries struct {
	db *sql.DB
}

// NewAgentQueries creates a new AgentQueries instance
func NewAgentQueries(db *sql.DB) *AgentQueries {
	return &AgentQueries{db: db}
}

// OverdueAgent represents an agent that needs to be executed
type OverdueAgent struct {
	ID               string
	UserID           string
	FirstName        string
	LastName         string
	TemplateID       string
	HeartbeatMinutes int32
	MaxTokensPerDay  int32
	TokensUsedToday  int32
	TokensResetDate  string
	LastExecutionAt  *time.Time
	TotalExecutions  int32
	EffectiveContext *string
}

// GetOverdueActiveAgents retrieves agents that are overdue for execution
func (aq *AgentQueries) GetOverdueActiveAgents(ctx context.Context) ([]*OverdueAgent, error) {
	query := `
		SELECT 
			a.id, a.user_id, a.first_name, a.last_name, a.template_id,
			a.heartbeat_minutes, a.max_tokens_per_day, a.tokens_used_today,
			a.tokens_reset_date, a.last_execution_at, a.total_executions,
			a.effective_context
		FROM agents a
		WHERE a.lifecycle_status = 'ACTIVE'
		  AND (
		    -- Never executed before
		    a.last_execution_at IS NULL
		    OR
		    -- Overdue based on heartbeat interval (using UTC for consistency)
		    a.last_execution_at <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL a.heartbeat_minutes MINUTE)
		  )
		  AND (
		    -- Token limit not reached or tokens need reset
		    a.tokens_used_today < a.max_tokens_per_day
		    OR
		    a.tokens_reset_date < CURDATE()
		  )
		ORDER BY 
			COALESCE(a.last_execution_at, '1970-01-01') ASC,
			a.created_at ASC
		LIMIT 100
	`

	rows, err := aq.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query overdue agents: %w", err)
	}
	defer rows.Close()

	var agents []*OverdueAgent
	for rows.Next() {
		agent := &OverdueAgent{}
		var lastExecutionAt sql.NullTime

		err := rows.Scan(
			&agent.ID,
			&agent.UserID,
			&agent.FirstName,
			&agent.LastName,
			&agent.TemplateID,
			&agent.HeartbeatMinutes,
			&agent.MaxTokensPerDay,
			&agent.TokensUsedToday,
			&agent.TokensResetDate,
			&lastExecutionAt,
			&agent.TotalExecutions,
			&agent.EffectiveContext,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan agent row: %w", err)
		}

		if lastExecutionAt.Valid {
			agent.LastExecutionAt = &lastExecutionAt.Time
		}

		agents = append(agents, agent)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating agent rows: %w", err)
	}

	return agents, nil
}

// ResetDailyTokensIfNeeded resets daily token usage for agents if the date has changed
func (aq *AgentQueries) ResetDailyTokensIfNeeded(ctx context.Context, agentID string) error {
	query := `
		UPDATE agents 
		SET 
			tokens_used_today = 0,
			tokens_reset_date = CURDATE()
		WHERE id = ? 
		  AND tokens_reset_date < CURDATE()
	`

	result, err := aq.db.ExecContext(ctx, query, agentID)
	if err != nil {
		return fmt.Errorf("failed to reset daily tokens for agent %s: %w", agentID, err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected for token reset: %w", err)
	}

	if rowsAffected > 0 {
		log.Printf("🔄 Reset daily tokens for agent %s", agentID)
	}

	return nil
}

// UpdateAgentExecution updates the agent's execution tracking fields
func (aq *AgentQueries) UpdateAgentExecution(ctx context.Context, agentID string, tokensUsed int32) error {
	now := time.Now().UTC() // Ensure we use UTC consistently

	query := `
		UPDATE agents 
		SET 
			last_execution_at = ?,
			next_scheduled_at = DATE_ADD(?, INTERVAL heartbeat_minutes MINUTE),
			total_executions = total_executions + 1,
			tokens_used_today = tokens_used_today + ?,
			updated_at = ?
		WHERE id = ?
	`

	_, err := aq.db.ExecContext(ctx, query, now, now, tokensUsed, now, agentID)
	if err != nil {
		return fmt.Errorf("failed to update agent execution for %s: %w", agentID, err)
	}

	return nil
}

// GetAgentTemplate retrieves the execution template for an agent
func (aq *AgentQueries) GetAgentTemplate(ctx context.Context, templateID string) (*types.ExecutionTemplate, error) {
	query := `
		SELECT 
			id, name, description, template_prompt, context_template,
			enable_function_calling, preferred_configuration_id, is_active, user_id, created_at, updated_at
		FROM execution_templates 
		WHERE id = ? AND is_active = 1
	`

	var template types.ExecutionTemplate
	var createdAt, updatedAt time.Time
	var preferredConfigID sql.NullString
	var description sql.NullString
	var contextTemplate sql.NullString

	err := aq.db.QueryRowContext(ctx, query, templateID).Scan(
		&template.ID,
		&template.Name,
		&description,
		&template.TemplatePrompt,
		&contextTemplate,
		&template.EnableFunctionCalling,
		&preferredConfigID,
		&template.IsActive,
		&template.UserID,
		&createdAt,
		&updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("template %s not found or inactive", templateID)
		}
		return nil, fmt.Errorf("failed to get template %s: %w", templateID, err)
	}

	template.CreatedAt = createdAt
	template.UpdatedAt = updatedAt

	// Handle nullable fields
	if description.Valid {
		template.Description = description.String
	}
	if contextTemplate.Valid {
		template.ContextTemplate = contextTemplate.String
	}
	if preferredConfigID.Valid {
		template.PreferredConfigurationID = &preferredConfigID.String
	}

	return &template, nil
}

// GetConfiguration retrieves an API configuration by ID
func (aq *AgentQueries) GetConfiguration(ctx context.Context, configID string) (*types.APIConfiguration, error) {
	query := `
		SELECT 
			id, user_id, variation_name, model_name, system_prompt,
			temperature, max_tokens, top_p, top_k,
			safety_settings, generation_config, tools, tool_config,
			created_at, updated_at
		FROM api_configurations 
		WHERE id = ?
	`

	var config types.APIConfiguration
	var createdAt, updatedAt time.Time
	var systemPrompt sql.NullString
	var temperature, topP sql.NullFloat64
	var maxTokens, topK sql.NullInt32
	var safetySettings, generationConfig, tools, toolConfig sql.NullString

	err := aq.db.QueryRowContext(ctx, query, configID).Scan(
		&config.ID,
		&config.UserID,
		&config.VariationName,
		&config.ModelName,
		&systemPrompt,
		&temperature,
		&maxTokens,
		&topP,
		&topK,
		&safetySettings,
		&generationConfig,
		&tools,
		&toolConfig,
		&createdAt,
		&updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("configuration %s not found", configID)
		}
		return nil, fmt.Errorf("failed to get configuration %s: %w", configID, err)
	}

	// Handle nullable fields
	if systemPrompt.Valid {
		config.SystemPrompt = systemPrompt.String
	}
	if temperature.Valid {
		temp := float32(temperature.Float64)
		config.Temperature = &temp
	}
	if maxTokens.Valid {
		tokens := maxTokens.Int32
		config.MaxTokens = &tokens
	}
	if topP.Valid {
		p := float32(topP.Float64)
		config.TopP = &p
	}
	if topK.Valid {
		k := topK.Int32
		config.TopK = &k
	}

	config.CreatedAt = createdAt
	config.UpdatedAt = updatedAt

	return &config, nil
}

// CheckAgentTokenLimit checks if an agent has reached its daily token limit
func (aq *AgentQueries) CheckAgentTokenLimit(ctx context.Context, agentID string) (bool, error) {
	query := `
		SELECT 
			tokens_used_today < max_tokens_per_day AS can_execute,
			tokens_used_today,
			max_tokens_per_day,
			tokens_reset_date
		FROM agents 
		WHERE id = ?
	`

	var canExecute bool
	var tokensUsed, maxTokens int32
	var resetDate string

	err := aq.db.QueryRowContext(ctx, query, agentID).Scan(
		&canExecute, &tokensUsed, &maxTokens, &resetDate,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return false, fmt.Errorf("agent %s not found", agentID)
		}
		return false, fmt.Errorf("failed to check token limit for agent %s: %w", agentID, err)
	}

	// Check if we need to reset daily tokens
	today := time.Now().Format("2006-01-02")
	if resetDate < today {
		log.Printf("🔄 Agent %s needs daily token reset (last reset: %s)", agentID, resetDate)
		err = aq.ResetDailyTokensIfNeeded(ctx, agentID)
		if err != nil {
			return false, fmt.Errorf("failed to reset daily tokens: %w", err)
		}
		// After reset, agent can execute
		return true, nil
	}

	log.Printf("📊 Agent %s token usage: %d/%d (can execute: %v)",
		agentID, tokensUsed, maxTokens, canExecute)

	return canExecute, nil
}

// GetActiveAgentCount returns the number of active agents in the system
func (aq *AgentQueries) GetActiveAgentCount(ctx context.Context) (int, error) {
	query := `SELECT COUNT(*) FROM agents WHERE lifecycle_status = 'ACTIVE'`

	var count int
	err := aq.db.QueryRowContext(ctx, query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get active agent count: %w", err)
	}

	return count, nil
}

// GetAgentExecutionStats returns execution statistics for monitoring
func (aq *AgentQueries) GetAgentExecutionStats(ctx context.Context) (map[string]interface{}, error) {
	query := `
		SELECT 
			COUNT(*) as total_agents,
			SUM(CASE WHEN lifecycle_status = 'ACTIVE' THEN 1 ELSE 0 END) as active_agents,
			SUM(CASE WHEN lifecycle_status = 'PAUSED' THEN 1 ELSE 0 END) as paused_agents,
			SUM(CASE WHEN lifecycle_status = 'STANDBY' THEN 1 ELSE 0 END) as standby_agents,
			SUM(CASE WHEN lifecycle_status = 'KILLED' THEN 1 ELSE 0 END) as killed_agents,
			AVG(total_executions) as avg_executions,
			SUM(total_executions) as total_executions,
			SUM(tokens_used_today) as total_tokens_today
		FROM agents
	`

	var stats struct {
		TotalAgents      int
		ActiveAgents     int
		PausedAgents     int
		StandbyAgents    int
		KilledAgents     int
		AvgExecutions    sql.NullFloat64
		TotalExecutions  int
		TotalTokensToday int
	}

	err := aq.db.QueryRowContext(ctx, query).Scan(
		&stats.TotalAgents,
		&stats.ActiveAgents,
		&stats.PausedAgents,
		&stats.StandbyAgents,
		&stats.KilledAgents,
		&stats.AvgExecutions,
		&stats.TotalExecutions,
		&stats.TotalTokensToday,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get agent execution stats: %w", err)
	}

	result := map[string]interface{}{
		"total_agents":       stats.TotalAgents,
		"active_agents":      stats.ActiveAgents,
		"paused_agents":      stats.PausedAgents,
		"standby_agents":     stats.StandbyAgents,
		"killed_agents":      stats.KilledAgents,
		"total_executions":   stats.TotalExecutions,
		"total_tokens_today": stats.TotalTokensToday,
	}

	if stats.AvgExecutions.Valid {
		result["avg_executions"] = stats.AvgExecutions.Float64
	} else {
		result["avg_executions"] = 0.0
	}

	return result, nil
}
