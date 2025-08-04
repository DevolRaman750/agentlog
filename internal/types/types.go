package types

import (
	"encoding/json"
	"time"
)

// RequestType represents the type of API request
type RequestType string

const (
	RequestTypeGenerate     RequestType = "generate"
	RequestTypeChat         RequestType = "chat"
	RequestTypeFunctionCall RequestType = "function_call"
)

// ResponseStatus represents the status of an API response
type ResponseStatus string

const (
	ResponseStatusSuccess ResponseStatus = "success"
	ResponseStatusError   ResponseStatus = "error"
	ResponseStatusTimeout ResponseStatus = "timeout"
)

// LogLevel represents the severity level of a log entry
type LogLevel string

const (
	LogLevelInfo    LogLevel = "INFO"
	LogLevelDebug   LogLevel = "DEBUG"
	LogLevelWarn    LogLevel = "WARN"
	LogLevelError   LogLevel = "ERROR"
	LogLevelSuccess LogLevel = "SUCCESS"
)

// LogCategory represents the category/context of a log entry
type LogCategory string

const (
	LogCategorySetup        LogCategory = "SETUP"
	LogCategoryExecution    LogCategory = "EXECUTION"
	LogCategoryFunctionCall LogCategory = "FUNCTION_CALL"
	LogCategoryAPICall      LogCategory = "API_CALL"
	LogCategoryCompletion   LogCategory = "COMPLETION"
	LogCategoryError        LogCategory = "ERROR"
)

// ExecutionLog represents a log entry for an execution
type ExecutionLog struct {
	ID              string                 `json:"id"`
	ExecutionRunID  string                 `json:"executionRunId"`
	ConfigurationID *string                `json:"configurationId,omitempty"`
	RequestID       *string                `json:"requestId,omitempty"`
	LogLevel        LogLevel               `json:"logLevel"`
	LogCategory     LogCategory            `json:"logCategory"`
	Message         string                 `json:"message"`
	Details         map[string]interface{} `json:"details,omitempty"`
	Timestamp       time.Time              `json:"timestamp"`
	SequenceNumber  *int32                 `json:"sequenceNumber,omitempty"`
	DurationMs      *int32                 `json:"durationMs,omitempty"`
	RelatedEventID  *string                `json:"relatedEventId,omitempty"`
}

