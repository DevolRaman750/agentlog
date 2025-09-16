package adapters

import (
	"context"
	"fmt"
	"time"

	"gogent/internal/gogent"
	"gogent/internal/interfaces"
	"gogent/internal/types"

	"github.com/google/uuid"
)

// GoGentClientAdapter adapts the current gogent.Client to implement our interfaces
type GoGentClientAdapter struct {
	client *gogent.Client
	userID string // Store user ID for all operations
}

// NewGoGentClientAdapter creates a new adapter for the gogent client
func NewGoGentClientAdapter(client *gogent.Client, userID string) *GoGentClientAdapter {
	return &GoGentClientAdapter{
		client: client,
		userID: userID,
	}
}

// Ensure the adapter implements all required interfaces
var (
	_ interfaces.MultiVariationExecutor = (*GoGentClientAdapter)(nil)
	_ interfaces.ExecutionLogger        = (*GoGentClientAdapter)(nil)
	_ interfaces.ConfigurationManager   = (*GoGentClientAdapter)(nil)
	_ interfaces.ResultComparator       = (*GoGentClientAdapter)(nil)
	_ interfaces.GoGentClient           = (*GoGentClientAdapter)(nil)
)

// MultiVariationExecutor interface implementation

func (adapter *GoGentClientAdapter) ExecuteMultiVariation(ctx context.Context, request *types.MultiExecutionRequest) (*types.ExecutionResult, error) {
	return adapter.client.ExecuteMultiVariation(ctx, adapter.userID, request)
}

func (adapter *GoGentClientAdapter) ExecuteSingleVariation(ctx context.Context, config *types.APIConfiguration, prompt, context string) (*types.VariationResult, error) {
	// Create a mini multi-execution with just one configuration
	request := &types.MultiExecutionRequest{
		ExecutionRunName: fmt.Sprintf("single-variation-%s", config.VariationName),
		Description:      "Single variation execution",
		BasePrompt:       prompt,
		Context:          context,
		Configurations:   []types.APIConfiguration{*config},
	}

	result, err := adapter.client.ExecuteMultiVariation(ctx, adapter.userID, request)
	if err != nil {
		return nil, err
	}

	if len(result.Results) == 0 {
		return nil, fmt.Errorf("no results returned from execution")
	}

	return &result.Results[0], nil
}

func (adapter *GoGentClientAdapter) Close() error {
	return adapter.client.Close()
}

// ExecutionLogger interface implementation

func (adapter *GoGentClientAdapter) CreateExecutionRun(ctx context.Context, name, description string, enableFunctionCalling bool) (*types.ExecutionRun, error) {
	return adapter.client.CreateExecutionRun(ctx, adapter.userID, name, description, enableFunctionCalling, nil)
}

func (adapter *GoGentClientAdapter) LogAPIRequest(ctx context.Context, request *types.APIRequest) error {
	return adapter.client.LogAPIRequest(ctx, adapter.userID, request)
}

func (adapter *GoGentClientAdapter) LogAPIResponse(ctx context.Context, response *types.APIResponse) error {
	return adapter.client.LogAPIResponse(ctx, adapter.userID, response)
}

func (adapter *GoGentClientAdapter) LogFunctionCall(ctx context.Context, call *types.FunctionCall) error {
	return adapter.client.LogFunctionCall(ctx, call)
}

func (adapter *GoGentClientAdapter) GetExecutionRun(ctx context.Context, id string) (*types.ExecutionRun, error) {
	return adapter.client.GetExecutionRun(ctx, adapter.userID, id)
}

func (adapter *GoGentClientAdapter) ListExecutionRuns(ctx context.Context, limit, offset int) ([]*types.ExecutionRun, error) {
	return adapter.client.ListExecutionRuns(ctx, adapter.userID, int32(limit), int32(offset))
}

// ConfigurationManager interface implementation

func (adapter *GoGentClientAdapter) CreateConfiguration(ctx context.Context, config *types.APIConfiguration) error {
	return adapter.client.CreateAPIConfiguration(ctx, adapter.userID, config)
}

