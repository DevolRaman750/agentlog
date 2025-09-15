package gogent

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gogent/internal/db"
)

// ProviderSpec defines the JSON structure for provider specifications
type ProviderSpec struct {
	Name               string                 `json:"name"`
	DisplayName        string                 `json:"display_name"`
	Description        string                 `json:"description"`
	BaseURL            string                 `json:"base_url"`
	AuthMethods        []string               `json:"auth_methods"`
	AuthConfig         map[string]interface{} `json:"auth_config"`
	RateLimits         map[string]interface{} `json:"rate_limits"`
	CommonHeaders      map[string]string      `json:"common_headers"`
	ErrorHandling      map[string]interface{} `json:"error_handling"`
	SupportedFunctions []string               `json:"supported_functions"`
}

// FunctionSpec defines the JSON structure for function specifications
type FunctionSpec struct {
	Name          string `json:"name"`
	Provider      string `json:"provider"`
	FunctionGroup string `json:"function_group"`
	DisplayName   string `json:"display_name"`
	Description   string `json:"description"`
	Endpoint      struct {
		Path   string `json:"path"`
		Method string `json:"method"`
	} `json:"endpoint"`
	Parameters            map[string]interface{}   `json:"parameters"`
	ParameterDependencies map[string]interface{}   `json:"parameter_dependencies,omitempty"`
	ResponseTransformer   map[string]interface{}   `json:"response_transformer,omitempty"`
	ProvidesTo            []map[string]interface{} `json:"provides_to_functions,omitempty"`
	Examples              []map[string]interface{} `json:"examples,omitempty"`
}

// SyncSystemSpecs synchronizes providers, functions, and configurations from JSON files to database
func (c *Client) SyncSystemSpecs(ctx context.Context) error {
	log.Printf("🔄 Starting system specs synchronization...")

	// Sync providers first
	if err := c.syncProviders(ctx); err != nil {
		return fmt.Errorf("failed to sync providers: %w", err)
	}

	// Then sync functions
	if err := c.syncFunctions(ctx); err != nil {
		return fmt.Errorf("failed to sync functions: %w", err)
	}

	// Sync system model configurations
	if err := c.syncSystemModelConfigurations(ctx); err != nil {
		return fmt.Errorf("failed to sync system model configurations: %w", err)
	}

	// Finally sync execution templates
	if err := c.syncExecutionTemplates(ctx); err != nil {
		return fmt.Errorf("failed to sync execution templates: %w", err)
	}

	log.Printf("✅ System specs synchronization completed")
	return nil
}

// syncProviders loads provider specs from JSON files and syncs to database
func (c *Client) syncProviders(ctx context.Context) error {
	providersDir := "system/providers"

	// Check if providers directory exists
	if _, err := os.Stat(providersDir); os.IsNotExist(err) {
		log.Printf("⚠️ Providers directory %s not found, skipping provider sync", providersDir)
		return nil
	}

	// Walk through provider JSON files
	err := filepath.WalkDir(providersDir, func(path string, _ fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !strings.HasSuffix(path, ".json") {
			return nil
		}

		log.Printf("📄 Loading provider spec: %s", path)

		// Read and parse provider spec
		data, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read %s: %w", path, err)
		}

		var spec ProviderSpec
		if err := json.Unmarshal(data, &spec); err != nil {
			return fmt.Errorf("failed to parse %s: %w", path, err)
		}

		// Validate spec
		if spec.Name == "" {
			return fmt.Errorf("provider spec %s missing name", path)
		}

		// TODO: Store provider spec in database
		// For now, just log the successful parse
		log.Printf("✅ Loaded provider: %s (%s)", spec.Name, spec.DisplayName)

		return nil
	})

	if err != nil {
		return fmt.Errorf("failed to walk providers directory: %w", err)
	}

	return nil
}

