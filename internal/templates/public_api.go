package templates

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"gogent/internal/types"
)

// PublicAPIHandler handles public template execution requests
type PublicAPIHandler struct {
	templateService *TemplateService
	rateLimiter     *RateLimiter
	executionEngine ExecutionEngine // Interface to existing execution system
}

// ExecutionEngine interface for integrating with existing execution system
type ExecutionEngine interface {
	StartExecution(request *types.MultiExecutionRequest, useMock bool, sessionApiKeys map[string]string) (string, *types.ExecutionRun, error)
	GetExecutionStatus(executionID string) (string, string, *time.Time, *time.Time, *types.ExecutionResult, error)
}

// NewPublicAPIHandler creates a new public API handler
func NewPublicAPIHandler(templateService *TemplateService, rateLimiter *RateLimiter, executionEngine ExecutionEngine) *PublicAPIHandler {
	return &PublicAPIHandler{
		templateService: templateService,
		rateLimiter:     rateLimiter,
		executionEngine: executionEngine,
	}
}

// =============================================================================
// PUBLIC TEMPLATE EXECUTION API (Token Authentication)
// =============================================================================

// ExecuteTemplate handles POST /api/public/templates/{id}/execute
func (pah *PublicAPIHandler) ExecuteTemplate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract template ID from URL
	templateID := pah.extractTemplateID(r.URL.Path)
	if templateID == "" {
		http.Error(w, "Template ID required", http.StatusBadRequest)
		return
	}

	// Extract auth token from header or query parameter
	authToken := pah.extractAuthToken(r)
	if authToken == "" {
		http.Error(w, "Authentication token required", http.StatusUnauthorized)
		return
	}

	// Get client information
	clientIP := pah.getClientIP(r)
	userAgent := r.Header.Get("User-Agent")
	referer := r.Header.Get("Referer")
	origin := r.Header.Get("Origin")

	// Validate auth token
	token, err := pah.templateService.GetAuthTokenByValue(authToken)
	if err != nil {
		log.Printf("Invalid auth token: %v", err)
		http.Error(w, "Invalid authentication token", http.StatusUnauthorized)
		return
	}

	// Verify token belongs to this template
	if token.TemplateID != templateID {
		http.Error(w, "Token not valid for this template", http.StatusForbidden)
		return
	}

	// Validate token access (IP/origin restrictions)
	err = pah.templateService.ValidateTokenAccess(token, clientIP, origin)
	if err != nil {
		log.Printf("Token access validation failed: %v", err)
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	// Get template
	template, err := pah.templateService.GetTemplateByID(templateID, true, false)
	if err != nil {
		log.Printf("Failed to get template: %v", err)
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Template not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to get template", http.StatusInternalServerError)
		}
		return
	}

	if !template.IsActive {
		http.Error(w, "Template is not active", http.StatusForbidden)
		return
	}

	// Check rate limits
	rateLimitResult, err := pah.rateLimiter.CheckRateLimit(templateID, token)
	if err != nil {
		log.Printf("Rate limit check failed: %v", err)
		http.Error(w, "Failed to check rate limits", http.StatusInternalServerError)
		return
	}

	if !rateLimitResult.Allowed {
		// Add rate limit headers
		w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", template.RateLimitPerHour))
		w.Header().Set("X-RateLimit-Remaining", "0")
		w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", rateLimitResult.ResetTimeHour.Unix()))
		w.Header().Set("X-RateLimit-Type", rateLimitResult.LimitType)

		if rateLimitResult.PlatformLimitHit {
			http.Error(w, "Platform rate limit exceeded", http.StatusTooManyRequests)
		} else {
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
		}
		return
	}

	// Parse request body
	var request struct {
		Parameters map[string]interface{} `json:"parameters"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	if request.Parameters == nil {
		request.Parameters = make(map[string]interface{})
	}

	// Validate parameters
	validationErrors, err := pah.templateService.ValidateParameters(templateID, request.Parameters)
	if err != nil {
		log.Printf("Parameter validation failed: %v", err)
		http.Error(w, "Parameter validation failed", http.StatusInternalServerError)
		return
	}

	if len(validationErrors) > 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error":  "Parameter validation failed",
			"errors": validationErrors,
		})
		return
	}

	// Substitute template parameters
	resolvedPrompt, resolvedContext, err := pah.templateService.SubstituteTemplateParameters(template, request.Parameters)
	if err != nil {
		log.Printf("Template substitution failed: %v", err)
		http.Error(w, "Template substitution failed", http.StatusInternalServerError)
		return
	}

	// Record the request (for rate limiting and analytics)
	err = pah.rateLimiter.RecordRequest(templateID, token)
	if err != nil {
		log.Printf("Warning: failed to record rate limit: %v", err)
	}

	// Update token usage
	err = pah.templateService.UpdateAuthTokenUsage(token.ID, clientIP)
	if err != nil {
		log.Printf("Warning: failed to update token usage: %v", err)
	}

	// Create template execution record
	templateExecutionID := generateTemplateExecutionID()
	templateExecution := &types.ExecutionTemplateExecution{
		ID:                 templateExecutionID,
		TemplateID:         templateID,
		AuthTokenID:        &token.ID,
		ParametersProvided: request.Parameters,
		ResolvedPrompt:     resolvedPrompt,
		ResolvedContext:    resolvedContext,
		RequestIP:          clientIP,
		UserAgent:          userAgent,
		Referer:            referer,
		Status:             "pending",
		CreatedAt:          time.Now(),
	}

	err = pah.recordTemplateExecution(templateExecution)
	if err != nil {
		log.Printf("Warning: failed to record template execution: %v", err)
	}

	// Create execution request for the existing execution system
	executionRequest := &types.MultiExecutionRequest{
		ExecutionRunName:      fmt.Sprintf("Template: %s", template.Name),
		Description:           fmt.Sprintf("Execution from template %s via API token", template.Name),
		BasePrompt:            resolvedPrompt,
		Context:               resolvedContext,
		EnableFunctionCalling: template.EnableFunctionCalling,
		Configurations:        []types.APIConfiguration{}, // Use default configuration
		SessionApiKeys:        &types.SessionApiKeys{},    // No API keys for public execution
	}

	// Start execution using existing system
	executionID, executionRun, err := pah.executionEngine.StartExecution(executionRequest, false, nil)
	if err != nil {
		log.Printf("Failed to start execution: %v", err)

		// Update template execution status
		templateExecution.Status = "failed"
		templateExecution.ErrorMessage = err.Error()
		templateExecution.CompletedAt = &[]time.Time{time.Now()}[0]
		pah.updateTemplateExecution(templateExecution)

		http.Error(w, "Failed to start execution", http.StatusInternalServerError)
		return
	}

	// Update template execution with execution run ID
	templateExecution.ExecutionRunID = &executionID
	templateExecution.Status = "running"
	pah.updateTemplateExecution(templateExecution)

	// Prepare response
	response := &types.TemplateExecutionResponse{
		ExecutionID:         executionID,
		TemplateExecutionID: templateExecutionID,
		ExecutionRun:        executionRun,
		Message:             "Template execution started successfully",
		RateLimited:         false,
		RateLimitRemaining:  rateLimitResult.RemainingHour,
		RateLimitResetAt:    &rateLimitResult.ResetTimeHour,
	}

	// Add rate limit headers
	w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", template.RateLimitPerHour))
	w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", rateLimitResult.RemainingHour))
	w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", rateLimitResult.ResetTimeHour.Unix()))
	w.Header().Set("X-RateLimit-Type", rateLimitResult.LimitType)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted) // 202 for async operation
	json.NewEncoder(w).Encode(response)
}

// GetTemplateExecutionStatus handles GET /api/public/templates/executions/{id}/status
func (pah *PublicAPIHandler) GetTemplateExecutionStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract template execution ID from URL
	templateExecutionID := pah.extractTemplateExecutionID(r.URL.Path)
	if templateExecutionID == "" {
		http.Error(w, "Template execution ID required", http.StatusBadRequest)
		return
	}

	// Extract auth token
	authToken := pah.extractAuthToken(r)
	if authToken == "" {
		http.Error(w, "Authentication token required", http.StatusUnauthorized)
		return
	}

	// Get template execution record
	templateExecution, err := pah.getTemplateExecution(templateExecutionID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Template execution not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to get template execution", http.StatusInternalServerError)
		}
		return
	}

	// Validate auth token (must be the same token used for execution)
	if templateExecution.AuthTokenID == nil {
		http.Error(w, "No auth token associated with this execution", http.StatusForbidden)
		return
	}

	token, err := pah.templateService.GetAuthTokenByValue(authToken)
	if err != nil || token.ID != *templateExecution.AuthTokenID {
		http.Error(w, "Invalid authentication token", http.StatusUnauthorized)
		return
	}

	// Get execution result if completed
	var executionResult *types.ExecutionResult
	if templateExecution.ExecutionRunID != nil &&
		(templateExecution.Status == "completed" || templateExecution.Status == "failed") {

		_, _, _, _, result, err := pah.executionEngine.GetExecutionStatus(*templateExecution.ExecutionRunID)
		if err == nil {
			executionResult = result
		}
	}

	response := map[string]interface{}{
		"templateExecution": templateExecution,
		"executionResult":   executionResult,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetTemplateInfo handles GET /api/public/templates/{id}/info (minimal template info for public use)
func (pah *PublicAPIHandler) GetTemplateInfo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract template ID
	templateID := pah.extractTemplateID(r.URL.Path)
	if templateID == "" {
		http.Error(w, "Template ID required", http.StatusBadRequest)
		return
	}

	// Get template
	template, err := pah.templateService.GetTemplateByID(templateID, true, false)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Template not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to get template", http.StatusInternalServerError)
		}
		return
	}

	if !template.IsActive || !template.IsPublic {
		http.Error(w, "Template not available", http.StatusNotFound)
		return
	}

	// Return minimal public info
	publicInfo := map[string]interface{}{
		"id":                      template.ID,
		"name":                    template.Name,
		"description":             template.Description,
		"category":                template.Category,
		"parameters":              template.Parameters,
		"enableFunctionCalling":   template.EnableFunctionCalling,
		"executionTimeoutSeconds": template.ExecutionTimeoutSeconds,
		"rateLimitPerHour":        template.RateLimitPerHour,
		"rateLimitPerDay":         template.RateLimitPerDay,
		"createdAt":               template.CreatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(publicInfo)
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// extractTemplateID extracts template ID from URL path
func (pah *PublicAPIHandler) extractTemplateID(path string) string {
	// Expected patterns:
	// /api/public/templates/{id}/execute
	// /api/public/templates/{id}/info
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) >= 4 && parts[0] == "api" && parts[1] == "public" && parts[2] == "templates" {
		return parts[3]
	}
	return ""
}

// extractTemplateExecutionID extracts template execution ID from URL path
func (pah *PublicAPIHandler) extractTemplateExecutionID(path string) string {
	// Expected pattern: /api/public/templates/executions/{id}/status
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) >= 5 && parts[0] == "api" && parts[1] == "public" &&
		parts[2] == "templates" && parts[3] == "executions" {
		return parts[4]
	}
	return ""
}

// extractAuthToken extracts auth token from Authorization header or query parameter
func (pah *PublicAPIHandler) extractAuthToken(r *http.Request) string {
	// Try Authorization header first (Bearer token)
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}

	// Try X-API-Token header
	if token := r.Header.Get("X-API-Token"); token != "" {
		return token
	}

	// Try query parameter as fallback
	return r.URL.Query().Get("token")
}

// getClientIP extracts client IP address
func (pah *PublicAPIHandler) getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first (for proxies)
	if xForwardedFor := r.Header.Get("X-Forwarded-For"); xForwardedFor != "" {
		// Take the first IP in the list
		ips := strings.Split(xForwardedFor, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	if xRealIP := r.Header.Get("X-Real-IP"); xRealIP != "" {
		return xRealIP
	}

	// Use remote address as fallback
	return strings.Split(r.RemoteAddr, ":")[0]
}

// Database operations for template executions
func (pah *PublicAPIHandler) recordTemplateExecution(execution *types.ExecutionTemplateExecution) error {
	query := `
		INSERT INTO execution_template_executions (
			id, template_id, auth_token_id, parameters_provided, resolved_prompt, 
			resolved_context, request_ip, user_agent, referer, status, 
			error_message, execution_run_id, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	parametersJSON, _ := json.Marshal(execution.ParametersProvided)

	_, err := pah.templateService.db.Exec(query,
		execution.ID,
		execution.TemplateID,
		execution.AuthTokenID,
		string(parametersJSON),
		execution.ResolvedPrompt,
		execution.ResolvedContext,
		execution.RequestIP,
		execution.UserAgent,
		execution.Referer,
		execution.Status,
		execution.ErrorMessage,
		execution.ExecutionRunID,
		execution.CreatedAt,
	)

	if err != nil {
		log.Printf("Failed to record template execution: %v", err)
		return err
	}

	log.Printf("Recorded template execution: %s", execution.ID)
	return nil
}

func (pah *PublicAPIHandler) updateTemplateExecution(execution *types.ExecutionTemplateExecution) error {
	query := `
		UPDATE execution_template_executions 
		SET status = ?, error_message = ?, execution_run_id = ?, completed_at = ?
		WHERE id = ?
	`

	now := time.Now()
	var completedAt *time.Time
	if execution.Status == "completed" || execution.Status == "failed" {
		completedAt = &now
	}

	_, err := pah.templateService.db.Exec(query,
		execution.Status,
		execution.ErrorMessage,
		execution.ExecutionRunID,
		completedAt,
		execution.ID,
	)

	if err != nil {
		log.Printf("Failed to update template execution: %v", err)
		return err
	}

	log.Printf("Updated template execution: %s, status: %s", execution.ID, execution.Status)
	return nil
}

func (pah *PublicAPIHandler) getTemplateExecution(executionID string) (*types.ExecutionTemplateExecution, error) {
	query := `
		SELECT id, template_id, auth_token_id, parameters_provided, resolved_prompt,
			   resolved_context, request_ip, user_agent, referer, status, 
			   error_message, execution_run_id, created_at, completed_at
		FROM execution_template_executions 
		WHERE id = ?
	`

	execution := &types.ExecutionTemplateExecution{}
	var parametersJSON string
	var authTokenID *string
	var executionRunID *string
	var completedAt *time.Time

	err := pah.templateService.db.QueryRow(query, executionID).Scan(
		&execution.ID,
		&execution.TemplateID,
		&authTokenID,
		&parametersJSON,
		&execution.ResolvedPrompt,
		&execution.ResolvedContext,
		&execution.RequestIP,
		&execution.UserAgent,
		&execution.Referer,
		&execution.Status,
		&execution.ErrorMessage,
		&executionRunID,
		&execution.CreatedAt,
		&completedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("template execution not found: %s", executionID)
		}
		log.Printf("Failed to get template execution: %v", err)
		return nil, err
	}

	// Parse JSON parameters
	if parametersJSON != "" {
		err = json.Unmarshal([]byte(parametersJSON), &execution.ParametersProvided)
		if err != nil {
			log.Printf("Failed to parse parameters JSON: %v", err)
		}
	}

	// Set nullable fields
	execution.AuthTokenID = authTokenID
	execution.ExecutionRunID = executionRunID
	execution.CompletedAt = completedAt

	return execution, nil
}

// generateTemplateExecutionID generates a unique execution ID
func generateTemplateExecutionID() string {
	return "texec-" + generateRandomString(16)
}
