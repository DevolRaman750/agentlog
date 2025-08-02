package templates

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"gogent/internal/types"
)

// =============================================================================
// AUTH TOKEN MANAGEMENT
// =============================================================================

// CreateAuthToken creates a new authentication token for a template
func (ts *TemplateService) CreateAuthToken(token *types.ExecutionTemplateAuthToken) (*types.ExecutionTemplateAuthToken, error) {
	// Generate token value
	token.ID = generateTokenID()
	token.TokenValue = generateSecureToken()
	token.CreatedAt = time.Now()
	token.UpdatedAt = time.Now()

	// Convert JSON fields
	var allowedOriginsJSON interface{}
	if token.AllowedOrigins != nil && len(token.AllowedOrigins) > 0 {
		bytes, err := json.Marshal(token.AllowedOrigins)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal allowed origins: %w", err)
		}
		allowedOriginsJSON = string(bytes)
	} else {
		allowedOriginsJSON = nil // SQL NULL
	}

	var allowedIPsJSON interface{}
	if token.AllowedIPs != nil && len(token.AllowedIPs) > 0 {
		bytes, err := json.Marshal(token.AllowedIPs)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal allowed IPs: %w", err)
		}
		allowedIPsJSON = string(bytes)
	} else {
		allowedIPsJSON = nil // SQL NULL
	}

	query := `
		INSERT INTO execution_template_auth_tokens (
			id, template_id, user_id, token_value, token_name, description,
			is_active, expires_at, custom_rate_limit_per_hour, custom_rate_limit_per_day,
			custom_rate_limit_burst, total_uses, allowed_origins, allowed_ips,
			created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := ts.db.Exec(query,
		token.ID, token.TemplateID, token.UserID, token.TokenValue, token.TokenName,
		token.Description, token.IsActive, token.ExpiresAt, token.CustomRateLimitPerHour,
		token.CustomRateLimitPerDay, token.CustomRateLimitBurst, 0,
		allowedOriginsJSON, allowedIPsJSON, token.CreatedAt, token.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create auth token: %w", err)
	}

	return token, nil
}

// GetAuthTokenByValue retrieves a token by its value (for API authentication)
func (ts *TemplateService) GetAuthTokenByValue(tokenValue string) (*types.ExecutionTemplateAuthToken, error) {
	query := `
		SELECT id, template_id, user_id, token_value, token_name, description,
			   is_active, expires_at, custom_rate_limit_per_hour, custom_rate_limit_per_day,
			   custom_rate_limit_burst, total_uses, last_used_at, last_used_ip,
			   allowed_origins, allowed_ips, created_at, updated_at
		FROM execution_template_auth_tokens
		WHERE token_value = ? AND is_active = TRUE
	`

	var token types.ExecutionTemplateAuthToken
	var expiresAt, lastUsedAt sql.NullTime
	var customRateLimitPerHour, customRateLimitPerDay, customRateLimitBurst sql.NullInt64
	var allowedOriginsJSON, allowedIPsJSON sql.NullString

	err := ts.db.QueryRow(query, tokenValue).Scan(
		&token.ID, &token.TemplateID, &token.UserID, &token.TokenValue,
		&token.TokenName, &token.Description, &token.IsActive, &expiresAt,
		&customRateLimitPerHour, &customRateLimitPerDay, &customRateLimitBurst,
		&token.TotalUses, &lastUsedAt, &token.LastUsedIP,
		&allowedOriginsJSON, &allowedIPsJSON, &token.CreatedAt, &token.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("token not found or inactive")
		}
		return nil, fmt.Errorf("failed to get auth token: %w", err)
	}

	// Handle nullable fields
	if expiresAt.Valid {
		token.ExpiresAt = &expiresAt.Time
		// Check if token is expired
		if token.ExpiresAt.Before(time.Now()) {
			return nil, fmt.Errorf("token has expired")
		}
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

	return &token, nil
}

// UpdateAuthTokenUsage updates token usage statistics
func (ts *TemplateService) UpdateAuthTokenUsage(tokenID, clientIP string) error {
	query := `
		UPDATE execution_template_auth_tokens 
		SET total_uses = total_uses + 1, last_used_at = ?, last_used_ip = ?, updated_at = ?
		WHERE id = ?
	`
	_, err := ts.db.Exec(query, time.Now(), clientIP, time.Now(), tokenID)
	if err != nil {
		return fmt.Errorf("failed to update token usage: %w", err)
	}
	return nil
}

// UpdateAuthToken updates an existing auth token
func (ts *TemplateService) UpdateAuthToken(tokenID string, token *types.ExecutionTemplateAuthToken) (*types.ExecutionTemplateAuthToken, error) {
	token.UpdatedAt = time.Now()

	// Convert JSON fields
	var allowedOriginsJSON interface{}
	if token.AllowedOrigins != nil && len(token.AllowedOrigins) > 0 {
		bytes, err := json.Marshal(token.AllowedOrigins)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal allowed origins: %w", err)
		}
		allowedOriginsJSON = string(bytes)
	} else {
		allowedOriginsJSON = nil // SQL NULL
	}

	var allowedIPsJSON interface{}
	if token.AllowedIPs != nil && len(token.AllowedIPs) > 0 {
		bytes, err := json.Marshal(token.AllowedIPs)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal allowed IPs: %w", err)
		}
		allowedIPsJSON = string(bytes)
	} else {
		allowedIPsJSON = nil // SQL NULL
	}

	query := `
		UPDATE execution_template_auth_tokens SET
			token_name = ?, description = ?, is_active = ?, expires_at = ?,
			custom_rate_limit_per_hour = ?, custom_rate_limit_per_day = ?,
			custom_rate_limit_burst = ?, allowed_origins = ?, allowed_ips = ?,
			updated_at = ?
		WHERE id = ?
	`

	_, err := ts.db.Exec(query,
		token.TokenName, token.Description, token.IsActive, token.ExpiresAt,
		token.CustomRateLimitPerHour, token.CustomRateLimitPerDay,
		token.CustomRateLimitBurst, allowedOriginsJSON, allowedIPsJSON,
		token.UpdatedAt, tokenID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update auth token: %w", err)
	}

	// Return the updated token
	return ts.GetAuthTokenByID(tokenID)
}

// GetAuthTokenByID retrieves a token by ID
func (ts *TemplateService) GetAuthTokenByID(tokenID string) (*types.ExecutionTemplateAuthToken, error) {
	query := `
		SELECT id, template_id, user_id, token_value, token_name, description,
			   is_active, expires_at, custom_rate_limit_per_hour, custom_rate_limit_per_day,
			   custom_rate_limit_burst, total_uses, last_used_at, last_used_ip,
			   allowed_origins, allowed_ips, created_at, updated_at
		FROM execution_template_auth_tokens
		WHERE id = ?
	`

	var token types.ExecutionTemplateAuthToken
	var expiresAt, lastUsedAt sql.NullTime
	var customRateLimitPerHour, customRateLimitPerDay, customRateLimitBurst sql.NullInt64
	var allowedOriginsJSON, allowedIPsJSON sql.NullString

	err := ts.db.QueryRow(query, tokenID).Scan(
		&token.ID, &token.TemplateID, &token.UserID, &token.TokenValue,
		&token.TokenName, &token.Description, &token.IsActive, &expiresAt,
		&customRateLimitPerHour, &customRateLimitPerDay, &customRateLimitBurst,
		&token.TotalUses, &lastUsedAt, &token.LastUsedIP,
		&allowedOriginsJSON, &allowedIPsJSON, &token.CreatedAt, &token.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("token not found")
		}
		return nil, fmt.Errorf("failed to get auth token: %w", err)
	}

	// Handle nullable fields (same as above)
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

	return &token, nil
}

// DeleteAuthToken deactivates an auth token
func (ts *TemplateService) DeleteAuthToken(tokenID string) error {
	query := "UPDATE execution_template_auth_tokens SET is_active = FALSE, updated_at = ? WHERE id = ?"
	_, err := ts.db.Exec(query, time.Now(), tokenID)
	if err != nil {
		return fmt.Errorf("failed to delete auth token: %w", err)
	}
	return nil
}

// ValidateTokenAccess validates if a token can access from a specific IP/origin
func (ts *TemplateService) ValidateTokenAccess(token *types.ExecutionTemplateAuthToken, clientIP, origin string) error {
	// Check IP whitelist
	if token.AllowedIPs != nil {
		allowedIPs, ok := token.AllowedIPs["ips"].([]interface{})
		if ok && len(allowedIPs) > 0 {
			allowed := false
			for _, ip := range allowedIPs {
				if ipStr, ok := ip.(string); ok && ipStr == clientIP {
					allowed = true
					break
				}
			}
			if !allowed {
				return fmt.Errorf("access denied: IP %s not in whitelist", clientIP)
			}
		}
	}

	// Check origin whitelist
	if token.AllowedOrigins != nil && origin != "" {
		allowedOrigins, ok := token.AllowedOrigins["origins"].([]interface{})
		if ok && len(allowedOrigins) > 0 {
			allowed := false
			for _, orig := range allowedOrigins {
				if origStr, ok := orig.(string); ok && origStr == origin {
					allowed = true
					break
				}
			}
			if !allowed {
				return fmt.Errorf("access denied: origin %s not in whitelist", origin)
			}
		}
	}

	return nil
}

// generateTokenID generates a unique token ID
func generateTokenID() string {
	return "tok-" + generateRandomString(16)
}

// generateSecureToken generates a cryptographically secure token
func generateSecureToken() string {
	bytes := make([]byte, 32) // 256 bits
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