// syncFunctions loads function specs from JSON files and syncs to database
func (c *Client) syncFunctions(ctx context.Context) error {
	functionsDir := "system/functions"

	// Check if functions directory exists
	if _, err := os.Stat(functionsDir); os.IsNotExist(err) {
		log.Printf("⚠️ Functions directory %s not found, skipping function sync", functionsDir)
		return nil
	}

	// Walk through function JSON files
	err := filepath.WalkDir(functionsDir, func(path string, _ fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !strings.HasSuffix(path, ".json") {
			return nil
		}

		log.Printf("📄 Loading function spec: %s", path)

		// Read and parse function spec
		data, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read %s: %w", path, err)
		}

		var spec FunctionSpec
		if err := json.Unmarshal(data, &spec); err != nil {
			return fmt.Errorf("failed to parse %s: %w", path, err)
		}

		// Validate spec
		if spec.Name == "" {
			return fmt.Errorf("function spec %s missing name", path)
		}
		if spec.Provider == "" {
			return fmt.Errorf("function spec %s missing provider", path)
		}

		// Set function_group to provider if not explicitly set (backward compatibility)
		if spec.FunctionGroup == "" {
			spec.FunctionGroup = spec.Provider
		}

		// Sync function to database
		if err := c.syncFunctionToDatabase(ctx, &spec); err != nil {
			return fmt.Errorf("failed to sync function %s: %w", spec.Name, err)
		}

		log.Printf("✅ Synced function: %s (%s)", spec.Name, spec.DisplayName)

		return nil
	})

	if err != nil {
		return fmt.Errorf("failed to walk functions directory: %w", err)
	}

	return nil
}

