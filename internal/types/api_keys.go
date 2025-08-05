package types

import (
	"encoding/json"
	"time"
)

// UserApiKey represents a user's API key with full metadata
type UserApiKey struct {
	ID          string `json:"id"`
	UserID      string `json:"userId"`
	KeyName     string `json:"keyName"`
	ServiceName string `json:"serviceName"`
	KeyType     string `json:"keyType"`

	// Encrypted storage - the actual key is never exposed in responses
	EncryptedKeyValue    string `json:"-"` // Never expose in JSON
	EncryptionAlgorithm  string `json:"encryptionAlgorithm,omitempty"`
	EncryptionKeyVersion int    `json:"encryptionKeyVersion,omitempty"`

	// Metadata and configuration
	DisplayName string `json:"displayName"`
	Description string `json:"description,omitempty"`

	// Access control
	AccessLevel string                 `json:"accessLevel"`
	Scopes      []string               `json:"scopes,omitempty"`
	Permissions map[string]interface{} `json:"permissions,omitempty"`

	// Lifecycle management
	ExpiresAt        *time.Time `json:"expiresAt,omitempty"`
	LastValidatedAt  *time.Time `json:"lastValidatedAt,omitempty"`
	ValidationStatus string     `json:"validationStatus"`
	ValidationError  string     `json:"validationError,omitempty"`

	// Usage tracking
	IsActive   bool       `json:"isActive"`
	IsDefault  bool       `json:"isDefault"`
	TotalUses  int        `json:"totalUses"`
	LastUsedAt *time.Time `json:"lastUsedAt,omitempty"`

	// Service configuration
	ServiceConfig map[string]interface{} `json:"serviceConfig,omitempty"`
	Environment   string                 `json:"environment"`

	// Rate limiting
	RateLimitPerHour *int `json:"rateLimitPerHour,omitempty"`
	RateLimitPerDay  *int `json:"rateLimitPerDay,omitempty"`
	RateLimitBurst   *int `json:"rateLimitBurst,omitempty"`

	// Audit trail
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	CreatedBy string    `json:"createdBy,omitempty"`
}

// CreateApiKeyRequest represents a request to create a new API key
type CreateApiKeyRequest struct {
	KeyName          string                 `json:"keyName"`
	ServiceName      string                 `json:"serviceName"`
	KeyType          string                 `json:"keyType"`
	KeyValue         string                 `json:"keyValue"` // Plain text - will be encrypted
	DisplayName      string                 `json:"displayName"`
	Description      string                 `json:"description,omitempty"`
	AccessLevel      string                 `json:"accessLevel"`
	Scopes           []string               `json:"scopes,omitempty"`
	Permissions      map[string]interface{} `json:"permissions,omitempty"`
	ExpiresAt        *time.Time             `json:"expiresAt,omitempty"`
	IsDefault        bool                   `json:"isDefault"`
	ServiceConfig    map[string]interface{} `json:"serviceConfig,omitempty"`
	Environment      string                 `json:"environment"`
	RateLimitPerHour *int                   `json:"rateLimitPerHour,omitempty"`
	RateLimitPerDay  *int                   `json:"rateLimitPerDay,omitempty"`
	RateLimitBurst   *int                   `json:"rateLimitBurst,omitempty"`
}

// UpdateApiKeyRequest represents a request to update an existing API key
type UpdateApiKeyRequest struct {
	KeyName          *string                `json:"keyName,omitempty"`
	KeyValue         *string                `json:"keyValue,omitempty"` // If provided, will re-encrypt
	DisplayName      *string                `json:"displayName,omitempty"`
	Description      *string                `json:"description,omitempty"`
	AccessLevel      *string                `json:"accessLevel,omitempty"`
	Scopes           []string               `json:"scopes,omitempty"`
	Permissions      map[string]interface{} `json:"permissions,omitempty"`
	ExpiresAt        *time.Time             `json:"expiresAt,omitempty"`
	IsActive         *bool                  `json:"isActive,omitempty"`
	IsDefault        *bool                  `json:"isDefault,omitempty"`
	ServiceConfig    map[string]interface{} `json:"serviceConfig,omitempty"`
	Environment      *string                `json:"environment,omitempty"`
	RateLimitPerHour *int                   `json:"rateLimitPerHour,omitempty"`
	RateLimitPerDay  *int                   `json:"rateLimitPerDay,omitempty"`
	RateLimitBurst   *int                   `json:"rateLimitBurst,omitempty"`
}

