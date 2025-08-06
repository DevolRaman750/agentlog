package gogent

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"

	"gogent/internal/db"
	"gogent/internal/types"

	"github.com/google/uuid"
)

// logExecutionEvent logs an execution event to the database
func (c *Client) logExecutionEvent(level types.LogLevel, category types.LogCategory, message string, details map[string]interface{}) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	// Only log if we have an execution context
	if c.currentExecutionRunID == nil {
		return
	}

	// Convert to database format
	detailsJSON, _ := types.ToJSON(details)

	err := c.queries.CreateExecutionLog(context.Background(), db.CreateExecutionLogParams{
		ID:              uuid.New().String(),
		ExecutionRunID:  *c.currentExecutionRunID,
		ConfigurationID: c.convertStringToNullString(c.currentConfigID),
		RequestID:       c.convertStringToNullString(c.currentRequestID),
		LogLevel:        sql.NullString{String: string(level), Valid: true},
		LogCategory:     sql.NullString{String: string(category), Valid: true},
		Message:         message,
		Details:         c.convertStringToRawMessage(detailsJSON),
	})

	if err != nil {
		log.Printf("⚠️ Failed to log execution event: %v", err)
	}

	// Also log to console with emoji
	emoji := c.getLogEmoji(level, category)
	log.Printf("%s [%s] %s: %s", emoji, category, level, message)
}

// logExecutionFlowEvent logs a flow event for execution tracking
func (c *Client) logExecutionFlowEvent(eventType string, sequenceNumber int, status string, parentEventID *string, eventData map[string]interface{}, durationMs *int32, errorMessage *string) {
	// TODO: Implement flow event logging when database schema is ready
	log.Printf("🔄 [FLOW] %s (%s): %s", eventType, status, uuid.New().String())
}

// getLogEmoji returns an appropriate emoji for the log level and category
func (c *Client) getLogEmoji(level types.LogLevel, category types.LogCategory) string {
	switch level {
	case types.LogLevelInfo:
		switch category {
		case types.LogCategorySetup:
			return "🔧"
		case types.LogCategoryExecution:
			return "⚡"
		case types.LogCategoryFunctionCall:
			return "🔗"
		case types.LogCategoryAPICall:
			return "🌐"
		case types.LogCategoryCompletion:
			return "✅"
		default:
			return "ℹ️"
		}
	case types.LogLevelDebug:
		return "🔍"
	case types.LogLevelWarn:
		return "⚠️"
	case types.LogLevelError:
		return "❌"
	case types.LogLevelSuccess:
		return "✅"
	default:
		return "📝"
	}
}

// Helper functions for data conversion
func (c *Client) convertStringToNullString(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: *s, Valid: true}
}

func (c *Client) convertStringToRawMessage(jsonStr string) json.RawMessage {
	if jsonStr == "" {
		return nil
	}
	return json.RawMessage(jsonStr)
}
