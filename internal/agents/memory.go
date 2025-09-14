package agents

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"gogent/internal/types"
)

// InitializeMemory creates a new empty memory structure for an agent
func (h *AgentsHandler) InitializeMemory(agentID string) (*types.AgentMemory, error) {
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
func (h *AgentsHandler) ReadMemory(ctx context.Context, agentID, userID string, request *types.AgentMemoryRequest) (*types.AgentMemoryResponse, error) {
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
func (h *AgentsHandler) WriteMemory(ctx context.Context, agentID, userID string, request *types.AgentMemoryRequest) (*types.AgentMemoryResponse, error) {
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
func (h *AgentsHandler) SearchMemory(ctx context.Context, agentID, userID string, request *types.AgentMemoryRequest) (*types.AgentMemoryResponse, error) {
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
func (h *AgentsHandler) ClearMemory(ctx context.Context, agentID, userID string, request *types.AgentMemoryRequest) (*types.AgentMemoryResponse, error) {
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
		err = h.compactMemory(agent.Memory)
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

func (h *AgentsHandler) getValueByPath(data map[string]interface{}, path string) (interface{}, error) {
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

func (h *AgentsHandler) writeToContext(context map[string]interface{}, path string, data map[string]interface{}, strategy string) error {
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

func (h *AgentsHandler) performMemorySearch(memory *types.AgentMemory, query string, limit int) []types.MemorySearchResult {
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

func (h *AgentsHandler) searchInContext(context map[string]interface{}, contextName, query string, results *[]types.MemorySearchResult) {
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

func (h *AgentsHandler) calculateRelevance(key, value, query string) float64 {
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

func (h *AgentsHandler) clearContext(memory *types.AgentMemory, contextName string) error {
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

func (h *AgentsHandler) clearPath(memory *types.AgentMemory, path string) error {
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

func (h *AgentsHandler) compactMemory(memory *types.AgentMemory) error {
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

	return nil
}

func (h *AgentsHandler) saveAgentMemory(ctx context.Context, agentID, userID string, memory *types.AgentMemory) error {
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

// UpdateAgentTaskProgress stores progress tracking data for a task the agent is working on in agent memory
func (h *AgentsHandler) UpdateAgentTaskProgress(ctx context.Context, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 UpdateAgentTaskProgress called with agentID: %s, userID: %s, taskID: %s", agentID, userID, request.TaskID)

	// Validate required parameters
	if request.TaskID == "" {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Task ID is required for progress update",
		}, nil
	}
	if request.ProgressData == nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Progress data is required",
		}, nil
	}

	// Get agent memory from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		return &types.TeamTaskResponse{
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
			return &types.TeamTaskResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to initialize memory: %v", err),
			}, nil
		}
	}

	// Ensure workflow context exists for agent task progress storage
	if memory.Contexts.Workflow == nil {
		memory.Contexts.Workflow = make(map[string]interface{})
	}

	// Create task progress storage path
	taskProgressKey := fmt.Sprintf("task_progress_%s", request.TaskID)

	// Add checkpoint timestamp and reason
	progressData := make(map[string]interface{})
	for k, v := range request.ProgressData {
		progressData[k] = v
	}

	now := time.Now()
	progressData["checkpoint_created_at"] = now.Format(time.RFC3339)
	if request.CheckpointReason != "" {
		progressData["checkpoint_reason"] = request.CheckpointReason
	}

	// Store progress data in agent's workflow context
	memory.Contexts.Workflow[taskProgressKey] = progressData

	// Update memory metadata
	memory.Metadata.UpdatedAt = now
	memory.Metadata.AccessCount++

	// Save updated memory
	err = h.saveAgentMemory(ctx, agentID, userID, memory)
	if err != nil {
		log.Printf("❌ UpdateAgentTaskProgress save failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save progress: %v", err),
		}, nil
	}

	log.Printf("✅ Agent task progress updated successfully: %s for agent %s", request.TaskID, agentID)

	return &types.TeamTaskResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":               "Agent task progress updated successfully",
			"task_id":               request.TaskID,
			"agent_id":              agentID,
			"progress_data":         progressData,
			"checkpoint_created_at": now.Format(time.RFC3339),
		},
	}, nil
}

// ReadAgentTaskProgress retrieves saved progress data for tasks the agent is working on from agent memory
func (h *AgentsHandler) ReadAgentTaskProgress(ctx context.Context, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 ReadAgentTaskProgress called with agentID: %s, userID: %s", agentID, userID)

	// Get agent memory from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Agent not found: %v", err),
		}, nil
	}

	if agent.Memory == nil || agent.Memory.Contexts.Workflow == nil {
		return &types.TeamTaskResponse{
			Success: true,
			Data: map[string]interface{}{
				"progress_records": []interface{}{},
				"message":          "No task progress data found",
			},
		}, nil
	}

	// Collect task progress records
	var progressRecords []map[string]interface{}

	if request.TaskID != "" {
		// Read specific task progress
		taskProgressKey := fmt.Sprintf("task_progress_%s", request.TaskID)
		if progressData, exists := agent.Memory.Contexts.Workflow[taskProgressKey]; exists {
			progressRecords = append(progressRecords, map[string]interface{}{
				"task_id":       request.TaskID,
				"progress_data": progressData,
			})
		}
	} else {
		// Read all task progress records
		for key, progressData := range agent.Memory.Contexts.Workflow {
			if strings.HasPrefix(key, "task_progress_") {
				taskID := strings.TrimPrefix(key, "task_progress_")

				// Apply status filter if provided
				if len(request.StatusFilter) > 0 {
					if progressMap, ok := progressData.(map[string]interface{}); ok {
						if status, exists := progressMap["status"].(string); exists {
							found := false
							for _, filterStatus := range request.StatusFilter {
								if status == filterStatus {
									found = true
									break
								}
							}
							if !found {
								continue
							}
						}
					}
				}

				progressRecords = append(progressRecords, map[string]interface{}{
					"task_id":       taskID,
					"progress_data": progressData,
				})
			}
		}
	}

	// Apply limit if specified
	limit := request.Limit
	if limit <= 0 {
		limit = 10 // Default limit
	}
	if len(progressRecords) > limit {
		progressRecords = progressRecords[:limit]
	}

	log.Printf("✅ ReadAgentTaskProgress found %d progress records for agent %s", len(progressRecords), agentID)

	return &types.TeamTaskResponse{
		Success: true,
		Data: map[string]interface{}{
			"progress_records": progressRecords,
			"total_count":      len(progressRecords),
			"agent_id":         agentID,
		},
	}, nil
}

// ClearAgentTaskProgress clears progress data for tasks the agent is working on from agent memory
func (h *AgentsHandler) ClearAgentTaskProgress(ctx context.Context, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 ClearAgentTaskProgress called with agentID: %s, userID: %s", agentID, userID)

	// Get agent memory from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Agent not found: %v", err),
		}, nil
	}

	if agent.Memory == nil || agent.Memory.Contexts.Workflow == nil {
		return &types.TeamTaskResponse{
			Success: true,
			Data: map[string]interface{}{
				"message": "No task progress data to clear",
			},
		}, nil
	}

	var clearedCount int
	now := time.Now()

	if request.TaskID != "" {
		// Clear specific task progress
		taskProgressKey := fmt.Sprintf("task_progress_%s", request.TaskID)
		if _, exists := agent.Memory.Contexts.Workflow[taskProgressKey]; exists {
			delete(agent.Memory.Contexts.Workflow, taskProgressKey)
			clearedCount = 1
		}
	} else {
		// Clear all task progress records
		for key := range agent.Memory.Contexts.Workflow {
			if strings.HasPrefix(key, "task_progress_") {
				delete(agent.Memory.Contexts.Workflow, key)
				clearedCount++
			}
		}
	}

	// Update memory metadata
	agent.Memory.Metadata.UpdatedAt = now

	// Save updated memory
	err = h.saveAgentMemory(ctx, agentID, userID, agent.Memory)
	if err != nil {
		log.Printf("❌ ClearAgentTaskProgress save failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save cleared memory: %v", err),
		}, nil
	}

	log.Printf("✅ ClearAgentTaskProgress cleared %d progress records for agent %s", clearedCount, agentID)

	return &types.TeamTaskResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":       "Agent task progress cleared successfully",
			"cleared_count": clearedCount,
			"agent_id":      agentID,
		},
	}, nil
}

