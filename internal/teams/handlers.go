package teams

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"gogent/internal/auth"
	"gogent/internal/types"

	"github.com/google/uuid"
)

// TeamsHandler handles all team-related HTTP requests
type TeamsHandler struct {
	db *sql.DB
}

// NewTeamsHandler creates a new teams handler
func NewTeamsHandler(db *sql.DB) *TeamsHandler {
	return &TeamsHandler{db: db}
}

// HandleTeams handles operations on the base /api/teams endpoint
func (h *TeamsHandler) HandleTeams(w http.ResponseWriter, r *http.Request) {
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
func (h *TeamsHandler) HandleTeamByID(w http.ResponseWriter, r *http.Request) {
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
func (h *TeamsHandler) listTeams(w http.ResponseWriter, r *http.Request) {
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
	json.NewEncoder(w).Encode(teams)
}

// createTeam creates a new team
func (h *TeamsHandler) createTeam(w http.ResponseWriter, r *http.Request) {
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
	json.NewEncoder(w).Encode(team)
}

// createTeamWithAgents creates a new team with associated agents
func (h *TeamsHandler) createTeamWithAgents(w http.ResponseWriter, r *http.Request) {
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
	defer tx.Rollback()

	// Create team
	team := types.Team{
		ID:               uuid.New().String(),
		UserID:           user.ID,
		Name:             req.Name,
		Description:      req.Description,
		MaxTokensPerDay:  req.MaxTokensPerDay,
		TokensUsedToday:  0,
		TokensResetDate:  time.Now().Format("2006-01-02"),
		AgentCount:       int32(len(req.Agents)),
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
	json.NewEncoder(w).Encode(response)
}

// getTeam retrieves a specific team
func (h *TeamsHandler) getTeam(w http.ResponseWriter, r *http.Request, teamID string) {
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
	json.NewEncoder(w).Encode(team)
}

// updateTeam updates a team
func (h *TeamsHandler) updateTeam(w http.ResponseWriter, r *http.Request, teamID string) {
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
	json.NewEncoder(w).Encode(team)
}

// deleteTeam deletes a team
func (h *TeamsHandler) deleteTeam(w http.ResponseWriter, r *http.Request, teamID string) {
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
	json.NewEncoder(w).Encode(map[string]string{"message": "Team deleted successfully"})
}

// handleTeamAgents handles /api/teams/{id}/agents
func (h *TeamsHandler) handleTeamAgents(w http.ResponseWriter, r *http.Request, teamID string) {
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
		json.NewEncoder(w).Encode(teamWithAgents)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleTeamAgentAssignment handles /api/teams/{id}/agents/{agentId}
func (h *TeamsHandler) handleTeamAgentAssignment(w http.ResponseWriter, r *http.Request, teamID, agentID string) {
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
		json.NewEncoder(w).Encode(agent)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// pauseAllTeamAgents pauses all active agents in a team
func (h *TeamsHandler) pauseAllTeamAgents(w http.ResponseWriter, r *http.Request, teamID string) {
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
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":       "Team agents paused successfully",
		"affectedCount": affectedCount,
	})
}

// resumeAllTeamAgents resumes all paused agents in a team
func (h *TeamsHandler) resumeAllTeamAgents(w http.ResponseWriter, r *http.Request, teamID string) {
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
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":       "Team agents resumed successfully",
		"affectedCount": affectedCount,
	})
}

// getTeamStats retrieves statistics for a team
func (h *TeamsHandler) getTeamStats(w http.ResponseWriter, r *http.Request, teamID string) {
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
	json.NewEncoder(w).Encode(stats)
}

// handleTeamMemory handles team memory operations
func (h *TeamsHandler) handleTeamMemory(w http.ResponseWriter, r *http.Request, teamID string, pathParts []string) {
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
	json.NewEncoder(w).Encode(response)
}

// validateTeamWithAgentsCreateRequest validates the team with agents creation request
func (h *TeamsHandler) validateTeamWithAgentsCreateRequest(req *types.TeamWithAgentsCreateRequest) error {
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
