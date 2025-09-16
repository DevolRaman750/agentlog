package templates

import (
	"database/sql"
	"log"
	"net/http"
	"strings"
	"time"

	"gogent/internal/auth"
	"gogent/internal/types"
)

// TemplateIntegration handles integration with the main GoGent system
type TemplateIntegration struct {
	templateService  *TemplateService
	rateLimiter      *RateLimiter
	templateHandler  *TemplateHandler
	publicAPIHandler *PublicAPIHandler
	authService      *auth.Service
}

// NewTemplateIntegration creates a new template integration instance
func NewTemplateIntegration(db *sql.DB, authService *auth.Service, executionEngine ExecutionEngine) *TemplateIntegration {
	// Create core services
	templateService := NewTemplateService(db)
	rateLimiter := NewRateLimiter(db)

	// Create handlers
	templateHandler := NewTemplateHandler(templateService, rateLimiter, authService)
	publicAPIHandler := NewPublicAPIHandler(templateService, rateLimiter, executionEngine)

	return &TemplateIntegration{
		templateService:  templateService,
		rateLimiter:      rateLimiter,
		templateHandler:  templateHandler,
		publicAPIHandler: publicAPIHandler,
		authService:      authService,
	}
}

// RegisterRoutes registers all template-related HTTP routes
func (ti *TemplateIntegration) RegisterRoutes(mux *http.ServeMux, authMiddleware func(http.HandlerFunc) http.Handler) {
	// =============================================================================
	// AUTHENTICATED ROUTES (Template Management)
	// =============================================================================

	// Template CRUD operations
	mux.Handle("/api/templates", authMiddleware(http.HandlerFunc(ti.handleTemplateOperations)))
	mux.Handle("/api/templates/", authMiddleware(http.HandlerFunc(ti.handleTemplateRoutes)))

	// =============================================================================
	// PUBLIC ROUTES (Template Execution)
	// =============================================================================

	// Public template execution API (no auth middleware - uses token auth)
	mux.HandleFunc("/api/public/templates/", ti.handlePublicTemplateRoutes)
}