// syncFunctionToDatabase syncs a function spec to the database
func (c *Client) syncFunctionToDatabase(ctx context.Context, spec *FunctionSpec) error {
	// Check if function already exists
	existingFunc, lookupErr := c.queries.GetFunctionDefinitionByName(ctx, db.GetFunctionDefinitionByNameParams{
		UserID: "system",
		Name:   spec.Name,
	})

	// Build endpoint URL
	endpointURL := ""
	if spec.Provider == "github" {
		endpointURL = "https://api.github.com" + spec.Endpoint.Path
	} else if spec.Provider == "slack" {
		endpointURL = "https://slack.com/api" + spec.Endpoint.Path
	} else if spec.Provider == "internal" {
		// Internal functions use local endpoints
		endpointURL = spec.Endpoint.Path
	}

	// Marshal parameters schema
	parametersSchema, err := json.Marshal(spec.Parameters)
	if err != nil {
		return fmt.Errorf("failed to marshal parameters schema: %w", err)
	}

	// Marshal mock response (empty for now)
	mockResponse, err := json.Marshal(map[string]interface{}{
		"status":  "mock",
		"message": "This is a mock response for " + spec.Name,
	})
	if err != nil {
		return fmt.Errorf("failed to marshal mock response: %w", err)
	}

	// Build headers based on provider configuration
	headers := map[string]interface{}{}

	// Add provider-specific authentication headers
	if spec.Provider == "slack" {
		headers["Authorization"] = "Bearer {SLACK_BOT_TOKEN}"
		headers["Content-Type"] = "application/json"
	} else if spec.Provider == "github" {
		headers["Authorization"] = "token {GITHUB_API_KEY}"
		headers["Accept"] = "application/vnd.github.v3+json"
		headers["User-Agent"] = "gogent/1.0"
	}

	headersJSON, err := json.Marshal(headers)
	if err != nil {
		return fmt.Errorf("failed to marshal headers: %w", err)
	}

	defaultAuthConfig, err := json.Marshal(map[string]interface{}{})
	if err != nil {
		return fmt.Errorf("failed to marshal default auth config: %w", err)
	}

	defaultFallbackData, err := json.Marshal(map[string]interface{}{})
	if err != nil {
		return fmt.Errorf("failed to marshal default fallback data: %w", err)
	}

	// Build required API keys based on provider
	requiredAPIKeys := []string{}
	if spec.Provider == "slack" {
		requiredAPIKeys = []string{"SLACK_BOT_TOKEN"}
	} else if spec.Provider == "github" {
		requiredAPIKeys = []string{"GITHUB_API_KEY"}
	}

	requiredAPIKeysJSON, err := json.Marshal(requiredAPIKeys)
	if err != nil {
		return fmt.Errorf("failed to marshal required API keys: %w", err)
	}

	defaultAPIKeyValidation, err := json.Marshal(map[string]interface{}{})
	if err != nil {
		return fmt.Errorf("failed to marshal default API key validation: %w", err)
	}

	// Check the database lookup result
	if lookupErr != nil && lookupErr != sql.ErrNoRows {
		return fmt.Errorf("failed to check existing function: %w", lookupErr)
	}

	if lookupErr == sql.ErrNoRows {
		// Generate unique ID for new function
		functionID := fmt.Sprintf("func-%s-%d", spec.Name, time.Now().Unix())

		// Determine if this should be a system resource
		// External service functions (slack, github, etc.) should be system resources
		isSystemResource := spec.Provider == "slack" || spec.Provider == "github" || spec.Provider == "weather" || spec.Provider == "googledrive"

		// Create new function
		params := db.CreateFunctionDefinitionParams{
			ID:                functionID,
			UserID:            "system",
			Name:              spec.Name,
			DisplayName:       spec.DisplayName,
			FunctionGroup:     spec.FunctionGroup,
			FunctionType:      "api", // Default to "api" type
			Description:       sql.NullString{String: spec.Description, Valid: true},
			ParametersSchema:  parametersSchema,
			MockResponse:      mockResponse,
			EndpointUrl:       sql.NullString{String: endpointURL, Valid: endpointURL != ""},
			HTTPMethod:        sql.NullString{String: spec.Endpoint.Method, Valid: spec.Endpoint.Method != ""},
			Headers:           headersJSON,
			AuthConfig:        defaultAuthConfig,
			IsActive:          sql.NullBool{Bool: true, Valid: true},
			IsSystemResource:  sql.NullBool{Bool: isSystemResource, Valid: true},
			RequiredAPIKeys:   requiredAPIKeysJSON,
			APIKeyValidation:  defaultAPIKeyValidation,
			QueryTemplate:     sql.NullString{Valid: false}, // Empty for now
			ResultTransformer: sql.NullString{Valid: false}, // Empty for now
			FallbackData:      defaultFallbackData,
		}

		if err := c.queries.CreateFunctionDefinition(ctx, params); err != nil {
			return fmt.Errorf("failed to create function definition: %w", err)
		}

		log.Printf("➕ Created new function: %s", spec.Name)
	} else {
		// Determine if this should be a system resource
		// External service functions (slack, github, etc.) should be system resources
		isSystemResource := spec.Provider == "slack" || spec.Provider == "github" || spec.Provider == "weather" || spec.Provider == "googledrive"

		// Update existing function
		params := db.UpdateFunctionDefinitionParams{
			ID:                existingFunc.ID,
			UserID:            "system",
			DisplayName:       spec.DisplayName,
			FunctionGroup:     spec.FunctionGroup,
			FunctionType:      "api", // Default to "api" type
			Description:       sql.NullString{String: spec.Description, Valid: true},
			ParametersSchema:  parametersSchema,
			MockResponse:      mockResponse,
			EndpointUrl:       sql.NullString{String: endpointURL, Valid: endpointURL != ""},
			HTTPMethod:        sql.NullString{String: spec.Endpoint.Method, Valid: spec.Endpoint.Method != ""},
			Headers:           headersJSON,
			AuthConfig:        defaultAuthConfig,
			IsActive:          sql.NullBool{Bool: true, Valid: true},
			IsSystemResource:  sql.NullBool{Bool: isSystemResource, Valid: true},
			RequiredAPIKeys:   requiredAPIKeysJSON,
			APIKeyValidation:  defaultAPIKeyValidation,
			QueryTemplate:     sql.NullString{Valid: false}, // Empty for now
			ResultTransformer: sql.NullString{Valid: false}, // Empty for now
			FallbackData:      defaultFallbackData,
		}

		if err := c.queries.UpdateFunctionDefinition(ctx, params); err != nil {
			return fmt.Errorf("failed to update function definition: %w", err)
		}

		log.Printf("🔄 Updated existing function: %s", spec.Name)
	}

	return nil
}

// ModelConfigurationSpec defines the JSON structure for model configuration specifications
type ModelConfigurationSpec struct {
	ID               string                 `json:"id"`
	Name             string                 `json:"name"`
	Model            string                 `json:"model"`
	Description      string                 `json:"description"`
	SystemPrompt     string                 `json:"system_prompt"`
	Parameters       map[string]interface{} `json:"parameters"`
	SafetySettings   interface{}            `json:"safety_settings"`
	GenerationConfig interface{}            `json:"generation_config"`
	ToolConfig       interface{}            `json:"tool_config"`
	IsSystem         bool                   `json:"is_system"`
	Provider         string                 `json:"provider"`
}

