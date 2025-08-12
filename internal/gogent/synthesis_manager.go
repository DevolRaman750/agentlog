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
		maxDepth:               10, // Reasonable depth for compositional workflows
		maxSameFunctionRepeats: 3,  // Prevent infinite loops of same function
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
// following Gemini's compositional function calling and Kimi K2 best practices
func (sm *SynthesisManager) DetermineSynthesisStrategy(config *SynthesisConfig) *SynthesisDecision {
	// Check for hard limits first
	if config.Depth >= sm.maxDepth {
		return &SynthesisDecision{
			AllowFunctionCalls: false,
			Tools:              []types.Tool{},
			Reason:             fmt.Sprintf("Maximum depth (%d) reached", sm.maxDepth),
			ForceCompletion:    true,
		}
	}

	// Check for infinite loops (same function repeated too many times)
	if sm.detectInfiniteLoop(config.FunctionCalls, config.FunctionResults) {
		return &SynthesisDecision{
			AllowFunctionCalls: false,
			Tools:              []types.Tool{},
			Reason:             "Infinite loop detected - same function repeated",
			ForceCompletion:    true,
		}
	}

	// If external logic determined completion is needed
	if config.ShouldComplete {
		return &SynthesisDecision{
			AllowFunctionCalls: false,
			Tools:              []types.Tool{},
			Reason:             "External completion signal received",
			ForceCompletion:    true,
		}
	}

	// For Gemini: Enable compositional function calling for natural workflows
	if config.ProviderType == "gemini" {
		return sm.geminiCompositionalStrategy(config)
	}

	// For Kimi K2: Enable multi-step reasoning with function calls
	if config.ProviderType == "kimi" {
		return sm.kimiMultiStepStrategy(config)
	}

	// Default: allow function calls for legitimate workflows
	return &SynthesisDecision{
		AllowFunctionCalls: true,
		Tools:              config.OriginalConfig.Tools,
		Reason:             "Default strategy - allowing function calls",
		ForceCompletion:    false,
	}
}

// geminiCompositionalStrategy implements Gemini's compositional function calling pattern
func (sm *SynthesisManager) geminiCompositionalStrategy(config *SynthesisConfig) *SynthesisDecision {
	// Gemini excels at compositional workflows - allow it to chain functions naturally
	// Key insight: Let Gemini decide when it has enough information to complete the task

	// Only force completion in specific error scenarios or very deep workflows
	if config.Depth >= 8 { // More generous for Gemini's compositional abilities
		return &SynthesisDecision{
			AllowFunctionCalls: false,
			Tools:              []types.Tool{},
			Reason:             "Gemini compositional workflow depth limit reached",
			ForceCompletion:    true,
		}
	}

	// Check if we have errors that suggest we should stop
	hasErrors := sm.hasSignificantErrors(config.FunctionResults)
	if hasErrors && config.Depth >= 3 {
		return &SynthesisDecision{
			AllowFunctionCalls: false,
			Tools:              []types.Tool{},
			Reason:             "Errors detected - stopping Gemini compositional flow",
			ForceCompletion:    true,
		}
	}

	// Enable full compositional function calling for Gemini
	return &SynthesisDecision{
		AllowFunctionCalls: true,
		Tools:              config.OriginalConfig.Tools,
		Reason:             "Gemini compositional function calling enabled",
		ForceCompletion:    false,
	}
}

// kimiMultiStepStrategy implements Kimi K2's multi-step reasoning pattern
func (sm *SynthesisManager) kimiMultiStepStrategy(config *SynthesisConfig) *SynthesisDecision {
	// Kimi K2 is excellent at multi-step reasoning - allow it to continue workflows

	// Conservative depth limit for Kimi K2
	if config.Depth >= 6 {
		return &SynthesisDecision{
			AllowFunctionCalls: false,
			Tools:              []types.Tool{},
			Reason:             "Kimi K2 multi-step workflow depth limit reached",
			ForceCompletion:    true,
		}
	}

	// Check for error patterns that suggest stopping
	hasErrors := sm.hasSignificantErrors(config.FunctionResults)
	if hasErrors && config.Depth >= 2 {
		return &SynthesisDecision{
			AllowFunctionCalls: false,
			Tools:              []types.Tool{},
			Reason:             "Errors detected - stopping Kimi K2 workflow",
			ForceCompletion:    true,
		}
	}

	// Enable multi-step function calling for Kimi K2
	return &SynthesisDecision{
		AllowFunctionCalls: true,
		Tools:              config.OriginalConfig.Tools,
		Reason:             "Kimi K2 multi-step reasoning enabled",
		ForceCompletion:    false,
	}
}

// detectInfiniteLoop checks if the same function is being called repeatedly
func (sm *SynthesisManager) detectInfiniteLoop(recentCalls []ResponsePart, recentResults []map[string]interface{}) bool {
	if len(recentCalls) < 2 {
		return false
	}

	// Check last few function calls for repetition
	functionCallHistory := make(map[string]int)

	// Look at the last few calls to detect patterns
	startIndex := 0
	if len(recentCalls) > 5 {
		startIndex = len(recentCalls) - 5
	}

	for i := startIndex; i < len(recentCalls); i++ {
		functionName := recentCalls[i].FunctionCall.Name
		functionCallHistory[functionName]++

		// If any function has been called too many times recently, it's likely a loop
		if functionCallHistory[functionName] > sm.maxSameFunctionRepeats {
			log.Printf("🛑 Infinite loop detected: %s called %d times", functionName, functionCallHistory[functionName])
			return true
		}
	}

	return false
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

// GetSynthesisPromptSuffix returns the appropriate prompt suffix based on strategy
func (sm *SynthesisManager) GetSynthesisPromptSuffix(decision *SynthesisDecision, providerType string) string {
	if decision.ForceCompletion {
		return "\n\n**IMPORTANT: You now have sufficient information to complete the user's request. Please provide a comprehensive final response using the data above. Do not call additional functions.**"
	}

	if providerType == "gemini" {
		return "\n\nPlease analyze the data above and determine how to best address the user's original request. You may call additional functions to gather more specific information if needed, or provide a final response if you have sufficient data to fully answer the user's question."
	}

	if providerType == "kimi" {
		return "\n\nBased on the function results above, please continue with the user's request. You may call additional functions if more information is needed, or provide a complete response if you have all necessary data."
	}

	// Default neutral prompt
	return "\n\nPlease analyze the data above and determine the best way to address the user's original request."
}

// LogDecision logs the synthesis decision for debugging
func (sm *SynthesisManager) LogDecision(decision *SynthesisDecision, config *SynthesisConfig) {
	log.Printf("🧠 Synthesis Decision: %s", decision.Reason)
	log.Printf("🔧 Provider: %s, Depth: %d, Tools: %d, Allow Functions: %v",
		config.ProviderType, config.Depth, len(decision.Tools), decision.AllowFunctionCalls)
}
