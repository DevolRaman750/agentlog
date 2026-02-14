package agents

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"gogent/internal/types"
)

// InitializeMemory creates a new empty memory structure for an agent
func (h *Handler) InitializeMemory(_ string) (*types.AgentMemory, error) {
	now := time.Now()
	memory := &types.AgentMemory{
		Version: "1.0",
		Contexts: types.AgentMemoryContexts{
			Workflow:   make(map[string]interface{}),
			Session:    make(map[string]interface{}),
			Persistent: make(map[string]interface{}),
		},
		Relationships: []types.MemoryRelationship{},
		Metadata: types.MemoryMetadata{
			CreatedAt:   now,
			UpdatedAt:   now,
			SizeBytes:   0,
			AccessCount: 0,
			Version:     "1.0",
		},
	}
	return memory, nil
}

// ReadMemory retrieves memory data for an agent with optional filtering
func (h *Handler) ReadMemory(ctx context.Context, agentID, userID string, request *types.AgentMemoryRequest) (*types.AgentMemoryResponse, error) {
	// Get agent memory from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		return &types.AgentMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Agent not found: %v", err),
		}, nil
	}

	// Parse existing memory or initialize if empty
	var memory *types.AgentMemory
	if agent.Memory != nil {
		memory = agent.Memory
	} else {
		memory, err = h.InitializeMemory(agentID)
		if err != nil {
			return &types.AgentMemoryResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to initialize memory: %v", err),
			}, nil
		}
	}

	// Update access count
	memory.Metadata.AccessCount++

	// Filter by context if specified
	var responseData map[string]interface{}
	switch strings.ToLower(request.Context) {
	case "workflow":
		responseData = map[string]interface{}{"workflow": memory.Contexts.Workflow}
	case "session":
		responseData = map[string]interface{}{"session": memory.Contexts.Session}
	case "persistent":
		responseData = map[string]interface{}{"persistent": memory.Contexts.Persistent}
	case "all", "":
		responseData = map[string]interface{}{
			"contexts":      memory.Contexts,
			"relationships": memory.Relationships,
		}
	default:
		return &types.AgentMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid context: %s", request.Context),
		}, nil
	}

	// Apply path filtering if specified
	if request.Path != "" {
		filteredData, err := h.getValueByPath(responseData, request.Path)
		if err != nil {
			return &types.AgentMemoryResponse{
				Success: false,
				Error:   fmt.Sprintf("Path not found: %s", request.Path),
			}, nil
		}
		responseData = map[string]interface{}{"result": filteredData}
	}

	// Save updated memory (for access count)
	err = h.saveAgentMemory(ctx, agentID, userID, memory)
	if err != nil {
		// Log error but don't fail the read operation
		fmt.Printf("Warning: Failed to update memory access count: %v\n", err)
	}

	return &types.AgentMemoryResponse{
		Success:  true,
		Data:     responseData,
		Metadata: memory.Metadata,
	}, nil
}

// WriteMemory stores or updates memory data for an agent
func (h *Handler) WriteMemory(ctx context.Context, agentID, userID string, request *types.AgentMemoryRequest) (*types.AgentMemoryResponse, error) {
	// Get agent memory from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		return &types.AgentMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Agent not found: %v", err),
		}, nil
	}

	// Parse existing memory or initialize if empty
	var memory *types.AgentMemory
	if agent.Memory != nil {
		memory = agent.Memory
	} else {
		memory, err = h.InitializeMemory(agentID)
		if err != nil {
			return &types.AgentMemoryResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to initialize memory: %v", err),
			}, nil
		}
	}

	// Get target context
	var targetContext map[string]interface{}
	switch strings.ToLower(request.Context) {
	case "workflow":
		if memory.Contexts.Workflow == nil {
			memory.Contexts.Workflow = make(map[string]interface{})
		}
		targetContext = memory.Contexts.Workflow
	case "session":
		if memory.Contexts.Session == nil {
			memory.Contexts.Session = make(map[string]interface{})
		}
		targetContext = memory.Contexts.Session
	case "persistent":
		if memory.Contexts.Persistent == nil {
			memory.Contexts.Persistent = make(map[string]interface{})
		}
		targetContext = memory.Contexts.Persistent
	default:
		return &types.AgentMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid context for writing: %s", request.Context),
		}, nil
	}

	// Apply write operation
	err = h.writeToContext(targetContext, request.Path, request.Data, request.MergeStrategy)
	if err != nil {
		return &types.AgentMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to write to memory: %v", err),
		}, nil
	}

	// Update metadata
	memory.Metadata.UpdatedAt = time.Now()
	memory.Metadata.AccessCount++

	// Save updated memory
	err = h.saveAgentMemory(ctx, agentID, userID, memory)
	if err != nil {
		return &types.AgentMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save memory: %v", err),
		}, nil
	}

	return &types.AgentMemoryResponse{
		Success:  true,
		Data:     map[string]interface{}{"written": request.Data},
		Metadata: memory.Metadata,
	}, nil
}

