package apikeys

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"gogent/internal/types"

	"github.com/google/uuid"
	"golang.org/x/crypto/argon2"
)

// Service handles API key management operations
type Service struct {
	db                   *sql.DB
	encryptionKey        []byte
	encryptionKeyVersion int
}

// NewService creates a new API key service
func NewService(db *sql.DB) (*Service, error) {
	// Get or generate encryption key
	encryptionKey, err := getOrGenerateEncryptionKey()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize encryption: %w", err)
	}

	return &Service{
		db:                   db,
		encryptionKey:        encryptionKey,
		encryptionKeyVersion: 1,
	}, nil
}

// getOrGenerateEncryptionKey gets the encryption key from environment or generates a new one
func getOrGenerateEncryptionKey() ([]byte, error) {
	// Try to get from environment first
	if keyB64 := os.Getenv("API_KEY_ENCRYPTION_KEY"); keyB64 != "" {
		key, err := base64.StdEncoding.DecodeString(keyB64)
		if err != nil {
			return nil, fmt.Errorf("invalid encryption key in environment: %w", err)
		}
		if len(key) == 32 {
			log.Printf("🔐 Using API key encryption key from environment")
			return key, nil
		}
	}

	// Generate a new key using a deterministic method based on system properties
	// In production, you should store this key securely (e.g., in a key management service)
	salt := []byte("gogent-api-key-salt-v1") // Static salt for consistency
	password := []byte("gogent-default-encryption-password-change-in-production")

	// Use Argon2 to derive a 32-byte key
	key := argon2.IDKey(password, salt, 1, 64*1024, 4, 32)

	log.Printf("🔐 Generated deterministic API key encryption key")
	log.Printf("⚠️  WARNING: Using default encryption key. Set API_KEY_ENCRYPTION_KEY environment variable for production")

	return key, nil
}

// encryptAPIKey encrypts an API key value
func (s *Service) encryptAPIKey(plaintext string) (string, error) {
	if plaintext == "" {
		return "", fmt.Errorf("cannot encrypt empty API key")
	}

	// Create AES cipher
	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	// Use GCM mode for authenticated encryption
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	// Generate random nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Encrypt the plaintext
	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)

	// Encode to base64 for storage
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// decryptAPIKey decrypts an API key value
func (s *Service) decryptAPIKey(ciphertext string) (string, error) {
	if ciphertext == "" || ciphertext == "TEMPLATE_ENCRYPTED_VALUE" {
		return "", fmt.Errorf("cannot decrypt empty or template API key")
	}

	// Decode from base64
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("failed to decode ciphertext: %w", err)
	}

	// Create AES cipher
	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	// Use GCM mode for authenticated decryption
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	// Extract nonce and ciphertext
	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext_bytes := data[:nonceSize], data[nonceSize:]

	// Decrypt
	plaintext, err := gcm.Open(nil, nonce, ciphertext_bytes, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt: %w", err)
	}

	return string(plaintext), nil
}

