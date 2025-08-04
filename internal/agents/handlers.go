package agents

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

// AgentsHandler handles all agent-related HTTP requests
type AgentsHandler struct {
	db *sql.DB
}

// NewAgentsHandler creates a new agents handler
func NewAgentsHandler(db *sql.DB) *AgentsHandler {
	return &AgentsHandler{db: db}
}

// HandleAgents handles operations on the base /api/agents endpoint
func (h *AgentsHandler) HandleAgents(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listAgents(w, r)
	case http.MethodPost:
		h.createAgent(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleAgentByID handles operations on specific agents at /api/agents/{id} and sub-routes
func (h *AgentsHandler) HandleAgentByID(w http.ResponseWriter, r *http.Request) {
	// Extract agent ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid agent ID", http.StatusBadRequest)
		return
	}
	agentID := pathParts[2]

	// Check for sub-routes like /api/agents/{id}/executions
	if len(pathParts) >= 4 && pathParts[3] == "executions" {
		h.getAgentExecutions(w, r, agentID)
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.getAgent(w, r, agentID)
	case http.MethodPut:
		h.updateAgent(w, r, agentID)
	case http.MethodDelete:
		h.deleteAgent(w, r, agentID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}



// listAgents lists all agents for the authenticated user
func (h *AgentsHandler) listAgents(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Parse query parameters
	includeStats := r.URL.Query().Get("include_stats") == "true"

	var agents []types.Agent
	var err error

	if includeStats {
		agents, err = h.getAgentsWithStats(user.ID)
	} else {
		agents, err = h.getAgents(user.ID)
	}

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get agents: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(agents)
}

// createAgent creates a new agent
func (h *AgentsHandler) createAgent(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	var req types.AgentCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	// Validate request
	if err := h.validateCreateRequest(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Verify template exists and belongs to user
	if err := h.verifyTemplateAccess(user.ID, req.TemplateID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Create agent
	agent := &types.Agent{
		ID:               uuid.New().String(),
		UserID:           user.ID,
		FirstName:        req.FirstName,
		LastName:         req.LastName,
		TemplateID:       req.TemplateID,
		MaxTokensPerDay:  req.MaxTokensPerDay,
		HeartbeatMinutes: req.HeartbeatMinutes,
		LifecycleStatus:  req.LifecycleStatus,
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

	if err := h.insertAgent(agent); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create agent: %v", err), http.StatusInternalServerError)
		return
	}

	// Get the created agent with template info
	createdAgent, err := h.getAgentByID(user.ID, agent.ID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to retrieve created agent: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(createdAgent)
}

// getAgent retrieves a specific agent
func (h *AgentsHandler) getAgent(w http.ResponseWriter, r *http.Request, agentID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	agent, err := h.getAgentByID(user.ID, agentID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Agent not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to get agent: %v", err), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(agent)
}

// updateAgent updates an existing agent
func (h *AgentsHandler) updateAgent(w http.ResponseWriter, r *http.Request, agentID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	var req types.AgentUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	// Validate request
	if err := h.validateUpdateRequest(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Check if agent exists and belongs to user
	existingAgent, err := h.getAgentByID(user.ID, agentID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Agent not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to get agent: %v", err), http.StatusInternalServerError)
		}
		return
	}

	// Update agent
	if err := h.updateAgentFields(user.ID, agentID, &req); err != nil {
		http.Error(w, fmt.Sprintf("Failed to update agent: %v", err), http.StatusInternalServerError)
		return
	}

	// Get updated agent
	updatedAgent, err := h.getAgentByID(user.ID, agentID)
	if err != nil {
		// If we can't get the updated agent, return the pre-update version
		// This ensures we don't lose the successful update
		updatedAgent = existingAgent
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedAgent)
}

// deleteAgent deletes an agent
func (h *AgentsHandler) deleteAgent(w http.ResponseWriter, r *http.Request, agentID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Check if agent exists and belongs to user
	_, err := h.getAgentByID(user.ID, agentID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Agent not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to get agent: %v", err), http.StatusInternalServerError)
		}
		return
	}

	// Delete agent
	if err := h.deleteAgentByID(user.ID, agentID); err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete agent: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// getAgentExecutions retrieves executions for a specific agent
func (h *AgentsHandler) getAgentExecutions(w http.ResponseWriter, r *http.Request, agentID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Check if agent exists and belongs to user
	_, err := h.getAgentByID(user.ID, agentID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Agent not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to get agent: %v", err), http.StatusInternalServerError)
		}
		return
	}

	// Parse query parameters for pagination
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50 // default
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	offset := 0 // default
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	executions, err := h.getExecutionsByAgentID(agentID, limit, offset)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get agent executions: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(executions)
}

// Database helper methods would go here...
// (I'll implement these in the next part)

// validateCreateRequest validates the agent creation request
func (h *AgentsHandler) validateCreateRequest(req *types.AgentCreateRequest) error {
	if req.FirstName == "" {
		return fmt.Errorf("firstName is required")
	}
	if req.LastName == "" {
		return fmt.Errorf("lastName is required")
	}
	if req.TemplateID == "" {
		return fmt.Errorf("templateId is required")
	}
	if req.MaxTokensPerDay <= 0 {
		return fmt.Errorf("maxTokensPerDay must be greater than 0")
	}
	if req.HeartbeatMinutes < 5 {
		return fmt.Errorf("heartbeatMinutes must be at least 5")
	}
	if req.LifecycleStatus != "" {
		valid := req.LifecycleStatus == types.LifecycleStatusStandby ||
			req.LifecycleStatus == types.LifecycleStatusActive ||
			req.LifecycleStatus == types.LifecycleStatusPaused ||
			req.LifecycleStatus == types.LifecycleStatusKilled
		if !valid {
			return fmt.Errorf("invalid lifecycleStatus")
		}
	}
	return nil
}

// validateUpdateRequest validates the agent update request
func (h *AgentsHandler) validateUpdateRequest(req *types.AgentUpdateRequest) error {
	if req.FirstName != nil && *req.FirstName == "" {
		return fmt.Errorf("firstName cannot be empty")
	}
	if req.LastName != nil && *req.LastName == "" {
		return fmt.Errorf("lastName cannot be empty")
	}
	if req.MaxTokensPerDay != nil && *req.MaxTokensPerDay <= 0 {
		return fmt.Errorf("maxTokensPerDay must be greater than 0")
	}
	if req.HeartbeatMinutes != nil && *req.HeartbeatMinutes < 5 {
		return fmt.Errorf("heartbeatMinutes must be at least 5")
	}
	if req.LifecycleStatus != nil {
		valid := *req.LifecycleStatus == types.LifecycleStatusStandby ||
			*req.LifecycleStatus == types.LifecycleStatusActive ||
			*req.LifecycleStatus == types.LifecycleStatusPaused ||
			*req.LifecycleStatus == types.LifecycleStatusKilled
		if !valid {
			return fmt.Errorf("invalid lifecycleStatus")
		}
	}
	return nil
}
