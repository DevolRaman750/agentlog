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
	Name        string `json:"name"`
	Provider    string `json:"provider"`
	DisplayName string `json:"display_name"`
	Description string `json:"description"`
	Endpoint    struct {
		Path   string `json:"path"`
		Method string `json:"method"`
	} `json:"endpoint"`
	Parameters struct {
		Required []string               `json:"required"`
		Optional []string               `json:"optional"`
		Schema   map[string]interface{} `json:"schema"`
	} `json:"parameters"`
	ParameterDependencies map[string]interface{}   `json:"parameter_dependencies,omitempty"`
	ResponseTransformer   map[string]interface{}   `json:"response_transformer,omitempty"`
	ProvidesTo            []map[string]interface{} `json:"provides_to_functions,omitempty"`
	Examples              []map[string]interface{} `json:"examples,omitempty"`
}

// SyncSystemSpecs synchronizes providers and functions from JSON files to database
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
	err := filepath.WalkDir(providersDir, func(path string, d fs.DirEntry, err error) error {
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
	err := filepath.WalkDir(functionsDir, func(path string, d fs.DirEntry, err error) error {
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
	existingFunc, err := c.queries.GetFunctionDefinitionByName(ctx, db.GetFunctionDefinitionByNameParams{
		UserID: "system",
		Name:   spec.Name,
	})

	// Build endpoint URL
	endpointURL := ""
	if spec.Provider == "github" {
		endpointURL = "https://api.github.com" + spec.Endpoint.Path
	} else if spec.Provider == "slack" {
		endpointURL = "https://slack.com/api" + spec.Endpoint.Path
	}

	// Marshal parameters schema
	parametersSchema, err := json.Marshal(spec.Parameters.Schema)
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

	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check existing function: %w", err)
	}

	if err == sql.ErrNoRows {
		// Create new function
		params := db.CreateFunctionDefinitionParams{
			UserID:           "system",
			Name:             spec.Name,
			FunctionGroup:    spec.Provider,
			Description:      sql.NullString{String: spec.Description, Valid: true},
			ParametersSchema: parametersSchema,
			EndpointUrl:      sql.NullString{String: endpointURL, Valid: endpointURL != ""},
			HttpMethod:       sql.NullString{String: spec.Endpoint.Method, Valid: spec.Endpoint.Method != ""},
			MockResponse:     mockResponse,
		}

		if err := c.queries.CreateFunctionDefinition(ctx, params); err != nil {
			return fmt.Errorf("failed to create function definition: %w", err)
		}

		log.Printf("➕ Created new function: %s", spec.Name)
	} else {
		// Update existing function
		params := db.UpdateFunctionDefinitionParams{
			ID:               existingFunc.ID,
			Description:      sql.NullString{String: spec.Description, Valid: true},
			ParametersSchema: parametersSchema,
			EndpointUrl:      sql.NullString{String: endpointURL, Valid: endpointURL != ""},
			HttpMethod:       sql.NullString{String: spec.Endpoint.Method, Valid: spec.Endpoint.Method != ""},
			MockResponse:     mockResponse,
		}

		if err := c.queries.UpdateFunctionDefinition(ctx, params); err != nil {
			return fmt.Errorf("failed to update function definition: %w", err)
		}

		log.Printf("🔄 Updated existing function: %s", spec.Name)
	}

	return nil
}
