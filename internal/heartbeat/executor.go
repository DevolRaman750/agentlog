package heartbeat

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"gogent/internal/gogent"
	"gogent/internal/types"

	"github.com/google/uuid"
)

// HeartbeatExecutor manages the continuous execution of agents based on their heartbeat
type HeartbeatExecutor struct {
	config  *Config
	client  *gogent.Client
	queries *AgentQueries

	// Concurrency control
	executingSemaphore chan struct{}
	executingMutex     sync.RWMutex
	executingAgents    map[string]bool

	// Lifecycle management
	ctx    context.Context
	cancel context.CancelFunc
	done   chan struct{}
	wg     sync.WaitGroup

	// Metrics
	metrics *ExecutorMetrics
}

// ExecutorMetrics tracks execution statistics
type ExecutorMetrics struct {
	mutex                sync.RWMutex
	TotalExecutions      int64
	SuccessfulExecutions int64
	FailedExecutions     int64
	LastCheckTime        time.Time
	LastExecutionTime    time.Time
	ActiveExecutions     int32
	AgentsProcessed      int64
}

// NewHeartbeatExecutor creates a new HeartbeatExecutor instance
func NewHeartbeatExecutor(client *gogent.Client, config *Config) *HeartbeatExecutor {
	if config == nil {
		config = DefaultConfig()
	}

	// Validate and adjust config
	config.Validate()

	ctx, cancel := context.WithCancel(context.Background())

	return &HeartbeatExecutor{
		config:             config,
		client:             client,
		queries:            NewAgentQueries(client.GetDB()),
		executingSemaphore: make(chan struct{}, config.MaxConcurrentExecutions),
		executingAgents:    make(map[string]bool),
		ctx:                ctx,
		cancel:             cancel,
		done:               make(chan struct{}),
		metrics: &ExecutorMetrics{
			LastCheckTime: time.Now(),
		},
	}
}

// Start begins the heartbeat executor goroutine
func (he *HeartbeatExecutor) Start() error {
	if !he.config.Enabled {
		log.Printf("🔇 HeartbeatExecutor is disabled via configuration")
		return nil
	}

	log.Printf("🚀 Starting HeartbeatExecutor with config: check_interval=%v, max_concurrent=%d, enabled=%v",
		he.config.CheckInterval, he.config.MaxConcurrentExecutions, he.config.Enabled)

	he.wg.Add(1)
	go he.run()

	return nil
}

// Stop gracefully stops the heartbeat executor
func (he *HeartbeatExecutor) Stop() error {
	log.Printf("🛑 Stopping HeartbeatExecutor...")

	he.cancel()

	// Wait for main goroutine to finish
	he.wg.Wait()

	// Wait for all active executions to complete with timeout
	timeout := time.NewTimer(30 * time.Second)
	defer timeout.Stop()

	for {
		he.executingMutex.RLock()
		activeCount := len(he.executingAgents)
		he.executingMutex.RUnlock()

		if activeCount == 0 {
			break
		}

		select {
		case <-timeout.C:
			log.Printf("⚠️ Timeout waiting for %d active executions to complete", activeCount)
			close(he.done)
			return nil
		case <-time.After(100 * time.Millisecond):
			// Check again
		}
	}

	close(he.done)
	log.Printf("✅ HeartbeatExecutor stopped successfully")
	return nil
}

// run is the main execution loop
func (he *HeartbeatExecutor) run() {
	defer he.wg.Done()

	ticker := time.NewTicker(he.config.CheckInterval)
	defer ticker.Stop()

	log.Printf("🔄 HeartbeatExecutor started - checking every %v", he.config.CheckInterval)

	// Run initial check immediately
	he.checkAndExecuteAgents()

	for {
		select {
		case <-he.ctx.Done():
			log.Printf("🔇 HeartbeatExecutor context canceled, stopping...")
			return
		case <-ticker.C:
			he.checkAndExecuteAgents()
		}
	}
}

