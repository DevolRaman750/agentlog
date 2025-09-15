package templates

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"
	"time"

	"gogent/internal/types"
)

const (
	// String constants for repeated values
	textType        = "text"
	numberType      = "number"
	booleanType     = "boolean"
	apiPrefix       = "api"
	publicPrefix    = "public"
	nilValue        = "nil"
	completedStatus = "completed"
	failedStatus    = "failed"
	dayWindow       = "day"
	hourWindow      = "hour"
	burstWindow     = "burst"
	trueValue       = "true"
	templatesPath   = "templates"

	// SQL query constants
	functionAssociationQuery = `
		INSERT INTO execution_template_functions (
			id, template_id, function_id, is_required, execution_order, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`
)

// TemplateService handles all execution template operations
type TemplateService struct {
	db *sql.DB
}

// NewTemplateService creates a new template service
func NewTemplateService(db *sql.DB) *TemplateService {
	return &TemplateService{
		db: db,
	}
}

// =============================================================================
// TEMPLATE CRUD OPERATIONS
// =============================================================================

// CreateTemplate creates a new execution template with parameters
func (ts *TemplateService) CreateTemplate(template *types.ExecutionTemplate, parameters []types.ExecutionTemplateParameter, functionIds []string) (*types.ExecutionTemplate, error) {
	tx, err := ts.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if err := tx.Rollback(); err != nil {
			log.Printf("Failed to rollback transaction: %v", err)
		}
	}()

	// Generate template ID
	template.ID = generateTemplateID()
	template.CreatedAt = time.Now()
	template.UpdatedAt = time.Now()

	// Convert tags to JSON
	var tagsJSON interface{}
	if len(template.Tags) > 0 {
		tagsBytes, err := json.Marshal(template.Tags)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal tags: %w", err)
		}
		tagsJSON = string(tagsBytes)
	}

	// Insert template
	query := `
		INSERT INTO execution_templates (
			id, user_id, name, description, template_prompt, context_template,
			enable_function_calling, preferred_configuration_id, is_active, is_public, category, tags,
			execution_timeout_seconds, rate_limit_per_hour, rate_limit_per_day,
			rate_limit_burst, total_executions, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	// Handle nil/empty values
	var contextTemplate interface{}
	if template.ContextTemplate == "" {
		contextTemplate = nil
	} else {
		contextTemplate = template.ContextTemplate
	}

	var description interface{}
	if template.Description == "" {
		description = nil
	} else {
		description = template.Description
	}

	log.Printf("🔧 Creating template with values: ID=%s, UserID=%s, Name=%s, FunctionIDs=%v", template.ID, template.UserID, template.Name, functionIds)
	_, err = tx.Exec(query,
		template.ID, template.UserID, template.Name, description,
		template.TemplatePrompt, contextTemplate, template.EnableFunctionCalling,
		template.PreferredConfigurationID, template.IsActive, template.IsPublic, template.Category, tagsJSON,
		template.ExecutionTimeoutSeconds, template.RateLimitPerHour, template.RateLimitPerDay,
		template.RateLimitBurst, 0, template.CreatedAt, template.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert template: %w", err)
	}

	// Insert parameters
	for i, param := range parameters {
		param.ID = generateParameterID()
		param.TemplateID = template.ID
		param.DisplayOrder = i + 1
		param.CreatedAt = time.Now()
		param.UpdatedAt = time.Now()

		// Set default values for required fields if not provided
		if param.UIComponent == "" {
			param.UIComponent = textType // Default to text input
		}

		err = ts.insertTemplateParameter(tx, &param)
		if err != nil {
			return nil, fmt.Errorf("failed to insert parameter %s: %w", param.ParameterName, err)
		}
	}

	// Insert function associations
	for i, functionID := range functionIds {
		if functionID == "" {
			continue // Skip empty function IDs
		}

		associationID := generateFunctionAssociationID()
		functionQuery := functionAssociationQuery

		_, err = tx.Exec(functionQuery,
			associationID, template.ID, functionID, false, i+1, template.CreatedAt, template.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to insert function association %s: %w", functionID, err)
		}

		log.Printf("🔗 Associated function %s with template %s", functionID, template.ID)
	}

	// Create initial version record
	_, err = ts.createTemplateVersion(tx, template, parameters, "create", "Initial template creation")
	if err != nil {
		return nil, fmt.Errorf("failed to create initial version: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Load the complete template with parameters
	return ts.GetTemplateByID(template.ID, true, false)
}

// GetTemplateByID retrieves a template by ID with optional parameters and tokens
func (ts *TemplateService) GetTemplateByID(templateID string, includeParameters, includeTokens bool) (*types.ExecutionTemplate, error) {
	query := `
		SELECT id, user_id, name, description, template_prompt, context_template,
			   enable_function_calling, preferred_configuration_id, is_active, is_public, category, tags,
			   execution_timeout_seconds, rate_limit_per_hour, rate_limit_per_day,
			   rate_limit_burst, total_executions, last_executed_at, created_at, updated_at
		FROM execution_templates
		WHERE id = ?
	`

	var template types.ExecutionTemplate
	var tagsJSON sql.NullString
	var lastExecutedAt sql.NullTime
	var description sql.NullString
	var contextTemplate sql.NullString
	var preferredConfigurationID sql.NullString

	err := ts.db.QueryRow(query, templateID).Scan(
		&template.ID, &template.UserID, &template.Name, &description,
		&template.TemplatePrompt, &contextTemplate, &template.EnableFunctionCalling,
		&preferredConfigurationID, &template.IsActive, &template.IsPublic, &template.Category, &tagsJSON,
		&template.ExecutionTimeoutSeconds, &template.RateLimitPerHour, &template.RateLimitPerDay,
		&template.RateLimitBurst, &template.TotalExecutions, &lastExecutedAt,
		&template.CreatedAt, &template.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("template not found")
		}
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	// Handle nullable fields
	if description.Valid {
		template.Description = description.String
	}
	if contextTemplate.Valid {
		template.ContextTemplate = contextTemplate.String
	}
	if preferredConfigurationID.Valid {
		template.PreferredConfigurationID = &preferredConfigurationID.String
	}
	if lastExecutedAt.Valid {
		template.LastExecutedAt = &lastExecutedAt.Time
	}

	// Parse tags - handle both array and object formats
	if tagsJSON.Valid {
		// First try to parse as object (current format)
		var tagsObj map[string]interface{}
		if err := json.Unmarshal([]byte(tagsJSON.String), &tagsObj); err == nil {
			template.Tags = tagsObj
		} else {
			// If that fails, try to parse as array (legacy format)
			var tagsArray []string
			if err := json.Unmarshal([]byte(tagsJSON.String), &tagsArray); err == nil {
				// Convert array to object format
				tagsObj := make(map[string]interface{})
				for _, tag := range tagsArray {
					tagsObj[tag] = true
				}
				template.Tags = tagsObj
			} else {
				log.Printf("Warning: failed to parse template tags (neither object nor array): %v", err)
				template.Tags = make(map[string]interface{})
			}
		}
	}

	// Set last executed time
	if lastExecutedAt.Valid {
		template.LastExecutedAt = &lastExecutedAt.Time
	}

	// Load parameters if requested
	if includeParameters {
		parameters, err := ts.getTemplateParameters(templateID)
		if err != nil {
			return nil, fmt.Errorf("failed to load parameters: %w", err)
		}
		template.Parameters = parameters
	}

	// Load auth tokens if requested
	if includeTokens {
		tokens, err := ts.getTemplateAuthTokens(templateID, false)
		if err != nil {
			return nil, fmt.Errorf("failed to load auth tokens: %w", err)
		}
		template.AuthTokens = tokens
	}

	// Always load function associations
	functionIDs, err := ts.getTemplateFunctionIDs(templateID)
	if err != nil {
		return nil, fmt.Errorf("failed to load function associations: %w", err)
	}
	template.FunctionIDs = functionIDs

	return &template, nil
}

// ListTemplates retrieves templates with filtering and pagination
func (ts *TemplateService) ListTemplates(userID string, limit, offset int, category string, includePublic, includeInactive, includeTokens bool) ([]types.ExecutionTemplate, int, error) {
	// Always include user's own templates and system templates
	whereConditions := []string{"(user_id = ? OR user_id = 'system')"}
	args := []interface{}{userID}

	if includePublic {
		// Include other public templates as well (not system or user's own)
		whereConditions[0] = "(user_id = ? OR user_id = 'system' OR is_public = TRUE)"
	}

	if !includeInactive {
		whereConditions = append(whereConditions, "is_active = TRUE")
	}

	if category != "" {
		whereConditions = append(whereConditions, "category = ?")
		args = append(args, category)
	}

	whereClause := strings.Join(whereConditions, " AND ")

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM execution_templates WHERE %s", whereClause)
	var totalCount int
	err := ts.db.QueryRow(countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get template count: %w", err)
	}

	// Get templates with pagination
	query := fmt.Sprintf(`
		SELECT id, user_id, name, description, template_prompt, context_template,
			   enable_function_calling, preferred_configuration_id, is_active, is_public, category, tags,
			   execution_timeout_seconds, rate_limit_per_hour, rate_limit_per_day,
			   rate_limit_burst, total_executions, last_executed_at, created_at, updated_at
		FROM execution_templates
		WHERE %s
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	args = append(args, limit, offset)
	rows, err := ts.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query templates: %w", err)
	}
	defer rows.Close()

	var templates []types.ExecutionTemplate
	for rows.Next() {
		var template types.ExecutionTemplate
		var tagsJSON sql.NullString
		var lastExecutedAt sql.NullTime
		var description sql.NullString
		var contextTemplate sql.NullString
		var preferredConfigurationID sql.NullString

		err := rows.Scan(
			&template.ID, &template.UserID, &template.Name, &description,
			&template.TemplatePrompt, &contextTemplate, &template.EnableFunctionCalling,
			&preferredConfigurationID, &template.IsActive, &template.IsPublic, &template.Category, &tagsJSON,
			&template.ExecutionTimeoutSeconds, &template.RateLimitPerHour, &template.RateLimitPerDay,
			&template.RateLimitBurst, &template.TotalExecutions, &lastExecutedAt,
			&template.CreatedAt, &template.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan template: %w", err)
		}

		// Handle nullable fields
		if description.Valid {
			template.Description = description.String
		}
		if contextTemplate.Valid {
			template.ContextTemplate = contextTemplate.String
		}
		if preferredConfigurationID.Valid {
			template.PreferredConfigurationID = &preferredConfigurationID.String
		}

		// Parse tags - handle both array and object formats
		if tagsJSON.Valid {
			// First try to parse as object (current format)
			var tagsObj map[string]interface{}
			if err := json.Unmarshal([]byte(tagsJSON.String), &tagsObj); err == nil {
				template.Tags = tagsObj
			} else {
				// If that fails, try to parse as array (legacy format)
				var tagsArray []string
				if err := json.Unmarshal([]byte(tagsJSON.String), &tagsArray); err == nil {
					// Convert array to object format
					tagsObj := make(map[string]interface{})
					for _, tag := range tagsArray {
						tagsObj[tag] = true
					}
					template.Tags = tagsObj
				} else {
					log.Printf("Warning: failed to parse template tags (neither object nor array): %v", err)
					template.Tags = make(map[string]interface{})
				}
			}
		}

		// Set last executed time
		if lastExecutedAt.Valid {
			template.LastExecutedAt = &lastExecutedAt.Time
		}

		// Always load function associations for each template
		functionIDs, err := ts.getTemplateFunctionIDs(template.ID)
		if err != nil {
			log.Printf("Warning: failed to load function associations for template %s: %v", template.ID, err)
			// Don't fail the whole request, just set empty slice
			template.FunctionIDs = []string{}
		} else {
			template.FunctionIDs = functionIDs
		}

		// Load auth tokens if requested
		if includeTokens {
			tokens, err := ts.getTemplateAuthTokens(template.ID, false) // Only active tokens
			if err != nil {
				log.Printf("Warning: failed to load auth tokens for template %s: %v", template.ID, err)
				// Don't fail the whole request, just set empty slice
				template.AuthTokens = []types.ExecutionTemplateAuthToken{}
			} else {
				template.AuthTokens = tokens
			}
		}

		templates = append(templates, template)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("failed to iterate template rows: %w", err)
	}

	return templates, totalCount, nil
}

