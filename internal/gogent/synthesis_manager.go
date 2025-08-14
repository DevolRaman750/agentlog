package gogent

import (
	"fmt"
	"log"

	"gogent/internal/types"
)

// SynthesisManager handles intelligent function calling flow for both Gemini and Kimi K2
type SynthesisManager struct {
	maxDepth               int
	maxSameFunctionRepeats int
}

// NewSynthesisManager creates a new synthesis manager with default settings
func NewSynthesisManager() *SynthesisManager {
	return &SynthesisManager{
		maxDepth:               10, // Allow more natural workflow completion
		maxSameFunctionRepeats: 5,  // Allow reasonable exploration before detecting loops
	}
}

// SynthesisConfig contains configuration for synthesis behavior
type SynthesisConfig struct {
	ProviderType    string
	Depth           int
	ShouldComplete  bool
	FunctionCalls   []ResponsePart
	FunctionResults []map[string]interface{}
	OriginalConfig  *types.APIConfiguration
}

// SynthesisDecision represents what action to take during synthesis
type SynthesisDecision struct {
	AllowFunctionCalls bool
	Tools              []types.Tool
	Reason             string
	ForceCompletion    bool
}

// DetermineSynthesisStrategy decides whether to allow function calls during synthesis
// Following Gemini best practices: provide intelligent guidance while preventing obvious loops
func (sm *SynthesisManager) DetermineSynthesisStrategy(config *SynthesisConfig) *SynthesisDecision {
	// Check for identical function loops first (Gemini best practice: prevent obvious repetition)
	if sm.detectIdenticalFunctionLoop(config.FunctionCalls) {
		log.Printf("🔄 [LOOP] Identical function loop detected - stopping function calls")
		return &SynthesisDecision{
			AllowFunctionCalls: false,
			Tools:              []types.Tool{},
			Reason:             "Identical function loop detected - preventing repetition",
			ForceCompletion:    true,
		}
	}

	// Check for excessive function calls (stronger loop detection)
	// Allow more calls for complex workflows (Slack + GitHub integration needs multiple calls)
	if len(config.FunctionCalls) >= 20 {
		log.Printf("🛑 [EXCESSIVE] Too many function calls (%d) - forcing completion", len(config.FunctionCalls))
		return &SynthesisDecision{
			AllowFunctionCalls: false,
			Tools:              []types.Tool{},
			Reason:             "Excessive function calls detected - forcing completion",
			ForceCompletion:    true,
		}
	}

	// Only stop for absolute safety net (prevent runaway costs)
	if config.Depth >= 15 {
		log.Printf("🛑 [SAFETY] Maximum depth reached: %d - preventing runaway execution", config.Depth)
		return &SynthesisDecision{
			AllowFunctionCalls: false,
			Tools:              []types.Tool{},
			Reason:             "Safety limit reached - preventing runaway execution",
			ForceCompletion:    true,
		}
	}

	// Honor external completion signals (e.g., from task completion detection)
	if config.ShouldComplete {
		log.Printf("🏁 [EXTERNAL] External completion signal received")
		return &SynthesisDecision{
			AllowFunctionCalls: false,
			Tools:              []types.Tool{},
			Reason:             "External completion signal received",
			ForceCompletion:    true,
		}
	}

	// Default: Trust the LLM provider to make intelligent decisions
	// Provide all tools and let the provider decide when to stop
	log.Printf("✅ [NATURAL] Allowing natural LLM workflow - depth %d, tools: %d", config.Depth, len(config.OriginalConfig.Tools))
	return &SynthesisDecision{
		AllowFunctionCalls: true,
		Tools:              config.OriginalConfig.Tools,
		Reason:             "Natural LLM workflow - provider decides completion",
		ForceCompletion:    false,
	}
}

// Removed provider-specific strategies - let each LLM provider handle workflows naturally