// checkAndExecuteAgents finds overdue agents and executes them
func (he *HeartbeatExecutor) checkAndExecuteAgents() {
	startTime := time.Now()
	he.metrics.mutex.Lock()
	he.metrics.LastCheckTime = startTime
	he.metrics.mutex.Unlock()

	ctx, cancel := context.WithTimeout(he.ctx, 5*time.Minute)
	defer cancel()

	// Get overdue agents
	overdueAgents, err := he.queries.GetOverdueActiveAgents(ctx)
	if err != nil {
		log.Printf("❌ Failed to get overdue agents: %v", err)
		return
	}

	if len(overdueAgents) == 0 {
		log.Printf("✅ No overdue agents found - all ACTIVE agents are up to date")
		return
	}

	log.Printf("🎯 Found %d overdue ACTIVE agents to execute", len(overdueAgents))

	// Process each agent
	for _, agent := range overdueAgents {
		select {
		case <-he.ctx.Done():
			log.Printf("🔇 Context canceled during agent processing")
			return
		default:
			he.processAgent(agent)
		}
	}

	duration := time.Since(startTime)
	log.Printf("📊 HeartbeatExecutor check completed in %v - processed %d agents",
		duration, len(overdueAgents))
}

// processAgent handles the execution of a single agent
func (he *HeartbeatExecutor) processAgent(agent *OverdueAgent) {
	// Check if agent is already executing
	he.executingMutex.Lock()
	if he.executingAgents[agent.ID] {
		he.executingMutex.Unlock()
		log.Printf("⏭️ Agent %s (%s %s) is already executing, skipping",
			agent.ID, agent.FirstName, agent.LastName)
		return
	}
	he.executingAgents[agent.ID] = true
	he.executingMutex.Unlock()

	// Clean up when done
	defer func() {
		he.executingMutex.Lock()
		delete(he.executingAgents, agent.ID)
		he.executingMutex.Unlock()
	}()

	// Acquire semaphore for concurrency control
	select {
	case he.executingSemaphore <- struct{}{}:
		defer func() { <-he.executingSemaphore }()
	case <-he.ctx.Done():
		return
	}

	// Execute agent in goroutine
	he.wg.Add(1)
	go func() {
		defer he.wg.Done()
		he.executeAgent(agent)
	}()
}

// executeAgent performs the actual execution of an agent
func (he *HeartbeatExecutor) executeAgent(agent *OverdueAgent) {
	startTime := time.Now()
	agentName := fmt.Sprintf("%s %s", agent.FirstName, agent.LastName)

	log.Printf("🤖 Executing agent %s (%s) - heartbeat: %dm, tokens: %d/%d",
		agentName, agent.ID, agent.HeartbeatMinutes, agent.TokensUsedToday, agent.MaxTokensPerDay)

	ctx, cancel := context.WithTimeout(he.ctx, he.config.ExecutionTimeout)
	defer cancel()

	// Update metrics
	he.metrics.mutex.Lock()
	he.metrics.TotalExecutions++
	he.metrics.ActiveExecutions++
	he.metrics.AgentsProcessed++
	he.metrics.LastExecutionTime = startTime
	he.metrics.mutex.Unlock()

	defer func() {
		he.metrics.mutex.Lock()
		he.metrics.ActiveExecutions--
		he.metrics.mutex.Unlock()
	}()

	// Check token limits
	if he.config.TokenCheckEnabled {
		canExecute, err := he.queries.CheckAgentTokenLimit(ctx, agent.ID)
		if err != nil {
			log.Printf("❌ Failed to check token limit for agent %s: %v", agent.ID, err)
			he.incrementFailedExecutions()
			return
		}

		if !canExecute {
			log.Printf("🚫 Agent %s has reached daily token limit (%d/%d), skipping execution",
				agent.ID, agent.TokensUsedToday, agent.MaxTokensPerDay)
			return
		}
	}

	// Get the agent's template
	template, err := he.queries.GetAgentTemplate(ctx, agent.TemplateID)
	if err != nil {
		log.Printf("❌ Failed to get template %s for agent %s: %v",
			agent.TemplateID, agent.ID, err)
		he.incrementFailedExecutions()
		return
	}

	// Execute the template
	success := he.executeAgentTemplate(ctx, agent, template)

	duration := time.Since(startTime)
	if success {
		log.Printf("✅ Agent %s executed successfully in %v", agentName, duration)
		he.incrementSuccessfulExecutions()
	} else {
		log.Printf("❌ Agent %s execution failed after %v", agentName, duration)
		he.incrementFailedExecutions()
	}
}

