# Multi-Model Integration Strategy

## Overview

This document outlines the strategy for adding support for multiple AI model providers (like Kimi K2) to the existing Gemini-based system while maintaining compatibility with current function calling and prompt configurations.

## Current Architecture Analysis

### Existing Components
1. **Gemini Client** (`internal/gemini/client.go`) - Simple wrapper for Gemini REST API
2. **Main Business Logic** (`internal/gogent/client.go`) - Contains complex function calling logic
3. **Function Execution** - Dynamic function system using database definitions
4. **Frontend Model Selection** - Currently limited to Gemini models
5. **Configuration System** - Hardcoded for Gemini parameters

### Key Insights
- **Function calling is provider-agnostic** - Your existing function definitions and execution logic can work with any model
- **Kimi K2 uses OpenAI-compatible function calling** - Same JSON schema format as many providers
- **The core function execution logic doesn't need to change** - Only the model interaction layer needs abstraction

## Implementation Strategy

### Phase 1: Add Frontend Support (COMPLETED)
✅ **Frontend model selection updated** to include Kimi K2 models:
- `moonshotai/kimi-k2-instruct` (recommended)
- `moonshotai/kimi-k2`

### Phase 2: Create Model Provider Abstraction

#### 2.1 Provider Interface
Create a simple interface that all providers must implement:

```go
// internal/providers/interface.go
type ModelProvider interface {
    GenerateWithFunctions(ctx context.Context, config *ModelConfig, tools []Tool) (*ModelResponse, error)
    GetProviderType() string
    ValidateConfig(config *ModelConfig) error
}

type ModelConfig struct {
    ModelName     string
    SystemPrompt  string
    Temperature   *float32
    MaxTokens     *int32
    Tools         []Tool
    ApiKey        string
    BaseURL       string
}

type ModelResponse struct {
    Text          string
    FunctionCalls []FunctionCall
    Usage         map[string]interface{}
    FinishReason  string
}
```

#### 2.2 Kimi K2 Provider Implementation
```go
// internal/providers/kimi_provider.go
type KimiProvider struct {
    client *http.Client
    baseURL string
}

func (p *KimiProvider) GenerateWithFunctions(ctx context.Context, config *ModelConfig, tools []Tool) (*ModelResponse, error) {
    // Convert tools to OpenAI format
    openaiTools := make([]map[string]interface{}, len(tools))
    for i, tool := range tools {
        openaiTools[i] = map[string]interface{}{
            "type": "function",
            "function": map[string]interface{}{
                "name":        tool.Name,
                "description": tool.Description,
                "parameters":  tool.Parameters,
            },
        }
    }
    
    // Build OpenAI-compatible request
    request := map[string]interface{}{
        "model": config.ModelName,
        "messages": []map[string]interface{}{
            {"role": "system", "content": config.SystemPrompt},
            {"role": "user", "content": prompt},
        },
        "tools": openaiTools,
        "tool_choice": "auto",
        "temperature": 0.6, // Kimi K2 recommended
    }
    
    // Make HTTP request to OpenRouter or direct Kimi API
    // Parse response and extract function calls
    // Return standardized ModelResponse
}
```

#### 2.3 Gemini Provider Wrapper
```go
// internal/providers/gemini_provider.go
type GeminiProvider struct {
    client *gemini.GeminiClient
}

func (p *GeminiProvider) GenerateWithFunctions(ctx context.Context, config *ModelConfig, tools []Tool) (*ModelResponse, error) {
    // Convert to existing Gemini format and delegate to existing implementation
    // This maintains backward compatibility
}
```

### Phase 3: Update Main Business Logic

#### 3.1 Provider Factory Pattern
```go
// internal/gogent/client.go modifications
func (c *Client) createProvider(modelName string, apiKey string) (ModelProvider, error) {
    switch {
    case strings.HasPrefix(modelName, "gemini"):
        return NewGeminiProvider(apiKey)
    case strings.HasPrefix(modelName, "moonshotai/kimi"):
        return NewKimiProvider(apiKey, "https://openrouter.ai/api/v1")
    default:
        return nil, fmt.Errorf("unsupported model: %s", modelName)
    }
}
```