// CreateAPIKey creates a new API key for a user
func (s *Service) CreateAPIKey(ctx context.Context, userID string, req *types.CreateAPIKeyRequest) (*types.UserAPIKey, error) {
	// Validate input
	if err := s.validateCreateRequest(req); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Check if key name already exists for this user
	exists, err := s.keyNameExists(ctx, userID, req.KeyName)
	if err != nil {
		return nil, fmt.Errorf("failed to check key name uniqueness: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("key name '%s' already exists", req.KeyName)
	}

	// If this is being set as default, unset any existing default for this service
	if req.IsDefault {
		if err := s.unsetDefaultKey(ctx, userID, req.ServiceName); err != nil {
			return nil, fmt.Errorf("failed to unset existing default key: %w", err)
		}
	}

	// Encrypt the API key
	encryptedValue, err := s.encryptAPIKey(req.KeyValue)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt API key: %w", err)
	}

	// Prepare JSON fields
	scopesJSON, err := json.Marshal(req.Scopes)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal scopes: %w", err)
	}

	permissionsJSON, err := json.Marshal(req.Permissions)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal permissions: %w", err)
	}

	serviceConfigJSON, err := json.Marshal(req.ServiceConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal service config: %w", err)
	}

	authConfigJSON, err := json.Marshal(req.AuthConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal auth config: %w", err)
	}

	// Set default auth mode if not provided
	authMode := req.AuthMode
	if authMode == "" {
		// Set default auth mode based on service and key type
		switch req.ServiceName {
		case "github":
			if req.KeyType == "github_app_credentials" {
				authMode = "github_app"
			} else {
				authMode = "personal_access_token"
			}
		case "slack":
			authMode = "bot_token"
		case "gemini":
			authMode = "api_key"
		default:
			authMode = "api_key"
		}
	}

	// Create the record
	apiKey := &types.UserAPIKey{
		ID:                   uuid.New().String(),
		UserID:               userID,
		KeyName:              req.KeyName,
		ServiceName:          req.ServiceName,
		KeyType:              req.KeyType,
		AuthMode:             authMode,
		AuthConfig:           req.AuthConfig,
		EncryptedKeyValue:    encryptedValue,
		EncryptionAlgorithm:  "AES-256-GCM",
		EncryptionKeyVersion: s.encryptionKeyVersion,
		DisplayName:          req.DisplayName,
		Description:          req.Description,
		AccessLevel:          req.AccessLevel,
		Scopes:               req.Scopes,
		Permissions:          req.Permissions,
		ExpiresAt:            req.ExpiresAt,
		ValidationStatus:     "untested",
		IsActive:             true,
		IsDefault:            req.IsDefault,
		TotalUses:            0,
		ServiceConfig:        req.ServiceConfig,
		Environment:          req.Environment,
		RateLimitPerHour:     req.RateLimitPerHour,
		RateLimitPerDay:      req.RateLimitPerDay,
		RateLimitBurst:       req.RateLimitBurst,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
		CreatedBy:            userID,
	}

	// Insert into database
	query := `
		INSERT INTO user_api_keys (
			id, user_id, key_name, service_name, key_type, auth_mode, auth_config,
			encrypted_key_value, encryption_algorithm, encryption_key_version,
			display_name, description, access_level, scopes, permissions,
			expires_at, validation_status, is_active, is_default,
			total_uses, service_config, environment,
			rate_limit_per_hour, rate_limit_per_day, rate_limit_burst,
			created_at, updated_at, created_by
		) VALUES (
			?, ?, ?, ?, ?, ?, ?,
			?, ?, ?,
			?, ?, ?, ?, ?,
			?, ?, ?, ?,
			?, ?, ?,
			?, ?, ?,
			?, ?, ?
		)
	`

	_, err = s.db.ExecContext(ctx, query,
		apiKey.ID, apiKey.UserID, apiKey.KeyName, apiKey.ServiceName, apiKey.KeyType, apiKey.AuthMode, authConfigJSON,
		apiKey.EncryptedKeyValue, apiKey.EncryptionAlgorithm, apiKey.EncryptionKeyVersion,
		apiKey.DisplayName, apiKey.Description, apiKey.AccessLevel, scopesJSON, permissionsJSON,
		apiKey.ExpiresAt, apiKey.ValidationStatus, apiKey.IsActive, apiKey.IsDefault,
		apiKey.TotalUses, serviceConfigJSON, apiKey.Environment,
		apiKey.RateLimitPerHour, apiKey.RateLimitPerDay, apiKey.RateLimitBurst,
		apiKey.CreatedAt, apiKey.UpdatedAt, apiKey.CreatedBy,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert API key: %w", err)
	}

	log.Printf("✅ Created new API key for user %s: %s (%s)", userID, apiKey.KeyName, apiKey.ServiceName)
	return apiKey, nil
}