// executeAgentTemplate executes the agent's template using the gogent client
func (he *HeartbeatExecutor) executeAgentTemplate(ctx context.Context, agent *OverdueAgent, template *types.ExecutionTemplate) bool {
	// Get the preferred configuration for the template
	var config types.APIConfiguration
	if template.PreferredConfigurationID != nil && *template.PreferredConfigurationID != "" {
		// Load the preferred configuration from database
		preferredConfig, err := he.queries.GetConfiguration(ctx, *template.PreferredConfigurationID)
		if err != nil {
			log.Printf("⚠️ Failed to load preferred configuration %s for agent %s: %v",
				*template.PreferredConfigurationID, agent.ID, err)
			log.Printf("🔧 Using default configuration for agent %s", agent.ID)
			// Use default configuration
			config = types.APIConfiguration{
				ID:            uuid.New().String(),
				UserID:        agent.UserID,
				VariationName: "heartbeat-execution-default",
				ModelName:     "gemini-1.5-pro",
				Temperature:   &[]float32{0.7}[0],
				MaxTokens:     &[]int32{4096}[0],
				TopK:          &[]int32{40}[0],
				TopP:          &[]float32{0.9}[0],
			}
		} else {
			// Use the preferred configuration
			config = *preferredConfig
			// Update variation name to indicate heartbeat execution
			config.VariationName = fmt.Sprintf("%s (Heartbeat)", config.VariationName)
			log.Printf("🎯 Using template preferred configuration for agent %s: %s (%s)",
				agent.ID, config.VariationName, config.ModelName)
		}
	} else {
		// No preferred configuration, use default
		log.Printf("ℹ️ No preferred configuration for template %s, using default for agent %s",
			template.ID, agent.ID)
		config = types.APIConfiguration{
			ID:            uuid.New().String(),
			UserID:        agent.UserID,
			VariationName: "heartbeat-execution-default",
			ModelName:     "gemini-1.5-pro",
			Temperature:   &[]float32{0.7}[0],
			MaxTokens:     &[]int32{4096}[0],
			TopK:          &[]int32{40}[0],
			TopP:          &[]float32{0.9}[0],
		}
	}

	// Use effective_context which contains the complete context (template + shared team context)
	// This ensures agents get both their individual template context AND any shared team context
	contextToUse := template.ContextTemplate
	if agent.EffectiveContext != nil && *agent.EffectiveContext != "" {
		// effective_context already contains: template_context + "\n\n--- SHARED TEAM CONTEXT ---\n" + shared_context
		contextToUse = *agent.EffectiveContext
	}

	// Create execution request
	executionRequest := &types.MultiExecutionRequest{
		ExecutionRunName:      fmt.Sprintf("Agent: %s %s (Heartbeat)", agent.FirstName, agent.LastName),
		Description:           fmt.Sprintf("Automated execution for agent %s via HeartbeatExecutor", agent.ID),
		BasePrompt:            template.TemplatePrompt,
		Context:               contextToUse,
		EnableFunctionCalling: template.EnableFunctionCalling,
		AgentID:               &agent.ID, // Important: link execution to agent
		Configurations:        []types.APIConfiguration{config},
		ComparisonConfig: &types.ComparisonConfig{
			Enabled: false, // Disable comparison for heartbeat executions
		},
		SessionAPIKeys: nil, // Will be loaded from database by LoadDatabaseAPIKeys
	}

	// Load function tools if function calling is enabled
	if template.EnableFunctionCalling {
		log.Printf("🔧 Loading function tools for agent %s", agent.ID)
		functionTools, err := he.client.LoadSystemFunctionTools(ctx, agent.UserID)
		if err != nil {
			log.Printf("⚠️ Failed to load function tools for agent %s: %v", agent.ID, err)
			// Continue with function calling disabled
			log.Printf("🔧 Function calling disabled for agent %s due to tool loading failure", agent.ID)
			executionRequest.EnableFunctionCalling = false
		} else {
			// Add function tools to the execution request
			executionRequest.FunctionTools = functionTools
			log.Printf("✅ Loaded %d function tools for agent %s", len(functionTools), agent.ID)
		}
	}

	// Load agent-specific API keys with fallback to user defaults
	log.Printf("🔑 Loading agent-specific API keys for agent %s (user: %s)", agent.ID, agent.UserID)
	if err := he.client.LoadAgentAPIKeys(ctx, agent.ID); err != nil {
		log.Printf("⚠️ Failed to load agent-specific API keys for agent %s: %v", agent.ID, err)
		// Try fallback to user API keys
		log.Printf("🔄 Falling back to user API keys for agent %s (user: %s)", agent.ID, agent.UserID)
		if err := he.client.LoadDatabaseAPIKeys(ctx, agent.UserID); err != nil {
			log.Printf("⚠️ Failed to load user API keys for agent %s (user %s): %v", agent.ID, agent.UserID, err)
			// Continue anyway - the client will handle missing keys gracefully
		} else {
			log.Printf("✅ Successfully loaded fallback user API keys for agent %s", agent.ID)
		}
	} else {
		log.Printf("✅ Successfully loaded agent-specific API keys for agent %s", agent.ID)
	}

	// Execute using the gogent client
	result, err := he.client.ExecuteMultiVariation(ctx, agent.UserID, executionRequest)
	if err != nil {
		log.Printf("❌ Failed to execute template for agent %s: %v", agent.ID, err)
		return false
	}

	// Calculate token usage from result
	tokensUsed := he.calculateTokenUsage(result)

	// Update agent execution tracking
	err = he.queries.UpdateAgentExecution(ctx, agent.ID, tokensUsed)
	if err != nil {
		log.Printf("⚠️ Failed to update execution tracking for agent %s: %v", agent.ID, err)
		// Don't fail the execution just because tracking failed
	}

	log.Printf("📊 Agent %s execution completed - tokens used: %d, success count: %d, error count: %d",
		agent.ID, tokensUsed, result.SuccessCount, result.ErrorCount)

	return result.SuccessCount > 0
}