// ListAgentTasks retrieves agent-specific tasks from agent memory
func (h *AgentsHandler) ListAgentTasks(ctx context.Context, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 ListAgentTasks called with agentID: %s, userID: %s", agentID, userID)

	// Get agent memory from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Agent not found: %v", err),
		}, nil
	}

	if agent.Memory == nil || agent.Memory.Contexts.Workflow == nil {
		return &types.TeamTaskResponse{
			Success: true,
			Tasks:   []types.TeamTask{},
			Data: map[string]interface{}{
				"message": "No agent tasks found",
			},
		}, nil
	}

	// Collect agent tasks from memory
	var agentTasks []types.TeamTask
	context := request.TaskTitle // Using TaskTitle field for context filter

	for key, taskData := range agent.Memory.Contexts.Workflow {
		if strings.HasPrefix(key, "agent_task_") {
			// Skip progress tracking entries
			if strings.HasPrefix(key, "task_progress_") {
				continue
			}

			// Apply context filter if specified
			if context != "" && !strings.Contains(key, context) {
				continue
			}

			// Convert task data to TeamTask structure
			if taskMap, ok := taskData.(map[string]interface{}); ok {
				task := types.TeamTask{
					ID:          key,
					Title:       fmt.Sprintf("Agent Task: %s", key),
					Description: "Agent-specific task stored in memory",
					Status:      types.TeamTaskStatus("completed"), // Agent tasks are typically completed when stored
				}

				// Extract task details if available
				if title, exists := taskMap["title"].(string); exists {
					task.Title = title
				}
				if desc, exists := taskMap["description"].(string); exists {
					task.Description = desc
				}
				if status, exists := taskMap["status"].(string); exists {
					task.Status = types.TeamTaskStatus(status)
				}
				if metadata, exists := taskMap["metadata"].(map[string]interface{}); exists {
					task.Metadata = metadata
				}

				agentTasks = append(agentTasks, task)
			}
		}
	}

	// Apply limit if specified
	limit := request.Limit
	if limit <= 0 {
		limit = 50 // Default limit
	}
	if len(agentTasks) > limit {
		agentTasks = agentTasks[:limit]
	}

	log.Printf("✅ ListAgentTasks found %d agent tasks for agent %s", len(agentTasks), agentID)

	return &types.TeamTaskResponse{
		Success: true,
		Tasks:   agentTasks,
		Data: map[string]interface{}{
			"total_count": len(agentTasks),
			"agent_id":    agentID,
		},
	}, nil
}