// syncSystemModelConfigurations loads model configuration specs from JSON files and syncs to database
func (c *Client) syncSystemModelConfigurations(ctx context.Context) error {
	modelsDir := "system/models"

	// Check if models directory exists
	if _, err := os.Stat(modelsDir); os.IsNotExist(err) {
		log.Printf("⚠️ Models directory %s not found, skipping model configuration sync", modelsDir)
		return nil
	}

	// Walk through model JSON files
	err := filepath.WalkDir(modelsDir, func(path string, _ fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !strings.HasSuffix(path, ".json") {
			return nil
		}

		log.Printf("📄 Loading model configuration: %s", path)

		// Read and parse model configuration spec
		data, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read %s: %w", path, err)
		}

		var spec ModelConfigurationSpec
		if err := json.Unmarshal(data, &spec); err != nil {
			return fmt.Errorf("failed to parse %s: %w", path, err)
		}

		// Validate spec
		if spec.ID == "" {
			return fmt.Errorf("model configuration spec %s missing id", path)
		}
		if spec.Model == "" {
			return fmt.Errorf("model configuration spec %s missing model", path)
		}

		// Only sync system configurations (skip user configurations)
		if !spec.IsSystem {
			log.Printf("⏭️ Skipping non-system model configuration: %s", spec.ID)
			return nil
		}

		// Sync configuration to database
		if err := c.syncModelConfigurationToDatabase(ctx, &spec); err != nil {
			return fmt.Errorf("failed to sync model configuration %s: %w", spec.ID, err)
		}

		log.Printf("✅ Synced model configuration: %s (%s)", spec.ID, spec.Name)

		return nil
	})

	if err != nil {
		return fmt.Errorf("failed to walk models directory: %w", err)
	}

	return nil
}

// syncModelConfigurationToDatabase syncs a model configuration spec to the database
func (c *Client) syncModelConfigurationToDatabase(ctx context.Context, spec *ModelConfigurationSpec) error {
	// Check if configuration already exists
	_, err := c.queries.GetAPIConfiguration(ctx, db.GetAPIConfigurationParams{
		ID:     spec.ID,
		UserID: "system",
	})
	configExists := err == nil

	// Extract parameters
	temperature := float32(0.5)
	maxTokens := int32(4096)
	topP := float32(0.9)
	topK := int32(40)

	if spec.Parameters != nil {
		if temp, ok := spec.Parameters["temperature"].(float64); ok {
			temperature = float32(temp)
		}
		if tokens, ok := spec.Parameters["max_tokens"].(float64); ok {
			maxTokens = int32(tokens)
		}
		if p, ok := spec.Parameters["top_p"].(float64); ok {
			topP = float32(p)
		}
		if k, ok := spec.Parameters["top_k"].(float64); ok {
			topK = int32(k)
		}
	}

	// Convert complex fields to JSON
	safetySettingsJSON, _ := json.Marshal(spec.SafetySettings)
	generationConfigJSON, _ := json.Marshal(spec.GenerationConfig)
	toolConfigJSON, _ := json.Marshal(spec.ToolConfig)

	if !configExists {
		// Create new configuration
		params := db.CreateAPIConfigurationParams{
			ID:               spec.ID,
			UserID:           "system",
			VariationName:    spec.Name,
			ModelName:        spec.Model,
			SystemPrompt:     sql.NullString{String: spec.SystemPrompt, Valid: spec.SystemPrompt != ""},
			Temperature:      sql.NullString{String: fmt.Sprintf("%.2f", temperature), Valid: true},
			MaxTokens:        sql.NullInt32{Int32: maxTokens, Valid: true},
			TopP:             sql.NullString{String: fmt.Sprintf("%.2f", topP), Valid: true},
			TopK:             sql.NullInt32{Int32: topK, Valid: true},
			SafetySettings:   safetySettingsJSON,
			GenerationConfig: generationConfigJSON,
			Tools:            []byte("[]"), // Empty tools array
			ToolConfig:       toolConfigJSON,
		}

		if err := c.queries.CreateAPIConfiguration(ctx, params); err != nil {
			return fmt.Errorf("failed to create model configuration: %w", err)
		}

		log.Printf("➕ Created new model configuration: %s", spec.ID)
	} else {
		// Update existing configuration
		params := db.UpdateAPIConfigurationParams{
			ID:               spec.ID,
			UserID:           "system",
			VariationName:    spec.Name,
			ModelName:        spec.Model,
			SystemPrompt:     sql.NullString{String: spec.SystemPrompt, Valid: spec.SystemPrompt != ""},
			Temperature:      sql.NullString{String: fmt.Sprintf("%.2f", temperature), Valid: true},
			MaxTokens:        sql.NullInt32{Int32: maxTokens, Valid: true},
			TopP:             sql.NullString{String: fmt.Sprintf("%.2f", topP), Valid: true},
			TopK:             sql.NullInt32{Int32: topK, Valid: true},
			SafetySettings:   safetySettingsJSON,
			GenerationConfig: generationConfigJSON,
			Tools:            []byte("[]"), // Empty tools array
			ToolConfig:       toolConfigJSON,
		}

		if err := c.queries.UpdateAPIConfiguration(ctx, params); err != nil {
			return fmt.Errorf("failed to update model configuration: %w", err)
		}

		log.Printf("🔄 Updated existing model configuration: %s", spec.ID)
	}

	return nil
}

