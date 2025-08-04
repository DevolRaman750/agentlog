package teams

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
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
		h.createTeam(w, r)
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
