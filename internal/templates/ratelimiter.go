package templates

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"gogent/internal/types"
)

// RateLimiter handles rate limiting for template executions
type RateLimiter struct {
	db *sql.DB
	// Platform-wide limits (configurable)
	platformLimitPerHour int
	platformLimitPerDay  int
	platformLimitBurst   int
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(db *sql.DB) *RateLimiter {
	return &RateLimiter{
		db: db,
		// Default platform limits - these should be configurable
		platformLimitPerHour: 1000, // 1000 requests per hour per template
		platformLimitPerDay:  5000, // 5000 requests per day per template
		platformLimitBurst:   50,   // 50 requests in burst
	}
}

// RateLimitResult represents the result of rate limit checking
type RateLimitResult struct {
	Allowed          bool      `json:"allowed"`
	RemainingHour    int       `json:"remainingHour"`
	RemainingDay     int       `json:"remainingDay"`
	RemainingBurst   int       `json:"remainingBurst"`
	ResetTimeHour    time.Time `json:"resetTimeHour"`
	ResetTimeDay     time.Time `json:"resetTimeDay"`
	ResetTimeBurst   time.Time `json:"resetTimeBurst"`
	LimitType        string    `json:"limitType"` // "platform", "template", "token"
	PlatformLimitHit bool      `json:"platformLimitHit"`
}

// CheckRateLimit checks if a request is allowed based on rate limits
func (rl *RateLimiter) CheckRateLimit(templateID string, token *types.ExecutionTemplateAuthToken) (*RateLimitResult, error) {
	result := &RateLimitResult{
		Allowed: true,
	}

	// Get template for default limits
	template, err := rl.getTemplate(templateID)
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	// Determine effective limits
	hourlyLimit := template.RateLimitPerHour
	dailyLimit := template.RateLimitPerDay
	burstLimit := template.RateLimitBurst

	// Override with token-specific limits if provided
	if token != nil {
		if token.CustomRateLimitPerHour != nil {
			hourlyLimit = *token.CustomRateLimitPerHour
		}
		if token.CustomRateLimitPerDay != nil {
			dailyLimit = *token.CustomRateLimitPerDay
		}
		if token.CustomRateLimitBurst != nil {
			burstLimit = *token.CustomRateLimitBurst
		}
	}

	// Check platform limits first
	platformResult, err := rl.checkPlatformLimits(templateID, token)
	if err != nil {
		return nil, fmt.Errorf("failed to check platform limits: %w", err)
	}
	if !platformResult.Allowed {
		return platformResult, nil
	}

	// Check user-defined limits
	userResult, err := rl.checkUserLimits(templateID, token, hourlyLimit, dailyLimit, burstLimit)
	if err != nil {
		return nil, fmt.Errorf("failed to check user limits: %w", err)
	}

	// Combine results (use the most restrictive)
	result.Allowed = userResult.Allowed
	result.RemainingHour = userResult.RemainingHour
	result.RemainingDay = userResult.RemainingDay
	result.RemainingBurst = userResult.RemainingBurst
	result.ResetTimeHour = userResult.ResetTimeHour
	result.ResetTimeDay = userResult.ResetTimeDay
	result.ResetTimeBurst = userResult.ResetTimeBurst
	result.LimitType = userResult.LimitType

	return result, nil
}

// RecordRequest records a request for rate limiting purposes
func (rl *RateLimiter) RecordRequest(templateID string, token *types.ExecutionTemplateAuthToken) error {
	now := time.Now()
	var tokenID *string
	if token != nil {
		tokenID = &token.ID
	}

	// Record for all time windows
	windows := []string{"hour", "day", "burst"}
	for _, windowType := range windows {
		windowStart := rl.getWindowStart(now, windowType)

		err := rl.upsertRateLimitWindow(templateID, tokenID, windowStart, windowType)
		if err != nil {
			log.Printf("Warning: failed to record rate limit for %s window: %v", windowType, err)
		}
	}

	return nil
}

// checkPlatformLimits checks platform-wide rate limits
func (rl *RateLimiter) checkPlatformLimits(templateID string, token *types.ExecutionTemplateAuthToken) (*RateLimitResult, error) {
	result := &RateLimitResult{
		Allowed:   true,
		LimitType: "platform",
	}

	var tokenID *string
	if token != nil {
		tokenID = &token.ID
	}

	// Check hourly platform limit
	hourlyCount, err := rl.getCurrentWindowCount(templateID, tokenID, "hour", rl.platformLimitPerHour)
	if err != nil {
		return nil, err
	}
	if hourlyCount >= rl.platformLimitPerHour {
		result.Allowed = false
		result.PlatformLimitHit = true
		result.ResetTimeHour = rl.getNextWindowStart(time.Now(), "hour")
		return result, nil
	}

	// Check daily platform limit
	dailyCount, err := rl.getCurrentWindowCount(templateID, tokenID, "day", rl.platformLimitPerDay)
	if err != nil {
		return nil, err
	}
	if dailyCount >= rl.platformLimitPerDay {
		result.Allowed = false
		result.PlatformLimitHit = true
		result.ResetTimeDay = rl.getNextWindowStart(time.Now(), "day")
		return result, nil
	}

	// Check burst platform limit
	burstCount, err := rl.getCurrentWindowCount(templateID, tokenID, "burst", rl.platformLimitBurst)
	if err != nil {
		return nil, err
	}
	if burstCount >= rl.platformLimitBurst {
		result.Allowed = false
		result.PlatformLimitHit = true
		result.ResetTimeBurst = rl.getNextWindowStart(time.Now(), "burst")
		return result, nil
	}

	result.RemainingHour = rl.platformLimitPerHour - hourlyCount
	result.RemainingDay = rl.platformLimitPerDay - dailyCount
	result.RemainingBurst = rl.platformLimitBurst - burstCount

	return result, nil
}

// checkUserLimits checks user-defined rate limits
func (rl *RateLimiter) checkUserLimits(templateID string, token *types.ExecutionTemplateAuthToken, hourlyLimit, dailyLimit, burstLimit int) (*RateLimitResult, error) {
	result := &RateLimitResult{
		Allowed:   true,
		LimitType: "template",
	}

	if token != nil {
		result.LimitType = "token"
	}

	var tokenID *string
	if token != nil {
		tokenID = &token.ID
	}

	// Check hourly limit
	hourlyCount, err := rl.getCurrentWindowCount(templateID, tokenID, "hour", hourlyLimit)
	if err != nil {
		return nil, err
	}
	if hourlyCount >= hourlyLimit {
		result.Allowed = false
		result.ResetTimeHour = rl.getNextWindowStart(time.Now(), "hour")
		return result, nil
	}

	// Check daily limit
	dailyCount, err := rl.getCurrentWindowCount(templateID, tokenID, "day", dailyLimit)
	if err != nil {
		return nil, err
	}
	if dailyCount >= dailyLimit {
		result.Allowed = false
		result.ResetTimeDay = rl.getNextWindowStart(time.Now(), "day")
		return result, nil
	}

	// Check burst limit
	burstCount, err := rl.getCurrentWindowCount(templateID, tokenID, "burst", burstLimit)
	if err != nil {
		return nil, err
	}
	if burstCount >= burstLimit {
		result.Allowed = false
		result.ResetTimeBurst = rl.getNextWindowStart(time.Now(), "burst")
		return result, nil
	}

	result.RemainingHour = hourlyLimit - hourlyCount
	result.RemainingDay = dailyLimit - dailyCount
	result.RemainingBurst = burstLimit - burstCount
	result.ResetTimeHour = rl.getNextWindowStart(time.Now(), "hour")
	result.ResetTimeDay = rl.getNextWindowStart(time.Now(), "day")
	result.ResetTimeBurst = rl.getNextWindowStart(time.Now(), "burst")

	return result, nil
}

// getCurrentWindowCount gets the current request count for a time window
func (rl *RateLimiter) getCurrentWindowCount(templateID string, tokenID *string, windowType string, _ int) (int, error) {
	windowStart := rl.getWindowStart(time.Now(), windowType)

	query := `
		SELECT COALESCE(request_count, 0)
		FROM execution_template_rate_limits
		WHERE template_id = ? AND window_start = ? AND window_type = ?
	`
	args := []interface{}{templateID, windowStart, windowType}

	if tokenID != nil {
		query += " AND auth_token_id = ?"
		args = append(args, *tokenID)
	} else {
		query += " AND auth_token_id IS NULL"
	}

	var count int
	err := rl.db.QueryRow(query, args...).Scan(&count)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to get window count: %w", err)
	}

	return count, nil
}

