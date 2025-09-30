# Execution Flow Analysis: Model Function Calling Loops

## Problem Summary

**Issue:** Non-K2 models (like GPT-4o-mini, Claude, etc.) are repeating the same function calls over and over, while K2 works correctly.

**Evidence from logs:**
- K2 model (execution `3ef35bb1-a951-47db-bae4-b08a091ad4e4`): Calls 7 different functions, completes after reaching max depth of 6 iterations ✅
- GPT-4o-mini model (execution `e42b7b47-71d3-4035-a9c2-38305394e6fb`): Calls `github_read_issues` **14 times** with identical or similar parameters, eventually hits max depth ❌

## Root Cause Analysis

### 1. **Incomplete Loop Detection**

The synthesis manager (`internal/gogent/synthesis_manager.go`) has loop detection logic, but it only checks for specific functions:

```go
// Lines 156-190: Special handling for specific functions
- slack_read_messages
- slack_find_channel
- team_task_list
- team_memory_read
- team_memory_search
```

**Missing:** `github_read_issues` and many other API functions are NOT in the loop detection list!

### 2. **Provider-Specific Synthesis Flow**

The code has two different synthesis paths:

#### **K2/Kimi Path** (Working correctly):
```
callGeminiAPI() 
  → Uses KimiProvider 
  → synthesizeProviderResponse()
  → processProviderSynthesisWithIteration() [Max 6 iterations]
  → SynthesisManager.DetermineSynthesisStrategy()
```

#### **Other Models Path** (Has issues):
```
callGeminiAPI()
  → Uses respective provider (OpenAI, Anthropic, etc.)
  → synthesizeProviderResponse()
  → processProviderSynthesisWithIteration() [Max 6 iterations]
  → SynthesisManager.DetermineSynthesisStrategy()
```

Both use the same synthesis manager, but the loop detection is insufficient.

### 3. **Why K2 Works Better**

Looking at the logs, K2 naturally stops calling functions after it has enough data. Other models don't have the same "intuition" about when to stop and keep calling the same functions.

### 4. **Caching Helps But Doesn't Solve**

The system has function call caching:
```
🔗 [FUNCTION_CALL] INFO: Function call cache hit: github_read_issues (avoiding duplicate API call)
```

This prevents **duplicate API calls** but doesn't prevent the **synthesis loop** - the model still "thinks" it's calling the function and wasting tokens/time.

## Solution Strategy

### **Approach 1: Universal Loop Detection (Recommended)**

Add generic loop detection for ANY function, not just specific ones.

#### Changes needed in `synthesis_manager.go`:

```go
func (sm *SynthesisManager) detectIdenticalFunctionLoop(functionCalls []ResponsePart) bool {
	if len(functionCalls) < 3 {
		return false
	}

	// NEW: Generic loop detection for ANY function
	// Check if the same function is called 3+ times consecutively with similar parameters
	recentCount := 3
	recent := functionCalls[len(functionCalls)-recentCount:]
	
	if len(recent) == recentCount {
		firstFunc := recent[0].FunctionCall.Name
		
		// Check if all recent calls are the same function
		sameFunction := true
		for i := 1; i < recentCount; i++ {
			if recent[i].FunctionCall.Name != firstFunc {
				sameFunction = false
				break
			}
		}
		
		if sameFunction {
			// For ANY function called 3+ times, check parameter similarity
			similarParams := true
			firstArgs := fmt.Sprintf("%v", recent[0].FunctionCall.Args)
			
			for i := 1; i < recentCount; i++ {
				currentArgs := fmt.Sprintf("%v", recent[i].FunctionCall.Args)
				
				// If parameters are > 80% similar, consider it a loop
				similarity := calculateSimilarity(firstArgs, currentArgs)
				if similarity < 0.8 {
					similarParams = false
					break
				}
			}
			
			if similarParams {
				log.Printf("🔄 [LOOP] Detected generic function loop: %s called %d times with similar parameters", 
					firstFunc, recentCount)
				return true
			}
		}
	}
	
	// Rest of existing logic...
}
```

### **Approach 2: Better Prompt Engineering**

The synthesis prompts need to be more explicit about when to stop:

```go
// In processProviderSynthesisWithIteration(), line 820-855
newSynthesisPrompt += `

**FUNCTION CALLING GUIDELINES:**
1. AVOID calling the same function multiple times with identical or very similar parameters
2. If a function returns data, USE that data instead of calling the function again
3. If you've already called a function and it succeeded, DO NOT call it again
4. Focus on completing the user's request with the data you have
5. Only call NEW functions if you need DIFFERENT data

`
```

### **Approach 3: Stricter Limits for Non-K2 Models**

```go
// In SynthesisManager.DetermineSynthesisStrategy()
maxCalls := 15
if config.ProviderType == "gemini" {
	maxCalls = 12
} else if config.ProviderType != "kimi" {
	// Stricter limits for other models
	maxCalls = 8  // Reduced from 15
}
```

### **Approach 4: Function Call History in Prompt**

Make the model more aware of what it has already called:

```go
// Add to synthesis prompt
if len(functionCalls) > 0 {
	newSynthesisPrompt += "\n**Functions you have already called:**\n"
	functionCallCounts := make(map[string]int)
	for _, fc := range functionCalls {
		functionCallCounts[fc.FunctionCall.Name]++
	}
	
	for funcName, count := range functionCallCounts {
		if count > 1 {
			newSynthesisPrompt += fmt.Sprintf("- %s: called %d times (DO NOT call again)\n", funcName, count)
		} else {
			newSynthesisPrompt += fmt.Sprintf("- %s: called once\n", funcName)
		}
	}
	newSynthesisPrompt += "\n"
}
```

## Recommended Implementation Plan

1. **Phase 1: Add Universal Loop Detection** (High Priority)
   - Modify `detectIdenticalFunctionLoop()` to catch ANY repeated function
   - Add parameter similarity checking
   - Test with GPT-4o-mini, Claude, and other models

2. **Phase 2: Improve Synthesis Prompts** (Medium Priority)
   - Add function calling guidelines to synthesis prompts
   - Include function call history
   - Make it explicit when to stop calling functions

3. **Phase 3: Model-Specific Tuning** (Low Priority)
   - Adjust limits per model type based on empirical data
   - Fine-tune prompt engineering per provider

## Testing Strategy

1. Create a test execution that triggers the loop (e.g., GitHub issues query)
2. Run with multiple models: K2, GPT-4o-mini, Claude, Gemini
3. Monitor logs for:
   - Number of function calls
   - Number of repeated calls
   - Loop detection triggers
   - Execution completion time

## Expected Outcomes

- **Before:** GPT-4o-mini calls `github_read_issues` 14 times
- **After:** GPT-4o-mini calls `github_read_issues` 1-2 times, then completes

## Metrics to Track

- Function calls per execution (by model)
- Repeated function calls (by model)
- Execution time (by model)
- Token usage (by model)
- User satisfaction with responses

