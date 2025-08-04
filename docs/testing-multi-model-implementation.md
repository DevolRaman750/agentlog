# Testing Multi-Model Implementation

This guide covers how to test the new multi-model provider abstraction with Kimi K2 support.

## Setup

### 1. Get API Keys

**OpenRouter API Key (for Kimi K2):**
1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Sign up and get an API key (starts with `sk-or-`)
3. Fund your account with credits

**Gemini API Key (existing):**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key (starts with `AIza`)

### 2. Configure API Keys

In the frontend API Keys screen:

- **Gemini API Key**: Your existing Google Gemini key
- **OpenRouter API Key**: Your new OpenRouter key (`sk-or-...`)

## Testing Plan

### Phase 1: Basic Model Selection

1. **Frontend Model Selection**
   ```
   ✅ Verify Kimi K2 models appear in model selector:
      - moonshotai/kimi-k2-instruct (recommended)
      - moonshotai/kimi-k2
   ```

2. **API Key Validation**
   ```
   ✅ Test OpenRouter API key validation:
      - Invalid format should show error
      - Valid sk-or- format should be accepted
      - Empty key should work (fallback to mock)
   ```

### Phase 2: Simple Text Generation

1. **Gemini Models (Baseline)**
   ```
   ✅ Test with gemini-1.5-flash:
      Prompt: "Explain quantum computing in simple terms"
      Expected: Standard Gemini response
   ```

2. **Kimi K2 Models**
   ```
   ✅ Test with moonshotai/kimi-k2-instruct:
      Prompt: "Explain quantum computing in simple terms"
      Expected: Kimi K2 response via OpenRouter
   ```

### Phase 3: Function Calling

1. **GitHub Functions**
   ```
   ✅ Test with Gemini:
      Prompt: "Analyze the README file in microsoft/vscode repository"
      Expected: Calls github_read_code function, returns analysis
   
   ✅ Test with Kimi K2:
      Same prompt
      Expected: Same function calls, potentially better code analysis
   ```

2. **Weather Functions**
   ```
   ✅ Test with both models:
      Prompt: "What's the weather like in Tokyo?"
      Expected: Calls get_weather function, returns current weather
   ```

3. **Neo4j Functions** (if configured)
   ```
   ✅ Test graph queries with both models:
      Prompt: "Find all nodes connected to user with ID 123"
      Expected: Calls neo4j_query function
   ```

### Phase 4: Complex Multi-Function Tasks

1. **Software Engineering Task**
   ```
   ✅ Test with both models:
      Prompt: "Analyze the React components in facebook/react repository and suggest improvements"
      Expected: 
      - Multiple github_read_code calls
      - Code analysis
      - Structured recommendations
      - Compare Kimi K2 vs Gemini quality
   ```

2. **Research Task**
   ```
   ✅ Test iterative function calling:
      Prompt: "Research GitHub issues about performance in the Next.js repository and summarize trends"
      Expected:
      - github_read_issues calls
      - Data analysis
      - Trend identification
   ```

## Validation Checklist

### Backend Provider System

- [ ] ProviderFactory correctly detects model types
- [ ] Kimi provider creates OpenRouter requests correctly
- [ ] Gemini provider maintains backward compatibility
- [ ] Function calls convert properly between formats
- [ ] Error handling falls back gracefully
- [ ] Logging shows provider selection clearly

### Frontend Integration

- [ ] Model selector shows Kimi K2 options
- [ ] API key management handles OpenRouter keys
- [ ] Configuration persistence works
- [ ] Error messages are clear and helpful

### Function Calling Compatibility

- [ ] All existing GitHub functions work with Kimi K2
- [ ] Weather functions work with both providers
- [ ] Neo4j functions work with both providers
- [ ] Function parameter validation is consistent
- [ ] Response parsing handles both providers

## Expected Log Output

### Successful Kimi K2 Call
```
🤖 Using kimi provider for model: moonshotai/kimi-k2-instruct
✅ Created kimi provider for model moonshotai/kimi-k2-instruct
🤖 Kimi K2 request - Model: moonshotai/kimi-k2-instruct, Tools: 2, Prompt length: 45
🔧 Added 2 tools for Kimi K2 function calling
✅ Kimi K2 response - Text: 150 chars, Function calls: 1, Time: 1250ms
🔧 Processing 1 function calls from kimi
```

### Successful Gemini Call
```
🤖 Using gemini provider for model: gemini-1.5-flash
✅ Created gemini provider for model gemini-1.5-flash
🤖 Gemini request - Model: gemini-1.5-flash, Tools: 2, Prompt length: 45
✅ Gemini response - Text: 120 chars, Function calls: 1, Time: 800ms
🔧 Processing 1 function calls from gemini
```

## Performance Comparison

Track these metrics:
- **Response Time**: Kimi vs Gemini for same prompts
- **Function Call Accuracy**: Which model calls the right functions
- **Code Quality**: For software engineering tasks
- **Cost**: OpenRouter vs direct Gemini pricing

## Troubleshooting

### Common Issues

1. **"Failed to create kimi provider"**
   - Check OpenRouter API key format (must start with sk-or-)
   - Verify API key has credits
   - Check network connectivity

2. **"Model not supported"**
   - Verify model name matches exactly
   - Check provider factory model detection logic

3. **Function calls not working**
   - Verify tools are properly converted between formats
   - Check function call response parsing
   - Ensure function execution logic is unchanged

### Debug Commands

**Check provider factory:**
```go
factory := providers.NewProviderFactory()
supportedModels := factory.GetSupportedModels()
fmt.Printf("Supported models: %+v\n", supportedModels)
```

**Validate model config:**
```go
config := &types.APIConfiguration{ModelName: "moonshotai/kimi-k2-instruct"}
err := factory.ValidateModelConfig(config)
fmt.Printf("Validation result: %v\n", err)
```

## Success Criteria

The implementation is successful when:

1. ✅ All existing Gemini functionality continues to work
2. ✅ Kimi K2 models are available and functional
3. ✅ Function calling works with both providers
4. ✅ Error handling is graceful
5. ✅ Performance is comparable or better
6. ✅ API key management is user-friendly
7. ✅ Logging provides clear provider information

This foundation enables easy addition of future models (GPT-4, Claude, etc.) using the same provider pattern. 