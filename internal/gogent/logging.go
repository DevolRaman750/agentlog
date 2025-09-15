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

// Log event type constants
const (
	LogEventFunctionExecution = "function_execution_start"

	// Emoji constants
	CheckmarkEmoji = "✅"
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
	c.mutex.Lock()
	defer c.mutex.Unlock()

	// Only log if we have an execution context
	if c.currentExecutionRunID == nil {
		log.Printf("⚠️ [FLOW] Skipping flow event - no execution context: %s (%s)", eventType, status)
		return
	}

	// Convert event data to JSON
	var eventDataJSON json.RawMessage
	if eventData != nil {
		if jsonBytes, err := json.Marshal(eventData); err != nil {
			log.Printf("⚠️ Failed to marshal flow event data: %v", err)
			eventDataJSON = nil
		} else {
			eventDataJSON = jsonBytes
		}
	}

	// Convert event type to database enum
	var dbEventType db.ExecutionFlowEventsEventType
	switch eventType {
	case "prompt_start":
		dbEventType = db.ExecutionFlowEventsEventTypePromptStart
	case "ai_model_call":
		dbEventType = db.ExecutionFlowEventsEventTypeAiModelCall
	case "function_call_start":
		dbEventType = db.ExecutionFlowEventsEventTypeFunctionCallStart
	case "function_call_end":
		dbEventType = db.ExecutionFlowEventsEventTypeFunctionCallEnd
	case "ai_response":
		dbEventType = db.ExecutionFlowEventsEventTypeAiResponse
	case "error_occurred":
		dbEventType = db.ExecutionFlowEventsEventTypeErrorOccurred
	case "retry_attempt":
		dbEventType = db.ExecutionFlowEventsEventTypeRetryAttempt
	case "execution_complete":
		dbEventType = db.ExecutionFlowEventsEventTypeExecutionComplete
	case "api_request_start", "api_request_end":
		// For backward compatibility, map these to ai_model_call
		dbEventType = db.ExecutionFlowEventsEventTypeAiModelCall
	case LogEventFunctionExecution, "function_execution_end":
		// Map function execution events appropriately
		if eventType == "function_execution_start" {
			dbEventType = db.ExecutionFlowEventsEventTypeFunctionCallStart
		} else {
			dbEventType = db.ExecutionFlowEventsEventTypeFunctionCallEnd
		}
	case "synthesis_start", "synthesis_end":
		// Map synthesis events to ai_model_call since they represent AI processing
		dbEventType = db.ExecutionFlowEventsEventTypeAiModelCall
	default:
		log.Printf("⚠️ [FLOW] Unknown event type '%s', using ai_model_call as fallback", eventType)
		dbEventType = db.ExecutionFlowEventsEventTypeAiModelCall
	}

	// Convert status to database enum
	var dbStatus db.NullExecutionFlowEventsStatus
	switch status {
	case "pending":
		dbStatus = db.NullExecutionFlowEventsStatus{
			ExecutionFlowEventsStatus: db.ExecutionFlowEventsStatusPending,
			Valid:                     true,
		}
	case "success":
		dbStatus = db.NullExecutionFlowEventsStatus{
			ExecutionFlowEventsStatus: db.ExecutionFlowEventsStatusSuccess,
			Valid:                     true,
		}
	case "error":
		dbStatus = db.NullExecutionFlowEventsStatus{
			ExecutionFlowEventsStatus: db.ExecutionFlowEventsStatusError,
			Valid:                     true,
		}
	case "timeout":
		dbStatus = db.NullExecutionFlowEventsStatus{
			ExecutionFlowEventsStatus: db.ExecutionFlowEventsStatusTimeout,
			Valid:                     true,
		}
	default:
		log.Printf("⚠️ [FLOW] Unknown status '%s', using pending as fallback", status)
		dbStatus = db.NullExecutionFlowEventsStatus{
			ExecutionFlowEventsStatus: db.ExecutionFlowEventsStatusPending,
			Valid:                     true,
		}
	}

	// Create flow event parameters
	params := db.CreateExecutionFlowEventParams{
		ID:             uuid.New().String(),
		ExecutionRunID: *c.currentExecutionRunID,
		RequestID:      c.convertStringToNullString(c.currentRequestID),
		EventType:      dbEventType,
		SequenceNumber: int32(sequenceNumber),
		ParentEventID:  c.convertStringToNullString(parentEventID),
		EventData:      eventDataJSON,
		DurationMs:     c.convertInt32ToNullInt32(durationMs),
		Status:         dbStatus,
		ErrorMessage:   c.convertStringToNullString(errorMessage),
	}

	// Insert into database
	err := c.queries.CreateExecutionFlowEvent(context.Background(), params)
	if err != nil {
		log.Printf("⚠️ Failed to log execution flow event: %v", err)
	} else {
		log.Printf("🔄 [FLOW] %s (%s): %s [seq: %d]", eventType, status, params.ID, sequenceNumber)
	}
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
			return CheckmarkEmoji
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

func (c *Client) convertInt32ToNullInt32(i *int32) sql.NullInt32 {
	if i == nil {
		return sql.NullInt32{Valid: false}
	}
	return sql.NullInt32{Int32: *i, Valid: true}
}