// ExecutionRun represents a group of related API calls with variations
type ExecutionRun struct {
	ID                    string    `json:"id"`
	Name                  string    `json:"name"`
	Description           string    `json:"description,omitempty"`
	BasePrompt            string    `json:"basePrompt,omitempty"`
	ContextPrompt         string    `json:"contextPrompt,omitempty"`
	EnableFunctionCalling bool      `json:"enableFunctionCalling"`
	Status                string    `json:"status"` // pending, running, completed, failed
	ErrorMessage          string    `json:"errorMessage,omitempty"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// APIConfiguration represents a specific configuration for API calls
type APIConfiguration struct {
	ID               string                 `json:"id"`
	UserID           string                 `json:"userId,omitempty"` // User who owns this configuration
	VariationName    string                 `json:"variationName"`
	ModelName        string                 `json:"modelName"`
	SystemPrompt     string                 `json:"systemPrompt,omitempty"`
	Temperature      *float32               `json:"temperature,omitempty"`
	MaxTokens        *int32                 `json:"maxTokens,omitempty"`
	TopP             *float32               `json:"topP,omitempty"`
	TopK             *int32                 `json:"topK,omitempty"`
	SafetySettings   map[string]interface{} `json:"safetySettings,omitempty"`
	GenerationConfig map[string]interface{} `json:"generationConfig,omitempty"`
	Tools            []Tool                 `json:"tools,omitempty"`
	ToolConfig       map[string]interface{} `json:"toolConfig,omitempty"`
	CreatedAt        time.Time              `json:"createdAt"`
	UpdatedAt        time.Time              `json:"updatedAt"`
	IsSystemResource bool                   `json:"isSystemResource,omitempty"` // Mark as system-provided resource
}

// FunctionDefinition represents a reusable function definition
type FunctionDefinition struct {
	ID                string                 `json:"id"`
	UserID            string                 `json:"userId,omitempty"`       // User who owns this function
	Name              string                 `json:"name"`                   // Unique function name for API calls
	DisplayName       string                 `json:"displayName"`            // Human-readable name
	Description       string                 `json:"description"`            // Function description
	FunctionGroup     string                 `json:"functionGroup"`          // Group functions by category (e.g., "graph", "weather", "github")
	ParametersSchema  map[string]interface{} `json:"parametersSchema"`       // JSON schema for parameters
	MockResponse      map[string]interface{} `json:"mockResponse,omitempty"` // Mock response for testing
	EndpointURL       string                 `json:"endpointUrl,omitempty"`  // Real API endpoint
	HttpMethod        string                 `json:"httpMethod"`             // HTTP method (GET, POST, etc.)
	Headers           map[string]interface{} `json:"headers,omitempty"`      // HTTP headers
	AuthConfig        map[string]interface{} `json:"authConfig,omitempty"`   // Authentication config
	IsActive          bool                   `json:"isActive"`
	IsSystemResource  bool                   `json:"isSystemResource"`            // Mark as system-provided resource
	RequiredApiKeys   []string               `json:"requiredApiKeys,omitempty"`   // API keys required for this function
	ApiKeyValidation  map[string]interface{} `json:"apiKeyValidation,omitempty"`  // Validation rules for each API key
	QueryTemplate     string                 `json:"queryTemplate,omitempty"`     // Cypher query template with {{parameter}} placeholders
	ResultTransformer string                 `json:"resultTransformer,omitempty"` // How to transform the raw results (e.g., 'sales_summary', 'normalize_attributes')
	FallbackData      map[string]interface{} `json:"fallbackData,omitempty"`      // Fallback data when external services are unavailable
	CreatedAt         time.Time              `json:"createdAt"`
	UpdatedAt         time.Time              `json:"updatedAt"`
}

// ExecutionFunctionConfig represents function configuration for a specific execution
type ExecutionFunctionConfig struct {
	ID                   string    `json:"id"`
	ExecutionRunID       string    `json:"executionRunId"`
	FunctionDefinitionID string    `json:"functionDefinitionId"`
	UseMockResponse      bool      `json:"useMockResponse"`
	ExecutionOrder       int       `json:"executionOrder"`
	CreatedAt            time.Time `json:"createdAt"`

	// Populated from JOIN queries
	FunctionName        string `json:"functionName,omitempty"`
	FunctionDisplayName string `json:"functionDisplayName,omitempty"`
	FunctionDescription string `json:"functionDescription,omitempty"`
}

// FunctionCallStats represents statistics for function calls
type FunctionCallStats struct {
	TotalCalls       int     `json:"totalCalls"`
	SuccessfulCalls  int     `json:"successfulCalls"`
	FailedCalls      int     `json:"failedCalls"`
	AvgExecutionTime float64 `json:"avgExecutionTime"`
	MaxExecutionTime int32   `json:"maxExecutionTime"`
	MinExecutionTime int32   `json:"minExecutionTime"`
}

// FunctionCallHistoryItem represents a function call with context
type FunctionCallHistoryItem struct {
	FunctionCall
	ExecutionRunID   string    `json:"executionRunId"`
	ExecutionName    string    `json:"executionName"`
	Prompt           string    `json:"prompt"`
	RequestCreatedAt time.Time `json:"requestCreatedAt"`
}

// FunctionExecutionMode represents how functions should be executed
type FunctionExecutionMode string

const (
	FunctionExecutionMock FunctionExecutionMode = "mock"
	FunctionExecutionReal FunctionExecutionMode = "real"
	FunctionExecutionAuto FunctionExecutionMode = "auto" // Use real if available, mock otherwise
)

// FunctionCallRequest represents a request to execute a function
type FunctionCallRequest struct {
	FunctionName  string                 `json:"functionName"`
	Arguments     map[string]interface{} `json:"arguments"`
	ExecutionMode FunctionExecutionMode  `json:"executionMode"`
	TimeoutMs     int32                  `json:"timeoutMs,omitempty"`
}

// FunctionCallResult represents the result of a function execution
type FunctionCallResult struct {
	FunctionName    string                 `json:"functionName"`
	Arguments       map[string]interface{} `json:"arguments"`
	Response        map[string]interface{} `json:"response"`
	ExecutionStatus string                 `json:"executionStatus"`
	ExecutionTimeMs int32                  `json:"executionTimeMs"`
	ErrorDetails    string                 `json:"errorDetails,omitempty"`
	UsedMockData    bool                   `json:"usedMockData"`
}

// Tool represents a function tool that can be called by the AI
type Tool struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Parameters  map[string]interface{} `json:"parameters"`
}

// APIRequest represents a request to the Gemini API
type APIRequest struct {
	ID                 string                 `json:"id"`
	ExecutionRunID     string                 `json:"executionRunId"`
	ConfigurationID    string                 `json:"configurationId"`
	RequestType        RequestType            `json:"requestType"`
	Prompt             string                 `json:"prompt"`
	Context            string                 `json:"context,omitempty"`
	FunctionName       string                 `json:"functionName,omitempty"`
	FunctionParameters map[string]interface{} `json:"functionParameters,omitempty"`
	RequestHeaders     map[string]interface{} `json:"requestHeaders,omitempty"`
	RequestBody        map[string]interface{} `json:"requestBody,omitempty"`
	CreatedAt          time.Time              `json:"createdAt"`
}

// APIResponse represents a response from the Gemini API
type APIResponse struct {
	ID                   string                 `json:"id"`
	RequestID            string                 `json:"requestId"`
	ResponseStatus       ResponseStatus         `json:"responseStatus"`
	ResponseText         string                 `json:"responseText,omitempty"`
	FunctionCallResponse map[string]interface{} `json:"functionCallResponse,omitempty"`
	UsageMetadata        map[string]interface{} `json:"usageMetadata,omitempty"`
	SafetyRatings        map[string]interface{} `json:"safetyRatings,omitempty"`
	FinishReason         string                 `json:"finishReason,omitempty"`
	ErrorMessage         string                 `json:"errorMessage,omitempty"`
	ResponseTimeMs       int32                  `json:"responseTimeMs"`
	ResponseHeaders      map[string]interface{} `json:"responseHeaders,omitempty"`
	ResponseBody         map[string]interface{} `json:"responseBody,omitempty"`
	CreatedAt            time.Time              `json:"createdAt"`
}

// FunctionCall represents a function call made during AI execution
type FunctionCall struct {
	ID               string                 `json:"id"`
	RequestID        string                 `json:"request_id"`
	FunctionName     string                 `json:"function_name"`
	FunctionArgs     map[string]interface{} `json:"function_arguments"`
	FunctionResponse map[string]interface{} `json:"function_response,omitempty"`
	ExecutionStatus  string                 `json:"execution_status"`
	ExecutionTimeMs  int32                  `json:"execution_time_ms,omitempty"`
	ErrorDetails     string                 `json:"error_details,omitempty"`
	CreatedAt        time.Time              `json:"created_at"`
	SequenceNumber   int32                  `json:"sequence_number"`
	ParentCallID     *string                `json:"parent_call_id,omitempty"`
	ExecutionDepth   int32                  `json:"execution_depth"`
}

// SessionApiKeys represents API keys passed with each request (not stored on backend)
type SessionApiKeys struct {
	GeminiApiKey      string `json:"geminiApiKey,omitempty"`
	OpenWeatherApiKey string `json:"openWeatherApiKey,omitempty"`
	Neo4jUrl          string `json:"neo4jUrl,omitempty"`
	Neo4jUsername     string `json:"neo4jUsername,omitempty"`
	Neo4jPassword     string `json:"neo4jPassword,omitempty"`
	Neo4jDatabase     string `json:"neo4jDatabase,omitempty"`
	GithubApiKey      string `json:"githubApiKey,omitempty"`
}

// GeminiClientConfig represents the configuration for the Gemini client
type GeminiClientConfig struct {
	ProjectID   string `json:"project_id,omitempty"`
	Region      string `json:"region,omitempty"`
	MaxRetries  int    `json:"max_retries"`
	TimeoutSecs int    `json:"timeout_secs"`
}

// MultiExecutionRequest represents a request to execute multiple variations
type MultiExecutionRequest struct {
	ExecutionRunName      string             `json:"executionRunName"`
	Description           string             `json:"description,omitempty"`
	BasePrompt            string             `json:"basePrompt"`
	Context               string             `json:"context,omitempty"`
	EnableFunctionCalling bool               `json:"enableFunctionCalling,omitempty"`
	Configurations        []APIConfiguration `json:"configurations"`
	FunctionTools         []Tool             `json:"functionTools,omitempty"`
	ComparisonConfig      *ComparisonConfig  `json:"comparisonConfig,omitempty"`
	SessionApiKeys        *SessionApiKeys    `json:"sessionApiKeys,omitempty"` // API keys for this session
}

// ComparisonConfig represents configuration for comparing execution results
type ComparisonConfig struct {
	Enabled     bool     `json:"enabled"`
	Metrics     []string `json:"metrics"`
	CustomRules []string `json:"customRules,omitempty"`
}

// ExecutionResult represents the result of a multi-execution
type ExecutionResult struct {
	ExecutionRun ExecutionRun      `json:"executionRun"`
	Results      []VariationResult `json:"results"`
	Comparison   *ComparisonResult `json:"comparison,omitempty"`
	TotalTime    int64             `json:"totalTime"` // milliseconds
	SuccessCount int               `json:"successCount"`
	ErrorCount   int               `json:"errorCount"`
	Logs         []ExecutionLog    `json:"logs,omitempty"`
}

// VariationResult represents the result of a single variation execution
type VariationResult struct {
	Configuration APIConfiguration `json:"configuration"`
	Request       APIRequest       `json:"request"`
	Response      APIResponse      `json:"response"`
	FunctionCalls []FunctionCall   `json:"functionCalls,omitempty"`
	ExecutionTime int64            `json:"executionTime"` // milliseconds
}

// ComparisonResult represents the result of comparing multiple variations
type ComparisonResult struct {
	ID                  string                 `json:"id"`
	ExecutionRunID      string                 `json:"executionRunId"`
	ComparisonType      string                 `json:"comparisonType"`
	MetricName          string                 `json:"metricName"`
	ConfigurationScores map[string]interface{} `json:"configurationScores"`
	BestConfigurationID string                 `json:"bestConfigurationId,omitempty"`
	BestConfiguration   *APIConfiguration      `json:"bestConfiguration,omitempty"`
	AllConfigurations   []APIConfiguration     `json:"allConfigurations,omitempty"`
	AnalysisNotes       string                 `json:"analysisNotes,omitempty"`
	CreatedAt           time.Time              `json:"createdAt"`
}

// ExecutionFlowEventType represents the type of execution flow event
type ExecutionFlowEventType string

const (
	EventTypePromptStart       ExecutionFlowEventType = "prompt_start"
	EventTypeAIModelCall       ExecutionFlowEventType = "ai_model_call"
	EventTypeFunctionCallStart ExecutionFlowEventType = "function_call_start"
	EventTypeFunctionCallEnd   ExecutionFlowEventType = "function_call_end"
	EventTypeAIResponse        ExecutionFlowEventType = "ai_response"
	EventTypeErrorOccurred     ExecutionFlowEventType = "error_occurred"
	EventTypeRetryAttempt      ExecutionFlowEventType = "retry_attempt"
	EventTypeExecutionComplete ExecutionFlowEventType = "execution_complete"
)

// ExecutionFlowEventStatus represents the status of an execution flow event
type ExecutionFlowEventStatus string

const (
	EventStatusPending ExecutionFlowEventStatus = "pending"
	EventStatusSuccess ExecutionFlowEventStatus = "success"
	EventStatusError   ExecutionFlowEventStatus = "error"
	EventStatusTimeout ExecutionFlowEventStatus = "timeout"
)

// ExecutionFlowEvent represents an event in the execution flow for graph visualization
type ExecutionFlowEvent struct {
	ID             string                   `json:"id"`
	ExecutionRunID string                   `json:"executionRunId"`
	RequestID      *string                  `json:"requestId,omitempty"`
	EventType      ExecutionFlowEventType   `json:"eventType"`
	SequenceNumber int32                    `json:"sequenceNumber"`
	ParentEventID  *string                  `json:"parentEventId,omitempty"`
	EventData      map[string]interface{}   `json:"eventData,omitempty"`
	DurationMs     *int32                   `json:"durationMs,omitempty"`
	Status         ExecutionFlowEventStatus `json:"status"`
	ErrorMessage   *string                  `json:"errorMessage,omitempty"`
	CreatedAt      time.Time                `json:"createdAt"`
}

// ExecutionStats represents performance statistics for an execution
type ExecutionStats struct {
	ID                    string                 `json:"id"`
	ExecutionRunID        string                 `json:"executionRunId"`
	TotalFunctionCalls    int32                  `json:"totalFunctionCalls"`
	TotalAIModelCalls     int32                  `json:"totalAIModelCalls"`
	TotalErrors           int32                  `json:"totalErrors"`
	TotalRetries          int32                  `json:"totalRetries"`
	TotalExecutionTimeMs  int32                  `json:"totalExecutionTimeMs"`
	AvgFunctionCallTimeMs float64                `json:"avgFunctionCallTimeMs"`
	AvgAIResponseTimeMs   float64                `json:"avgAIResponseTimeMs"`
	MaxExecutionDepth     int32                  `json:"maxExecutionDepth"`
	FunctionCallBreakdown map[string]interface{} `json:"functionCallBreakdown,omitempty"`
	CreatedAt             time.Time              `json:"createdAt"`
	UpdatedAt             time.Time              `json:"updatedAt"`
}

// ExecutionFlowGraph represents the complete execution flow for Gorph visualization
type ExecutionFlowGraph struct {
	ExecutionRunID string               `json:"executionRunId"`
	Events         []ExecutionFlowEvent `json:"events"`
	FunctionCalls  []FunctionCall       `json:"functionCalls"`
	Stats          *ExecutionStats      `json:"stats,omitempty"`
	GraphYAML      string               `json:"graphYaml"` // Generated YAML for Gorph
}

// Additional types for interface support

// ModelInfo represents information about an AI model
type ModelInfo struct {
	Name             string    `json:"name"`
	DisplayName      string    `json:"display_name"`
	Description      string    `json:"description"`
	Version          string    `json:"version"`
	InputTokenLimit  int32     `json:"input_token_limit"`
	OutputTokenLimit int32     `json:"output_token_limit"`
	SupportedMethods []string  `json:"supported_methods"`
	SupportedFormats []string  `json:"supported_formats"`
	CreatedAt        time.Time `json:"created_at"`
}

// TimeRange represents a time range for analytics
type TimeRange struct {
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

// ExecutionAnalytics represents analytics for an execution run
type ExecutionAnalytics struct {
	ExecutionRunID      string             `json:"execution_run_id"`
	TotalRequests       int                `json:"total_requests"`
	SuccessfulRequests  int                `json:"successful_requests"`
	FailedRequests      int                `json:"failed_requests"`
	AverageResponseTime float64            `json:"average_response_time_ms"`
	TotalTokensUsed     int32              `json:"total_tokens_used"`
	TotalCost           float64            `json:"total_cost"`
	ModelUsage          map[string]int     `json:"model_usage"`
	PerformanceMetrics  map[string]float64 `json:"performance_metrics"`
	CreatedAt           time.Time          `json:"created_at"`
}

// PerformanceMetrics represents performance metrics across runs
type PerformanceMetrics struct {
	TimeRange           TimeRange          `json:"time_range"`
	TotalExecutions     int                `json:"total_executions"`
	AverageResponseTime float64            `json:"average_response_time_ms"`
	P95ResponseTime     float64            `json:"p95_response_time_ms"`
	P99ResponseTime     float64            `json:"p99_response_time_ms"`
	SuccessRate         float64            `json:"success_rate"`
	ThroughputPerHour   float64            `json:"throughput_per_hour"`
	ModelPerformance    map[string]float64 `json:"model_performance"`
	CreatedAt           time.Time          `json:"created_at"`
}

// =============================================================================
// EXECUTION TEMPLATES
// =============================================================================

// ExecutionTemplate represents a reusable execution template with parameters
type ExecutionTemplate struct {
	ID                       string                       `json:"id"`
	UserID                   string                       `json:"userId"`
	Name                     string                       `json:"name"`
	Description              string                       `json:"description,omitempty"`
	TemplatePrompt           string                       `json:"templatePrompt"`
	ContextTemplate          string                       `json:"contextTemplate,omitempty"`
	EnableFunctionCalling    bool                         `json:"enableFunctionCalling"`
	PreferredConfigurationID *string                      `json:"preferredConfigurationId,omitempty"`
	IsActive                 bool                         `json:"isActive"`
	IsPublic                 bool                         `json:"isPublic"`
	Category                 string                       `json:"category"`
	Tags                     map[string]interface{}       `json:"tags,omitempty"`
	ExecutionTimeoutSeconds  int                          `json:"executionTimeoutSeconds"`
	RateLimitPerHour         int                          `json:"rateLimitPerHour"`
	RateLimitPerDay          int                          `json:"rateLimitPerDay"`
	RateLimitBurst           int                          `json:"rateLimitBurst"`
	TotalExecutions          int                          `json:"totalExecutions"`
	LastExecutedAt           *time.Time                   `json:"lastExecutedAt,omitempty"`
	CreatedAt                time.Time                    `json:"createdAt"`
	UpdatedAt                time.Time                    `json:"updatedAt"`
	Parameters               []ExecutionTemplateParameter `json:"parameters,omitempty"`
	AuthTokens               []ExecutionTemplateAuthToken `json:"authTokens,omitempty"`
	FunctionIds              []string                     `json:"functionIds,omitempty"` // Associated function IDs
}

// ExecutionTemplateParameter represents a parameter definition for templates
type ExecutionTemplateParameter struct {
	ID                string                 `json:"id"`
	TemplateID        string                 `json:"templateId"`
	ParameterName     string                 `json:"parameterName"`
	ParameterType     string                 `json:"parameterType"` // string, number, boolean, array, object
	Description       string                 `json:"description,omitempty"`
	DefaultValue      string                 `json:"defaultValue,omitempty"`
	IsRequired        bool                   `json:"isRequired"`
	ValidationRules   map[string]interface{} `json:"validationRules,omitempty"`
	AllowedValues     map[string]interface{} `json:"allowedValues,omitempty"`
	AllowSQLKeywords  bool                   `json:"allowSqlKeywords"`
	AllowSpecialChars bool                   `json:"allowSpecialChars"`
	SanitizeHTML      bool                   `json:"sanitizeHtml"`
	DisplayOrder      int                    `json:"displayOrder"`
	UIComponent       string                 `json:"uiComponent"` // text, textarea, select, etc.
	PlaceholderText   string                 `json:"placeholderText,omitempty"`
	HelpText          string                 `json:"helpText,omitempty"`
	CreatedAt         time.Time              `json:"createdAt"`
	UpdatedAt         time.Time              `json:"updatedAt"`
}

// ExecutionTemplateAuthToken represents authentication tokens for public API access
type ExecutionTemplateAuthToken struct {
	ID                     string                 `json:"id"`
	TemplateID             string                 `json:"templateId"`
	UserID                 string                 `json:"userId"`
	TokenValue             string                 `json:"tokenValue"`
	TokenName              string                 `json:"tokenName"`
	Description            string                 `json:"description,omitempty"`
	IsActive               bool                   `json:"isActive"`
	ExpiresAt              *time.Time             `json:"expiresAt,omitempty"`
	CustomRateLimitPerHour *int                   `json:"customRateLimitPerHour,omitempty"`
	CustomRateLimitPerDay  *int                   `json:"customRateLimitPerDay,omitempty"`
	CustomRateLimitBurst   *int                   `json:"customRateLimitBurst,omitempty"`
	TotalUses              int                    `json:"totalUses"`
	LastUsedAt             *time.Time             `json:"lastUsedAt,omitempty"`
	LastUsedIP             *string                `json:"lastUsedIp,omitempty"` // Fixed to handle NULL values
	AllowedOrigins         map[string]interface{} `json:"allowedOrigins,omitempty"`
	AllowedIPs             map[string]interface{} `json:"allowedIps,omitempty"`
	CreatedAt              time.Time              `json:"createdAt"`
	UpdatedAt              time.Time              `json:"updatedAt"`
}

// ExecutionTemplateVersion represents a version snapshot for history tracking
type ExecutionTemplateVersion struct {
	ID                    string                       `json:"id"`
	TemplateID            string                       `json:"templateId"`
	VersionNumber         int                          `json:"versionNumber"`
	UserID                string                       `json:"userId"`
	Name                  string                       `json:"name"`
	Description           string                       `json:"description,omitempty"`
	TemplatePrompt        string                       `json:"templatePrompt"`
	ContextTemplate       string                       `json:"contextTemplate,omitempty"`
	EnableFunctionCalling bool                         `json:"enableFunctionCalling"`
	Category              string                       `json:"category"`
	Tags                  map[string]interface{}       `json:"tags,omitempty"`
	RateLimitPerHour      int                          `json:"rateLimitPerHour"`
	RateLimitPerDay       int                          `json:"rateLimitPerDay"`
	RateLimitBurst        int                          `json:"rateLimitBurst"`
	ChangeSummary         string                       `json:"changeSummary,omitempty"`
	ChangeType            string                       `json:"changeType"` // create, update, restore
	IsCurrentVersion      bool                         `json:"isCurrentVersion"`
	CreatedAt             time.Time                    `json:"createdAt"`
	Parameters            []ExecutionTemplateParameter `json:"parameters,omitempty"`
}

// ExecutionTemplateExecution represents an execution record for audit trail
type ExecutionTemplateExecution struct {
	ID                 string                 `json:"id"`
	TemplateID         string                 `json:"templateId"`
	TemplateVersionID  *string                `json:"templateVersionId,omitempty"`
	AuthTokenID        *string                `json:"authTokenId,omitempty"`
	ExecutionRunID     *string                `json:"executionRunId,omitempty"`
	ParametersProvided map[string]interface{} `json:"parametersProvided"`
	ResolvedPrompt     string                 `json:"resolvedPrompt"`
	ResolvedContext    string                 `json:"resolvedContext,omitempty"`
	RequestIP          string                 `json:"requestIp,omitempty"`
	UserAgent          string                 `json:"userAgent,omitempty"`
	Referer            string                 `json:"referer,omitempty"`
	Status             string                 `json:"status"` // pending, running, completed, failed, rate_limited
	ErrorMessage       string                 `json:"errorMessage,omitempty"`
	ExecutionTimeMs    *int                   `json:"executionTimeMs,omitempty"`
	CreatedAt          time.Time              `json:"createdAt"`
	CompletedAt        *time.Time             `json:"completedAt,omitempty"`
}

// ExecutionTemplateAnalytics represents analytics data for templates
type ExecutionTemplateAnalytics struct {
	TemplateID             string                 `json:"templateId"`
	TotalExecutions        int                    `json:"totalExecutions"`
	SuccessfulExecutions   int                    `json:"successfulExecutions"`
	FailedExecutions       int                    `json:"failedExecutions"`
	RateLimitedExecutions  int                    `json:"rateLimitedExecutions"`
	AverageExecutionTimeMs float64                `json:"averageExecutionTimeMs"`
	UsageByDay             map[string]interface{} `json:"usageByDay,omitempty"`
	TopParameters          map[string]interface{} `json:"topParameters,omitempty"`
	ErrorBreakdown         map[string]interface{} `json:"errorBreakdown,omitempty"`
}

// TemplateParameterValidationError represents a parameter validation error
type TemplateParameterValidationError struct {
	ParameterName string `json:"parameterName"`
	ErrorType     string `json:"errorType"`
	ErrorMessage  string `json:"errorMessage"`
	ProvidedValue string `json:"providedValue,omitempty"`
}

// TemplateExecutionRequest represents a request to execute a template
type TemplateExecutionRequest struct {
	TemplateID string                 `json:"templateId"`
	AuthToken  string                 `json:"authToken"`
	Parameters map[string]interface{} `json:"parameters"`
	ClientIP   string                 `json:"clientIp,omitempty"`
	UserAgent  string                 `json:"userAgent,omitempty"`
	Referer    string                 `json:"referer,omitempty"`
}

// TemplateExecutionResponse represents the response from template execution
type TemplateExecutionResponse struct {
	ExecutionID         string        `json:"executionId"`
	TemplateExecutionID string        `json:"templateExecutionId"`
	ExecutionRun        *ExecutionRun `json:"executionRun,omitempty"`
	Message             string        `json:"message"`
	RateLimited         bool          `json:"rateLimited"`
	RateLimitRemaining  int           `json:"rateLimitRemaining"`
	RateLimitResetAt    *time.Time    `json:"rateLimitResetAt,omitempty"`
}

// RateLimitWindow represents a rate limiting time window
type RateLimitWindow struct {
	ID                   string     `json:"id"`
	TemplateID           string     `json:"templateId"`
	AuthTokenID          *string    `json:"authTokenId,omitempty"`
	WindowStart          time.Time  `json:"windowStart"`
	WindowType           string     `json:"windowType"` // hour, day, burst
	RequestCount         int        `json:"requestCount"`
	LastRequestAt        *time.Time `json:"lastRequestAt,omitempty"`
	PlatformLimitHit     bool       `json:"platformLimitHit"`
	PlatformLimitResetAt *time.Time `json:"platformLimitResetAt,omitempty"`
	CreatedAt            time.Time  `json:"createdAt"`
	UpdatedAt            time.Time  `json:"updatedAt"`
}

// LifecycleStatus represents the lifecycle status of an agent
type LifecycleStatus string

const (
	LifecycleStatusStandby LifecycleStatus = "STANDBY" // Alive but won't perform actions, will only log
	LifecycleStatusActive  LifecycleStatus = "ACTIVE"  // Fully operational
	LifecycleStatusPaused  LifecycleStatus = "PAUSED"  // Temporarily stopped
	LifecycleStatusKilled  LifecycleStatus = "KILLED"  // Permanently disabled (cannot revive)
)

// Agent represents an autonomous agent that can execute templates on a schedule
type Agent struct {
	ID               string          `json:"id"`
	UserID           string          `json:"userId"`
	FirstName        string          `json:"firstName"`
	LastName         string          `json:"lastName"`
	TemplateID       string          `json:"templateId"`
	MaxTokensPerDay  int32           `json:"maxTokensPerDay"`
	HeartbeatMinutes int32           `json:"heartbeatMinutes"` // Minimum 5 minutes
	LifecycleStatus  LifecycleStatus `json:"lifecycleStatus"`
	TokensUsedToday  int32           `json:"tokensUsedToday"`
	TokensResetDate  string          `json:"tokensResetDate"` // Date string in YYYY-MM-DD format
	LastExecutionAt  *time.Time      `json:"lastExecutionAt,omitempty"`
	NextScheduledAt  *time.Time      `json:"nextScheduledAt,omitempty"`
	TotalExecutions  int32           `json:"totalExecutions"`
	CreatedAt        time.Time       `json:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt"`
	// Template information (populated via JOIN)
	TemplateName        string `json:"templateName,omitempty"`
	TemplateDescription string `json:"templateDescription,omitempty"`
}