// handleTemplateOperations handles operations on the base /api/templates endpoint
func (ti *TemplateIntegration) handleTemplateOperations(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		ti.templateHandler.ListTemplates(w, r)
	case http.MethodPost:
		ti.templateHandler.CreateTemplate(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleTemplateRoutes handles all template-related routes under /api/templates/{id}
func (ti *TemplateIntegration) handleTemplateRoutes(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	// Route pattern matching
	switch {
	case matchesPattern(path, "/api/templates/[id]") && r.Method == http.MethodGet:
		ti.templateHandler.GetTemplate(w, r)
	case matchesPattern(path, "/api/templates/[id]") && r.Method == http.MethodPut:
		ti.templateHandler.UpdateTemplate(w, r)
	case matchesPattern(path, "/api/templates/[id]") && r.Method == http.MethodDelete:
		ti.templateHandler.DeleteTemplate(w, r)
	case matchesPattern(path, "/api/templates/[id]/tokens") && r.Method == http.MethodGet:
		ti.templateHandler.ListAuthTokens(w, r)
	case matchesPattern(path, "/api/templates/[id]/tokens") && r.Method == http.MethodPost:
		ti.templateHandler.CreateAuthToken(w, r)
	case matchesPattern(path, "/api/templates/[id]/tokens/[tokenId]") && r.Method == http.MethodPut:
		ti.templateHandler.UpdateAuthToken(w, r)
	case matchesPattern(path, "/api/templates/[id]/tokens/[tokenId]") && r.Method == http.MethodDelete:
		ti.templateHandler.DeleteAuthToken(w, r)
	default:
		http.Error(w, "Not found", http.StatusNotFound)
	}
}

// handlePublicTemplateRoutes handles all public template routes under /api/public/templates/
func (ti *TemplateIntegration) handlePublicTemplateRoutes(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	// Add CORS headers for public API
	ti.addCORSHeaders(w, r)

	// Handle preflight requests
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Route pattern matching
	switch {
	case matchesPattern(path, "/api/public/templates/[id]/execute") && r.Method == http.MethodPost:
		ti.publicAPIHandler.ExecuteTemplate(w, r)
	case matchesPattern(path, "/api/public/templates/[id]/info") && r.Method == http.MethodGet:
		ti.publicAPIHandler.GetTemplateInfo(w, r)
	case matchesPattern(path, "/api/public/templates/executions/[id]/status") && r.Method == http.MethodGet:
		ti.publicAPIHandler.GetTemplateExecutionStatus(w, r)
	default:
		http.Error(w, "Not found", http.StatusNotFound)
	}
}

// addCORSHeaders adds CORS headers for the public API
func (ti *TemplateIntegration) addCORSHeaders(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")

	// For public API, we can be more permissive with CORS
	// In production, you might want to restrict this to specific domains
	if origin != "" {
		w.Header().Set("Access-Control-Allow-Origin", origin)
	} else {
		w.Header().Set("Access-Control-Allow-Origin", "*")
	}

	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Token")
	w.Header().Set("Access-Control-Expose-Headers", "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-Type")
	w.Header().Set("Access-Control-Max-Age", "3600")
}

// GetTemplateService returns the template service for external use
func (ti *TemplateIntegration) GetTemplateService() *TemplateService {
	return ti.templateService
}

// GetRateLimiter returns the rate limiter for external use
func (ti *TemplateIntegration) GetRateLimiter() *RateLimiter {
	return ti.rateLimiter
}

// StartBackgroundTasks starts background tasks for template management
func (ti *TemplateIntegration) StartBackgroundTasks() {
	// Start rate limit cleanup task
	go ti.startRateLimitCleanup()

	log.Printf("Started template management background tasks")
}

// startRateLimitCleanup runs periodic cleanup of old rate limit windows
func (ti *TemplateIntegration) startRateLimitCleanup() {
	ticker := time.NewTicker(24 * time.Hour) // Run daily
	defer ticker.Stop()

	for range ticker.C {
		err := ti.rateLimiter.CleanupOldWindows()
		if err != nil {
			log.Printf("Error cleaning up rate limit windows: %v", err)
		}
	}
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// matchesPattern checks if a path matches a pattern with placeholders
func matchesPattern(path, pattern string) bool {
	// Simple pattern matching for URL paths
	// Patterns use [id] as placeholders
	// Example: "/api/templates/[id]" matches "/api/templates/123"

	pathParts := splitPath(path)
	patternParts := splitPath(pattern)

	if len(pathParts) != len(patternParts) {
		return false
	}

	for i, patternPart := range patternParts {
		if patternPart == "" {
			continue
		}

		// Check for placeholder
		if strings.HasPrefix(patternPart, "[") && strings.HasSuffix(patternPart, "]") {
			// This is a placeholder, any non-empty value matches
			if pathParts[i] == "" {
				return false
			}
			continue
		}

		// Exact match required
		if pathParts[i] != patternPart {
			return false
		}
	}

	return true
}

// splitPath splits a URL path into parts, handling leading/trailing slashes
func splitPath(path string) []string {
	// Remove leading and trailing slashes, then split
	path = strings.Trim(path, "/")
	if path == "" {
		return []string{}
	}
	return strings.Split(path, "/")
}

// ExecutionEngineAdapter creates an adapter to integrate with the existing execution engine
type ExecutionEngineAdapter struct {
	businessLogic BusinessLogicInterface
}

// BusinessLogicInterface represents the interface to the existing business logic
type BusinessLogicInterface interface {
	StartExecution(request *types.MultiExecutionRequest, useMock bool, sessionAPIKeys map[string]string) (string, *types.ExecutionRun, error)
	GetExecutionStatus(executionID string) (string, error)
}

// NewExecutionEngineAdapter creates a new adapter
func NewExecutionEngineAdapter(businessLogic BusinessLogicInterface) *ExecutionEngineAdapter {
	return &ExecutionEngineAdapter{
		businessLogic: businessLogic,
	}
}

// StartExecution implements the ExecutionEngine interface
func (adapter *ExecutionEngineAdapter) StartExecution(request *types.MultiExecutionRequest, useMock bool, sessionAPIKeys map[string]string) (string, *types.ExecutionRun, error) {
	return adapter.businessLogic.StartExecution(request, useMock, sessionAPIKeys)
}

// GetExecutionStatus implements the ExecutionEngine interface
//
//nolint:gocritic // tooManyResultsChecker - required for template interface
func (adapter *ExecutionEngineAdapter) GetExecutionStatus(executionID string) (string, string, *time.Time, *time.Time, *types.ExecutionResult, error) {
	status, err := adapter.businessLogic.GetExecutionStatus(executionID)
	if err != nil {
		return "", "", nil, nil, nil, err
	}

	// For now, return basic status - this would need to be enhanced to get full execution details
	return status, "", nil, nil, nil, nil
}