#### 3.2 Unified Function Calling Flow
The existing function calling logic in `internal/gogent/client.go` can remain largely unchanged:

1. **Function Discovery** - Same database-driven approach
2. **Function Execution** - Same `executeFunctionCall` method
3. **Response Processing** - Same iterative calling logic
4. **Only the model interaction changes** - Use provider interface instead of direct Gemini calls

### Phase 4: Configuration and API Key Management

#### 4.1 Enhanced Session Keys
```go
// internal/types/types.go
type SessionApiKeys struct {
    GeminiApiKey    string `json:"geminiApiKey,omitempty"`
    OpenRouterApiKey string `json:"openRouterApiKey,omitempty"` // For Kimi K2
    // Future providers...
}
```

#### 4.2 Model-Specific Configurations
```go
// Add to APIConfiguration
type APIConfiguration struct {
    // ... existing fields
    ProviderType string `json:"providerType,omitempty"` // "gemini", "kimi", etc.
    ProviderConfig map[string]interface{} `json:"providerConfig,omitempty"`
}
```

## Technical Implementation Details

### Function Calling Compatibility

**Gemini Format:**
```json
{
  "tools": [{
    "functionDeclarations": [{
      "name": "get_weather",
      "description": "Get weather info",
      "parameters": { "type": "object", "properties": {...} }
    }]
  }],
  "toolConfig": {"functionCallingConfig": {"mode": "AUTO"}}
}
```

**Kimi K2/OpenAI Format:**
```json
{
  "tools": [{
    "type": "function",
    "function": {
      "name": "get_weather", 
      "description": "Get weather info",
      "parameters": { "type": "object", "properties": {...} }
    }
  }],
  "tool_choice": "auto"
}
```

### API Key Management Strategies

1. **Option 1: OpenRouter (Recommended)**
   - Single API key for multiple models
   - Unified billing and rate limiting
   - Consistent OpenAI-compatible interface

2. **Option 2: Direct Provider APIs**
   - Separate API keys for each provider
   - Provider-specific rate limits and billing
   - Need to handle different API formats

### Migration Path

1. **Immediate** - Add Kimi K2 models to frontend (✅ Done)
2. **Week 1** - Implement basic Kimi provider with function calling
3. **Week 2** - Update main business logic to use provider pattern
4. **Week 3** - Add comprehensive testing and error handling
5. **Week 4** - Update documentation and deployment

## Code Changes Required

### Minimal Changes (Quick Implementation)
1. ✅ **Frontend**: Add Kimi models to `SUPPORTED_MODELS`
2. **Backend**: Add simple model detection in existing Gemini flow
3. **API**: Add Kimi API calls alongside Gemini calls

### Comprehensive Changes (Better Architecture)
1. **Create provider interface and implementations**
2. **Refactor main business logic to use providers**
3. **Update configuration system for multi-provider support**
4. **Enhanced error handling and validation**

## Benefits of This Approach

1. **Backwards Compatibility** - Existing Gemini configurations continue to work
2. **Function Calling Preservation** - All existing function definitions work with new models
3. **Easy Extension** - Adding new providers follows the same pattern
4. **Performance** - No significant performance impact
5. **Maintainability** - Clear separation of concerns

## Example Usage

After implementation, users could:

```javascript
// Frontend - Select Kimi K2
const config = {
  modelName: "moonshotai/kimi-k2-instruct",
  temperature: 0.6,
  systemPrompt: "You are a helpful assistant with tool access"
}

// Backend automatically detects provider and uses appropriate API
// All existing functions (GitHub, Neo4j, weather, etc.) work unchanged
```

## Testing Strategy

1. **Unit Tests** - Each provider implementation
2. **Integration Tests** - Function calling with different providers
3. **Performance Tests** - Compare response times and quality
4. **A/B Testing** - Compare Gemini vs Kimi for same tasks

This strategy provides a clear path to multi-model support while preserving your investment in the existing function calling infrastructure. 