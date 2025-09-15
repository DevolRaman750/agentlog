package engine

import (
	"encoding/json"
	"strconv"
)

const (
	noDataReturned = "No data returned"
)

// SummarizeResult returns a concise representation of a function result.
// Current strategy:
// - If result is nil: "No data returned"
// - If status is failed/validation_failed: return "FAILED: <error>" if present
// - Otherwise: return full JSON for maximal context preservation
func SummarizeResult(_ string, result map[string]interface{}) string {
	if result == nil {
		return noDataReturned
	}

	if status, ok := result["status"].(string); ok && (status == "failed" || status == "validation_failed") {
		if errMsg, ok := result["error"].(string); ok && errMsg != "" {
			return "FAILED: " + errMsg
		}
		return "FAILED: Unknown error"
	}

	return CreateFullDataSummary(result)
}

// CreateFullDataSummary marshals the entire result as JSON.
func CreateFullDataSummary(result map[string]interface{}) string {
	if len(result) == 0 {
		return noDataReturned
	}
	b, err := json.Marshal(result)
	if err != nil {
		// Fall back to a generic message that doesn’t leak internal details
		return CreateGenericSummary(result)
	}
	return string(b)
}

// CreateGenericSummary provides a coarse fallback string when JSON marshal fails.
func CreateGenericSummary(result map[string]interface{}) string {
	if len(result) == 0 {
		return noDataReturned
	}
	// Keep very concise to avoid large prompts; count non-metadata fields
	count := 0
	for k, v := range result {
		if k != "metadata" && k != "_metadata" && v != nil {
			count++
		}
	}
	return "Retrieved data with " + strconv.Itoa(count) + " fields"
}