// ExecutionTemplateSpec defines the JSON structure for execution template specifications
type ExecutionTemplateSpec struct {
	ID                       string `json:"id"`
	Name                     string `json:"name"`
	Description              string `json:"description"`
	Category                 string `json:"category"`
	TemplatePrompt           string `json:"template_prompt"`
	ContextTemplate          string `json:"context_template"`
	EnableFunctionCalling    bool   `json:"enable_function_calling"`
	PreferredConfigurationID string `json:"preferred_configuration_id"`
	Settings                 struct {
		ExecutionTimeoutSeconds int `json:"execution_timeout_seconds"`
		RateLimitPerHour        int `json:"rate_limit_per_hour"`
		RateLimitPerDay         int `json:"rate_limit_per_day"`
		RateLimitBurst          int `json:"rate_limit_burst"`
	} `json:"settings"`
	Tags        []string                 `json:"tags"`
	FunctionIDs []string                 `json:"function_ids"`
	Parameters  []map[string]interface{} `json:"parameters"`
	IsSystem    bool                     `json:"is_system"`
	IsPublic    bool                     `json:"is_public"`
}

// syncExecutionTemplates loads execution template specs from JSON files and syncs to database
func (c *Client) syncExecutionTemplates(ctx context.Context) error {
	templatesDir := "system/execution_templates"

	// Check if templates directory exists
	if _, err := os.Stat(templatesDir); os.IsNotExist(err) {
		log.Printf("⚠️ Templates directory %s not found, skipping execution template sync", templatesDir)
		return nil
	}

	// Walk through template JSON files
	err := filepath.WalkDir(templatesDir, func(path string, _ fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !strings.HasSuffix(path, ".json") {
			return nil
		}

		log.Printf("📄 Loading execution template spec: %s", path)

		// Read and parse template spec
		data, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read %s: %w", path, err)
		}

		var spec ExecutionTemplateSpec
		if err := json.Unmarshal(data, &spec); err != nil {
			return fmt.Errorf("failed to parse %s: %w", path, err)
		}

		// Validate spec
		if spec.ID == "" {
			return fmt.Errorf("execution template spec %s missing id", path)
		}
		if spec.Name == "" {
			return fmt.Errorf("execution template spec %s missing name", path)
		}
		if spec.TemplatePrompt == "" {
			return fmt.Errorf("execution template spec %s missing template_prompt", path)
		}

		// Sync template to database
		if err := c.syncExecutionTemplateToDatabase(ctx, &spec); err != nil {
			return fmt.Errorf("failed to sync execution template %s: %w", spec.ID, err)
		}

		log.Printf("✅ Synced execution template: %s (%s)", spec.ID, spec.Name)

		return nil
	})

	if err != nil {
		return fmt.Errorf("failed to walk execution templates directory: %w", err)
	}

	return nil
}

