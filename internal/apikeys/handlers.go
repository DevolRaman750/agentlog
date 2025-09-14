package apikeys

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"gogent/internal/types"
)

// Handler handles HTTP requests for API key management
type Handler struct {
	service *Service
}

// NewHandler creates a new API key handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// getUserIDFromContext extracts user ID from request context
// This assumes the auth middleware has already validated the JWT and set the user ID
func (h *Handler) getUserIDFromContext(r *http.Request) (string, error) {
	userID := r.Header.Get("X-User-ID") // Set by auth middleware
	if userID == "" {
		return "", fmt.Errorf("user ID not found in request context")
	}
	return userID, nil
}

// CreateAPIKey handles POST /api/user/api-keys
func (h *Handler) CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, err := h.getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req types.CreateApiKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	apiKey, err := h.service.CreateAPIKey(ctx, userID, &req)
	if err != nil {
		log.Printf("❌ Failed to create API key: %v", err)
		if strings.Contains(err.Error(), "already exists") {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		if strings.Contains(err.Error(), "validation failed") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to create API key", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    apiKey,
		"message": "API key created successfully",
	})
}

// GetAPIKeys handles GET /api/user/api-keys
func (h *Handler) GetAPIKeys(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, err := h.getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check for service filter
	serviceName := r.URL.Query().Get("service")

	ctx := context.Background()
	var apiKeys []*types.UserApiKey

	if serviceName != "" {
		apiKeys, err = h.service.GetAPIKeysByService(ctx, userID, serviceName)
	} else {
		apiKeys, err = h.service.GetAPIKeys(ctx, userID)
	}

	if err != nil {
		log.Printf("❌ Failed to get API keys: %v", err)
		http.Error(w, "Failed to retrieve API keys", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    apiKeys,
		"count":   len(apiKeys),
	})
}

// HandleKeyRoutes is a generic handler for /api/user/api-keys/ and /api/user/api-keys/{id}
func (h *Handler) HandleKeyRoutes(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	// Handle function requirements endpoint first
	if strings.HasPrefix(path, "/api/user/api-keys/functions/") && strings.HasSuffix(path, "/requirements") {
		h.GetFunctionApiKeyRequirements(w, r)
		return
	}

	// Handle test endpoint
	if strings.HasPrefix(path, "/api/user/api-keys/") && strings.HasSuffix(path, "/test") {
		h.TestAPIKey(w, r)
		return
	}

	trimmedPath := strings.TrimSuffix(path, "/")
	parts := strings.Split(trimmedPath, "/")

	// /api/user/api-keys
	if len(parts) == 4 {
		switch r.Method {
		case http.MethodGet:
			h.GetAPIKeys(w, r)
		case http.MethodPost:
			h.CreateAPIKey(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	// /api/user/api-keys/{id}
	if len(parts) == 5 {
		switch r.Method {
		case http.MethodGet:
			h.GetAPIKey(w, r)
		case http.MethodPut:
			h.UpdateAPIKey(w, r)
		case http.MethodDelete:
			h.DeleteAPIKey(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	http.NotFound(w, r)
}
func (h *Handler) GetAPIKey(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	keyID := strings.TrimPrefix(r.URL.Path, "/api/user/api-keys/")
	apiKey, err := h.service.GetAPIKeyByID(r.Context(), userID, keyID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(apiKey)
}
func (h *Handler) UpdateAPIKey(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	keyID := strings.TrimPrefix(r.URL.Path, "/api/user/api-keys/")
	var req types.UpdateApiKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	apiKey, err := h.service.UpdateAPIKey(r.Context(), userID, keyID, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(apiKey)
}
func (h *Handler) DeleteAPIKey(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	keyID := strings.TrimPrefix(r.URL.Path, "/api/user/api-keys/")
	if err := h.service.DeleteAPIKey(r.Context(), userID, keyID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
func (h *Handler) TestAPIKey(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	keyID := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/api/user/api-keys/"), "/test")
	result, err := h.service.TestAPIKey(r.Context(), userID, keyID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(result)
}
func (h *Handler) GetFunctionApiKeyRequirements(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	functionID := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/api/user/api-keys/functions/"), "/requirements")
	requirements, err := h.service.GetFunctionApiKeyRequirements(r.Context(), userID, functionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(requirements)
}
func (h *Handler) GetFunctionGroupApiKeyStatus(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	status, err := h.service.GetFunctionGroupApiKeyStatus(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(status)
}
func (h *Handler) GetAPIKeyStatistics(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	stats, err := h.service.GetAPIKeyStatistics(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(stats)
}

// RegisterRoutes registers all API key routes with the HTTP server
func (h *Handler) RegisterRoutes(mux *http.ServeMux, authMiddleware func(http.HandlerFunc) http.HandlerFunc) {
	// Core CRUD operations
	mux.HandleFunc("/api/user/api-keys", authMiddleware(h.handleAPIKeyRoutes))

	// Status and requirements
	mux.HandleFunc("/api/user/api-keys/function-groups/status", authMiddleware(h.GetFunctionGroupApiKeyStatus))
	mux.HandleFunc("/api/user/api-keys/statistics", authMiddleware(h.GetAPIKeyStatistics))

	// These will need custom routing logic since they have path parameters
	// For now, we'll handle them in a single route with path parsing
}

// handleAPIKeyRoutes handles routing for the main API key endpoints
func (h *Handler) handleAPIKeyRoutes(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	switch {
	case path == "/api/user/api-keys":
		switch r.Method {
		case http.MethodGet:
			h.GetAPIKeys(w, r)
		case http.MethodPost:
			h.CreateAPIKey(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	case strings.HasPrefix(path, "/api/user/api-keys/") && strings.HasSuffix(path, "/test"):
		h.TestAPIKey(w, r)
	case strings.HasPrefix(path, "/api/user/api-keys/functions/") && strings.HasSuffix(path, "/requirements"):
		h.GetFunctionApiKeyRequirements(w, r)
	case strings.HasPrefix(path, "/api/user/api-keys/"):
		// Individual API key operations (GET, PUT, DELETE)
		switch r.Method {
		case http.MethodGet:
			h.GetAPIKey(w, r)
		case http.MethodPut:
			h.UpdateAPIKey(w, r)
		case http.MethodDelete:
			h.DeleteAPIKey(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	default:
		http.Error(w, "Not found", http.StatusNotFound)
	}
}