// StoreAgentTask stores an agent-specific task in agent memory
func (h *AgentsHandler) StoreAgentTask(ctx context.Context, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 StoreAgentTask called with agentID: %s, userID: %s", agentID, userID)

	// Get agent memory from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		return &types.TeamTaskResponse{
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
			return &types.TeamTaskResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to initialize memory: %v", err),
			}, nil
		}
	}

	// Ensure workflow context exists
	if memory.Contexts.Workflow == nil {
		memory.Contexts.Workflow = make(map[string]interface{})
	}

	// Generate task ID if not provided
	taskID := request.TaskID
	if taskID == "" {
		taskID = fmt.Sprintf("agent_task_%s_%d", agentID, time.Now().Unix())
	}

	// Create task data
	taskData := map[string]interface{}{
		"title":       request.TaskTitle,
		"description": request.TaskDescription,
		"status":      "stored",
		"created_at":  time.Now().Format(time.RFC3339),
		"agent_id":    agentID,
	}

	if request.Metadata != nil {
		taskData["metadata"] = request.Metadata
	}

	// Store task in agent memory
	memory.Contexts.Workflow[taskID] = taskData

	// Update memory metadata
	now := time.Now()
	memory.Metadata.UpdatedAt = now
	memory.Metadata.AccessCount++

	// Save updated memory
	err = h.saveAgentMemory(ctx, agentID, userID, memory)
	if err != nil {
		log.Printf("❌ StoreAgentTask save failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save task: %v", err),
		}, nil
	}

	log.Printf("✅ Agent task stored successfully: %s for agent %s", taskID, agentID)

	return &types.TeamTaskResponse{
		Success: true,
		Task: &types.TeamTask{
			ID:          taskID,
			Title:       request.TaskTitle,
			Description: request.TaskDescription,
			Status:      types.TeamTaskStatus("stored"),
			Metadata:    request.Metadata,
		},
		Data: map[string]interface{}{
			"message":  "Agent task stored successfully",
			"task_id":  taskID,
			"agent_id": agentID,
		},
	}, nil
}