// ApiKeyFunctionMapping represents the mapping between API keys and functions
type ApiKeyFunctionMapping struct {
	ID                   string                 `json:"id"`
	ApiKeyID             string                 `json:"apiKeyId"`
	FunctionDefinitionID *string                `json:"functionDefinitionId,omitempty"`
	FunctionGroup        *string                `json:"functionGroup,omitempty"`
	IsRequired           bool                   `json:"isRequired"`
	AccessLevelOverride  *string                `json:"accessLevelOverride,omitempty"`
	CustomConfig         map[string]interface{} `json:"customConfig,omitempty"`
	CreatedAt            time.Time              `json:"createdAt"`
	UpdatedAt            time.Time              `json:"updatedAt"`
}

// ApiKeyUsageLog represents a log entry of API key usage
type ApiKeyUsageLog struct {
	ID                string    `json:"id"`
	ApiKeyID          string    `json:"apiKeyId"`
	UserID            string    `json:"userId"`
	FunctionName      string    `json:"functionName,omitempty"`
	FunctionGroup     string    `json:"functionGroup,omitempty"`
	ExecutionRunID    *string   `json:"executionRunId,omitempty"`
	UsedAt            time.Time `json:"usedAt"`
	Success           bool      `json:"success"`
	ResponseTimeMs    *int      `json:"responseTimeMs,omitempty"`
	ErrorMessage      string    `json:"errorMessage,omitempty"`
	RateLimited       bool      `json:"rateLimited"`
	HttpStatusCode    *int      `json:"httpStatusCode,omitempty"`
	ResponseSizeBytes *int      `json:"responseSizeBytes,omitempty"`
}

// ApiKeyValidationResult represents the result of validating an API key
type ApiKeyValidationResult struct {
	IsValid         bool                   `json:"isValid"`
	ErrorMessage    string                 `json:"errorMessage,omitempty"`
	HttpStatusCode  *int                   `json:"httpStatusCode,omitempty"`
	ResponseTimeMs  int                    `json:"responseTimeMs"`
	ServiceResponse map[string]interface{} `json:"serviceResponse,omitempty"`
	TestedAt        time.Time              `json:"testedAt"`
}

// FunctionGroupApiKeyStatus represents the status of API keys for a function group
type FunctionGroupApiKeyStatus struct {
	FunctionGroup      string   `json:"functionGroup"`
	GroupDisplayName   string   `json:"groupDisplayName"`
	RequiredServices   []string `json:"requiredServices"`
	ConfiguredServices []string `json:"configuredServices"`
	MissingServices    []string `json:"missingServices"`
	AllKeysConfigured  bool     `json:"allKeysConfigured"`
	FunctionCount      int      `json:"functionCount"`

	// Per-service details
	ServiceDetails map[string]ServiceApiKeyStatus `json:"serviceDetails"`
}

// ServiceApiKeyStatus represents the status of API keys for a specific service
type ServiceApiKeyStatus struct {
	ServiceName      string     `json:"serviceName"`
	HasValidKey      bool       `json:"hasValidKey"`
	KeyCount         int        `json:"keyCount"`
	DefaultKeyID     string     `json:"defaultKeyId,omitempty"`
	LastValidated    *time.Time `json:"lastValidated,omitempty"`
	ValidationStatus string     `json:"validationStatus"`
	AccessLevel      string     `json:"accessLevel,omitempty"`
	Environment      string     `json:"environment,omitempty"`
}

// FunctionApiKeyRequirements represents API key requirements for a specific function
type FunctionApiKeyRequirements struct {
	FunctionID         string   `json:"functionId"`
	FunctionName       string   `json:"functionName"`
	DisplayName        string   `json:"displayName"`
	FunctionGroup      string   `json:"functionGroup"`
	RequiredServices   []string `json:"requiredServices"`
	ConfiguredServices []string `json:"configuredServices"`
	MissingServices    []string `json:"missingServices"`
	AllKeysConfigured  bool     `json:"allKeysConfigured"`

	// Detailed requirements per service
	ServiceRequirements map[string]ServiceRequirement `json:"serviceRequirements"`
}