// UpdateTemplate updates an existing template and creates a new version
func (ts *TemplateService) UpdateTemplate(templateID string, template *types.ExecutionTemplate, parameters []types.ExecutionTemplateParameter, functionIds []string, changeSummary string) (*types.ExecutionTemplate, *types.ExecutionTemplateVersion, error) {
	tx, err := ts.db.Begin()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if err := tx.Rollback(); err != nil {
			log.Printf("Failed to rollback transaction: %v", err)
		}
	}()

	// Update template
	template.UpdatedAt = time.Now()

	// Convert tags to JSON
	var tagsJSON interface{}
	if len(template.Tags) > 0 {
		tagsBytes, err := json.Marshal(template.Tags)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to marshal tags: %w", err)
		}
		tagsJSON = string(tagsBytes)
	} else {
		tagsJSON = nil
	}

	// Handle nil/empty values
	var contextTemplate interface{}
	if template.ContextTemplate == "" {
		contextTemplate = nil
	} else {
		contextTemplate = template.ContextTemplate
	}

	var description interface{}
	if template.Description == "" {
		description = nil
	} else {
		description = template.Description
	}

	var preferredConfigurationID interface{}
	if template.PreferredConfigurationID != nil && *template.PreferredConfigurationID != "" {
		preferredConfigurationID = *template.PreferredConfigurationID
	} else {
		preferredConfigurationID = nil
	}

	// Update template record
	query := `
		UPDATE execution_templates SET
			name = ?, description = ?, template_prompt = ?, context_template = ?,
			enable_function_calling = ?, preferred_configuration_id = ?, is_active = ?, 
			is_public = ?, category = ?, tags = ?, execution_timeout_seconds = ?, 
			rate_limit_per_hour = ?, rate_limit_per_day = ?, rate_limit_burst = ?, updated_at = ?
		WHERE id = ?
	`

	result, err := tx.Exec(query,
		template.Name, description, template.TemplatePrompt, contextTemplate,
		template.EnableFunctionCalling, preferredConfigurationID, template.IsActive,
		template.IsPublic, template.Category, tagsJSON, template.ExecutionTimeoutSeconds,
		template.RateLimitPerHour, template.RateLimitPerDay, template.RateLimitBurst,
		template.UpdatedAt, template.ID,
	)

	if err == nil {
		_, err = result.RowsAffected()
		if err != nil {
			return nil, nil, fmt.Errorf("failed to get rows affected: %w", err)
		}
	}
	if err != nil {
		return nil, nil, fmt.Errorf("failed to update template: %w", err)
	}

	// Delete existing parameters
	_, err = tx.Exec("DELETE FROM execution_template_parameters WHERE template_id = ?", template.ID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to delete existing parameters: %w", err)
	}

	// Insert new parameters
	for i, param := range parameters {
		param.ID = generateParameterID()
		param.TemplateID = template.ID
		param.DisplayOrder = i + 1
		param.CreatedAt = time.Now()
		param.UpdatedAt = time.Now()

		if param.UIComponent == "" {
			param.UIComponent = textType
		}

		err = ts.insertTemplateParameter(tx, &param)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to insert parameter %s: %w", param.ParameterName, err)
		}
	}

	// Delete existing function associations
	_, err = tx.Exec("DELETE FROM execution_template_functions WHERE template_id = ?", template.ID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to delete existing function associations: %w", err)
	}

	// Insert new function associations
	log.Printf("🔥 SERVICE: UpdateTemplate processing %d functions for template %s", len(functionIds), template.ID)
	for i, functionID := range functionIds {
		if functionID == "" {
			log.Printf("🔥 SERVICE: Skipping empty function ID at index %d", i)
			continue
		}

		associationID := generateFunctionAssociationID()
		functionQuery := functionAssociationQuery

		_, err = tx.Exec(functionQuery,
			associationID, template.ID, functionID, false, i+1, template.UpdatedAt, template.UpdatedAt,
		)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to insert function association %s: %w", functionID, err)
		}

		log.Printf("🔗 Associated function %s with template %s", functionID, template.ID)
	}

	// Create new version record
	version, err := ts.createTemplateVersion(tx, template, parameters, "update", changeSummary)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create version: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Load the complete updated template
	updatedTemplate, err := ts.GetTemplateByID(template.ID, true, false)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to load updated template: %w", err)
	}

	return updatedTemplate, version, nil
}

