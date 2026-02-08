# Extensible API Plugin Architecture

## Current Problems
- Hardcoded authentication logic for each API
- Hardcoded URL building for GitHub
- Hardcoded error handling for Slack
- No consistent pattern for adding new APIs

## Proposed Solution: API Plugin System

### 1. Define API Plugin Interface

```go
// APIPlugin defines the interface that all API integrations must implement
type APIPlugin interface {
    // Name returns the unique identifier for this API (e.g., "slack", "discord", "salesforce")
    Name() string
    
    // FunctionGroup returns the function group this plugin handles (e.g., "communication", "crm")
    FunctionGroup() string
    
    // BuildURL constructs the API URL for the given function and arguments
    BuildURL(functionName string, args map[string]interface{}, funcDef *db.FunctionDefinition) (string, error)
    
    // SetAuthentication adds authentication headers/params to the request
    SetAuthentication(req *http.Request, apiKeys *types.APIKeys) error
    
    // HandleResponse processes the API response and returns structured data or error
    HandleResponse(responseData interface{}, statusCode int) (map[string]interface{}, error)
    
    // GetDefaultHeaders returns default headers for this API
    GetDefaultHeaders() map[string]string
    
    // ProcessRequestBody modifies request body based on API requirements
    ProcessRequestBody(args map[string]interface{}, httpMethod string) (map[string]interface{}, error)
}
```

### 2. Implement Specific API Plugins

```go
// SlackPlugin implements the APIPlugin interface for Slack
type SlackPlugin struct{}

func (s *SlackPlugin) Name() string { return "slack" }
func (s *SlackPlugin) FunctionGroup() string { return "communication" }

func (s *SlackPlugin) BuildURL(functionName string, args map[string]interface{}, funcDef *db.FunctionDefinition) (string, error) {
    // Use the endpoint_url from function definition for Slack
    return funcDef.EndpointURL.String, nil
}

func (s *SlackPlugin) SetAuthentication(req *http.Request, apiKeys *types.APIKeys) error {
    if apiKeys.SlackBotToken == "" {
        return fmt.Errorf("no Slack bot token available")
    }
    req.Header.Set("Authorization", "Bearer " + apiKeys.SlackBotToken)
    return nil
}

func (s *SlackPlugin) HandleResponse(responseData interface{}, statusCode int) (map[string]interface{}, error) {
    if responseMap, ok := responseData.(map[string]interface{}); ok {
        if okField, exists := responseMap["ok"]; exists {
            if ok, isBool := okField.(bool); isBool && !ok {
                errorMsg := "unknown error"
                if errorField, hasError := responseMap["error"]; hasError {
                    errorMsg = fmt.Sprintf("%v", errorField)
                }
                return nil, fmt.Errorf("Slack API error: %s", errorMsg)
            }
        }
    }
    return responseData.(map[string]interface{}), nil
}

// DiscordPlugin implements the APIPlugin interface for Discord
type DiscordPlugin struct{}

func (d *DiscordPlugin) Name() string { return "discord" }
func (d *DiscordPlugin) FunctionGroup() string { return "communication" }

func (d *DiscordPlugin) HandleResponse(responseData interface{}, statusCode int) (map[string]interface{}, error) {
    // Discord has different error patterns than Slack
    if statusCode >= 400 {
        return nil, fmt.Errorf("Discord API error: %d", statusCode)
    }
    return responseData.(map[string]interface{}), nil
}

// SalesforcePlugin implements the APIPlugin interface for Salesforce
type SalesforcePlugin struct{}

func (s *SalesforcePlugin) Name() string { return "salesforce" }
func (s *SalesforcePlugin) FunctionGroup() string { return "crm" }

func (s *SalesforcePlugin) SetAuthentication(req *http.Request, apiKeys *types.APIKeys) error {
    if apiKeys.SalesforceToken == "" {
        return fmt.Errorf("no Salesforce token available")
    }
    req.Header.Set("Authorization", "Bearer " + apiKeys.SalesforceToken)
    return nil
}
```

### 3. Plugin Registry

```go
type APIPluginRegistry struct {
    plugins map[string]APIPlugin
}

func NewAPIPluginRegistry() *APIPluginRegistry {
    registry := &APIPluginRegistry{
        plugins: make(map[string]APIPlugin),
    }
    
    // Register all available plugins
    registry.Register(&SlackPlugin{})
    registry.Register(&DiscordPlugin{})
    registry.Register(&SalesforcePlugin{})
    registry.Register(&GitHubPlugin{})
    
    return registry
}

func (r *APIPluginRegistry) Register(plugin APIPlugin) {
    r.plugins[plugin.Name()] = plugin
}

func (r *APIPluginRegistry) GetPlugin(functionGroup, functionName string) APIPlugin {
    // Smart detection based on function name prefix or group
    for _, plugin := range r.plugins {
        if plugin.FunctionGroup() == functionGroup {
            if strings.HasPrefix(functionName, plugin.Name()+"_") {
                return plugin
            }
        }
    }
    return nil
}
```

### 4. Refactored executeAPIFunction

```go
func (c *Client) executeAPIFunction(ctx context.Context, funcDef *db.FunctionDefinition, args map[string]interface{}) (map[string]interface{}, error) {
    // Get the appropriate plugin for this function
    plugin := c.pluginRegistry.GetPlugin(funcDef.FunctionGroup, funcDef.Name)
    if plugin == nil {
        // Fallback to generic handling
        return c.executeGenericAPIFunction(ctx, funcDef, args)
    }
    
    // Use plugin to build URL
    url, err := plugin.BuildURL(funcDef.Name, args, funcDef)
    if err != nil {
        return nil, fmt.Errorf("failed to build URL: %w", err)
    }
    
    // Create request
    req, err := http.NewRequestWithContext(ctx, httpMethod, url, requestBody)
    if err != nil {
        return nil, fmt.Errorf("failed to create HTTP request: %w", err)
    }
    
    // Use plugin to set authentication
    if err := plugin.SetAuthentication(req, c.getEffectiveApiKeys()); err != nil {
        return nil, fmt.Errorf("authentication failed: %w", err)
    }
    
    // Add plugin-specific headers
    for key, value := range plugin.GetDefaultHeaders() {
        req.Header.Set(key, value)
    }
    
    // Make request and get response...
    
    // Use plugin to handle response
    result, err := plugin.HandleResponse(responseData, resp.StatusCode)
    if err != nil {
        return nil, err
    }
    
    return result, nil
}
```

## Benefits of This Architecture

1. **Easy to Add New APIs**: Just implement the APIPlugin interface
2. **No Code Changes to Core**: New APIs don't require touching executeAPIFunction
3. **Consistent Patterns**: All APIs follow the same interface
4. **Testable**: Each plugin can be unit tested independently
5. **Maintainable**: API-specific logic is isolated
6. **Configurable**: Plugin behavior can be configured per API

## Adding Discord Would Be:

1. Create `DiscordPlugin` struct
2. Implement the 7 interface methods
3. Register it in the registry
4. Add Discord functions to database

**No changes to core execution logic needed!**