// upsertRateLimitWindow inserts or updates a rate limit window
func (rl *RateLimiter) upsertRateLimitWindow(templateID string, tokenID *string, windowStart time.Time, windowType string) error {
	now := time.Now()

	// Check if record exists
	var exists bool
	checkQuery := `
		SELECT EXISTS(
			SELECT 1 FROM execution_template_rate_limits
			WHERE template_id = ? AND window_start = ? AND window_type = ? AND auth_token_id = ?
		)
	`

	var tokenIDVal interface{}
	if tokenID != nil {
		tokenIDVal = *tokenID
	}

	err := rl.db.QueryRow(checkQuery, templateID, windowStart, windowType, tokenIDVal).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check rate limit record existence: %w", err)
	}

	if exists {
		// Update existing record
		updateQuery := `
			UPDATE execution_template_rate_limits
			SET request_count = request_count + 1, last_request_at = ?, updated_at = ?
			WHERE template_id = ? AND window_start = ? AND window_type = ? AND auth_token_id = ?
		`
		_, err = rl.db.Exec(updateQuery, now, now, templateID, windowStart, windowType, tokenIDVal)
		if err != nil {
			return fmt.Errorf("failed to update rate limit record: %w", err)
		}
	} else {
		// Insert new record
		insertQuery := `
			INSERT INTO execution_template_rate_limits (
				id, template_id, auth_token_id, window_start, window_type,
				request_count, last_request_at, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`

		recordID := generateRateLimitID()
		_, err = rl.db.Exec(insertQuery,
			recordID, templateID, tokenIDVal, windowStart, windowType,
			1, now, now, now,
		)
		if err != nil {
			return fmt.Errorf("failed to insert rate limit record: %w", err)
		}
	}

	return nil
}

