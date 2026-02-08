#!/bin/bash

echo "🔧 Fixing unused parameters..."

# Fix specific unused parameters
sed -i '' -E 's/func \(h \*GitHubPATHandler\) GetAuthCredentials\(ctx context\.Context, apiKey \*types\.UserAPIKey\)/func (h *GitHubPATHandler) GetAuthCredentials(_ context.Context, apiKey *types.UserAPIKey)/g' internal/apiauth/handlers.go
sed -i '' -E 's/func \(h \*SlackBotTokenHandler\) GetAuthCredentials\(ctx context\.Context, apiKey \*types\.UserAPIKey\)/func (h *SlackBotTokenHandler) GetAuthCredentials(_ context.Context, apiKey *types.UserAPIKey)/g' internal/apiauth/handlers.go
sed -i '' -E 's/func \(h \*GeminiAPIKeyHandler\) GetAuthCredentials\(ctx context\.Context, apiKey \*types\.UserAPIKey\)/func (h *GeminiAPIKeyHandler) GetAuthCredentials(_ context.Context, apiKey *types.UserAPIKey)/g' internal/apiauth/handlers.go

# Fix filepath.WalkDir unused parameters
sed -i '' -E 's/func\(path string, d fs\.DirEntry, err error\) error/func(path string, _ fs.DirEntry, err error) error/g' internal/gogent/system_sync.go

# Fix other unused parameters
sed -i '' -E 's/func \(c \*Client\) ListAPIConfigurationsByUser\(ctx context\.Context, userID string, limit, offset int32\)/func (c *Client) ListAPIConfigurationsByUser(ctx context.Context, userID string, _ int32, offset int32)/g' internal/gogent/api_management.go
sed -i '' -E 's/func \(l \*engineLogger\) FlowEvent\(name string, seq int, status string, payload map\[string\]interface\{\}\)/func (l *engineLogger) FlowEvent(name string, _ int, status string, payload map[string]interface{})/g' internal/gogent/engine_adapter.go
sed -i '' -E 's/func \(c \*Client\) processIterativeFunctionCalls\(ctx context\.Context, config \*types\.APIConfiguration, request \*types\.APIRequest, functionCalls \[\]ResponsePart, originalPrompt string\)/func (c *Client) processIterativeFunctionCalls(ctx context.Context, _ *types.APIConfiguration, request *types.APIRequest, functionCalls []ResponsePart, originalPrompt string)/g' internal/gogent/execution_engine.go
sed -i '' -E 's/func \(c \*Client\) detectTaskCompletion\(functionCalls \[\]ResponsePart, functionResults \[\]map\[string\]interface\{\}, depth int, originalPrompt string\)/func (c *Client) detectTaskCompletion(functionCalls []ResponsePart, _ []map[string]interface{}, depth int, originalPrompt string)/g' internal/gogent/execution_engine.go
sed -i '' -E 's/func \(sm \*SynthesisManager\) GetSynthesisPromptSuffix\(decision \*SynthesisDecision, providerType string\)/func (sm *SynthesisManager) GetSynthesisPromptSuffix(decision *SynthesisDecision, _ string)/g' internal/gogent/synthesis_manager.go

echo "✅ Unused parameters fixed!"