// DeleteTemplate soft deletes a template by setting is_active to false
func (ts *TemplateService) DeleteTemplate(templateID string) error {
	query := "UPDATE execution_templates SET is_active = FALSE, updated_at = ? WHERE id = ?"
	_, err := ts.db.Exec(query, time.Now(), templateID)
	if err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}
	return nil
}

// =============================================================================
// PARAMETER VALIDATION AND TEMPLATE SUBSTITUTION
// =============================================================================

// ValidateParameters validates provided parameters against template parameter definitions
func (ts *TemplateService) ValidateParameters(templateID string, providedParams map[string]interface{}) ([]types.TemplateParameterValidationError, error) {
	parameters, err := ts.getTemplateParameters(templateID)
	if err != nil {
		return nil, fmt.Errorf("failed to get template parameters: %w", err)
	}

	var errors []types.TemplateParameterValidationError

	// Check each parameter definition
	for _, param := range parameters {
		value, provided := providedParams[param.ParameterName]

		// Check if required parameter is missing
		if param.IsRequired && !provided {
			errors = append(errors, types.TemplateParameterValidationError{
				ParameterName: param.ParameterName,
				ErrorType:     "required",
				ErrorMessage:  "This parameter is required",
			})
			continue
		}

		// Skip validation if parameter not provided and not required
		if !provided {
			continue
		}

		// Validate parameter based on type and rules
		paramErrors := ts.validateSingleParameter(&param, value)
		errors = append(errors, paramErrors...)
	}

	return errors, nil
}