// SearchMemory searches through agent memory using various strategies
func (h *Handler) SearchMemory(ctx context.Context, agentID, userID string, request *types.AgentMemoryRequest) (*types.AgentMemoryResponse, error) {
	// Get agent memory from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		return &types.AgentMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Agent not found: %v", err),
		}, nil
	}

	if agent.Memory == nil {
		return &types.AgentMemoryResponse{
			Success: true,
			Results: []types.MemorySearchResult{},
			Metadata: types.MemoryMetadata{
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
		}, nil
	}

	// Perform search
	results := h.performMemorySearch(agent.Memory, request.SearchQuery, request.Limit)

	// Update access count
	agent.Memory.Metadata.AccessCount++
	err = h.saveAgentMemory(ctx, agentID, userID, agent.Memory)
	if err != nil {
		fmt.Printf("Warning: Failed to update memory access count: %v\n", err)
	}

	return &types.AgentMemoryResponse{
		Success:  true,
		Results:  results,
		Metadata: agent.Memory.Metadata,
	}, nil
}

// ClearMemory clears or manages agent memory based on the request
func (h *Handler) ClearMemory(ctx context.Context, agentID, userID string, request *types.AgentMemoryRequest) (*types.AgentMemoryResponse, error) {
	// Get agent memory from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		return &types.AgentMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Agent not found: %v", err),
		}, nil
	}

	if agent.Memory == nil {
		// Nothing to clear
		return &types.AgentMemoryResponse{
			Success: true,
			Data:    map[string]interface{}{"message": "No memory to clear"},
		}, nil
	}

	// Perform clear operation based on action
	action := request.Context // Using context field for action in clear operations
	switch strings.ToLower(action) {
	case "clear_context":
		err = h.clearContext(agent.Memory, request.Path) // Using path field for context name
	case "clear_path":
		err = h.clearPath(agent.Memory, request.Path)
	case "clear_all":
		agent.Memory, err = h.InitializeMemory(agentID)
	case "compact":
		h.compactMemory(agent.Memory)
	default:
		return &types.AgentMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid clear action: %s", action),
		}, nil
	}

	if err != nil {
		return &types.AgentMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to clear memory: %v", err),
		}, nil
	}

	// Update metadata
	agent.Memory.Metadata.UpdatedAt = time.Now()

	// Save updated memory
	err = h.saveAgentMemory(ctx, agentID, userID, agent.Memory)
	if err != nil {
		return &types.AgentMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save cleared memory: %v", err),
		}, nil
	}

	return &types.AgentMemoryResponse{
		Success:  true,
		Data:     map[string]interface{}{"message": "Memory cleared successfully"},
		Metadata: agent.Memory.Metadata,
	}, nil
}

// Helper functions

func (h *Handler) getValueByPath(data map[string]interface{}, path string) (interface{}, error) {
	parts := strings.Split(path, ".")
	current := data

	for i, part := range parts {
		if i == len(parts)-1 {
			// Last part, return the value
			return current[part], nil
		}

		// Navigate deeper
		if next, ok := current[part].(map[string]interface{}); ok {
			current = next
		} else {
			return nil, fmt.Errorf("path not found: %s", path)
		}
	}

	return current, nil
}

func (h *Handler) writeToContext(context map[string]interface{}, path string, data map[string]interface{}, strategy string) error {
	if path == "" {
		// Write to context root
		switch strings.ToLower(strategy) {
		case "replace":
			// Clear and replace
			for k := range context {
				delete(context, k)
			}
			for k, v := range data {
				context[k] = v
			}
		case "merge", "":
			// Merge data
			for k, v := range data {
				context[k] = v
			}
		default:
			return fmt.Errorf("unsupported merge strategy: %s", strategy)
		}
		return nil
	}

	// Navigate to path and write
	parts := strings.Split(path, ".")
	current := context

	for i, part := range parts {
		if i == len(parts)-1 {
			// Last part, write the value
			current[part] = data
			return nil
		}

		// Navigate or create path
		if next, ok := current[part].(map[string]interface{}); ok {
			current = next
		} else {
			// Create intermediate path
			newMap := make(map[string]interface{})
			current[part] = newMap
			current = newMap
		}
	}

	return nil
}

