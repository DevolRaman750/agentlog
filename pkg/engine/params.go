package engine

// AutoFillMissingArgs fills obvious missing arguments for a tool/function call
// based on previous function results. Returns true if it populated any field.
//
// Current behavior: if "channel" arg is missing and previous results contain
// channels[0].id, set args["channel"] to that id.
func AutoFillMissingArgs(_ string, args map[string]interface{}, previousResults []map[string]interface{}) bool {
	if args == nil {
		return false
	}
	if _, exists := args["channel"]; exists {
		return false
	}
	for _, r := range previousResults {
		if channels, ok := r["channels"].([]interface{}); ok && len(channels) > 0 {
			if ch, ok := channels[0].(map[string]interface{}); ok {
				if id, ok := ch["id"].(string); ok && id != "" {
					args["channel"] = id
					return true
				}
			}
		}
	}
	return false
}