// SubstituteTemplateParameters substitutes parameters in template prompt and context
func (ts *TemplateService) SubstituteTemplateParameters(template *types.ExecutionTemplate, providedParams map[string]interface{}) (string, string, error) {
	parameters, err := ts.getTemplateParameters(template.ID)
	if err != nil {
		return "", "", fmt.Errorf("failed to get template parameters: %w", err)
	}

	// Create final parameter map with defaults
	finalParams := make(map[string]interface{})

	// First, set default values
	for _, param := range parameters {
		if param.DefaultValue != "" {
			var defaultValue interface{}
			switch param.ParameterType {
			case numberType:
				if val, err := strconv.ParseFloat(param.DefaultValue, 64); err == nil {
					defaultValue = val
				}
			case booleanType:
				if val, err := strconv.ParseBool(param.DefaultValue); err == nil {
					defaultValue = val
				}
			case "array", "object":
				err := json.Unmarshal([]byte(param.DefaultValue), &defaultValue)
				if err != nil {
					defaultValue = param.DefaultValue // Fallback to string
				}
			default:
				defaultValue = param.DefaultValue
			}
			finalParams[param.ParameterName] = defaultValue
		}
	}

	// Override with provided values
	for key, value := range providedParams {
		finalParams[key] = value
	}

	// Substitute in template prompt
	resolvedPrompt := ts.substituteString(template.TemplatePrompt, finalParams)
	resolvedContext := ts.substituteString(template.ContextTemplate, finalParams)

	return resolvedPrompt, resolvedContext, nil
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

func (ts *TemplateService) insertTemplateParameter(tx *sql.Tx, param *types.ExecutionTemplateParameter) error {
	// Convert JSON fields
	var validationRulesJSON interface{}
	if len(param.ValidationRules) > 0 {
		bytes, err := json.Marshal(param.ValidationRules)
		if err != nil {
			return fmt.Errorf("failed to marshal validation rules: %w", err)
		}
		validationRulesJSON = string(bytes)
	}

	var allowedValuesJSON interface{}
	if len(param.AllowedValues) > 0 {
		bytes, err := json.Marshal(param.AllowedValues)
		if err != nil {
			return fmt.Errorf("failed to marshal allowed values: %w", err)
		}
		allowedValuesJSON = string(bytes)
	} else {
		allowedValuesJSON = nil // SQL NULL
	}

	query := `
		INSERT INTO execution_template_parameters (
			id, template_id, parameter_name, parameter_type, description, default_value,
			is_required, validation_rules, allowed_values, allow_sql_keywords,
			allow_special_chars, sanitize_html, display_order, ui_component,
			placeholder_text, help_text, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := tx.Exec(query,
		param.ID, param.TemplateID, param.ParameterName, param.ParameterType,
		param.Description, param.DefaultValue, param.IsRequired, validationRulesJSON,
		allowedValuesJSON, param.AllowSQLKeywords, param.AllowSpecialChars,
		param.SanitizeHTML, param.DisplayOrder, param.UIComponent,
		param.PlaceholderText, param.HelpText, param.CreatedAt, param.UpdatedAt,
	)

	return err
}

func (ts *TemplateService) getTemplateParameters(templateID string) ([]types.ExecutionTemplateParameter, error) {
	query := `
		SELECT id, template_id, parameter_name, parameter_type, description, default_value,
			   is_required, validation_rules, allowed_values, allow_sql_keywords,
			   allow_special_chars, sanitize_html, display_order, ui_component,
			   placeholder_text, help_text, created_at, updated_at
		FROM execution_template_parameters
		WHERE template_id = ?
		ORDER BY display_order, parameter_name
	`

	rows, err := ts.db.Query(query, templateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var parameters []types.ExecutionTemplateParameter
	for rows.Next() {
		var param types.ExecutionTemplateParameter
		var validationRulesJSON, allowedValuesJSON sql.NullString

		err := rows.Scan(
			&param.ID, &param.TemplateID, &param.ParameterName, &param.ParameterType,
			&param.Description, &param.DefaultValue, &param.IsRequired,
			&validationRulesJSON, &allowedValuesJSON, &param.AllowSQLKeywords,
			&param.AllowSpecialChars, &param.SanitizeHTML, &param.DisplayOrder,
			&param.UIComponent, &param.PlaceholderText, &param.HelpText,
			&param.CreatedAt, &param.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse JSON fields
		if validationRulesJSON.Valid {
			err = json.Unmarshal([]byte(validationRulesJSON.String), &param.ValidationRules)
			if err != nil {
				log.Printf("Warning: failed to parse validation rules: %v", err)
			}
		}

		if allowedValuesJSON.Valid {
			err = json.Unmarshal([]byte(allowedValuesJSON.String), &param.AllowedValues)
			if err != nil {
				log.Printf("Warning: failed to parse allowed values: %v", err)
			}
		}

		parameters = append(parameters, param)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate parameter rows: %w", err)
	}

	return parameters, nil
}

func (ts *TemplateService) validateSingleParameter(param *types.ExecutionTemplateParameter, value interface{}) []types.TemplateParameterValidationError {
	var errors []types.TemplateParameterValidationError
	valueStr := fmt.Sprintf("%v", value)

	// Type validation
	switch param.ParameterType {
	case "number":
		if _, err := strconv.ParseFloat(valueStr, 64); err != nil {
			errors = append(errors, types.TemplateParameterValidationError{
				ParameterName: param.ParameterName,
				ErrorType:     "type",
				ErrorMessage:  "Must be a valid number",
				ProvidedValue: valueStr,
			})
			return errors // Don't continue validation if type is wrong
		}
	case "boolean":
		if _, err := strconv.ParseBool(valueStr); err != nil {
			errors = append(errors, types.TemplateParameterValidationError{
				ParameterName: param.ParameterName,
				ErrorType:     "type",
				ErrorMessage:  "Must be true or false",
				ProvidedValue: valueStr,
			})
			return errors
		}
	}

	// Security validation
	if !param.AllowSQLKeywords {
		sqlKeywords := []string{"DROP", "DELETE", "UPDATE", "INSERT", "SELECT", "UNION", "CREATE", "ALTER", "EXEC", "EXECUTE"}
		upperValue := strings.ToUpper(valueStr)
		for _, keyword := range sqlKeywords {
			if strings.Contains(upperValue, keyword) {
				errors = append(errors, types.TemplateParameterValidationError{
					ParameterName: param.ParameterName,
					ErrorType:     "security",
					ErrorMessage:  fmt.Sprintf("Contains forbidden SQL keyword: %s", keyword),
					ProvidedValue: valueStr,
				})
			}
		}
	}

	// Validation rules
	if param.ValidationRules != nil {
		if minLength, ok := param.ValidationRules["min_length"].(float64); ok {
			if len(valueStr) < int(minLength) {
				errors = append(errors, types.TemplateParameterValidationError{
					ParameterName: param.ParameterName,
					ErrorType:     "min_length",
					ErrorMessage:  fmt.Sprintf("Must be at least %d characters", int(minLength)),
					ProvidedValue: valueStr,
				})
			}
		}

		if maxLength, ok := param.ValidationRules["max_length"].(float64); ok {
			if len(valueStr) > int(maxLength) {
				errors = append(errors, types.TemplateParameterValidationError{
					ParameterName: param.ParameterName,
					ErrorType:     "max_length",
					ErrorMessage:  fmt.Sprintf("Must be no more than %d characters", int(maxLength)),
					ProvidedValue: valueStr,
				})
			}
		}

		if pattern, ok := param.ValidationRules["pattern"].(string); ok {
			if matched, err := regexp.MatchString(pattern, valueStr); err == nil && !matched {
				errors = append(errors, types.TemplateParameterValidationError{
					ParameterName: param.ParameterName,
					ErrorType:     "pattern",
					ErrorMessage:  "Does not match required pattern",
					ProvidedValue: valueStr,
				})
			}
		}
	}

	return errors
}

func (ts *TemplateService) substituteString(template string, params map[string]interface{}) string {
	result := template
	for key, value := range params {
		placeholder := fmt.Sprintf("{{%s}}", key)
		replacement := fmt.Sprintf("%v", value)
		result = strings.ReplaceAll(result, placeholder, replacement)
	}
	return result
}

func (ts *TemplateService) createTemplateVersion(tx *sql.Tx, template *types.ExecutionTemplate, parameters []types.ExecutionTemplateParameter, changeType, changeSummary string) (*types.ExecutionTemplateVersion, error) {
	// Get next version number
	var versionNumber int
	err := tx.QueryRow("SELECT COALESCE(MAX(version_number), 0) + 1 FROM execution_template_versions WHERE template_id = ?", template.ID).Scan(&versionNumber)
	if err != nil {
		return nil, err
	}

	// Mark all previous versions as not current
	_, err = tx.Exec("UPDATE execution_template_versions SET is_current_version = FALSE WHERE template_id = ?", template.ID)
	if err != nil {
		return nil, err
	}

	// Create version record
	versionID := generateVersionID()
	var tagsJSON interface{}
	if len(template.Tags) > 0 {
		tagsBytes, err := json.Marshal(template.Tags)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal tags: %w", err)
		}
		tagsJSON = string(tagsBytes)
	} else {
		tagsJSON = nil // SQL NULL
	}

	query := `
		INSERT INTO execution_template_versions (
			id, template_id, version_number, user_id, name, description,
			template_prompt, context_template, enable_function_calling,
			category, tags, rate_limit_per_hour, rate_limit_per_day,
			rate_limit_burst, change_summary, change_type, is_current_version, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = tx.Exec(query,
		versionID, template.ID, versionNumber, template.UserID, template.Name,
		template.Description, template.TemplatePrompt, template.ContextTemplate,
		template.EnableFunctionCalling, template.Category, tagsJSON,
		template.RateLimitPerHour, template.RateLimitPerDay, template.RateLimitBurst,
		changeSummary, changeType, true, time.Now(),
	)
	if err != nil {
		return nil, err
	}

	// Insert parameter versions
	for _, param := range parameters {
		err = ts.insertParameterVersion(tx, versionID, &param)
		if err != nil {
			return nil, err
		}
	}

	// Return the version
	version := &types.ExecutionTemplateVersion{
		ID:                    versionID,
		TemplateID:            template.ID,
		VersionNumber:         versionNumber,
		UserID:                template.UserID,
		Name:                  template.Name,
		Description:           template.Description,
		TemplatePrompt:        template.TemplatePrompt,
		ContextTemplate:       template.ContextTemplate,
		EnableFunctionCalling: template.EnableFunctionCalling,
		Category:              template.Category,
		Tags:                  template.Tags,
		RateLimitPerHour:      template.RateLimitPerHour,
		RateLimitPerDay:       template.RateLimitPerDay,
		RateLimitBurst:        template.RateLimitBurst,
		ChangeSummary:         changeSummary,
		ChangeType:            changeType,
		IsCurrentVersion:      true,
		CreatedAt:             time.Now(),
		Parameters:            parameters,
	}

	return version, nil
}

func (ts *TemplateService) insertParameterVersion(tx *sql.Tx, versionID string, param *types.ExecutionTemplateParameter) error {
	// Set default values for required fields if not provided
	if param.UIComponent == "" {
		param.UIComponent = textType // Default to text input
	}

	var validationRulesJSON interface{}
	if len(param.ValidationRules) > 0 {
		bytes, err := json.Marshal(param.ValidationRules)
		if err != nil {
			return fmt.Errorf("failed to marshal validation rules: %w", err)
		}
		validationRulesJSON = string(bytes)
	} else {
		validationRulesJSON = nil // SQL NULL
	}

	var allowedValuesJSON interface{}
	if len(param.AllowedValues) > 0 {
		bytes, err := json.Marshal(param.AllowedValues)
		if err != nil {
			return fmt.Errorf("failed to marshal allowed values: %w", err)
		}
		allowedValuesJSON = string(bytes)
	} else {
		allowedValuesJSON = nil // SQL NULL
	}

	query := `
		INSERT INTO execution_template_parameter_versions (
			id, template_version_id, parameter_name, parameter_type, description,
			default_value, is_required, validation_rules, allowed_values,
			allow_sql_keywords, allow_special_chars, sanitize_html, display_order,
			ui_component, placeholder_text, help_text
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := tx.Exec(query,
		generateParameterVersionID(), versionID, param.ParameterName, param.ParameterType,
		param.Description, param.DefaultValue, param.IsRequired, validationRulesJSON,
		allowedValuesJSON, param.AllowSQLKeywords, param.AllowSpecialChars,
		param.SanitizeHTML, param.DisplayOrder, param.UIComponent,
		param.PlaceholderText, param.HelpText,
	)

	return err
}

func (ts *TemplateService) getTemplateAuthTokens(templateID string, includeInactive bool) ([]types.ExecutionTemplateAuthToken, error) {
	whereClause := "template_id = ?"
	args := []interface{}{templateID}

	if !includeInactive {
		whereClause += " AND is_active = TRUE"
	}

	query := fmt.Sprintf(`
		SELECT id, template_id, user_id, token_value, token_name, description,
			   is_active, expires_at, custom_rate_limit_per_hour, custom_rate_limit_per_day,
			   custom_rate_limit_burst, total_uses, last_used_at, last_used_ip,
			   allowed_origins, allowed_ips, created_at, updated_at
		FROM execution_template_auth_tokens
		WHERE %s
		ORDER BY created_at DESC
	`, whereClause)

	rows, err := ts.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tokens []types.ExecutionTemplateAuthToken
	for rows.Next() {
		var token types.ExecutionTemplateAuthToken
		var expiresAt, lastUsedAt sql.NullTime
		var customRateLimitPerHour, customRateLimitPerDay, customRateLimitBurst sql.NullInt64
		var allowedOriginsJSON, allowedIPsJSON sql.NullString

		err := rows.Scan(
			&token.ID, &token.TemplateID, &token.UserID, &token.TokenValue,
			&token.TokenName, &token.Description, &token.IsActive, &expiresAt,
			&customRateLimitPerHour, &customRateLimitPerDay, &customRateLimitBurst,
			&token.TotalUses, &lastUsedAt, &token.LastUsedIP,
			&allowedOriginsJSON, &allowedIPsJSON, &token.CreatedAt, &token.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Handle nullable fields
		if expiresAt.Valid {
			token.ExpiresAt = &expiresAt.Time
		}
		if lastUsedAt.Valid {
			token.LastUsedAt = &lastUsedAt.Time
		}
		if customRateLimitPerHour.Valid {
			val := int(customRateLimitPerHour.Int64)
			token.CustomRateLimitPerHour = &val
		}
		if customRateLimitPerDay.Valid {
			val := int(customRateLimitPerDay.Int64)
			token.CustomRateLimitPerDay = &val
		}
		if customRateLimitBurst.Valid {
			val := int(customRateLimitBurst.Int64)
			token.CustomRateLimitBurst = &val
		}

		// Parse JSON fields
		if allowedOriginsJSON.Valid {
			err = json.Unmarshal([]byte(allowedOriginsJSON.String), &token.AllowedOrigins)
			if err != nil {
				log.Printf("Warning: failed to parse allowed origins: %v", err)
			}
		}
		if allowedIPsJSON.Valid {
			err = json.Unmarshal([]byte(allowedIPsJSON.String), &token.AllowedIPs)
			if err != nil {
				log.Printf("Warning: failed to parse allowed IPs: %v", err)
			}
		}

		tokens = append(tokens, token)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate token rows: %w", err)
	}

	return tokens, nil
}

func (ts *TemplateService) getTemplateFunctionIDs(templateID string) ([]string, error) {
	query := `
		SELECT function_id
		FROM execution_template_functions
		WHERE template_id = ?
		ORDER BY execution_order ASC
	`

	rows, err := ts.db.Query(query, templateID)
	if err != nil {
		return nil, fmt.Errorf("failed to query function associations: %w", err)
	}
	defer rows.Close()

	var functionIDs []string
	for rows.Next() {
		var functionID string
		if err := rows.Scan(&functionID); err != nil {
			return nil, fmt.Errorf("failed to scan function ID: %w", err)
		}
		functionIDs = append(functionIDs, functionID)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate function associations: %w", err)
	}

	return functionIDs, nil
}

// ID generation functions
func generateTemplateID() string {
	return "tmpl-" + generateRandomString(16)
}

func generateParameterID() string {
	return "param-" + generateRandomString(12)
}

func generateVersionID() string {
	return "tver-" + generateRandomString(12)
}

func generateParameterVersionID() string {
	return "pver-" + generateRandomString(12)
}

func generateFunctionAssociationID() string {
	return "tfunc-" + generateRandomString(12)
}

// Auth token methods are now implemented in tokens.go to avoid duplication