// DeleteAgentTask deletes an agent-specific task from agent memory
func (h *AgentsHandler) DeleteAgentTask(ctx context.Context, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 DeleteAgentTask called with agentID: %s, userID: %s", agentID, userID)

	// Get agent memory from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Agent not found: %v", err),
		}, nil
	}

	if agent.Memory == nil || agent.Memory.Contexts.Workflow == nil {
		return &types.TeamTaskResponse{
			Success: true,
			Data: map[string]interface{}{
				"message": "No agent tasks to delete",
			},
		}, nil
	}

	// Delete specific task if task ID provided
	if request.TaskID != "" {
		if _, exists := agent.Memory.Contexts.Workflow[request.TaskID]; exists {
			delete(agent.Memory.Contexts.Workflow, request.TaskID)
		} else {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   "Task not found",
			}, nil
		}
	} else {
		// Delete all agent tasks (but keep progress tracking)
		for key := range agent.Memory.Contexts.Workflow {
			if strings.HasPrefix(key, "agent_task_") && !strings.HasPrefix(key, "task_progress_") {
				delete(agent.Memory.Contexts.Workflow, key)
			}
		}
	}

	// Update memory metadata
	agent.Memory.Metadata.UpdatedAt = time.Now()

	// Save updated memory
	err = h.saveAgentMemory(ctx, agentID, userID, agent.Memory)
	if err != nil {
		log.Printf("❌ DeleteAgentTask save failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to delete task: %v", err),
		}, nil
	}

	log.Printf("✅ Agent task deleted successfully for agent %s", agentID)

	return &types.TeamTaskResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":  "Agent task deleted successfully",
			"agent_id": agentID,
		},
	}, nil
}

// StoreAgentTaskData stores task-specific data in agent memory with strict validation
func (h *AgentsHandler) StoreAgentTaskData(ctx context.Context, agentID, userID string, request *types.AgentTaskDataRequest) (*types.AgentTaskDataResponse, error) {
	log.Printf("🔍 StoreAgentTaskData called with agentID: %s, userID: %s, taskID: %s", agentID, userID, request.TaskID)

	// Validate required parameters
	if request.TaskID == "" {
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   "Task ID is required",
		}, nil
	}

	if request.DataKey == "" {
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   "Data key is required",
		}, nil
	}

	if request.DataContent == "" {
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   "Data content is required",
		}, nil
	}

	if request.DataType == "" {
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   "Data type is required",
		}, nil
	}

	if request.CurrentStep == "" {
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   "Current step is required",
		}, nil
	}

	if request.FutureUse == "" {
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   "Future use description is required",
		}, nil
	}

	// Validate data type
	validDataTypes := []string{"code", "api_response", "research", "analysis", "documentation", "error_log", "configuration", "other"}
	if !contains(validDataTypes, request.DataType) {
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid data type: %s. Must be one of: %v", request.DataType, validDataTypes),
		}, nil
	}

	// Validate priority
	if request.Priority == "" {
		request.Priority = "medium"
	}
	validPriorities := []string{"low", "medium", "high", "critical"}
	if !contains(validPriorities, request.Priority) {
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid priority: %s. Must be one of: %v", request.Priority, validPriorities),
		}, nil
	}

	// Get agent from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		log.Printf("❌ StoreAgentTaskData getAgentByID failed: %v", err)
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   "Agent not found",
		}, nil
	}

	// Initialize memory if nil
	if agent.Memory == nil {
		agent.Memory = &types.AgentMemory{
			Contexts: types.AgentMemoryContexts{},
		}
	}

	// Initialize task data storage in workflow context if not exists
	taskDataKey := fmt.Sprintf("task_data_%s", request.TaskID)
	if agent.Memory.Contexts.Workflow == nil {
		agent.Memory.Contexts.Workflow = make(map[string]interface{})
	}
	if agent.Memory.Contexts.Workflow[taskDataKey] == nil {
		agent.Memory.Contexts.Workflow[taskDataKey] = make(map[string]interface{})
	}

	taskData := agent.Memory.Contexts.Workflow[taskDataKey].(map[string]interface{})

	// Create the data entry
	dataEntry := types.AgentTaskData{
		DataKey:     request.DataKey,
		DataContent: request.DataContent,
		DataType:    request.DataType,
		CurrentStep: request.CurrentStep,
		FutureUse:   request.FutureUse,
		Priority:    request.Priority,
		StoredAt:    time.Now(),
		Metadata:    request.Metadata,
	}

	// Store the data entry
	taskData[request.DataKey] = dataEntry

	// Save to database
	agent.Memory.Contexts.Workflow[taskDataKey] = taskData
	if err := h.saveAgentMemory(ctx, agentID, userID, agent.Memory); err != nil {
		log.Printf("❌ StoreAgentTaskData save failed: %v", err)
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save task data: %v", err),
		}, nil
	}

	log.Printf("✅ StoreAgentTaskData success: stored %s for task %s", request.DataKey, request.TaskID)

	return &types.AgentTaskDataResponse{
		Success: true,
		Data:    []types.AgentTaskData{dataEntry},
		Metadata: map[string]interface{}{
			"message":   "Task data stored successfully",
			"agent_id":  agentID,
			"task_id":   request.TaskID,
			"data_key":  request.DataKey,
			"data_type": request.DataType,
			"stored_at": dataEntry.StoredAt,
		},
	}, nil
}