// getWindowStart calculates the start time for a rate limiting window
func (rl *RateLimiter) getWindowStart(t time.Time, windowType string) time.Time {
	switch windowType {
	case hourWindow:
		return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), 0, 0, 0, t.Location())
	case dayWindow:
		return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
	case burstWindow:
		// Burst window is 5-minute sliding window
		minutes := t.Minute() / 5 * 5
		return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), minutes, 0, 0, t.Location())
	default:
		return t
	}
}

// getNextWindowStart calculates when the current window will reset
func (rl *RateLimiter) getNextWindowStart(t time.Time, windowType string) time.Time {
	switch windowType {
	case "hour":
		return rl.getWindowStart(t, windowType).Add(time.Hour)
	case "day":
		return rl.getWindowStart(t, windowType).Add(24 * time.Hour)
	case "burst":
		return rl.getWindowStart(t, windowType).Add(5 * time.Minute)
	default:
		return t
	}
}

// getTemplate retrieves template info for rate limiting
func (rl *RateLimiter) getTemplate(templateID string) (*types.ExecutionTemplate, error) {
	query := `
		SELECT rate_limit_per_hour, rate_limit_per_day, rate_limit_burst
		FROM execution_templates
		WHERE id = ? AND is_active = TRUE
	`

	var template types.ExecutionTemplate
	err := rl.db.QueryRow(query, templateID).Scan(
		&template.RateLimitPerHour,
		&template.RateLimitPerDay,
		&template.RateLimitBurst,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("template not found")
		}
		return nil, fmt.Errorf("failed to get template rate limits: %w", err)
	}

	return &template, nil
}

// CleanupOldWindows removes old rate limiting windows (cleanup job)
func (rl *RateLimiter) CleanupOldWindows() error {
	// Delete records older than 7 days
	cutoff := time.Now().Add(-7 * 24 * time.Hour)

	query := "DELETE FROM execution_template_rate_limits WHERE window_start < ?"
	result, err := rl.db.Exec(query, cutoff)
	if err != nil {
		return fmt.Errorf("failed to cleanup old rate limit windows: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	log.Printf("Cleaned up %d old rate limit windows", rowsAffected)

	return nil
}

// GetRateLimitStats returns rate limiting statistics for a template
func (rl *RateLimiter) GetRateLimitStats(templateID string, days int) (map[string]interface{}, error) {
	cutoff := time.Now().Add(-time.Duration(days) * 24 * time.Hour)

	query := `
		SELECT 
			window_type,
			COUNT(*) as total_windows,
			SUM(request_count) as total_requests,
			AVG(request_count) as avg_requests_per_window,
			MAX(request_count) as max_requests_per_window
		FROM execution_template_rate_limits
		WHERE template_id = ? AND window_start >= ?
		GROUP BY window_type
	`

	rows, err := rl.db.Query(query, templateID, cutoff)
	if err != nil {
		return nil, fmt.Errorf("failed to get rate limit stats: %w", err)
	}
	defer rows.Close()

	stats := make(map[string]interface{})
	for rows.Next() {
		var windowType string
		var totalWindows, totalRequests, maxRequests int
		var avgRequests float64

		err := rows.Scan(&windowType, &totalWindows, &totalRequests, &avgRequests, &maxRequests)
		if err != nil {
			return nil, fmt.Errorf("failed to scan rate limit stats: %w", err)
		}

		stats[windowType] = map[string]interface{}{
			"total_windows":           totalWindows,
			"total_requests":          totalRequests,
			"avg_requests_per_window": avgRequests,
			"max_requests_per_window": maxRequests,
		}
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate rate limit stats rows: %w", err)
	}

	return stats, nil
}

// generateRateLimitID generates a unique ID for rate limit records
func generateRateLimitID() string {
	return "rl-" + generateRandomString(12)
}