// detectIdenticalFunctionLoop checks for functional loops (same function, same key parameters)
// This prevents Gemini from calling slack_read_messages repeatedly with just different limits
func (sm *SynthesisManager) detectIdenticalFunctionLoop(functionCalls []ResponsePart) bool {
	if len(functionCalls) < 3 {
		return false
	}

	// Check the last 3 function calls
	recent := functionCalls[len(functionCalls)-3:]

	// If all 3 recent calls are the same function, it's likely a loop
	if len(recent) == 3 {
		first := recent[0]
		functionName := first.FunctionCall.Name

		// Check if all 3 calls are the same function
		for i := 1; i < 3; i++ {
			if recent[i].FunctionCall.Name != functionName {
				return false
			}
		}

		// Special handling for slack_read_messages - if same channel, it's a loop regardless of limit
		if functionName == "slack_read_messages" {
			firstChannel := sm.getChannelFromArgs(first.FunctionCall.Args)
			for i := 1; i < 3; i++ {
				if sm.getChannelFromArgs(recent[i].FunctionCall.Args) != firstChannel {
					return false
				}
			}
			log.Printf("🔄 [LOOP] Detected slack_read_messages loop: channel=%s (called 3+ times)", firstChannel)
			return true
		}

		// Special handling for slack_find_channel - if same channel name, it's a loop
		if functionName == "slack_find_channel" {
			firstChannelName := sm.getChannelNameFromArgs(first.FunctionCall.Args)
			for i := 1; i < 3; i++ {
				if sm.getChannelNameFromArgs(recent[i].FunctionCall.Args) != firstChannelName {
					return false
				}
			}
			log.Printf("🔄 [LOOP] Detected slack_find_channel loop: channel_name=%s (called 3+ times)", firstChannelName)
			return true
		}

		// For other functions, check if parameters are identical
		for i := 1; i < 3; i++ {
			if fmt.Sprintf("%v", recent[i].FunctionCall.Args) != fmt.Sprintf("%v", first.FunctionCall.Args) {
				return false
			}
		}

		log.Printf("🔄 [LOOP] Detected identical function loop: %s with args %v",
			functionName, first.FunctionCall.Args)
		return true
	}

	return false
}

// getChannelFromArgs extracts the channel parameter from function arguments
func (sm *SynthesisManager) getChannelFromArgs(args map[string]interface{}) string {
	if channel, ok := args["channel"].(string); ok {
		return channel
	}
	return ""
}

// getChannelNameFromArgs extracts the channel_name parameter from function arguments
func (sm *SynthesisManager) getChannelNameFromArgs(args map[string]interface{}) string {
	if channelName, ok := args["channel_name"].(string); ok {
		return channelName
	}
	return ""
}

// hasSignificantErrors checks if recent function calls have significant errors
func (sm *SynthesisManager) hasSignificantErrors(results []map[string]interface{}) bool {
	if len(results) == 0 {
		return false
	}

	errorCount := 0
	for _, result := range results {
		if status, ok := result["status"].(string); ok {
			if status == "failed" || status == "validation_failed" {
				errorCount++
			}
		}
		if _, hasError := result["error"]; hasError {
			errorCount++
		}
	}

	// If more than half the recent calls failed, consider it significant
	return float64(errorCount)/float64(len(results)) > 0.5
}

// GetSynthesisPromptSuffix returns guidance following Gemini function calling best practices
func (sm *SynthesisManager) GetSynthesisPromptSuffix(decision *SynthesisDecision, providerType string) string {
	if decision.ForceCompletion {
		return "\n\n**COMPLETION REQUIRED:** Please provide your final response using the information you've gathered. Focus on the user's primary request."
	}

	// Following Gemini best practices: provide clear, specific instructions
	return "\n\n**INSTRUCTIONS:**\n" +
		"- You are an intelligent assistant that can call functions to complete user requests\n" +
		"- Use the available functions to gather information and take actions as needed\n" +
		"- If you have already gathered the necessary data, proceed to complete the requested actions\n" +
		"- Do not repeat the same function calls with identical parameters\n" +
		"- Focus on completing the user's primary request efficiently\n" +
		"- If some functions fail, continue with the main task using available data"
}

// LogDecision logs the synthesis decision for debugging
func (sm *SynthesisManager) LogDecision(decision *SynthesisDecision, config *SynthesisConfig) {
	log.Printf("🧠 Synthesis Decision: %s", decision.Reason)
	log.Printf("🔧 Provider: %s, Depth: %d, Tools: %d, Allow Functions: %v",
		config.ProviderType, config.Depth, len(decision.Tools), decision.AllowFunctionCalls)
}