func (h *Handler) performMemorySearch(memory *types.AgentMemory, query string, limit int) []types.MemorySearchResult {
	results := []types.MemorySearchResult{}
	searchLower := strings.ToLower(query)

	if limit <= 0 {
		limit = 20
	}

	// Search in workflow context
	h.searchInContext(memory.Contexts.Workflow, "workflow", searchLower, &results)

	// Search in session context
	h.searchInContext(memory.Contexts.Session, "session", searchLower, &results)

	// Search in persistent context
	h.searchInContext(memory.Contexts.Persistent, "persistent", searchLower, &results)

	// Limit results
	if len(results) > limit {
		results = results[:limit]
	}

	return results
}

func (h *Handler) searchInContext(context map[string]interface{}, contextName, query string, results *[]types.MemorySearchResult) {
	for key, value := range context {
		// Convert value to string for searching
		valueStr := fmt.Sprintf("%v", value)
		if strings.Contains(strings.ToLower(valueStr), query) || strings.Contains(strings.ToLower(key), query) {
			*results = append(*results, types.MemorySearchResult{
				Path:      fmt.Sprintf("contexts.%s.%s", contextName, key),
				Context:   contextName,
				Data:      map[string]interface{}{key: value},
				Relevance: h.calculateRelevance(key, valueStr, query),
				UpdatedAt: time.Now(),
			})
		}
	}
}

func (h *Handler) calculateRelevance(key, value, query string) float64 {
	// Simple relevance calculation
	keyMatch := strings.Contains(strings.ToLower(key), query)
	valueMatch := strings.Contains(strings.ToLower(value), query)

	if keyMatch && valueMatch {
		return 1.0
	} else if keyMatch {
		return 0.8
	} else if valueMatch {
		return 0.6
	}
	return 0.5
}

func (h *Handler) clearContext(memory *types.AgentMemory, contextName string) error {
	switch strings.ToLower(contextName) {
	case "workflow":
		memory.Contexts.Workflow = make(map[string]interface{})
	case "session":
		memory.Contexts.Session = make(map[string]interface{})
	case "persistent":
		memory.Contexts.Persistent = make(map[string]interface{})
	default:
		return fmt.Errorf("invalid context name: %s", contextName)
	}
	return nil
}

func (h *Handler) clearPath(memory *types.AgentMemory, path string) error {
	// Simple path clearing - can be enhanced
	parts := strings.Split(path, ".")
	if len(parts) < 2 {
		return fmt.Errorf("invalid path: %s", path)
	}

	contextName := parts[1] // Assuming path like "contexts.workflow.current_step"
	switch contextName {
	case "workflow":
		if len(parts) > 2 {
			delete(memory.Contexts.Workflow, parts[2])
		}
	case "session":
		if len(parts) > 2 {
			delete(memory.Contexts.Session, parts[2])
		}
	case "persistent":
		if len(parts) > 2 {
			delete(memory.Contexts.Persistent, parts[2])
		}
	}
	return nil
}

func (h *Handler) compactMemory(memory *types.AgentMemory) {
	// Remove empty contexts and optimize structure
	if len(memory.Contexts.Workflow) == 0 {
		memory.Contexts.Workflow = nil
	}
	if len(memory.Contexts.Session) == 0 {
		memory.Contexts.Session = nil
	}
	if len(memory.Contexts.Persistent) == 0 {
		memory.Contexts.Persistent = nil
	}

	// Remove empty relationships
	var activeRelationships []types.MemoryRelationship
	for _, rel := range memory.Relationships {
		if rel.From != "" && rel.To != "" {
			activeRelationships = append(activeRelationships, rel)
		}
	}
	memory.Relationships = activeRelationships
}

func (h *Handler) saveAgentMemory(ctx context.Context, agentID, userID string, memory *types.AgentMemory) error {
	// Convert memory to JSON
	memoryJSON, err := json.Marshal(memory)
	if err != nil {
		return fmt.Errorf("failed to marshal memory: %w", err)
	}

	sizeBytes := len(memoryJSON)
	memory.Metadata.SizeBytes = int32(sizeBytes)

	// Update agent record with memory
	query := `
		UPDATE agents
		SET memory = ?,
		    memory_size_bytes = ?,
		    memory_updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND user_id = ?`

	_, err = h.db.ExecContext(ctx, query, string(memoryJSON), sizeBytes, agentID, userID)
	if err != nil {
		return fmt.Errorf("failed to save memory to database: %w", err)
	}

	return nil
}