// calculateTokenUsage extracts token usage from execution result
func (he *HeartbeatExecutor) calculateTokenUsage(result *types.ExecutionResult) int32 {
	var totalTokens int32 = 0

	for _, res := range result.Results {
		if res.Response.UsageMetadata != nil {
			if tokens, ok := res.Response.UsageMetadata["totalTokenCount"]; ok {
				switch t := tokens.(type) {
				case int:
					totalTokens += int32(t)
				case int32:
					totalTokens += t
				case float64:
					totalTokens += int32(t)
				}
			}
		}
	}

	// Default estimate if no metadata available
	if totalTokens == 0 && len(result.Results) > 0 {
		// Rough estimate: 1 token per 4 characters
		for _, res := range result.Results {
			totalTokens += int32(len(res.Response.ResponseText) / 4)
		}
	}

	return totalTokens
}

// incrementSuccessfulExecutions safely increments the success counter
func (he *HeartbeatExecutor) incrementSuccessfulExecutions() {
	he.metrics.mutex.Lock()
	he.metrics.SuccessfulExecutions++
	he.metrics.TotalExecutions++
	he.metrics.mutex.Unlock()
}

// incrementFailedExecutions safely increments the failure counter
func (he *HeartbeatExecutor) incrementFailedExecutions() {
	he.metrics.mutex.Lock()
	he.metrics.FailedExecutions++
	he.metrics.TotalExecutions++
	he.metrics.mutex.Unlock()
}

// GetMetrics returns current execution metrics
func (he *HeartbeatExecutor) GetMetrics() map[string]interface{} {
	he.metrics.mutex.RLock()
	defer he.metrics.mutex.RUnlock()

	return map[string]interface{}{
		"total_executions":      he.metrics.TotalExecutions,
		"successful_executions": he.metrics.SuccessfulExecutions,
		"failed_executions":     he.metrics.FailedExecutions,
		"last_check_time":       he.metrics.LastCheckTime,
		"last_execution_time":   he.metrics.LastExecutionTime,
		"active_executions":     he.metrics.ActiveExecutions,
		"agents_processed":      he.metrics.AgentsProcessed,
		"success_rate":          he.getSuccessRate(),
		"config": map[string]interface{}{
			"check_interval":            he.config.CheckInterval.String(),
			"max_concurrent_executions": he.config.MaxConcurrentExecutions,
			"execution_timeout":         he.config.ExecutionTimeout.String(),
			"token_check_enabled":       he.config.TokenCheckEnabled,
			"enabled":                   he.config.Enabled,
		},
	}
}

// getSuccessRate calculates the success rate percentage
func (he *HeartbeatExecutor) getSuccessRate() float64 {
	if he.metrics.TotalExecutions == 0 {
		return 0.0
	}
	return float64(he.metrics.SuccessfulExecutions) / float64(he.metrics.TotalExecutions) * 100.0
}

// GetStatus returns the current status of the heartbeat executor
func (he *HeartbeatExecutor) GetStatus() string {
	select {
	case <-he.ctx.Done():
		return "stopped"
	default:
		if he.config.Enabled {
			return "running"
		}
		return "disabled"
	}
}

// GetQueries returns the AgentQueries instance for external monitoring
func (he *HeartbeatExecutor) GetQueries() *AgentQueries {
	return he.queries
}
