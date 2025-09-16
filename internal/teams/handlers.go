package teams

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"gogent/internal/auth"
	"gogent/internal/types"

	"github.com/google/uuid"
)

// Handler handles all team-related HTTP requests
type Handler struct {
	db *sql.DB
}

// NewTeamsHandler creates a new teams handler
func NewTeamsHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// HandleTeams handles operations on the base /api/teams endpoint
func (h *Handler) HandleTeams(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listTeams(w, r)
	case http.MethodPost:
		// Check if this is a team-with-agents creation request
		if r.URL.Query().Get("with_agents") == "true" {
			h.createTeamWithAgents(w, r)
		} else {
			h.createTeam(w, r)
		}
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleTeamByID handles operations on specific teams at /api/teams/{id} and sub-routes
func (h *Handler) HandleTeamByID(w http.ResponseWriter, r *http.Request) {
	// Extract team ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid team ID", http.StatusBadRequest)
		return
	}
	teamID := pathParts[2]

	// Check for sub-routes like /api/teams/{id}/agents
	if len(pathParts) > 3 {
		switch pathParts[3] {
		case "agents":
			if len(pathParts) > 4 {
				// /api/teams/{id}/agents/{agentId}
				h.handleTeamAgentAssignment(w, r, teamID, pathParts[4])
			} else {
				// /api/teams/{id}/agents
				h.handleTeamAgents(w, r, teamID)
			}
		case "context":
			// /api/teams/{id}/context
			h.handleTeamContextOperations(w, r, teamID)
		case "memory":
			h.handleTeamMemory(w, r, teamID, pathParts)
		case "pause-all":
			h.pauseAllTeamAgents(w, r, teamID)
		case "resume-all":
			h.resumeAllTeamAgents(w, r, teamID)
		case "stats":
			h.getTeamStats(w, r, teamID)
		default:
			http.Error(w, "Invalid endpoint", http.StatusNotFound)
		}
		return
	}

	// Handle operations on the team itself
	switch r.Method {
	case http.MethodGet:
		h.getTeam(w, r, teamID)
	case http.MethodPut:
		h.updateTeam(w, r, teamID)
	case http.MethodDelete:
		h.deleteTeam(w, r, teamID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// listTeams retrieves all teams for the authenticated user
func (h *Handler) listTeams(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	teams, err := h.getTeams(user.ID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to retrieve teams: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(teams); err != nil {
		http.Error(w, fmt.Sprintf("Failed to encode response: %v", err), http.StatusInternalServerError)
		return
	}
}

// createTeam creates a new team
func (h *Handler) createTeam(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	var req types.TeamCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create new team
	team := types.Team{
		ID:              uuid.New().String(),
		UserID:          user.ID,
		Name:            req.Name,
		Description:     req.Description,
		MaxTokensPerDay: req.MaxTokensPerDay,
		TokensUsedToday: 0,
		TokensResetDate: time.Now().Format("2006-01-02"),
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	err := h.createTeamInDB(team)
	if err != nil {
		if strings.Contains(err.Error(), "uk_teams_user_name") {
			http.Error(w, "A team with this name already exists", http.StatusConflict)
			return
		}
		http.Error(w, fmt.Sprintf("Failed to create team: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(team); err != nil {
		http.Error(w, fmt.Sprintf("Failed to encode response: %v", err), http.StatusInternalServerError)
		return
	}
}

// createTeamWithAgents creates a new team with associated agents
func (h *Handler) createTeamWithAgents(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	var req types.TeamWithAgentsCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if err := h.validateTeamWithAgentsCreateRequest(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Start transaction
	tx, err := h.db.Begin()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to start transaction: %v", err), http.StatusInternalServerError)
		return
	}
	defer func() {
		if err := tx.Rollback(); err != nil {
			log.Printf("Failed to rollback transaction: %v", err)
		}
	}()

	// Create team
	team := types.Team{
		ID:              uuid.New().String(),
		UserID:          user.ID,
		Name:            req.Name,
		Description:     req.Description,
		MaxTokensPerDay: req.MaxTokensPerDay,
		TokensUsedToday: 0,
		TokensResetDate: time.Now().Format("2006-01-02"),
		AgentCount: func() int32 {
			n := len(req.Agents)
			// Clamp to MaxInt32 to avoid overflow (gosec G115)
			if n > int(^uint32(0)>>1) {
				return int32(^uint32(0) >> 1)
			}
			return int32(n)
		}(),
		ActiveAgentCount: 0, // Will be updated based on agent lifecycle status
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// Insert team
	err = h.createTeamInDBTx(tx, team)
	if err != nil {
		if strings.Contains(err.Error(), "uk_teams_user_name") {
			http.Error(w, "A team with this name already exists", http.StatusConflict)
			return
		}
		http.Error(w, fmt.Sprintf("Failed to create team: %v", err), http.StatusInternalServerError)
		return
	}

	// Create agents
	var createdAgents []types.Agent
	activeAgentCount := int32(0)

	for _, agentReq := range req.Agents {
		// Verify template exists and is accessible
		if err := h.verifyTemplateAccessTx(tx, user.ID, agentReq.TemplateID); err != nil {
			http.Error(w, fmt.Sprintf("Template %s not accessible: %v", agentReq.TemplateID, err), http.StatusBadRequest)
			return
		}

		// Load template to get context for appending shared context
		template, err := h.getTemplateByIDTx(tx, agentReq.TemplateID)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to load template %s: %v", agentReq.TemplateID, err), http.StatusInternalServerError)
			return
		}

		// Create effective context by appending shared team context to template context
		var effectiveContext *string
		if req.SharedTeamContext != nil && *req.SharedTeamContext != "" {
			combinedContext := appendSharedContextToTemplate(template.ContextTemplate, *req.SharedTeamContext)
			effectiveContext = &combinedContext
		} else if template.ContextTemplate != "" {
			effectiveContext = &template.ContextTemplate
		}

		agent := types.Agent{
			ID:               uuid.New().String(),
			UserID:           user.ID,
			FirstName:        agentReq.FirstName,
			LastName:         agentReq.LastName,
			TemplateID:       agentReq.TemplateID,
			TeamID:           &team.ID,
			MaxTokensPerDay:  agentReq.MaxTokensPerDay,
			HeartbeatMinutes: agentReq.HeartbeatMinutes,
			LifecycleStatus:  agentReq.LifecycleStatus,
			TokensUsedToday:  0,
			TokensResetDate:  time.Now().Format("2006-01-02"),
			TotalExecutions:  0,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
			EffectiveContext: effectiveContext,
		}

		// Set default lifecycle status if not provided
		if agent.LifecycleStatus == "" {
			agent.LifecycleStatus = types.LifecycleStatusStandby
		}

		// Count active agents
		if agent.LifecycleStatus == types.LifecycleStatusActive {
			activeAgentCount++
		}

		// Insert agent
		if err := h.insertAgentTx(tx, &agent); err != nil {
			http.Error(w, fmt.Sprintf("Failed to create agent %s: %v", agent.FirstName, err), http.StatusInternalServerError)
			return
		}

		createdAgents = append(createdAgents, agent)
	}

	// Update team with correct active agent count
	team.ActiveAgentCount = activeAgentCount
	if err := h.updateTeamAgentCountTx(tx, team.ID, team.AgentCount, activeAgentCount); err != nil {
		http.Error(w, fmt.Sprintf("Failed to update team agent count: %v", err), http.StatusInternalServerError)
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, fmt.Sprintf("Failed to commit transaction: %v", err), http.StatusInternalServerError)
		return
	}

	// Return response
	response := types.TeamWithAgentsCreateResponse{
		Team:   team,
		Agents: createdAgents,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

// getTeam retrieves a specific team
func (h *Handler) getTeam(w http.ResponseWriter, r *http.Request, teamID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	team, err := h.getTeamByID(teamID, user.ID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Team not found", http.StatusNotFound)
			return
		}
		http.Error(w, fmt.Sprintf("Failed to retrieve team: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(team); err != nil {
		log.Printf("Failed to encode team: %v", err)
	}
}

// updateTeam updates a team
func (h *Handler) updateTeam(w http.ResponseWriter, r *http.Request, teamID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	var req types.TeamUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	team, err := h.updateTeamInDB(teamID, user.ID, req)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Team not found", http.StatusNotFound)
			return
		}
		if strings.Contains(err.Error(), "uk_teams_user_name") {
			http.Error(w, "A team with this name already exists", http.StatusConflict)
			return
		}
		http.Error(w, fmt.Sprintf("Failed to update team: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(team); err != nil {
		log.Printf("Failed to encode team: %v", err)
	}
}

// deleteTeam deletes a team
func (h *Handler) deleteTeam(w http.ResponseWriter, r *http.Request, teamID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	err := h.deleteTeamFromDB(teamID, user.ID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Team not found", http.StatusNotFound)
			return
		}
		http.Error(w, fmt.Sprintf("Failed to delete team: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"message": "Team deleted successfully"}); err != nil {
		log.Printf("Failed to encode delete response: %v", err)
	}
}

// handleTeamAgents handles /api/teams/{id}/agents
func (h *Handler) handleTeamAgents(w http.ResponseWriter, r *http.Request, teamID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	switch r.Method {
	case http.MethodGet:
		// Get team with agents
		teamWithAgents, err := h.getTeamWithAgents(teamID, user.ID)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Team not found", http.StatusNotFound)
				return
			}
			http.Error(w, fmt.Sprintf("Failed to retrieve team with agents: %v", err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(teamWithAgents); err != nil {
			log.Printf("Failed to encode team-with-agents response: %v", err)
		}
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleTeamAgentAssignment handles /api/teams/{id}/agents/{agentId}
func (h *Handler) handleTeamAgentAssignment(w http.ResponseWriter, r *http.Request, teamID, agentID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	switch r.Method {
	case http.MethodPost:
		// Assign agent to team
		agent, err := h.assignAgentToTeam(agentID, teamID, user.ID)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Agent or team not found", http.StatusNotFound)
				return
			}
			http.Error(w, fmt.Sprintf("Failed to assign agent to team: %v", err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(agent); err != nil {
			log.Printf("Failed to encode agent response: %v", err)
		}
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// pauseAllTeamAgents pauses all active agents in a team
func (h *Handler) pauseAllTeamAgents(w http.ResponseWriter, r *http.Request, teamID string) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	affectedCount, err := h.pauseAllAgentsInTeam(teamID, user.ID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to pause team agents: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"message":       "Team agents paused successfully",
		"affectedCount": affectedCount,
	}); err != nil {
		log.Printf("Failed to encode pause response: %v", err)
	}
}

// resumeAllTeamAgents resumes all paused agents in a team
func (h *Handler) resumeAllTeamAgents(w http.ResponseWriter, r *http.Request, teamID string) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	affectedCount, err := h.resumeAllAgentsInTeam(teamID, user.ID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to resume team agents: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"message":       "Team agents resumed successfully",
		"affectedCount": affectedCount,
	}); err != nil {
		log.Printf("Failed to encode resume response: %v", err)
	}
}

// getTeamStats retrieves statistics for a team
func (h *Handler) getTeamStats(w http.ResponseWriter, r *http.Request, teamID string) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	stats, err := h.getTeamStatsByID(teamID, user.ID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Team not found", http.StatusNotFound)
			return
		}
		http.Error(w, fmt.Sprintf("Failed to retrieve team stats: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(stats); err != nil {
		log.Printf("Failed to encode stats response: %v", err)
	}
}

// handleTeamMemory handles team memory operations
func (h *Handler) handleTeamMemory(w http.ResponseWriter, r *http.Request, teamID string, pathParts []string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Parse memory operation from path
	var operation string
	if len(pathParts) >= 5 {
		operation = pathParts[4]
	}

	// Parse request body for memory operations
	var request types.TeamMemoryRequest
	if r.Method == http.MethodPost || r.Method == http.MethodPut {
		err := json.NewDecoder(r.Body).Decode(&request)
		if err != nil {
			http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
			return
		}
		request.TeamID = teamID
	}

	var response *types.TeamMemoryResponse
	var err error

	switch operation {
	case "read", "":
		if r.Method != http.MethodGet && r.Method != http.MethodPost {
			http.Error(w, "Method not allowed for read operation", http.StatusMethodNotAllowed)
			return
		}
		// Parse query parameters for GET requests
		if r.Method == http.MethodGet {
			request.Context = r.URL.Query().Get("context")
			request.Path = r.URL.Query().Get("path")
			request.SearchQuery = r.URL.Query().Get("search_query")
			if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
				if limit, parseErr := strconv.Atoi(limitStr); parseErr == nil {
					request.Limit = limit
				}
			}
			request.TeamID = teamID
		}
		response, err = h.ReadTeamMemory(r.Context(), teamID, request.AgentID, user.ID, &request)

	case "write":
		if r.Method != http.MethodPost && r.Method != http.MethodPut {
			http.Error(w, "Method not allowed for write operation", http.StatusMethodNotAllowed)
			return
		}
		response, err = h.WriteTeamMemory(r.Context(), teamID, request.AgentID, user.ID, &request)

	case "search":
		if r.Method != http.MethodGet && r.Method != http.MethodPost {
			http.Error(w, "Method not allowed for search operation", http.StatusMethodNotAllowed)
			return
		}
		// Parse query parameters for GET requests
		if r.Method == http.MethodGet {
			request.SearchQuery = r.URL.Query().Get("query")
			if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
				if limit, parseErr := strconv.Atoi(limitStr); parseErr == nil {
					request.Limit = limit
				}
			}
			request.TeamID = teamID
		}
		response, err = h.SearchTeamMemory(r.Context(), teamID, request.AgentID, user.ID, &request)

	case "clear":
		if r.Method != http.MethodPost && r.Method != http.MethodDelete {
			http.Error(w, "Method not allowed for clear operation", http.StatusMethodNotAllowed)
			return
		}
		response, err = h.ClearTeamMemory(r.Context(), teamID, request.AgentID, user.ID, &request)

	default:
		http.Error(w, fmt.Sprintf("Unknown memory operation: %s", operation), http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, fmt.Sprintf("Memory operation failed: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

// validateTeamWithAgentsCreateRequest validates the team with agents creation request
func (h *Handler) validateTeamWithAgentsCreateRequest(req *types.TeamWithAgentsCreateRequest) error {
	if req.Name == "" {
		return fmt.Errorf("name is required")
	}
	if req.MaxTokensPerDay <= 0 {
		return fmt.Errorf("maxTokensPerDay must be greater than 0")
	}
	if len(req.Agents) == 0 {
		return fmt.Errorf("at least one agent is required")
	}

	// Validate each agent
	for i, agent := range req.Agents {
		if agent.FirstName == "" {
			return fmt.Errorf("agent %d: firstName is required", i+1)
		}
		if agent.LastName == "" {
			return fmt.Errorf("agent %d: lastName is required", i+1)
		}
		if agent.TemplateID == "" {
			return fmt.Errorf("agent %d: templateId is required", i+1)
		}
		if agent.MaxTokensPerDay <= 0 {
			return fmt.Errorf("agent %d: maxTokensPerDay must be greater than 0", i+1)
		}
		if agent.HeartbeatMinutes < 5 {
			return fmt.Errorf("agent %d: heartbeatMinutes must be at least 5", i+1)
		}
		if agent.LifecycleStatus != "" {
			valid := agent.LifecycleStatus == types.LifecycleStatusStandby ||
				agent.LifecycleStatus == types.LifecycleStatusActive ||
				agent.LifecycleStatus == types.LifecycleStatusPaused ||
				agent.LifecycleStatus == types.LifecycleStatusKilled
			if !valid {
				return fmt.Errorf("agent %d: invalid lifecycleStatus", i+1)
			}
		}
	}

	return nil
}

// getTemplateByIDTx retrieves a template by ID within a transaction
func (h *Handler) getTemplateByIDTx(tx *sql.Tx, templateID string) (*types.ExecutionTemplate, error) {
	query := `
		SELECT id, name, description, template_prompt, context_template,
		       enable_function_calling, preferred_configuration_id, is_active, user_id, created_at, updated_at
		FROM execution_templates 
		WHERE id = ? AND is_active = 1
	`

	var template types.ExecutionTemplate
	var createdAt, updatedAt time.Time
	var preferredConfigID sql.NullString
	var description sql.NullString
	var contextTemplate sql.NullString

	err := tx.QueryRow(query, templateID).Scan(
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

// handleTeamContextOperations handles team context update operations
func (h *Handler) handleTeamContextOperations(w http.ResponseWriter, r *http.Request, teamID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req types.TeamContextUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update team context for all agents in the team
	err := h.updateTeamContextForAllAgents(teamID, user.ID, req.SharedTeamContext)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Team not found", http.StatusNotFound)
			return
		}
		http.Error(w, fmt.Sprintf("Failed to update team context: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"message": "Team context updated successfully"}); err != nil {
		log.Printf("Failed to encode context update response: %v", err)
	}
}

// updateTeamContextForAllAgents updates the effective context for all agents in a team
func (h *Handler) updateTeamContextForAllAgents(teamID, userID string, sharedContext *string) error {
	// Start transaction
	tx, err := h.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer func() {
		if err := tx.Rollback(); err != nil {
			log.Printf("Failed to rollback transaction: %v", err)
		}
	}()

	// Get all agents in the team
	agents, err := h.getTeamAgentsTx(tx, teamID, userID)
	if err != nil {
		return fmt.Errorf("failed to get team agents: %w", err)
	}

	// Update effective context for each agent
	for _, agent := range agents {
		// Get the agent's template
		template, err := h.getTemplateByIDTx(tx, agent.TemplateID)
		if err != nil {
			return fmt.Errorf("failed to get template for agent %s: %w", agent.ID, err)
		}

		// Create effective context by appending shared team context to template context
		var effectiveContext *string
		if sharedContext != nil && *sharedContext != "" {
			combinedContext := appendSharedContextToTemplate(template.ContextTemplate, *sharedContext)
			effectiveContext = &combinedContext
		} else if template.ContextTemplate != "" {
			effectiveContext = &template.ContextTemplate
		}

		// Update the agent's effective context
		err = h.updateAgentEffectiveContextTx(tx, agent.ID, effectiveContext)
		if err != nil {
			return fmt.Errorf("failed to update effective context for agent %s: %w", agent.ID, err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// getTeamAgentsTx retrieves all agents in a team within a transaction
func (h *Handler) getTeamAgentsTx(tx *sql.Tx, teamID, userID string) ([]types.Agent, error) {
	query := `
		SELECT id, user_id, first_name, last_name, template_id, team_id,
		       max_tokens_per_day, heartbeat_minutes, lifecycle_status,
		       tokens_used_today, tokens_reset_date, total_executions,
		       effective_context, created_at, updated_at
		FROM agents 
		WHERE team_id = ? AND user_id = ?
	`

	rows, err := tx.Query(query, teamID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var agents []types.Agent
	for rows.Next() {
		var agent types.Agent
		var createdAt, updatedAt time.Time
		var effectiveContext sql.NullString

		err := rows.Scan(
			&agent.ID,
			&agent.UserID,
			&agent.FirstName,
			&agent.LastName,
			&agent.TemplateID,
			&agent.TeamID,
			&agent.MaxTokensPerDay,
			&agent.HeartbeatMinutes,
			&agent.LifecycleStatus,
			&agent.TokensUsedToday,
			&agent.TokensResetDate,
			&agent.TotalExecutions,
			&effectiveContext,
			&createdAt,
			&updatedAt,
		)
		if err != nil {
			return nil, err
		}

		agent.CreatedAt = createdAt
		agent.UpdatedAt = updatedAt

		if effectiveContext.Valid {
			agent.EffectiveContext = &effectiveContext.String
		}

		agents = append(agents, agent)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate agent rows: %w", err)
	}

	return agents, nil
}

// updateAgentEffectiveContextTx updates an agent's effective context within a transaction
func (h *Handler) updateAgentEffectiveContextTx(tx *sql.Tx, agentID string, effectiveContext *string) error {
	query := `UPDATE agents SET effective_context = ?, updated_at = NOW() WHERE id = ?`
	_, err := tx.Exec(query, effectiveContext, agentID)
	return err
}

// appendSharedContextToTemplate combines template context with shared team context
func appendSharedContextToTemplate(templateContext, sharedContext string) string {
	if sharedContext == "" {
		return templateContext
	}

	if templateContext == "" {
		return sharedContext
	}

	// Append shared context with proper formatting
	return templateContext + "\n\n--- SHARED TEAM CONTEXT ---\n" + sharedContext
}