// ServiceRequirement represents the requirements for a specific service
type ServiceRequirement struct {
	ServiceName           string   `json:"serviceName"`
	Required              bool     `json:"required"`
	MinimumAccessLevel    string   `json:"minimumAccessLevel"`
	RequiredScopes        []string `json:"requiredScopes,omitempty"`
	IsConfigured          bool     `json:"isConfigured"`
	ConfiguredKeyID       string   `json:"configuredKeyId,omitempty"`
	ConfiguredAccessLevel string   `json:"configuredAccessLevel,omitempty"`
}

// ApiKeyStatistics represents usage statistics for API keys
type ApiKeyStatistics struct {
	UserID       string `json:"userId"`
	TotalKeys    int    `json:"totalKeys"`
	ActiveKeys   int    `json:"activeKeys"`
	ValidKeys    int    `json:"validKeys"`
	ExpiredKeys  int    `json:"expiredKeys"`
	UntestedKeys int    `json:"untestedKeys"`

	// Usage in last period
	Last24HourUsage int `json:"last24HourUsage"`
	Last7DayUsage   int `json:"last7DayUsage"`
	Last30DayUsage  int `json:"last30DayUsage"`

	// Success rates
	SuccessRate24Hours float64 `json:"successRate24Hours"`
	SuccessRate7Days   float64 `json:"successRate7Days"`

	// Per service breakdown
	ServiceBreakdown map[string]ServiceStatistics `json:"serviceBreakdown"`
}

// ServiceStatistics represents statistics for a specific service
type ServiceStatistics struct {
	ServiceName         string     `json:"serviceName"`
	KeyCount            int        `json:"keyCount"`
	TotalUsage          int        `json:"totalUsage"`
	SuccessfulUsage     int        `json:"successfulUsage"`
	FailedUsage         int        `json:"failedUsage"`
	SuccessRate         float64    `json:"successRate"`
	AverageResponseTime float64    `json:"averageResponseTime"`
	LastUsed            *time.Time `json:"lastUsed,omitempty"`
}

// Helper methods for JSON marshaling/unmarshaling with database compatibility

// MarshalScopes converts scopes slice to JSON for database storage
func (k *UserApiKey) MarshalScopes() ([]byte, error) {
	if k.Scopes == nil {
		return json.Marshal([]string{})
	}
	return json.Marshal(k.Scopes)
}

// UnmarshalScopes converts JSON to scopes slice from database
func (k *UserApiKey) UnmarshalScopes(data []byte) error {
	if len(data) == 0 {
		k.Scopes = []string{}
		return nil
	}
	return json.Unmarshal(data, &k.Scopes)
}

// MarshalPermissions converts permissions map to JSON for database storage
func (k *UserApiKey) MarshalPermissions() ([]byte, error) {
	if k.Permissions == nil {
		return json.Marshal(map[string]interface{}{})
	}
	return json.Marshal(k.Permissions)
}

// UnmarshalPermissions converts JSON to permissions map from database
func (k *UserApiKey) UnmarshalPermissions(data []byte) error {
	if len(data) == 0 {
		k.Permissions = map[string]interface{}{}
		return nil
	}
	return json.Unmarshal(data, &k.Permissions)
}

// MarshalServiceConfig converts service config map to JSON for database storage
func (k *UserApiKey) MarshalServiceConfig() ([]byte, error) {
	if k.ServiceConfig == nil {
		return json.Marshal(map[string]interface{}{})
	}
	return json.Marshal(k.ServiceConfig)
}

// UnmarshalServiceConfig converts JSON to service config map from database
func (k *UserApiKey) UnmarshalServiceConfig(data []byte) error {
	if len(data) == 0 {
		k.ServiceConfig = map[string]interface{}{}
		return nil
	}
	return json.Unmarshal(data, &k.ServiceConfig)
}