// GetAPIKeys retrieves all API keys for a user
func (s *Service) GetAPIKeys(ctx context.Context, userID string) ([]*types.UserAPIKey, error) {
	query := `
		SELECT 
			id, user_id, key_name, service_name, key_type, auth_mode, auth_config,
			encryption_algorithm, encryption_key_version,
			display_name, description, access_level, scopes, permissions,
			expires_at, last_validated_at, validation_status, validation_error,
			is_active, is_default, total_uses, last_used_at,
			service_config, environment,
			rate_limit_per_hour, rate_limit_per_day, rate_limit_burst,
			created_at, updated_at, created_by
		FROM user_api_keys 
		WHERE user_id = ? AND is_active = TRUE
		ORDER BY service_name, is_default DESC, created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query API keys: %w", err)
	}
	defer rows.Close()

	var apiKeys []*types.UserAPIKey
	for rows.Next() {
		apiKey, err := s.scanAPIKeyRow(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan API key row: %w", err)
		}
		apiKeys = append(apiKeys, apiKey)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating API key rows: %w", err)
	}

	return apiKeys, nil
}

// GetAPIKeyByID retrieves a specific API key by ID
func (s *Service) GetAPIKeyByID(ctx context.Context, userID, keyID string) (*types.UserAPIKey, error) {
	query := `
		SELECT 
			id, user_id, key_name, service_name, key_type, auth_mode, auth_config,
			encryption_algorithm, encryption_key_version,
			display_name, description, access_level, scopes, permissions,
			expires_at, last_validated_at, validation_status, validation_error,
			is_active, is_default, total_uses, last_used_at,
			service_config, environment,
			rate_limit_per_hour, rate_limit_per_day, rate_limit_burst,
			created_at, updated_at, created_by
		FROM user_api_keys 
		WHERE id = ? AND user_id = ?
	`

	row := s.db.QueryRowContext(ctx, query, keyID, userID)
	apiKey, err := s.scanAPIKeyRow(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("API key not found")
		}
		return nil, fmt.Errorf("failed to get API key: %w", err)
	}

	return apiKey, nil
}

// GetDecryptedAPIKey retrieves and decrypts an API key value
func (s *Service) GetDecryptedAPIKey(ctx context.Context, userID, keyID string) (string, error) {
	query := `
		SELECT encrypted_key_value 
		FROM user_api_keys 
		WHERE id = ? AND user_id = ? AND is_active = TRUE
	`

	var encryptedValue string
	err := s.db.QueryRowContext(ctx, query, keyID, userID).Scan(&encryptedValue)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("API key not found")
		}
		return "", fmt.Errorf("failed to get encrypted API key: %w", err)
	}

	// Decrypt the value
	decryptedValue, err := s.decryptAPIKey(encryptedValue)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt API key: %w", err)
	}

	return decryptedValue, nil
}

// GetAPIKeysByService retrieves API keys for a specific service
func (s *Service) GetAPIKeysByService(ctx context.Context, userID, serviceName string) ([]*types.UserAPIKey, error) {
	query := `
		SELECT 
			id, user_id, key_name, service_name, key_type, auth_mode, auth_config,
			encryption_algorithm, encryption_key_version,
			display_name, description, access_level, scopes, permissions,
			expires_at, last_validated_at, validation_status, validation_error,
			is_active, is_default, total_uses, last_used_at,
			service_config, environment,
			rate_limit_per_hour, rate_limit_per_day, rate_limit_burst,
			created_at, updated_at, created_by
		FROM user_api_keys 
		WHERE user_id = ? AND service_name = ? AND is_active = TRUE
		ORDER BY is_default DESC, created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query, userID, serviceName)
	if err != nil {
		return nil, fmt.Errorf("failed to query API keys by service: %w", err)
	}
	defer rows.Close()

	var apiKeys []*types.UserAPIKey
	for rows.Next() {
		apiKey, err := s.scanAPIKeyRow(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan API key row: %w", err)
		}
		apiKeys = append(apiKeys, apiKey)
	}

	return apiKeys, nil
}