// syncExecutionTemplateToDatabase syncs an execution template spec to the database
func (c *Client) syncExecutionTemplateToDatabase(ctx context.Context, spec *ExecutionTemplateSpec) error {
	// Check if template already exists
	var existingID string
	lookupErr := c.db.QueryRowContext(ctx,
		"SELECT id FROM execution_templates WHERE id = ? AND user_id = 'system'",
		spec.ID).Scan(&existingID)

	// Convert tags to JSON
	tagsJSON, err := json.Marshal(spec.Tags)
	if err != nil {
		return fmt.Errorf("failed to marshal tags: %w", err)
	}

	if lookupErr == sql.ErrNoRows {
		// Create new template - use raw SQL since we need custom logic
		_, err := c.db.ExecContext(ctx, `
			INSERT INTO execution_templates (
				id, user_id, name, description, template_prompt, context_template,
				enable_function_calling, is_active, is_public, category, tags,
				execution_timeout_seconds, rate_limit_per_hour, rate_limit_per_day,
				rate_limit_burst, total_executions, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
		`, spec.ID, "system", spec.Name, spec.Description, spec.TemplatePrompt,
			spec.ContextTemplate, spec.EnableFunctionCalling, spec.IsPublic, spec.IsPublic, spec.Category,
			tagsJSON, spec.Settings.ExecutionTimeoutSeconds, spec.Settings.RateLimitPerHour,
			spec.Settings.RateLimitPerDay, spec.Settings.RateLimitBurst, 0)

		if err != nil {
			return fmt.Errorf("failed to create execution template: %w", err)
		}

		log.Printf("➕ Created new execution template: %s", spec.ID)
	} else if lookupErr != nil {
		return fmt.Errorf("failed to check existing execution template: %w", lookupErr)
	} else {
		// Update existing template
		_, err := c.db.ExecContext(ctx, `
			UPDATE execution_templates SET 
				name = ?, description = ?, template_prompt = ?, context_template = ?,
				enable_function_calling = ?, is_active = ?, is_public = ?, category = ?, 
				tags = ?, execution_timeout_seconds = ?, rate_limit_per_hour = ?, 
				rate_limit_per_day = ?, rate_limit_burst = ?, updated_at = NOW()
			WHERE id = ? AND user_id = 'system'
		`, spec.Name, spec.Description, spec.TemplatePrompt, spec.ContextTemplate,
			spec.EnableFunctionCalling, spec.IsPublic, spec.IsPublic, spec.Category, tagsJSON,
			spec.Settings.ExecutionTimeoutSeconds, spec.Settings.RateLimitPerHour, spec.Settings.RateLimitPerDay,
			spec.Settings.RateLimitBurst, spec.ID)

		if err != nil {
			return fmt.Errorf("failed to update execution template: %w", err)
		}

		log.Printf("🔄 Updated existing execution template: %s", spec.ID)
	}

	// Sync function associations if provided
	if len(spec.FunctionIDs) > 0 {
		if err := c.syncTemplateFunction(ctx, spec.ID, spec.FunctionIDs); err != nil {
			log.Printf("⚠️ Failed to sync function associations for template %s: %v", spec.ID, err)
			// Don't fail the entire sync for function association errors
		}
	}

	return nil
}

// syncTemplateFunction associates functions with a template by resolving function names to IDs
func (c *Client) syncTemplateFunction(ctx context.Context, templateID string, functionIds []string) error {
	// First, remove existing associations for this template
	_, err := c.db.ExecContext(ctx,
		"DELETE FROM execution_template_functions WHERE template_id = ?", templateID)
	if err != nil {
		return fmt.Errorf("failed to clear existing function associations: %w", err)
	}

	// Add new associations
	for i, functionRef := range functionIds {
		// Resolve function reference to actual database ID
		actualFunctionID, err := c.resolveFunctionID(ctx, functionRef)
		if err != nil {
			log.Printf("⚠️ Failed to resolve function %s for template %s: %v", functionRef, templateID, err)
			continue // Skip this function but continue with others
		}

		associationID := fmt.Sprintf("etf-%s-%s-%d", templateID, actualFunctionID, time.Now().Unix())

		_, err = c.db.ExecContext(ctx, `
			INSERT INTO execution_template_functions 
			(id, template_id, function_id, is_required, execution_order, created_at, updated_at) 
			VALUES (?, ?, ?, ?, ?, NOW(), NOW())
		`, associationID, templateID, actualFunctionID, true, i)

		if err != nil {
			log.Printf("⚠️ Failed to associate function %s (resolved to %s) with template %s: %v", functionRef, actualFunctionID, templateID, err)
			// Continue with other associations
		} else {
			log.Printf("✅ Associated function %s (resolved to %s) with template %s", functionRef, actualFunctionID, templateID)
		}
	}

	return nil
}

// resolveFunctionID resolves a function name to the actual database function ID
func (c *Client) resolveFunctionID(ctx context.Context, functionName string) (string, error) {
	// Simply look up by function name - templates should use clean function names
	var functionID string
	err := c.db.QueryRowContext(ctx,
		"SELECT id FROM function_definitions WHERE name = ? AND user_id = 'system'",
		functionName).Scan(&functionID)

	if err == nil {
		return functionID, nil // Found by name
	}

	return "", fmt.Errorf("function not found: %s", functionName)
}