// AgentCreateRequest represents the request to create a new agent
type AgentCreateRequest struct {
	FirstName        string          `json:"firstName" validate:"required,min=1,max=100"`
	LastName         string          `json:"lastName" validate:"required,min=1,max=100"`
	TemplateID       string          `json:"templateId" validate:"required"`
	MaxTokensPerDay  int32           `json:"maxTokensPerDay" validate:"required,min=1"`
	HeartbeatMinutes int32           `json:"heartbeatMinutes" validate:"required,min=5"`
	LifecycleStatus  LifecycleStatus `json:"lifecycleStatus"`
}

// AgentUpdateRequest represents the request to update an existing agent
type AgentUpdateRequest struct {
	FirstName        *string          `json:"firstName,omitempty" validate:"omitempty,min=1,max=100"`
	LastName         *string          `json:"lastName,omitempty" validate:"omitempty,min=1,max=100"`
	MaxTokensPerDay  *int32           `json:"maxTokensPerDay,omitempty" validate:"omitempty,min=1"`
	HeartbeatMinutes *int32           `json:"heartbeatMinutes,omitempty" validate:"omitempty,min=5"`
	LifecycleStatus  *LifecycleStatus `json:"lifecycleStatus,omitempty"`
}

// AgentSummary represents a summary view of an agent with execution statistics
type AgentSummary struct {
	Agent
	ExecutionCount       int32      `json:"executionCount"`
	LatestExecutionAt    *time.Time `json:"latestExecutionAt,omitempty"`
	SuccessfulExecutions int32      `json:"successfulExecutions"`
	FailedExecutions     int32      `json:"failedExecutions"`
}

// ToJSON converts any struct to JSON string for database storage
func ToJSON(v interface{}) (string, error) {
	bytes, err := json.Marshal(v)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// FromJSON converts JSON string from database to struct
func FromJSON(jsonStr string, v interface{}) error {
	if jsonStr == "" {
		return nil
	}
	return json.Unmarshal([]byte(jsonStr), v)
}
