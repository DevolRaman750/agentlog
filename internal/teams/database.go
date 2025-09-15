package teams

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"gogent/internal/types"
)

// Database query constants
const (
	QueryTeamExists = `SELECT EXISTS(SELECT 1 FROM teams WHERE id = ? AND user_id = ?)`
	QueryInsertTeam = `
		INSERT INTO teams (id, user_id, name, description, max_tokens_per_day, 
		                   tokens_used_today, tokens_reset_date, agent_count, 
		                   active_agent_count, total_executions, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
)

// getTeams retrieves all teams for a user
func (h *Handler) getTeams(userID string) ([]types.Team, error) {
	query := `
		SELECT id, user_id, name, description, max_tokens_per_day, tokens_used_today,
		       tokens_reset_date, agent_count, active_agent_count, total_executions,
		       created_at, updated_at, memory, memory_size_bytes, memory_updated_at
		FROM teams
		WHERE user_id = ?
		ORDER BY created_at DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teams []types.Team
	for rows.Next() {
		var team types.Team
		var description sql.NullString
		var memoryJSON sql.NullString
		var memorySizeBytes sql.NullInt32
		var memoryUpdatedAt sql.NullTime

		err := rows.Scan(
			&team.ID, &team.UserID, &team.Name, &description, &team.MaxTokensPerDay,
			&team.TokensUsedToday, &team.TokensResetDate, &team.AgentCount,
			&team.ActiveAgentCount, &team.TotalExecutions, &team.CreatedAt, &team.UpdatedAt,
			&memoryJSON, &memorySizeBytes, &memoryUpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		if description.Valid {
			team.Description = &description.String
		}

		// Parse memory if present
		if memoryJSON.Valid && memoryJSON.String != "" {
			var memory types.TeamMemory
			if err := types.FromJSON(memoryJSON.String, &memory); err == nil {
				team.Memory = &memory
			}
		}

		if memorySizeBytes.Valid {
			team.MemorySizeBytes = memorySizeBytes.Int32
		}

		if memoryUpdatedAt.Valid {
			team.MemoryUpdatedAt = &memoryUpdatedAt.Time
		}

		teams = append(teams, team)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return teams, nil
}

// getTeamByID retrieves a specific team by ID
func (h *Handler) getTeamByID(teamID, userID string) (types.Team, error) {
	query := `
		SELECT id, user_id, name, description, max_tokens_per_day, tokens_used_today,
		       tokens_reset_date, agent_count, active_agent_count, total_executions,
		       created_at, updated_at, memory, memory_size_bytes, memory_updated_at
		FROM teams
		WHERE id = ? AND user_id = ?
	`

	var team types.Team
	var description sql.NullString
	var memoryJSON sql.NullString
	var memorySizeBytes sql.NullInt32
	var memoryUpdatedAt sql.NullTime

	err := h.db.QueryRow(query, teamID, userID).Scan(
		&team.ID, &team.UserID, &team.Name, &description, &team.MaxTokensPerDay,
		&team.TokensUsedToday, &team.TokensResetDate, &team.AgentCount,
		&team.ActiveAgentCount, &team.TotalExecutions, &team.CreatedAt, &team.UpdatedAt,
		&memoryJSON, &memorySizeBytes, &memoryUpdatedAt,
	)
	if err != nil {
		return team, err
	}

	if description.Valid {
		team.Description = &description.String
	}

	// Parse memory if present
	if memoryJSON.Valid && memoryJSON.String != "" {
		var memory types.TeamMemory
		if err := types.FromJSON(memoryJSON.String, &memory); err == nil {
			team.Memory = &memory
		}
	}

	if memorySizeBytes.Valid {
		team.MemorySizeBytes = memorySizeBytes.Int32
	}

	if memoryUpdatedAt.Valid {
		team.MemoryUpdatedAt = &memoryUpdatedAt.Time
	}

	return team, nil
}

// createTeamInDB creates a new team in the database
func (h *Handler) createTeamInDB(team types.Team) error {
	query := QueryInsertTeam

	var description interface{}
	if team.Description != nil {
		description = *team.Description
	}

	_, err := h.db.Exec(query,
		team.ID, team.UserID, team.Name, description, team.MaxTokensPerDay,
		team.TokensUsedToday, team.TokensResetDate, team.AgentCount,
		team.ActiveAgentCount, team.TotalExecutions, team.CreatedAt, team.UpdatedAt,
	)

	return err
}

// updateTeamInDB updates a team in the database
func (h *Handler) updateTeamInDB(teamID, userID string, req types.TeamUpdateRequest) (types.Team, error) {
	// Build dynamic update query
	var setParts []string
	var args []interface{}

	if req.Name != nil {
		setParts = append(setParts, "name = ?")
		args = append(args, *req.Name)
	}
	if req.Description != nil {
		setParts = append(setParts, "description = ?")
		args = append(args, *req.Description)
	}
	if req.MaxTokensPerDay != nil {
		setParts = append(setParts, "max_tokens_per_day = ?")
		args = append(args, *req.MaxTokensPerDay)
	}

	if len(setParts) == 0 {
		// No updates requested, just return the current team
		return h.getTeamByID(teamID, userID)
	}

	setParts = append(setParts, "updated_at = ?")
	args = append(args, time.Now())

    // Build the query without fmt.Sprintf to avoid gosec G201 false positive.
    query := "UPDATE teams SET " + strings.Join(setParts, ", ") + " WHERE id = ? AND user_id = ?"

	args = append(args, teamID, userID)

	result, err := h.db.Exec(query, args...)
	if err != nil {
		return types.Team{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return types.Team{}, err
	}

	if rowsAffected == 0 {
		return types.Team{}, sql.ErrNoRows
	}

	// Return the updated team
	return h.getTeamByID(teamID, userID)
}

// deleteTeamFromDB deletes a team from the database
func (h *Handler) deleteTeamFromDB(teamID, userID string) error {
	query := `DELETE FROM teams WHERE id = ? AND user_id = ?`

	result, err := h.db.Exec(query, teamID, userID)
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

// getTeamWithAgents retrieves a team with its associated agents
func (h *Handler) getTeamWithAgents(teamID, userID string) (types.TeamWithAgents, error) {
	// First get the team
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		return types.TeamWithAgents{}, err
	}

	// Then get the agents
	agentsQuery := `
		SELECT a.id, a.user_id, a.first_name, a.last_name, a.template_id, a.team_id,
		       a.max_tokens_per_day, a.heartbeat_minutes, a.lifecycle_status,
		       a.tokens_used_today, a.tokens_reset_date, a.last_execution_at,
		       a.next_scheduled_at, a.total_executions, a.created_at, a.updated_at,
		       et.name, et.description
		FROM agents a
		LEFT JOIN execution_templates et ON a.template_id = et.id
		WHERE a.team_id = ? AND a.user_id = ?
		ORDER BY a.created_at DESC
	`

	rows, err := h.db.Query(agentsQuery, teamID, userID)
	if err != nil {
		return types.TeamWithAgents{}, err
	}
	defer rows.Close()

	var agents []types.Agent
	for rows.Next() {
		var agent types.Agent
		var lastExecutionAt, nextScheduledAt sql.NullTime
		var templateName, templateDescription sql.NullString
		var teamID sql.NullString

		err := rows.Scan(
			&agent.ID, &agent.UserID, &agent.FirstName, &agent.LastName, &agent.TemplateID, &teamID,
			&agent.MaxTokensPerDay, &agent.HeartbeatMinutes, &agent.LifecycleStatus,
			&agent.TokensUsedToday, &agent.TokensResetDate, &lastExecutionAt,
			&nextScheduledAt, &agent.TotalExecutions, &agent.CreatedAt, &agent.UpdatedAt,
			&templateName, &templateDescription,
		)
		if err != nil {
			return types.TeamWithAgents{}, err
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
			agent.TeamName = team.Name
		}

		agents = append(agents, agent)
	}

	if err := rows.Err(); err != nil {
		return types.TeamWithAgents{}, err
	}

	return types.TeamWithAgents{
		Team:   team,
		Agents: agents,
	}, nil
}

// assignAgentToTeam assigns an agent to a team
func (h *Handler) assignAgentToTeam(agentID, teamID, userID string) (types.Agent, error) {
	// First verify both the agent and team belong to the user
	var agentExists, teamExists bool

	agentQuery := `SELECT EXISTS(SELECT 1 FROM agents WHERE id = ? AND user_id = ?)`
	err := h.db.QueryRow(agentQuery, agentID, userID).Scan(&agentExists)
	if err != nil {
		return types.Agent{}, err
	}

	teamQuery := QueryTeamExists
	err = h.db.QueryRow(teamQuery, teamID, userID).Scan(&teamExists)
	if err != nil {
		return types.Agent{}, err
	}

	if !agentExists || !teamExists {
		return types.Agent{}, sql.ErrNoRows
	}

	// Update the agent's team assignment
	updateQuery := `UPDATE agents SET team_id = ?, updated_at = ? WHERE id = ? AND user_id = ?`
	_, err = h.db.Exec(updateQuery, teamID, time.Now(), agentID, userID)
	if err != nil {
		return types.Agent{}, err
	}

	// Return the updated agent with team info
	return h.getAgentWithTeamInfo(agentID, userID)
}

// removeAgentFromTeam removes an agent from its team
// removeAgentFromTeam is implemented in internal/agents/database.go for the AgentsHandler type.

// getAgentWithTeamInfo retrieves an agent with team information
func (h *Handler) getAgentWithTeamInfo(agentID, userID string) (types.Agent, error) {
	query := `
		SELECT a.id, a.user_id, a.first_name, a.last_name, a.template_id, a.team_id,
		       a.max_tokens_per_day, a.heartbeat_minutes, a.lifecycle_status,
		       a.tokens_used_today, a.tokens_reset_date, a.last_execution_at,
		       a.next_scheduled_at, a.total_executions, a.created_at, a.updated_at,
		       et.name, et.description, t.name
		FROM agents a
		LEFT JOIN execution_templates et ON a.template_id = et.id
		LEFT JOIN teams t ON a.team_id = t.id
		WHERE a.id = ? AND a.user_id = ?
	`

	var agent types.Agent
	var lastExecutionAt, nextScheduledAt sql.NullTime
	var templateName, templateDescription sql.NullString
	var teamID, teamName sql.NullString

	err := h.db.QueryRow(query, agentID, userID).Scan(
		&agent.ID, &agent.UserID, &agent.FirstName, &agent.LastName, &agent.TemplateID, &teamID,
		&agent.MaxTokensPerDay, &agent.HeartbeatMinutes, &agent.LifecycleStatus,
		&agent.TokensUsedToday, &agent.TokensResetDate, &lastExecutionAt,
		&nextScheduledAt, &agent.TotalExecutions, &agent.CreatedAt, &agent.UpdatedAt,
		&templateName, &templateDescription, &teamName,
	)
	if err != nil {
		return agent, err
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

	return agent, nil
}

// pauseAllAgentsInTeam pauses all active agents in a team
func (h *Handler) pauseAllAgentsInTeam(teamID, userID string) (int64, error) {
	// First verify the team belongs to the user
	var teamExists bool
	teamQuery := QueryTeamExists
	err := h.db.QueryRow(teamQuery, teamID, userID).Scan(&teamExists)
	if err != nil {
		return 0, err
	}

	if !teamExists {
		return 0, sql.ErrNoRows
	}

	// Update all active agents in the team to paused
	updateQuery := `
		UPDATE agents 
		SET lifecycle_status = 'PAUSED', updated_at = ? 
		WHERE team_id = ? AND user_id = ? AND lifecycle_status = 'ACTIVE'
	`
	result, err := h.db.Exec(updateQuery, time.Now(), teamID, userID)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

// resumeAllAgentsInTeam resumes all paused agents in a team
func (h *Handler) resumeAllAgentsInTeam(teamID, userID string) (int64, error) {
	// First verify the team belongs to the user
	var teamExists bool
	teamQuery := QueryTeamExists
	err := h.db.QueryRow(teamQuery, teamID, userID).Scan(&teamExists)
	if err != nil {
		return 0, err
	}

	if !teamExists {
		return 0, sql.ErrNoRows
	}

	// Update all paused agents in the team to active
	updateQuery := `
		UPDATE agents 
		SET lifecycle_status = 'ACTIVE', updated_at = ? 
		WHERE team_id = ? AND user_id = ? AND lifecycle_status = 'PAUSED'
	`
	result, err := h.db.Exec(updateQuery, time.Now(), teamID, userID)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

// getTeamStatsByID retrieves statistics for a team
func (h *Handler) getTeamStatsByID(teamID, userID string) (types.TeamStats, error) {
	// First verify the team belongs to the user
	var teamExists bool
	teamQuery := QueryTeamExists
	err := h.db.QueryRow(teamQuery, teamID, userID).Scan(&teamExists)
	if err != nil {
		return types.TeamStats{}, err
	}

	if !teamExists {
		return types.TeamStats{}, sql.ErrNoRows
	}

	// Get team stats using the team_stats view or aggregate query
	query := `
		SELECT 
			? as team_id,
			COUNT(a.id) as total_agents,
			COUNT(CASE WHEN a.lifecycle_status = 'ACTIVE' THEN 1 END) as active_agents,
			COUNT(CASE WHEN a.lifecycle_status = 'PAUSED' THEN 1 END) as paused_agents,
			COALESCE(SUM(a.tokens_used_today), 0) as total_tokens_used,
			COALESCE(SUM(a.total_executions), 0) as total_executions,
			MAX(a.last_execution_at) as last_execution_at
		FROM agents a
		WHERE a.team_id = ? AND a.user_id = ?
	`

	var stats types.TeamStats
	var lastExecutionAt sql.NullTime

	err = h.db.QueryRow(query, teamID, teamID, userID).Scan(
		&stats.TeamID, &stats.TotalAgents, &stats.ActiveAgents, &stats.PausedAgents,
		&stats.TotalTokensUsed, &stats.TotalExecutions, &lastExecutionAt,
	)
	if err != nil {
		return stats, err
	}

	if lastExecutionAt.Valid {
		stats.LastExecutionAt = &lastExecutionAt.Time
	}

	return stats, nil
}

// validateAgentTeamMembership checks if an agent is a member of the specified team
func (h *Handler) validateAgentTeamMembership(agentID, teamID, userID string) error {
	query := `SELECT EXISTS(SELECT 1 FROM agents WHERE id = ? AND team_id = ? AND user_id = ?)`
	var exists bool

	err := h.db.QueryRow(query, agentID, teamID, userID).Scan(&exists)
	if err != nil {
		return err
	}

	if !exists {
		return fmt.Errorf("agent %s is not a member of team %s", agentID, teamID)
	}

	return nil
}

// validateTeamMemoryAccess checks if either the agent is a member of the team OR the user owns the team
func (h *Handler) validateTeamMemoryAccess(agentID, teamID, userID string) error {
	// First check if the user owns the team (for manual UI access)
	teamQuery := QueryTeamExists
	var userOwnsTeam bool

	err := h.db.QueryRow(teamQuery, teamID, userID).Scan(&userOwnsTeam)
	if err != nil {
		return fmt.Errorf("failed to check team ownership: %w", err)
	}

	if userOwnsTeam {
		// User owns the team, allow access
		return nil
	}

	// If user doesn't own the team, check if this is an agent call
	// (agentID should be a valid agent that belongs to this team)
	return h.validateAgentTeamMembership(agentID, teamID, userID)
}

// saveTeamMemory saves team memory to the database
func (h *Handler) saveTeamMemory(teamID, userID string, memory *types.TeamMemory) error {
	// Convert memory to JSON
	memoryJSON, err := types.ToJSON(memory)
	if err != nil {
		return fmt.Errorf("failed to marshal team memory: %w", err)
	}

    sizeBytes := len(memoryJSON)
    // Guard against potential int -> int32 overflow (gosec G115)
    if sizeBytes > int(^uint32(0)>>1) { // math.MaxInt32 without importing math
        memory.Metadata.SizeBytes = int32(^uint32(0) >> 1)
    } else {
        memory.Metadata.SizeBytes = int32(sizeBytes)
    }

	// Update team record with memory
	query := `
		UPDATE teams 
		SET memory = ?, 
		    memory_size_bytes = ?, 
		    memory_updated_at = CURRENT_TIMESTAMP 
		WHERE id = ? AND user_id = ?`

	_, err = h.db.Exec(query, memoryJSON, sizeBytes, teamID, userID)
	if err != nil {
		return fmt.Errorf("failed to save team memory to database: %w", err)
	}

	return nil
}

// createTeamInDBTx creates a new team in the database within a transaction
func (h *Handler) createTeamInDBTx(tx *sql.Tx, team types.Team) error {
	query := QueryInsertTeam

	var description interface{}
	if team.Description != nil {
		description = *team.Description
	}

	_, err := tx.Exec(query,
		team.ID, team.UserID, team.Name, description, team.MaxTokensPerDay,
		team.TokensUsedToday, team.TokensResetDate, team.AgentCount,
		team.ActiveAgentCount, team.TotalExecutions, team.CreatedAt, team.UpdatedAt,
	)

	return err
}

// insertAgentTx creates a new agent in the database within a transaction
func (h *Handler) insertAgentTx(tx *sql.Tx, agent *types.Agent) error {
	query := `
		INSERT INTO agents (
			id, user_id, first_name, last_name, template_id, team_id,
			max_tokens_per_day, heartbeat_minutes, lifecycle_status,
			tokens_used_today, tokens_reset_date, total_executions,
			effective_context, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := tx.Exec(query,
		agent.ID, agent.UserID, agent.FirstName, agent.LastName, agent.TemplateID, agent.TeamID,
		agent.MaxTokensPerDay, agent.HeartbeatMinutes, agent.LifecycleStatus,
		agent.TokensUsedToday, agent.TokensResetDate, agent.TotalExecutions,
		agent.EffectiveContext, agent.CreatedAt, agent.UpdatedAt,
	)
	return err
}

// verifyTemplateAccessTx verifies that a template exists and is accessible to the user within a transaction
func (h *Handler) verifyTemplateAccessTx(tx *sql.Tx, userID, templateID string) error {
	query := `
		SELECT COUNT(*) FROM execution_templates 
		WHERE id = ? AND (user_id = ? OR user_id = 'system' OR is_public = TRUE) AND is_active = TRUE
	`

	var count int
	err := tx.QueryRow(query, templateID, userID).Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to verify template access: %w", err)
	}

	if count == 0 {
		return fmt.Errorf("template not found or not accessible")
	}

	return nil
}

// updateTeamAgentCountTx updates the agent count for a team within a transaction
func (h *Handler) updateTeamAgentCountTx(tx *sql.Tx, teamID string, agentCount, activeAgentCount int32) error {
	query := `
		UPDATE teams 
		SET agent_count = ?, active_agent_count = ?, updated_at = ?
		WHERE id = ?
	`

	_, err := tx.Exec(query, agentCount, activeAgentCount, time.Now(), teamID)
	return err
}
