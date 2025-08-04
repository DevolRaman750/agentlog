# Kimi K2 Integration - Practical Implementation Example

This document shows a practical example of how to add Kimi K2 support to your existing system with minimal code changes.

## Quick Implementation Approach

Instead of a complex provider abstraction, you can add Kimi K2 support by extending your existing `internal/gogent/client.go` with Kimi-specific handling.

### Step 1: Add Model Detection Helper

```go
// internal/gogent/client.go - Add this helper function

func (c *Client) isKimiModel(modelName string) bool {
    return strings.HasPrefix(modelName, "moonshotai/") || 
           strings.Contains(strings.ToLower(modelName), "kimi")
}

func (c *Client) getModelProvider(modelName string) string {
    if c.isKimiModel(modelName) {
        return "kimi"
    }
    return "gemini"
}
```

### Step 2: Add Kimi API Call Function

```go
// internal/gogent/client.go - Add this function for Kimi API calls

func (c *Client) callKimiAPI(ctx context.Context, config *types.APIConfiguration, prompt string, tools []types.Tool) (*types.APIResponse, []FunctionCall, error) {
    startTime := time.Now()
    
    // Build OpenAI-compatible request
    messages := []map[string]interface{}{
        {
            "role":    "user", 
            "content": prompt,
        },
    }
    
    if config.SystemPrompt != "" {
        messages = append([]map[string]interface{}{
            {"role": "system", "content": config.SystemPrompt},
        }, messages...)
    }
    
    requestBody := map[string]interface{}{
        "model":    config.ModelName,
        "messages": messages,
    }
    
    // Add generation parameters (Kimi K2 specific optimizations)
    if config.Temperature != nil {
        requestBody["temperature"] = *config.Temperature
    } else {
        requestBody["temperature"] = 0.6 // Kimi K2 recommended default
    }
    
    if config.MaxTokens != nil {
        requestBody["max_tokens"] = *config.MaxTokens
    }
    
    // Add tools if provided
    if len(tools) > 0 {
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
        requestBody["tools"] = openaiTools
        requestBody["tool_choice"] = "auto"
    }
    
    // Make HTTP request
    jsonBody, err := json.Marshal(requestBody)
    if err != nil {
        return nil, nil, fmt.Errorf("failed to marshal request: %w", err)
    }
    
    // Use OpenRouter endpoint
    url := "https://openrouter.ai/api/v1/chat/completions"
    req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
    if err != nil {
        return nil, nil, fmt.Errorf("failed to create request: %w", err)
    }
    
    // Get API key from session keys
    var apiKey string
    if c.sessionApiKeys != nil {
        // Try OpenRouter API key first, fallback to Gemini key for OpenRouter
        if c.sessionApiKeys.OpenRouterApiKey != "" {
            apiKey = c.sessionApiKeys.OpenRouterApiKey
        } else if strings.HasPrefix(c.sessionApiKeys.GeminiApiKey, "sk-or-") {
            apiKey = c.sessionApiKeys.GeminiApiKey
        }
    }
    
    if apiKey == "" {
        return nil, nil, fmt.Errorf("OpenRouter API key required for Kimi models")
    }
    
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
    
    client := &http.Client{Timeout: 60 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return nil, nil, fmt.Errorf("failed to make request: %w", err)
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, nil, fmt.Errorf("failed to read response: %w", err)
    }
    
    if resp.StatusCode != http.StatusOK {
        return nil, nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(body))
    }
    
    // Parse OpenAI-compatible response
    var openaiResp struct {
        Choices []struct {
            Message struct {
                Content   string `json:"content"`
                ToolCalls []struct {
                    Function struct {
                        Name      string `json:"name"`
                        Arguments string `json:"arguments"`
                    } `json:"function"`
                } `json:"tool_calls"`
            } `json:"message"`
            FinishReason string `json:"finish_reason"`
        } `json:"choices"`
        Usage map[string]interface{} `json:"usage"`
    }
    
    if err := json.Unmarshal(body, &openaiResp); err != nil {
        return nil, nil, fmt.Errorf("failed to parse response: %w", err)
    }
    
    var responseText string
    var functionCalls []FunctionCall
    var finishReason string
    
    if len(openaiResp.Choices) > 0 {
        choice := openaiResp.Choices[0]
        responseText = choice.Message.Content
        finishReason = choice.FinishReason
        
        // Parse function calls
        for _, toolCall := range choice.Message.ToolCalls {
            var args map[string]interface{}
            if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err != nil {
                log.Printf("Failed to parse function arguments: %v", err)
                continue
            }
            
            functionCalls = append(functionCalls, FunctionCall{
                Name: toolCall.Function.Name,
                Args: args,
            })
        }
    }
    
    response := &types.APIResponse{
        ResponseStatus: types.ResponseStatusSuccess,
        ResponseText:   responseText,
        UsageMetadata:  openaiResp.Usage,
        FinishReason:   finishReason,
        ResponseTimeMs: int32(time.Since(startTime).Milliseconds()),
    }
    
    return response, functionCalls, nil
}
```

### Step 3: Modify Main API Call Function

```go
// internal/gogent/client.go - Modify your main API calling function to route to the right provider

func (c *Client) generateContent(ctx context.Context, config *types.APIConfiguration, request *types.APIRequest) (*types.APIResponse, error) {
    provider := c.getModelProvider(config.ModelName)
    
    switch provider {
    case "kimi":
        response, functionCalls, err := c.callKimiAPI(ctx, config, request.Prompt, config.Tools)
        if err != nil {
            return nil, err
        }
        
        // If there are function calls, process them using your existing logic
        if len(functionCalls) > 0 {
            return c.processIterativeFunctionCalls(ctx, config, request, functionCalls, request.Prompt)
        }
        
        return response, nil
        
    case "gemini":
    default:
        // Use existing Gemini implementation
        return c.callGeminiWithExistingLogic(ctx, config, request)
    }
}
```

### Step 4: Update Function Call Types

```go
// internal/gogent/client.go - Add this type if it doesn't exist

type FunctionCall struct {
    Name string                 `json:"name"`
    Args map[string]interface{} `json:"args"`
}
```

## Benefits of This Approach

1. **Minimal Code Changes** - Extends existing architecture without major refactoring
2. **Maintains Compatibility** - All existing Gemini functionality continues to work
3. **Reuses Existing Logic** - Function execution and iterative calling logic unchanged
4. **Easy to Test** - Can gradually roll out to specific models/configurations

## Usage Example

With these changes, users can:

1. **Frontend**: Select "Kimi K2 Instruct" from model dropdown
2. **Backend**: Automatically detects Kimi model and uses OpenRouter API
3. **Function Calling**: Works exactly the same as with Gemini models
4. **API Keys**: Uses OpenRouterApiKey from session keys

```javascript
// Frontend configuration
const executionConfig = {
  modelName: "moonshotai/kimi-k2-instruct",
  temperature: 0.6,
  systemPrompt: "You are a helpful assistant with access to tools.",
  enableFunctionCalling: true
}

// Backend automatically routes to Kimi provider
// All existing GitHub, Neo4j, weather functions work unchanged
```

## Testing

Test the integration by:

1. Getting an OpenRouter API key
2. Selecting a Kimi model in the frontend
3. Running a simple function calling task
4. Comparing results with Gemini models

This approach gives you immediate Kimi K2 support while maintaining all your existing functionality. 