// RetrieveAgentTaskData retrieves task-specific data from agent memory with filtering
func (h *AgentsHandler) RetrieveAgentTaskData(ctx context.Context, agentID, userID string, request *types.AgentTaskDataRequest) (*types.AgentTaskDataResponse, error) {
	log.Printf("🔍 RetrieveAgentTaskData called with agentID: %s, userID: %s, taskID: %s", agentID, userID, request.TaskID)

	// Validate required parameters
	if request.TaskID == "" {
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   "Task ID is required",
		}, nil
	}

	// Get agent from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		log.Printf("❌ RetrieveAgentTaskData getAgentByID failed: %v", err)
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   "Agent not found",
		}, nil
	}

	// Initialize memory if nil
	if agent.Memory == nil || agent.Memory.Contexts.Workflow == nil {
		return &types.AgentTaskDataResponse{
			Success: true,
			Data:    []types.AgentTaskData{},
			Metadata: map[string]interface{}{
				"message":  "No task data found",
				"agent_id": agentID,
				"task_id":  request.TaskID,
			},
		}, nil
	}

	// Get task data
	taskDataKey := fmt.Sprintf("task_data_%s", request.TaskID)
	taskDataInterface, exists := agent.Memory.Contexts.Workflow[taskDataKey]
	if !exists {
		return &types.AgentTaskDataResponse{
			Success: true,
			Data:    []types.AgentTaskData{},
			Metadata: map[string]interface{}{
				"message":  "No task data found",
				"agent_id": agentID,
				"task_id":  request.TaskID,
			},
		}, nil
	}

	taskData := taskDataInterface.(map[string]interface{})
	var results []types.AgentTaskData

	// If specific data key requested
	if request.DataKey != "" {
		if dataEntryInterface, exists := taskData[request.DataKey]; exists {
			if dataEntry, ok := dataEntryInterface.(types.AgentTaskData); ok {
				results = append(results, dataEntry)
			}
		}
	} else {
		// Get all data entries
		for _, dataEntryInterface := range taskData {
			if dataEntry, ok := dataEntryInterface.(types.AgentTaskData); ok {
				// Apply filters
				if request.DataType != "" && dataEntry.DataType != request.DataType {
					continue
				}
				if request.Priority != "" && dataEntry.Priority != request.Priority {
					continue
				}
				if request.StepFilter != "" && dataEntry.CurrentStep != request.StepFilter {
					continue
				}
				if request.SearchQuery != "" {
					searchText := strings.ToLower(request.SearchQuery)
					contentMatch := strings.Contains(strings.ToLower(dataEntry.DataContent), searchText)
					futureUseMatch := strings.Contains(strings.ToLower(dataEntry.FutureUse), searchText)
					if !contentMatch && !futureUseMatch {
						continue
					}
				}

				results = append(results, dataEntry)
			}
		}
	}

	// Apply limit
	if request.Limit > 0 && len(results) > request.Limit {
		results = results[:request.Limit]
	}

	// Remove metadata if requested
	if !request.IncludeMetadata {
		for i := range results {
			results[i].Metadata = nil
		}
	}

	log.Printf("✅ RetrieveAgentTaskData success: found %d entries for task %s", len(results), request.TaskID)

	return &types.AgentTaskDataResponse{
		Success: true,
		Data:    results,
		Metadata: map[string]interface{}{
			"message":  "Task data retrieved successfully",
			"agent_id": agentID,
			"task_id":  request.TaskID,
			"count":    len(results),
			"filters": map[string]interface{}{
				"data_key":     request.DataKey,
				"data_type":    request.DataType,
				"priority":     request.Priority,
				"step_filter":  request.StepFilter,
				"search_query": request.SearchQuery,
			},
		},
	}, nil
}

