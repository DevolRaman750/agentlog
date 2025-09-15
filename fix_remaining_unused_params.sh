#!/bin/bash

echo "🔧 Fixing remaining unused parameters..."

# Fix GitHub integration unused parameters
sed -i '' -E 's/func \(g \*Integration\) CreateFileOnBranch\(ctx context\.Context, owner, repo, filePath, content, message, branch string, funcDef \*db\.FunctionDefinition\)/func (g *Integration) CreateFileOnBranch(ctx context.Context, owner, repo, filePath, content, message, branch string, _ *db.FunctionDefinition)/g' internal/gogent/integrations/github/integration.go
sed -i '' -E 's/func \(g \*Integration\) UpdateFileOnBranch\(ctx context\.Context, owner, repo, filePath, content, message, branch string, funcDef \*db\.FunctionDefinition\)/func (g *Integration) UpdateFileOnBranch(ctx context.Context, owner, repo, filePath, content, message, branch string, _ *db.FunctionDefinition)/g' internal/gogent/integrations/github/integration.go

# Fix basic comparator unused parameter
sed -i '' -E 's/func \(bc \*BasicComparator\) Store\(ctx context\.Context, userID string, comp \*types\.ComparisonResult\)/func (bc *BasicComparator) Store(ctx context.Context, _ string, comp *types.ComparisonResult)/g' pkg/engine/basic_comparator.go

# Fix adapters unused parameters
sed -i '' -E 's/func \(a \*GoGentAdapter\) LogExecutionFlowEvent\(ctx context\.Context, userID string, event \*types\.ExecutionFlowEvent, executionRunID string\)/func (a *GoGentAdapter) LogExecutionFlowEvent(ctx context.Context, userID string, event *types.ExecutionFlowEvent, _ string)/g' internal/adapters/gogent_adapter.go
sed -i '' -E 's/func \(a \*GoGentAdapter\) GetExecutionFlowEvents\(ctx context\.Context, executionRunID string, sequence int\)/func (a *GoGentAdapter) GetExecutionFlowEvents(_ context.Context, executionRunID string, sequence int)/g' internal/adapters/gogent_adapter.go

# Fix apikeys service unused parameters
sed -i '' -E 's/func \(s \*Service\) GetAPIKeyStatistics\(ctx context\.Context, userID string\)/func (s *Service) GetAPIKeyStatistics(_ context.Context, userID string)/g' internal/apikeys/service.go
sed -i '' -E 's/func \(s \*Service\) GetAPIKeyUsageLogs\(ctx context\.Context, userID string, limit, offset int\)/func (s *Service) GetAPIKeyUsageLogs(_ context.Context, userID string, limit, offset int)/g' internal/apikeys/service.go

# Fix slack integration unused parameter
sed -i '' -E 's/func \(s \*Integration\) ProcessResponse\(resp \*http\.Response, funcDef \*db\.FunctionDefinition\)/func (s *Integration) ProcessResponse(resp *http.Response, _ *db.FunctionDefinition)/g' internal/gogent/integrations/slack/integration.go

# Fix api management unused parameter
sed -i '' -E 's/func \(c \*Client\) ListAPIConfigurationsByUser\(ctx context\.Context, userID string, _ int32, offset int32\)/func (c *Client) ListAPIConfigurationsByUser(ctx context.Context, userID string, _ int32, _ int32)/g' internal/gogent/api_management.go

echo "✅ Remaining unused parameters fixed!"
