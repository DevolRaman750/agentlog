package agents

import (
	"context"
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

	// Check for team assignment sub-route /api/agents/{id}/team
	if len(pathParts) >= 4 && pathParts[3] == "team" {
		h.handleAgentTeamAssignment(w, r, agentID)
		return
	}

	// Check for memory sub-routes /api/agents/{id}/memory/*
	if len(pathParts) >= 4 && pathParts[3] == "memory" {
		h.handleAgentMemory(w, r, agentID, pathParts)
		return
	}

	// Check for API key sub-routes /api/agents/{id}/api-keys/*
	if len(pathParts) >= 4 && pathParts[3] == "api-keys" {
		h.handleAgentApiKeys(w, r, agentID, pathParts)
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
	if req.TemplateID != nil && *req.TemplateID == "" {
		return fmt.Errorf("templateId cannot be empty")
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

// handleAgentTeamAssignment handles team assignment operations for an agent
func (h *AgentsHandler) handleAgentTeamAssignment(w http.ResponseWriter, r *http.Request, agentID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	switch r.Method {
	case http.MethodDelete:
		// Remove agent from team
		err := h.removeAgentFromTeam(agentID, user.ID)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Agent not found", http.StatusNotFound)
				return
			}
			http.Error(w, fmt.Sprintf("Failed to remove agent from team: %v", err), http.StatusInternalServerError)
			return
		}

		// Get the updated agent
		agent, err := h.getAgentByID(agentID, user.ID)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to retrieve updated agent: %v", err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(agent)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleAgentMemory handles all memory-related operations for an agent
func (h *AgentsHandler) handleAgentMemory(w http.ResponseWriter, r *http.Request, agentID string, pathParts []string) {
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
	var request types.AgentMemoryRequest
	if r.Method == http.MethodPost || r.Method == http.MethodPut {
		err := json.NewDecoder(r.Body).Decode(&request)
		if err != nil {
			http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
			return
		}
		request.AgentID = agentID
	}

	var response *types.AgentMemoryResponse
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
			request.AgentID = agentID
		}
		response, err = h.ReadMemory(r.Context(), agentID, user.ID, &request)

	case "write":
		if r.Method != http.MethodPost && r.Method != http.MethodPut {
			http.Error(w, "Method not allowed for write operation", http.StatusMethodNotAllowed)
			return
		}
		response, err = h.WriteMemory(r.Context(), agentID, user.ID, &request)

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
			request.AgentID = agentID
		}
		response, err = h.SearchMemory(r.Context(), agentID, user.ID, &request)

	case "clear":
		if r.Method != http.MethodPost && r.Method != http.MethodDelete {
			http.Error(w, "Method not allowed for clear operation", http.StatusMethodNotAllowed)
			return
		}
		response, err = h.ClearMemory(r.Context(), agentID, user.ID, &request)

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

// handleAgentApiKeys handles API key operations for agents
func (h *AgentsHandler) handleAgentApiKeys(w http.ResponseWriter, r *http.Request, agentID string, pathParts []string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Verify agent ownership
	_, err := h.getAgentByID(user.ID, agentID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Agent not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to get agent", http.StatusInternalServerError)
		}
		return
	}

	// Check for specific API key ID in path: /api/agents/{id}/api-keys/{keyId}
	if len(pathParts) >= 5 {
		keyMappingID := pathParts[4]
		h.handleAgentApiKeyByID(w, r, agentID, keyMappingID, user.ID)
		return
	}

	// Handle base API key operations
	switch r.Method {
	case http.MethodGet:
		h.listAgentApiKeys(w, r, agentID, user.ID)
	case http.MethodPost:
		h.createAgentApiKey(w, r, agentID, user.ID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// listAgentApiKeys lists all API keys for an agent
func (h *AgentsHandler) listAgentApiKeys(w http.ResponseWriter, r *http.Request, agentID, userID string) {
	agentApiKeys, err := h.getAgentApiKeys(agentID)
	if err != nil {
		http.Error(w, "Failed to get agent API keys", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"apiKeys": agentApiKeys,
	})
}

// createAgentApiKey creates a new API key mapping for an agent
func (h *AgentsHandler) createAgentApiKey(w http.ResponseWriter, r *http.Request, agentID, userID string) {
	var req types.AgentApiKeyCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.AgentID == "" || req.ApiKeyID == "" {
		http.Error(w, "Agent ID and API key ID are required", http.StatusBadRequest)
		return
	}

	// Ensure agent ID matches URL
	if req.AgentID != agentID {
		http.Error(w, "Agent ID mismatch", http.StatusBadRequest)
		return
	}

	// Verify API key access
	if err := h.verifyApiKeyAccess(agentID, req.ApiKeyID); err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	// Create the mapping
	agentApiKey := &types.AgentApiKey{
		ID:               uuid.New().String(),
		AgentID:          req.AgentID,
		ApiKeyID:         req.ApiKeyID,
		IsDefault:        req.IsDefault,
		UseGlobalDefault: req.UseGlobalDefault,
		Priority:         req.Priority,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := h.insertAgentApiKey(agentApiKey); err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			http.Error(w, "API key already assigned to this agent", http.StatusConflict)
		} else {
			http.Error(w, "Failed to create agent API key mapping", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"apiKey":  agentApiKey,
	})
}

// handleAgentApiKeyByID handles operations on specific agent API key mappings
func (h *AgentsHandler) handleAgentApiKeyByID(w http.ResponseWriter, r *http.Request, agentID, keyMappingID, userID string) {
	switch r.Method {
	case http.MethodPut:
		h.updateAgentApiKey(w, r, agentID, keyMappingID, userID)
	case http.MethodDelete:
		h.deleteAgentApiKeyHandler(w, r, agentID, keyMappingID, userID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// updateAgentApiKey updates an agent API key mapping
func (h *AgentsHandler) updateAgentApiKey(w http.ResponseWriter, r *http.Request, agentID, keyMappingID, userID string) {
	var req types.AgentApiKeyUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.updateAgentApiKeyFields(agentID, keyMappingID, &req); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Agent API key mapping not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to update agent API key mapping", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Agent API key mapping updated successfully",
	})
}

// deleteAgentApiKeyHandler removes an agent API key mapping
func (h *AgentsHandler) deleteAgentApiKeyHandler(w http.ResponseWriter, r *http.Request, agentID, keyMappingID, userID string) {
	if err := h.deleteAgentApiKey(agentID, keyMappingID); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Agent API key mapping not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to delete agent API key mapping", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Agent API key mapping deleted successfully",
	})
}

// GetAgentApiKeyConfiguration gets the complete API key configuration for an agent
// This is used internally by the execution engine to resolve agent-specific API keys
func (h *AgentsHandler) GetAgentApiKeyConfiguration(ctx context.Context, agentID string) (*types.AgentApiKeyConfiguration, error) {
	return h.getAgentApiKeyConfiguration(ctx, agentID)
}
