package engine

import "strings"

// SmartTruncateJSON attempts to truncate JSON at a logical boundary near maxLength.
// If the input is shorter than maxLength, returns it unchanged.
func SmartTruncateJSON(jsonStr string, maxLength int) string {
	if len(jsonStr) <= maxLength {
		return jsonStr
	}
	truncated := jsonStr[:maxLength]
	lastComma := strings.LastIndex(truncated, ",")
	lastBrace := strings.LastIndex(truncated, "}")
	lastBracket := strings.LastIndex(truncated, "]")

	best := maxLength
	if lastComma > 0 && lastComma > maxLength-200 {
		best = lastComma
	} else if lastBrace > 0 && lastBrace > maxLength-200 {
		best = lastBrace + 1
	} else if lastBracket > 0 && lastBracket > maxLength-200 {
		best = lastBracket + 1
	}
	return jsonStr[:best] + "... [truncated]"
}