// ClearAgentTaskData clears task-specific data from agent memory with optional filtering
func (h *AgentsHandler) ClearAgentTaskData(ctx context.Context, agentID, userID string, request *types.AgentTaskDataRequest) (*types.AgentTaskDataResponse, error) {
	log.Printf("🔍 ClearAgentTaskData called with agentID: %s, userID: %s, taskID: %s", agentID, userID, request.TaskID)

	// Validate required parameters
	if request.TaskID == "" {
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   "Task ID is required",
		}, nil
	}

	if !request.Confirmation {
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   "Confirmation is required to clear task data",
		}, nil
	}

	// Get agent from database
	agent, err := h.getAgentByID(userID, agentID)
	if err != nil {
		log.Printf("❌ ClearAgentTaskData getAgentByID failed: %v", err)
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   "Agent not found",
		}, nil
	}

	// Initialize memory if nil
	if agent.Memory == nil || agent.Memory.Contexts.Workflow == nil {
		return &types.AgentTaskDataResponse{
			Success: true,
			Data:    []types.AgentTaskData{},
			Metadata: map[string]interface{}{
				"message":  "No task data to clear",
				"agent_id": agentID,
				"task_id":  request.TaskID,
			},
		}, nil
	}

	// Get task data
	taskDataKey := fmt.Sprintf("task_data_%s", request.TaskID)
	taskDataInterface, exists := agent.Memory.Contexts.Workflow[taskDataKey]
	if !exists {
		return &types.AgentTaskDataResponse{
			Success: true,
			Data:    []types.AgentTaskData{},
			Metadata: map[string]interface{}{
				"message":  "No task data to clear",
				"agent_id": agentID,
				"task_id":  request.TaskID,
			},
		}, nil
	}

	taskData := taskDataInterface.(map[string]interface{})
	var clearedEntries []types.AgentTaskData

	// If specific data key requested
	if request.DataKey != "" {
		if dataEntryInterface, exists := taskData[request.DataKey]; exists {
			if dataEntry, ok := dataEntryInterface.(types.AgentTaskData); ok {
				clearedEntries = append(clearedEntries, dataEntry)
				delete(taskData, request.DataKey)
			}
		}
	} else {
		// Clear based on filters
		keysToDelete := []string{}
		for key, dataEntryInterface := range taskData {
			if dataEntry, ok := dataEntryInterface.(types.AgentTaskData); ok {
				// Apply filters
				if request.DataType != "" && dataEntry.DataType != request.DataType {
					continue
				}
				if request.Priority != "" && dataEntry.Priority != request.Priority {
					continue
				}
				if request.StepFilter != "" && dataEntry.CurrentStep != request.StepFilter {
					continue
				}

				clearedEntries = append(clearedEntries, dataEntry)
				keysToDelete = append(keysToDelete, key)
			}
		}

		// Delete filtered entries
		for _, key := range keysToDelete {
			delete(taskData, key)
		}
	}

	// If no specific data key and no filters, clear all task data
	if request.DataKey == "" && request.DataType == "" && request.Priority == "" && request.StepFilter == "" {
		clearedEntries = []types.AgentTaskData{}
		for _, dataEntryInterface := range taskData {
			if dataEntry, ok := dataEntryInterface.(types.AgentTaskData); ok {
				clearedEntries = append(clearedEntries, dataEntry)
			}
		}
		delete(agent.Memory.Contexts.Workflow, taskDataKey)
	} else {
		// Update the task data in memory
		agent.Memory.Contexts.Workflow[taskDataKey] = taskData
	}

	// Save to database
	if err := h.saveAgentMemory(ctx, agentID, userID, agent.Memory); err != nil {
		log.Printf("❌ ClearAgentTaskData save failed: %v", err)
		return &types.AgentTaskDataResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to clear task data: %v", err),
		}, nil
	}

	log.Printf("✅ ClearAgentTaskData success: cleared %d entries for task %s", len(clearedEntries), request.TaskID)

	return &types.AgentTaskDataResponse{
		Success: true,
		Data:    clearedEntries,
		Metadata: map[string]interface{}{
			"message":       "Task data cleared successfully",
			"agent_id":      agentID,
			"task_id":       request.TaskID,
			"cleared_count": len(clearedEntries),
			"reason":        request.Reason,
			"filters": map[string]interface{}{
				"data_key":    request.DataKey,
				"data_type":   request.DataType,
				"priority":    request.Priority,
				"step_filter": request.StepFilter,
			},
		},
	}, nil
}

// Helper function to check if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
