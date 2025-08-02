package templates

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"gogent/internal/auth"
	"gogent/internal/types"
)

// TemplateHandler handles HTTP requests for execution templates
type TemplateHandler struct {
	templateService *TemplateService
	rateLimiter     *RateLimiter
	authService     *auth.AuthService
}

// NewTemplateHandler creates a new template handler
func NewTemplateHandler(templateService *TemplateService, rateLimiter *RateLimiter, authService *auth.AuthService) *TemplateHandler {
	return &TemplateHandler{
		templateService: templateService,
		rateLimiter:     rateLimiter,
		authService:     authService,
	}
}

// =============================================================================
// TEMPLATE CRUD HANDLERS (Authenticated Users)
// =============================================================================

// ListTemplates handles GET /api/templates
func (th *TemplateHandler) ListTemplates(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user from context
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Parse query parameters
	query := r.URL.Query()
	limit, _ := strconv.Atoi(query.Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 20 // Default limit
	}
	offset, _ := strconv.Atoi(query.Get("offset"))
	if offset < 0 {
		offset = 0
	}

	category := query.Get("category")
	includePublic := query.Get("include_public") == "true"
	includeInactive := query.Get("include_inactive") == "true"
	includeTokens := query.Get("include_tokens") == "true"

	// Get templates
	templates, totalCount, err := th.templateService.ListTemplates(user.ID, limit, offset, category, includePublic, includeInactive, includeTokens)
	if err != nil {
		log.Printf("Error listing templates: %v", err)
		http.Error(w, "Failed to list templates", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"templates":  templates,
		"totalCount": totalCount,
		"limit":      limit,
		"offset":     offset,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetTemplate handles GET /api/templates/{id}
func (th *TemplateHandler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract template ID from URL
	templateID := th.extractTemplateID(r.URL.Path)
	if templateID == "" {
		http.Error(w, "Template ID required", http.StatusBadRequest)
		return
	}

	// Parse query parameters
	query := r.URL.Query()
	includeParameters := query.Get("include_parameters") != "false" // Default true
	includeTokens := query.Get("include_tokens") == "true"

	// Get template
	template, err := th.templateService.GetTemplateByID(templateID, includeParameters, includeTokens)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}
		log.Printf("Error getting template: %v", err)
		http.Error(w, "Failed to get template", http.StatusInternalServerError)
		return
	}

	// Check if user has access (must be owner or template is public)
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	if template.UserID != user.ID && !template.IsPublic {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	// Hide sensitive data if not owner
	if template.UserID != user.ID {
		template.AuthTokens = nil // Don't show tokens to non-owners
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(template)
}

// CreateTemplate handles POST /api/templates
func (th *TemplateHandler) CreateTemplate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user from context
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Parse request body
	var request struct {
		Template    types.ExecutionTemplate            `json:"template"`
		Parameters  []types.ExecutionTemplateParameter `json:"parameters"`
		FunctionIds []string                           `json:"functionIds,omitempty"` // Function IDs to associate
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	// Validate required fields
	if request.Template.Name == "" {
		http.Error(w, "Template name is required", http.StatusBadRequest)
		return
	}
	if request.Template.TemplatePrompt == "" {
		http.Error(w, "Template prompt is required", http.StatusBadRequest)
		return
	}

	// Set user ID and defaults
	request.Template.UserID = user.ID
	if request.Template.ExecutionTimeoutSeconds == 0 {
		request.Template.ExecutionTimeoutSeconds = 300 // 5 minutes default
	}
	if request.Template.RateLimitPerHour == 0 {
		request.Template.RateLimitPerHour = 100
	}
	if request.Template.RateLimitPerDay == 0 {
		request.Template.RateLimitPerDay = 1000
	}
	if request.Template.RateLimitBurst == 0 {
		request.Template.RateLimitBurst = 10
	}
	if request.Template.Category == "" {
		request.Template.Category = "general"
	}

	// Create template
	createdTemplate, err := th.templateService.CreateTemplate(&request.Template, request.Parameters, request.FunctionIds)
	if err != nil {
		log.Printf("Error creating template: %v", err)
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			http.Error(w, "Template name already exists", http.StatusConflict)
			return
		}
		http.Error(w, "Failed to create template", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(createdTemplate)
}

// UpdateTemplate handles PUT /api/templates/{id}
func (th *TemplateHandler) UpdateTemplate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract template ID
	templateID := th.extractTemplateID(r.URL.Path)
	if templateID == "" {
		http.Error(w, "Template ID required", http.StatusBadRequest)
		return
	}

	// Get user from context
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Check if template exists and user owns it
	existingTemplate, err := th.templateService.GetTemplateByID(templateID, false, false)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to get template", http.StatusInternalServerError)
		return
	}

	if existingTemplate.UserID != user.ID {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	// Parse request body
	var request struct {
		Template      types.ExecutionTemplate            `json:"template"`
		Parameters    []types.ExecutionTemplateParameter `json:"parameters"`
		FunctionIds   []string                           `json:"functionIds,omitempty"` // Function IDs to associate
		ChangeSummary string                             `json:"changeSummary"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	// Preserve user ID and ID
	request.Template.UserID = user.ID
	request.Template.ID = templateID

	// Update template
	updatedTemplate, version, err := th.templateService.UpdateTemplate(templateID, &request.Template, request.Parameters, request.FunctionIds, request.ChangeSummary)
	if err != nil {
		log.Printf("Error updating template: %v", err)
		http.Error(w, "Failed to update template", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"template": updatedTemplate,
		"version":  version,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DeleteTemplate handles DELETE /api/templates/{id}
func (th *TemplateHandler) DeleteTemplate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract template ID
	templateID := th.extractTemplateID(r.URL.Path)
	if templateID == "" {
		http.Error(w, "Template ID required", http.StatusBadRequest)
		return
	}

	// Get user from context
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Check if template exists and user owns it
	existingTemplate, err := th.templateService.GetTemplateByID(templateID, false, false)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to get template", http.StatusInternalServerError)
		return
	}

	if existingTemplate.UserID != user.ID {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	// Delete template
	err = th.templateService.DeleteTemplate(templateID)
	if err != nil {
		log.Printf("Error deleting template: %v", err)
		http.Error(w, "Failed to delete template", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Template deleted successfully",
	})
}

// =============================================================================
// AUTH TOKEN MANAGEMENT HANDLERS
// =============================================================================

// CreateAuthToken handles POST /api/templates/{id}/tokens
func (th *TemplateHandler) CreateAuthToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract template ID
	templateID := th.extractTemplateID(r.URL.Path)
	if templateID == "" {
		http.Error(w, "Template ID required", http.StatusBadRequest)
		return
	}

	// Get user from context
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Check template ownership
	template, err := th.templateService.GetTemplateByID(templateID, false, false)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to get template", http.StatusInternalServerError)
		return
	}

	if template.UserID != user.ID {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	// Parse request body
	var token types.ExecutionTemplateAuthToken
	if err := json.NewDecoder(r.Body).Decode(&token); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	// Validate required fields
	if token.TokenName == "" {
		http.Error(w, "Token name is required", http.StatusBadRequest)
		return
	}

	// Set fields
	token.TemplateID = templateID
	token.UserID = user.ID
	token.IsActive = true

	// Create token
	createdToken, err := th.templateService.CreateAuthToken(&token)
	if err != nil {
		log.Printf("Error creating auth token: %v", err)
		http.Error(w, "Failed to create auth token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(createdToken)
}

// ListAuthTokens handles GET /api/templates/{id}/tokens
func (th *TemplateHandler) ListAuthTokens(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract template ID
	templateID := th.extractTemplateID(r.URL.Path)
	if templateID == "" {
		http.Error(w, "Template ID required", http.StatusBadRequest)
		return
	}

	// Get user from context
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Check template ownership
	template, err := th.templateService.GetTemplateByID(templateID, false, false)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to get template", http.StatusInternalServerError)
		return
	}

	if template.UserID != user.ID {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	// Parse query parameters
	includeInactive := r.URL.Query().Get("include_inactive") == "true"

	// Get tokens
	tokens, err := th.templateService.getTemplateAuthTokens(templateID, includeInactive)
	if err != nil {
		log.Printf("Error listing auth tokens: %v", err)
		http.Error(w, "Failed to list auth tokens", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"tokens": tokens,
	})
}

// UpdateAuthToken handles PUT /api/templates/{id}/tokens/{tokenId}
func (th *TemplateHandler) UpdateAuthToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract IDs from URL
	templateID := th.extractTemplateID(r.URL.Path)
	tokenID := th.extractTokenID(r.URL.Path)
	if templateID == "" || tokenID == "" {
		http.Error(w, "Template ID and Token ID required", http.StatusBadRequest)
		return
	}

	// Get user from context
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Check ownership
	if err := th.checkTokenOwnership(templateID, tokenID, user.ID); err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Token not found", http.StatusNotFound)
			return
		}
		if strings.Contains(err.Error(), "access denied") {
			http.Error(w, "Access denied", http.StatusForbidden)
			return
		}
		http.Error(w, "Failed to verify ownership", http.StatusInternalServerError)
		return
	}

	// Parse request body
	var token types.ExecutionTemplateAuthToken
	if err := json.NewDecoder(r.Body).Decode(&token); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	// Update token
	updatedToken, err := th.templateService.UpdateAuthToken(tokenID, &token)
	if err != nil {
		log.Printf("Error updating auth token: %v", err)
		http.Error(w, "Failed to update auth token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedToken)
}

// DeleteAuthToken handles DELETE /api/templates/{id}/tokens/{tokenId}
func (th *TemplateHandler) DeleteAuthToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract IDs from URL
	templateID := th.extractTemplateID(r.URL.Path)
	tokenID := th.extractTokenID(r.URL.Path)
	if templateID == "" || tokenID == "" {
		http.Error(w, "Template ID and Token ID required", http.StatusBadRequest)
		return
	}

	// Get user from context
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "User not found in context", http.StatusUnauthorized)
		return
	}

	// Check ownership
	if err := th.checkTokenOwnership(templateID, tokenID, user.ID); err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Token not found", http.StatusNotFound)
			return
		}
		if strings.Contains(err.Error(), "access denied") {
			http.Error(w, "Access denied", http.StatusForbidden)
			return
		}
		http.Error(w, "Failed to verify ownership", http.StatusInternalServerError)
		return
	}

	// Delete token
	err := th.templateService.DeleteAuthToken(tokenID)
	if err != nil {
		log.Printf("Error deleting auth token: %v", err)
		http.Error(w, "Failed to delete auth token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Auth token deleted successfully",
	})
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// extractTemplateID extracts template ID from URL path
func (th *TemplateHandler) extractTemplateID(path string) string {
	// Expected patterns:
	// /api/templates/{id}
	// /api/templates/{id}/tokens
	// /api/templates/{id}/tokens/{tokenId}
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "templates" {
		return parts[2]
	}
	return ""
}

// extractTokenID extracts token ID from URL path
func (th *TemplateHandler) extractTokenID(path string) string {
	// Expected pattern: /api/templates/{id}/tokens/{tokenId}
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) >= 5 && parts[0] == "api" && parts[1] == "templates" && parts[3] == "tokens" {
		return parts[4]
	}
	return ""
}

// checkTokenOwnership verifies that user owns the template and token
func (th *TemplateHandler) checkTokenOwnership(templateID, tokenID, userID string) error {
	// Get template to check ownership
	template, err := th.templateService.GetTemplateByID(templateID, false, false)
	if err != nil {
		return err
	}

	if template.UserID != userID {
		return fmt.Errorf("access denied")
	}

	// Get token to verify it belongs to this template
	token, err := th.templateService.GetAuthTokenByID(tokenID)
	if err != nil {
		return err
	}

	if token.TemplateID != templateID {
		return fmt.Errorf("token not found")
	}

	return nil
}