func (s *Service) GetFunctionAPIKeyRequirements(ctx context.Context, userID, functionID string) (*types.FunctionAPIKeyRequirements, error) {
	// Step 1: Get function definition
	queryFunc := `
		SELECT 
			id, name, display_name, function_group, required_api_keys
		FROM function_definitions 
		WHERE id = ?
	`
	var funcDef struct {
		ID              string
		Name            string
		DisplayName     string
		FunctionGroup   string
		RequiredAPIKeys sql.NullString
	}
	err := s.db.QueryRowContext(ctx, queryFunc, functionID).Scan(
		&funcDef.ID, &funcDef.Name, &funcDef.DisplayName, &funcDef.FunctionGroup, &funcDef.RequiredAPIKeys,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("function not found")
		}
		return nil, fmt.Errorf("failed to get function definition: %w", err)
	}

	var requiredServices []string
	if funcDef.RequiredAPIKeys.Valid && funcDef.RequiredAPIKeys.String != "" {
		if err := json.Unmarshal([]byte(funcDef.RequiredAPIKeys.String), &requiredServices); err != nil {
			log.Printf("⚠️ Could not unmarshal required_api_keys for function %s: %v", functionID, err)
			requiredServices = []string{}
		}
	}

	// Step 2: Get all active API keys for the user
	userKeys, err := s.GetAPIKeys(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user API keys: %w", err)
	}

	// Step 3: Build the requirements response
	requirements := &types.FunctionAPIKeyRequirements{
		FunctionID:          funcDef.ID,
		FunctionName:        funcDef.Name,
		DisplayName:         funcDef.DisplayName,
		FunctionGroup:       funcDef.FunctionGroup,
		RequiredServices:    requiredServices,
		ConfiguredServices:  []string{},
		MissingServices:     []string{},
		ServiceRequirements: make(map[string]types.ServiceRequirement),
	}

	configuredServicesMap := make(map[string]bool)
	for _, key := range userKeys {
		if key.ValidationStatus == "valid" {
			configuredServicesMap[key.ServiceName] = true
		}
	}

	for _, serviceName := range requiredServices {
		if configuredServicesMap[serviceName] {
			requirements.ConfiguredServices = append(requirements.ConfiguredServices, serviceName)
		} else {
			requirements.MissingServices = append(requirements.MissingServices, serviceName)
		}

		// For now, set a default requirement. This can be expanded later.
		requirements.ServiceRequirements[serviceName] = types.ServiceRequirement{
			ServiceName:        serviceName,
			Required:           true,
			MinimumAccessLevel: "read", // Default, can be customized later
			IsConfigured:       configuredServicesMap[serviceName],
		}
	}

	requirements.AllKeysConfigured = len(requirements.MissingServices) == 0

	return requirements, nil
}

// Helper methods

func (s *Service) validateCreateRequest(req *types.CreateAPIKeyRequest) error {
	if req.KeyName == "" {
		return fmt.Errorf("key name is required")
	}
	if req.ServiceName == "" {
		return fmt.Errorf("service name is required")
	}
	if req.KeyValue == "" {
		return fmt.Errorf("key value is required")
	}
	if req.DisplayName == "" {
		return fmt.Errorf("display name is required")
	}
	if req.AccessLevel == "" {
		req.AccessLevel = "read_write"
	}
	if req.Environment == "" {
		req.Environment = "production"
	}
	if req.KeyType == "" {
		req.KeyType = "api_key"
	}

	// Validate access level
	validAccessLevels := map[string]bool{
		"read": true, "write": true, "admin": true, "read_write": true,
	}
	if !validAccessLevels[req.AccessLevel] {
		return fmt.Errorf("invalid access level: %s", req.AccessLevel)
	}

	// Validate key type
	validKeyTypes := map[string]bool{
		"api_key": true, "access_token": true, "bearer_token": true,
		"oauth_token": true, "webhook_url": true, "connection_string": true,
		"github_app_credentials": true,
	}
	if !validKeyTypes[req.KeyType] {
		return fmt.Errorf("invalid key type: %s", req.KeyType)
	}

	return nil
}