func (adapter *GoGentClientAdapter) GetConfiguration(ctx context.Context, id string) (*types.APIConfiguration, error) {
	// Get single configuration by ID
	configs, err := adapter.client.ListAPIConfigurationsByUser(ctx, adapter.userID, 1000, 0)
	if err != nil {
		return nil, err
	}

	for _, config := range configs {
		if config.ID == id {
			return &config, nil
		}
	}

	return nil, fmt.Errorf("configuration with ID %s not found", id)
}

func (adapter *GoGentClientAdapter) ListConfigurations(ctx context.Context, _ string) ([]*types.APIConfiguration, error) {
	// List all configurations for user (filtered by execution run if needed)
	configs, err := adapter.client.ListAPIConfigurationsByUser(ctx, adapter.userID, 1000, 0)
	if err != nil {
		return nil, err
	}

	// Convert []types.APIConfiguration to []*types.APIConfiguration
	result := make([]*types.APIConfiguration, len(configs))
	for i := range configs {
		result[i] = &configs[i]
	}

	return result, nil
}

func (adapter *GoGentClientAdapter) UpdateConfiguration(ctx context.Context, config *types.APIConfiguration) error {
	return adapter.client.UpdateAPIConfiguration(ctx, adapter.userID, config)
}

func (adapter *GoGentClientAdapter) DeleteConfiguration(ctx context.Context, id string) error {
	return adapter.client.DeleteAPIConfiguration(ctx, id, adapter.userID)
}

// ResultComparator interface implementation

func (adapter *GoGentClientAdapter) CompareResults(_ context.Context, result *types.ExecutionResult, metrics []string) (*types.ComparisonResult, error) {
	// Basic comparison implementation - this could be enhanced later
	comparison := &types.ComparisonResult{
		ID:                  uuid.New().String(),
		ExecutionRunID:      result.ExecutionRun.ID,
		ComparisonType:      "basic",
		MetricName:          "execution_metrics",
		ConfigurationScores: make(map[string]interface{}),
		AnalysisNotes:       fmt.Sprintf("Compared %d configurations using metrics: %v", len(result.Results), metrics),
		CreatedAt:           time.Now(),
	}

	// Add metrics to configuration scores
	comparison.ConfigurationScores["total_variations"] = len(result.Results)
	comparison.ConfigurationScores["success_count"] = result.SuccessCount
	comparison.ConfigurationScores["error_count"] = result.ErrorCount
	comparison.ConfigurationScores["total_time_ms"] = result.TotalTime

	// Find best configuration by execution time or success rate
	var bestConfig *types.APIConfiguration
	var bestTime int64 = 999999999
	for _, res := range result.Results {
		if res.ExecutionTime < bestTime && res.Response.ResponseStatus == "success" {
			bestTime = res.ExecutionTime
			bestConfig = &res.Configuration
		}
	}

	if bestConfig != nil {
		comparison.BestConfigurationID = bestConfig.ID
		comparison.BestConfiguration = bestConfig
	}

	// Add all configurations
	allConfigs := make([]types.APIConfiguration, len(result.Results))
	for i, res := range result.Results {
		allConfigs[i] = res.Configuration
	}
	comparison.AllConfigurations = allConfigs

	return comparison, nil
}

func (adapter *GoGentClientAdapter) SaveComparison(ctx context.Context, comparison *types.ComparisonResult) error {
	return adapter.client.StoreComparisonResult(ctx, adapter.userID, comparison)
}

func (adapter *GoGentClientAdapter) GetComparison(ctx context.Context, executionRunID string) (*types.ComparisonResult, error) {
	return adapter.client.GetComparisonResult(ctx, executionRunID)
}

func (adapter *GoGentClientAdapter) ListComparisons(ctx context.Context, executionRunID string) ([]*types.ComparisonResult, error) {
	return adapter.client.ListComparisonResults(ctx, executionRunID)
}

// GetUnderlyingClient returns the underlying gogent client for advanced usage
func (adapter *GoGentClientAdapter) GetUnderlyingClient() *gogent.Client {
	return adapter.client
}