func (s *Service) keyNameExists(ctx context.Context, userID, keyName string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM user_api_keys WHERE user_id = ? AND key_name = ?`
	err := s.db.QueryRowContext(ctx, query, userID, keyName).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *Service) unsetDefaultKey(ctx context.Context, userID, serviceName string) error {
	query := `UPDATE user_api_keys SET is_default = FALSE WHERE user_id = ? AND service_name = ? AND is_default = TRUE`
	_, err := s.db.ExecContext(ctx, query, userID, serviceName)
	return err
}

// unsetDefaultKeyTx does the same as unsetDefaultKey but within a transaction
func (s *Service) unsetDefaultKeyTx(ctx context.Context, tx *sql.Tx, userID, serviceName string) error {
	query := `UPDATE user_api_keys SET is_default = FALSE WHERE user_id = ? AND service_name = ? AND is_default = TRUE`
	_, err := tx.ExecContext(ctx, query, userID, serviceName)
	return err
}

func (s *Service) UpdateAPIKey(ctx context.Context, userID, keyID string, req *types.UpdateAPIKeyRequest) (*types.UserAPIKey, error) {
	log.Printf("🔑 Updating API key %s for user %s", keyID, userID)

	// Start transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Check if the API key exists and belongs to the user
	query := `
		SELECT 
			id, user_id, key_name, service_name, key_type, auth_mode, auth_config,
			encryption_algorithm, encryption_key_version,
			display_name, description, access_level, scopes, permissions,
			expires_at, last_validated_at, validation_status, validation_error,
			is_active, is_default, total_uses, last_used_at,
			service_config, environment,
			rate_limit_per_hour, rate_limit_per_day, rate_limit_burst,
			created_at, updated_at, created_by
		FROM user_api_keys 
		WHERE id = ? AND user_id = ?`

	row := tx.QueryRowContext(ctx, query, keyID, userID)
	existingKey, err := s.scanAPIKeyRow(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("API key not found")
		}
		return nil, fmt.Errorf("failed to get existing API key: %w", err)
	}

	// Build update query based on provided fields
	updateFields := []string{}
	args := []interface{}{}

	// Update key value if provided
	if req.KeyValue != nil && *req.KeyValue != "" {
		encrypted, err := s.encryptAPIKey(*req.KeyValue)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt API key: %w", err)
		}
		updateFields = append(updateFields, "encrypted_key_value = ?")
		args = append(args, encrypted)

		// Reset validation status when key changes
		updateFields = append(updateFields, "validation_status = ?", "validation_error = ?")
		args = append(args, "untested", "")
	}

	// Update display name if provided
	if req.DisplayName != nil && *req.DisplayName != "" {
		updateFields = append(updateFields, "display_name = ?")
		args = append(args, *req.DisplayName)
	}

	// Update active status if provided
	if req.IsActive != nil {
		updateFields = append(updateFields, "is_active = ?")
		args = append(args, *req.IsActive)
	}

	// Update default status if provided
	if req.IsDefault != nil && *req.IsDefault {
		// Unset other default keys for this service first
		if err := s.unsetDefaultKeyTx(ctx, tx, userID, existingKey.ServiceName); err != nil {
			return nil, fmt.Errorf("failed to unset other default keys: %w", err)
		}
		updateFields = append(updateFields, "is_default = ?")
		args = append(args, true)
	} else if req.IsDefault != nil && !*req.IsDefault {
		updateFields = append(updateFields, "is_default = ?")
		args = append(args, false)
	}

	// Always update the updated_at timestamp
	updateFields = append(updateFields, "updated_at = NOW()")

	if len(updateFields) == 1 { // Only updated_at was added
		return nil, fmt.Errorf("no fields provided to update")
	}

	// Add WHERE clause parameters
	args = append(args, keyID, userID)

	updateQuery := fmt.Sprintf(
		`UPDATE user_api_keys SET %s WHERE id = ? AND user_id = ?`,
		strings.Join(updateFields, ", "),
	)

	log.Printf("🔑 Executing update query with %d fields", len(updateFields)-1) // -1 for updated_at

	_, err = tx.ExecContext(ctx, updateQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update API key: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Return the updated API key
	updatedKey, err := s.GetAPIKeyByID(ctx, userID, keyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated API key: %w", err)
	}

	log.Printf("🔑 Successfully updated API key %s", keyID)
	return updatedKey, nil
}

func (s *Service) DeleteAPIKey(ctx context.Context, userID, keyID string) error {
	log.Printf("🔑 Deleting API key %s for user %s", keyID, userID)

	// Start transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Check if the API key exists and belongs to the user
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM user_api_keys WHERE id = ? AND user_id = ?)`
	err = tx.QueryRowContext(ctx, checkQuery, keyID, userID).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check API key existence: %w", err)
	}

	if !exists {
		return fmt.Errorf("API key not found or does not belong to user")
	}

	// Delete the API key
	deleteQuery := `DELETE FROM user_api_keys WHERE id = ? AND user_id = ?`
	result, err := tx.ExecContext(ctx, deleteQuery, keyID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete API key: %w", err)
	}

	// Check if any rows were affected
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("no API key was deleted")
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	log.Printf("🔑 Successfully deleted API key %s for user %s", keyID, userID)
	return nil
}

func (s *Service) TestAPIKey(ctx context.Context, userID, keyID string) (*types.APIKeyValidationResult, error) {
	// For now, return not implemented
	return nil, fmt.Errorf("test API key not yet implemented")
}

func (s *Service) GetFunctionGroupAPIKeyStatus(ctx context.Context, userID string) ([]*types.FunctionGroupAPIKeyStatus, error) {
	// For now, return not implemented
	return nil, fmt.Errorf("get function group API key status not yet implemented")
}

func (s *Service) GetAPIKeyStatistics(_ context.Context, userID string) (*types.APIKeyStatistics, error) {
	// For now, return not implemented
	return nil, fmt.Errorf("get API key statistics not yet implemented")
}

func (s *Service) scanAPIKeyRow(scanner interface {
	Scan(...interface{}) error
}) (*types.UserAPIKey, error) {
	var apiKey types.UserAPIKey
	var scopesJSON, permissionsJSON, serviceConfigJSON, authConfigJSON []byte
	var expiresAt, lastValidatedAt, lastUsedAt sql.NullTime
	var description, validationError, createdBy sql.NullString
	var rateLimitPerHour, rateLimitPerDay, rateLimitBurst sql.NullInt32

	err := scanner.Scan(
		&apiKey.ID, &apiKey.UserID, &apiKey.KeyName, &apiKey.ServiceName, &apiKey.KeyType, &apiKey.AuthMode, &authConfigJSON,
		&apiKey.EncryptionAlgorithm, &apiKey.EncryptionKeyVersion,
		&apiKey.DisplayName, &description, &apiKey.AccessLevel, &scopesJSON, &permissionsJSON,
		&expiresAt, &lastValidatedAt, &apiKey.ValidationStatus, &validationError,
		&apiKey.IsActive, &apiKey.IsDefault, &apiKey.TotalUses, &lastUsedAt,
		&serviceConfigJSON, &apiKey.Environment,
		&rateLimitPerHour, &rateLimitPerDay, &rateLimitBurst,
		&apiKey.CreatedAt, &apiKey.UpdatedAt, &createdBy,
	)
	if err != nil {
		return nil, err
	}

	// Handle nullable fields
	if description.Valid {
		apiKey.Description = description.String
	}
	if validationError.Valid {
		apiKey.ValidationError = validationError.String
	}
	if createdBy.Valid {
		apiKey.CreatedBy = createdBy.String
	}
	if expiresAt.Valid {
		apiKey.ExpiresAt = &expiresAt.Time
	}
	if lastValidatedAt.Valid {
		apiKey.LastValidatedAt = &lastValidatedAt.Time
	}
	if lastUsedAt.Valid {
		apiKey.LastUsedAt = &lastUsedAt.Time
	}
	if rateLimitPerHour.Valid {
		val := int(rateLimitPerHour.Int32)
		apiKey.RateLimitPerHour = &val
	}
	if rateLimitPerDay.Valid {
		val := int(rateLimitPerDay.Int32)
		apiKey.RateLimitPerDay = &val
	}
	if rateLimitBurst.Valid {
		val := int(rateLimitBurst.Int32)
		apiKey.RateLimitBurst = &val
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(scopesJSON, &apiKey.Scopes); err != nil {
		return nil, fmt.Errorf("failed to unmarshal scopes: %w", err)
	}
	if err := json.Unmarshal(permissionsJSON, &apiKey.Permissions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal permissions: %w", err)
	}
	if err := json.Unmarshal(serviceConfigJSON, &apiKey.ServiceConfig); err != nil {
		return nil, fmt.Errorf("failed to unmarshal service config: %w", err)
	}
	if len(authConfigJSON) > 0 {
		if err := json.Unmarshal(authConfigJSON, &apiKey.AuthConfig); err != nil {
			return nil, fmt.Errorf("failed to unmarshal auth config: %w", err)
		}
	}

	return &apiKey, nil
}
