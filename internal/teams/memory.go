package teams

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"gogent/internal/types"
)

// InitializeTeamMemory creates a new empty memory structure for a team
func (h *TeamsHandler) InitializeTeamMemory(teamID string) (*types.TeamMemory, error) {
	now := time.Now()
	memory := &types.TeamMemory{
		Version: "1.0",
		Contexts: types.TeamMemoryContexts{
			Workflow:   make(map[string]interface{}),
			Session:    make(map[string]interface{}),
			Persistent: make(map[string]interface{}),
			Shared:     make(map[string]interface{}),
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

// ReadTeamMemory retrieves memory data for a team with optional filtering
func (h *TeamsHandler) ReadTeamMemory(ctx context.Context, teamID, agentID, userID string, request *types.TeamMemoryRequest) (*types.TeamMemoryResponse, error) {
	// Validate access - either agent membership or team ownership
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}

	// Get team memory from database
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}

	// Parse existing memory or initialize if empty
	var memory *types.TeamMemory
	if team.Memory != nil {
		memory = team.Memory
	} else {
		memory, err = h.InitializeTeamMemory(teamID)
		if err != nil {
			return &types.TeamMemoryResponse{
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
	case "shared":
		responseData = map[string]interface{}{"shared": memory.Contexts.Shared}
	case "all", "":
		responseData = map[string]interface{}{
			"contexts":      memory.Contexts,
			"relationships": memory.Relationships,
		}
	default:
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid context: %s", request.Context),
		}, nil
	}

	// Apply path filtering if specified
	if request.Path != "" {
		filteredData, err := h.getValueByPath(responseData, request.Path)
		if err != nil {
			return &types.TeamMemoryResponse{
				Success: false,
				Error:   fmt.Sprintf("Path not found: %s", request.Path),
			}, nil
		}
		responseData = map[string]interface{}{"result": filteredData}
	}

	// Save updated memory (for access count)
	err = h.saveTeamMemory(teamID, userID, memory)
	if err != nil {
		// Log error but don't fail the read operation
		fmt.Printf("Warning: Failed to update team memory access count: %v\n", err)
	}

	return &types.TeamMemoryResponse{
		Success:  true,
		Data:     responseData,
		Metadata: memory.Metadata,
	}, nil
}

// WriteTeamMemory stores or updates memory data for a team
func (h *TeamsHandler) WriteTeamMemory(ctx context.Context, teamID, agentID, userID string, request *types.TeamMemoryRequest) (*types.TeamMemoryResponse, error) {
	// Validate access - either agent membership or team ownership
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}

	// Get team memory from database
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}

	// Parse existing memory or initialize if empty
	var memory *types.TeamMemory
	if team.Memory != nil {
		memory = team.Memory
	} else {
		memory, err = h.InitializeTeamMemory(teamID)
		if err != nil {
			return &types.TeamMemoryResponse{
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
	case "shared":
		if memory.Contexts.Shared == nil {
			memory.Contexts.Shared = make(map[string]interface{})
		}
		targetContext = memory.Contexts.Shared
	default:
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid context for writing: %s", request.Context),
		}, nil
	}

	// Apply write operation
	err = h.writeToContext(targetContext, request.Path, request.Data, request.MergeStrategy)
	if err != nil {
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to write to memory: %v", err),
		}, nil
	}

	// Update metadata
	memory.Metadata.UpdatedAt = time.Now()
	memory.Metadata.AccessCount++

	// Save updated memory
	err = h.saveTeamMemory(teamID, userID, memory)
	if err != nil {
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save memory: %v", err),
		}, nil
	}

	return &types.TeamMemoryResponse{
		Success:  true,
		Data:     map[string]interface{}{"written": request.Data},
		Metadata: memory.Metadata,
	}, nil
}

// SearchTeamMemory searches through team memory using various strategies
func (h *TeamsHandler) SearchTeamMemory(ctx context.Context, teamID, agentID, userID string, request *types.TeamMemoryRequest) (*types.TeamMemoryResponse, error) {
	// Validate access - either agent membership or team ownership
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}

	// Get team memory from database
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}

	if team.Memory == nil {
		return &types.TeamMemoryResponse{
			Success: true,
			Results: []types.MemorySearchResult{},
			Metadata: types.MemoryMetadata{
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
		}, nil
	}

	// Perform search
	results := h.performMemorySearch(team.Memory, request.SearchQuery, request.Limit)

	// Update access count
	team.Memory.Metadata.AccessCount++
	err = h.saveTeamMemory(teamID, userID, team.Memory)
	if err != nil {
		fmt.Printf("Warning: Failed to update team memory access count: %v\n", err)
	}

	return &types.TeamMemoryResponse{
		Success:  true,
		Results:  results,
		Metadata: team.Memory.Metadata,
	}, nil
}

// ClearTeamMemory clears or manages team memory based on the request
func (h *TeamsHandler) ClearTeamMemory(ctx context.Context, teamID, agentID, userID string, request *types.TeamMemoryRequest) (*types.TeamMemoryResponse, error) {
	// Validate access - either agent membership or team ownership
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}

	// Get team memory from database
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}

	if team.Memory == nil {
		// Nothing to clear
		return &types.TeamMemoryResponse{
			Success: true,
			Data:    map[string]interface{}{"message": "No memory to clear"},
		}, nil
	}

	// Perform clear operation based on action
	action := request.Context // Using context field for action in clear operations
	switch strings.ToLower(action) {
	case "clear_context":
		err = h.clearContext(team.Memory, request.Path) // Using path field for context name
	case "clear_path":
		err = h.clearPath(team.Memory, request.Path)
	case "clear_all":
		team.Memory, err = h.InitializeTeamMemory(teamID)
	case "compact":
		err = h.compactMemory(team.Memory)
	default:
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid clear action: %s", action),
		}, nil
	}

	if err != nil {
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to clear memory: %v", err),
		}, nil
	}

	// Update metadata
	team.Memory.Metadata.UpdatedAt = time.Now()

	// Save updated memory
	err = h.saveTeamMemory(teamID, userID, team.Memory)
	if err != nil {
		return &types.TeamMemoryResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save cleared memory: %v", err),
		}, nil
	}

	return &types.TeamMemoryResponse{
		Success:  true,
		Data:     map[string]interface{}{"message": "Memory cleared successfully"},
		Metadata: team.Memory.Metadata,
	}, nil
}

// Helper functions (similar to agent memory helpers)
func (h *TeamsHandler) getValueByPath(data map[string]interface{}, path string) (interface{}, error) {
	// Simple path resolution - can be enhanced for more complex paths
	parts := strings.Split(path, ".")
	current := data

	for i, part := range parts {
		if i == len(parts)-1 {
			if value, exists := current[part]; exists {
				return value, nil
			}
			return nil, fmt.Errorf("path not found: %s", path)
		}

		if next, exists := current[part]; exists {
			if nextMap, ok := next.(map[string]interface{}); ok {
				current = nextMap
			} else {
				return nil, fmt.Errorf("path element is not a map: %s", part)
			}
		} else {
			return nil, fmt.Errorf("path not found: %s", path)
		}
	}

	return nil, fmt.Errorf("path not found: %s", path)
}

func (h *TeamsHandler) writeToContext(context map[string]interface{}, path string, data interface{}, mergeStrategy string) error {
	if path == "" {
		// Write to context root
		switch mergeStrategy {
		case "replace":
			// Clear and replace
			for k := range context {
				delete(context, k)
			}
			if dataMap, ok := data.(map[string]interface{}); ok {
				for k, v := range dataMap {
					context[k] = v
				}
			} else {
				context["value"] = data
			}
		case "append":
			// Append to array or create new array
			if dataArray, ok := data.([]interface{}); ok {
				if existingArray, exists := context["items"]; exists {
					if existing, ok := existingArray.([]interface{}); ok {
						context["items"] = append(existing, dataArray...)
					} else {
						context["items"] = dataArray
					}
				} else {
					context["items"] = dataArray
				}
			} else {
				context["value"] = data
			}
		default: // merge
			if dataMap, ok := data.(map[string]interface{}); ok {
				for k, v := range dataMap {
					context[k] = v
				}
			} else {
				context["value"] = data
			}
		}
		return nil
	}

	// Write to specific path
	parts := strings.Split(path, ".")
	current := context

	for i, part := range parts {
		if i == len(parts)-1 {
			// Last part - write the data
			switch mergeStrategy {
			case "replace":
				current[part] = data
			case "append":
				if existing, exists := current[part]; exists {
					if existingArray, ok := existing.([]interface{}); ok {
						if dataArray, ok := data.([]interface{}); ok {
							current[part] = append(existingArray, dataArray...)
						} else {
							current[part] = append(existingArray, data)
						}
					} else {
						current[part] = []interface{}{existing, data}
					}
				} else {
					current[part] = data
				}
			default: // merge
				if dataMap, ok := data.(map[string]interface{}); ok {
					if existing, exists := current[part]; exists {
						if existingMap, ok := existing.(map[string]interface{}); ok {
							for k, v := range dataMap {
								existingMap[k] = v
							}
							current[part] = existingMap
						} else {
							current[part] = dataMap
						}
					} else {
						current[part] = dataMap
					}
				} else {
					current[part] = data
				}
			}
			return nil
		}

		// Navigate to next level
		if next, exists := current[part]; exists {
			if nextMap, ok := next.(map[string]interface{}); ok {
				current = nextMap
			} else {
				// Create new map if current value is not a map
				newMap := make(map[string]interface{})
				current[part] = newMap
				current = newMap
			}
		} else {
			// Create new map for this path
			newMap := make(map[string]interface{})
			current[part] = newMap
			current = newMap
		}
	}

	return nil
}

func (h *TeamsHandler) performMemorySearch(memory *types.TeamMemory, query string, limit int) []types.MemorySearchResult {
	var results []types.MemorySearchResult

	// Simple text-based search implementation
	// This can be enhanced with more sophisticated search algorithms
	searchInContext := func(context map[string]interface{}, contextName string) {
		h.searchRecursive(context, "", contextName, query, &results)
	}

	searchInContext(memory.Contexts.Workflow, "workflow")
	searchInContext(memory.Contexts.Session, "session")
	searchInContext(memory.Contexts.Persistent, "persistent")
	searchInContext(memory.Contexts.Shared, "shared")

	// Limit results
	if len(results) > limit {
		results = results[:limit]
	}

	return results
}

func (h *TeamsHandler) searchRecursive(data interface{}, path, context, query string, results *[]types.MemorySearchResult) {
	queryLower := strings.ToLower(query)

	switch v := data.(type) {
	case map[string]interface{}:
		for key, value := range v {
			currentPath := path
			if currentPath != "" {
				currentPath += "."
			}
			currentPath += key

			// Check if key or value contains query
			if strings.Contains(strings.ToLower(key), queryLower) {
				*results = append(*results, types.MemorySearchResult{
					Path:      currentPath,
					Context:   context,
					Data:      map[string]interface{}{key: value},
					Relevance: 1.0,
					UpdatedAt: time.Now(),
				})
			}

			// Recursively search nested structures
			h.searchRecursive(value, currentPath, context, query, results)
		}
	case []interface{}:
		for i, item := range v {
			currentPath := fmt.Sprintf("%s[%d]", path, i)
			h.searchRecursive(item, currentPath, context, query, results)
		}
	case string:
		if strings.Contains(strings.ToLower(v), queryLower) {
			*results = append(*results, types.MemorySearchResult{
				Path:      path,
				Context:   context,
				Data:      map[string]interface{}{"value": v},
				Relevance: 0.8,
				UpdatedAt: time.Now(),
			})
		}
	}
}

func (h *TeamsHandler) clearContext(memory *types.TeamMemory, contextName string) error {
	switch strings.ToLower(contextName) {
	case "workflow":
		memory.Contexts.Workflow = make(map[string]interface{})
	case "session":
		memory.Contexts.Session = make(map[string]interface{})
	case "persistent":
		memory.Contexts.Persistent = make(map[string]interface{})
	case "shared":
		memory.Contexts.Shared = make(map[string]interface{})
	default:
		return fmt.Errorf("invalid context: %s", contextName)
	}
	return nil
}

func (h *TeamsHandler) clearPath(memory *types.TeamMemory, path string) error {
	// Implementation for clearing specific paths
	// This would need to traverse the memory structure and remove the specified path
	return fmt.Errorf("clear path not implemented yet")
}

func (h *TeamsHandler) compactMemory(memory *types.TeamMemory) error {
	// Implementation for memory compaction
	// This could remove empty contexts, optimize storage, etc.
	return nil
}

// StoreTeamTask stores a new task in the team's task memory
func (h *TeamsHandler) StoreTeamTask(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 StoreTeamTask called with teamID: %s, agentID: %s, userID: %s", teamID, agentID, userID)
	
	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		log.Printf("❌ StoreTeamTask access validation failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}
	log.Printf("✅ StoreTeamTask access validation passed")

	// Get team memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		log.Printf("❌ StoreTeamTask team lookup failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}
	log.Printf("✅ StoreTeamTask team found: %s", team.Name)

	// Initialize memory if needed
	var memory *types.TeamMemory
	if team.Memory != nil {
		memory = team.Memory
	} else {
		memory, err = h.InitializeTeamMemory(teamID)
		if err != nil {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to initialize memory: %v", err),
			}, nil
		}
	}

	// Ensure tasks context exists
	if memory.Contexts.Shared == nil {
		memory.Contexts.Shared = make(map[string]interface{})
	}
	if memory.Contexts.Shared["tasks"] == nil {
		memory.Contexts.Shared["tasks"] = make(map[string]interface{})
	}

	// Create new task
	now := time.Now()
	task := &types.TeamTask{
		ID:                   generateTaskID(),
		Title:                request.TaskTitle,
		Description:          request.TaskDescription,
		Priority:             types.TeamTaskPriority(request.Priority),
		Status:               types.TaskStatusPending,
		CreatedBy:            agentID,
		EstimatedDuration:    request.EstimatedDuration,
		RequiredCapabilities: request.RequiredCapabilities,
		Dependencies:         request.Dependencies,
		Deadline:             request.Deadline,
		Metadata:             request.Metadata,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	// Store task in memory
	tasksMap := memory.Contexts.Shared["tasks"].(map[string]interface{})
	tasksMap[task.ID] = task

	// Update memory metadata
	memory.Metadata.UpdatedAt = now
	memory.Metadata.AccessCount++

	// Save memory
	err = h.saveTeamMemory(teamID, userID, memory)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save task: %v", err),
		}, nil
	}

	return &types.TeamTaskResponse{
		Success: true,
		Task:    task,
		Data: map[string]interface{}{
			"message": "Task created successfully",
			"task_id": task.ID,
		},
	}, nil
}

// ClaimTeamTask allows an agent to claim a pending task
func (h *TeamsHandler) ClaimTeamTask(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}

	// Get team memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}

	if team.Memory == nil || team.Memory.Contexts.Shared == nil || team.Memory.Contexts.Shared["tasks"] == nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "No tasks available",
		}, nil
	}

	tasksMap := team.Memory.Contexts.Shared["tasks"].(map[string]interface{})

	// If specific task ID provided, claim that task
	if request.TaskID != "" {
		taskData, exists := tasksMap[request.TaskID]
		if !exists {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   fmt.Sprintf("Task %s not found", request.TaskID),
			}, nil
		}

		// Convert to TeamTask
		task := taskData.(*types.TeamTask)
		if task.Status != types.TaskStatusPending {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   fmt.Sprintf("Task %s is not available for claiming (status: %s)", request.TaskID, task.Status),
			}, nil
		}

		// Claim the task
		now := time.Now()
		task.Status = types.TaskStatusClaimed
		task.AssignedTo = agentID
		task.ClaimedAt = &now
		task.UpdatedAt = now

		tasksMap[task.ID] = task

		// Save memory
		team.Memory.Metadata.UpdatedAt = now
		err = h.saveTeamMemory(teamID, userID, team.Memory)
		if err != nil {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to claim task: %v", err),
			}, nil
		}

		return &types.TeamTaskResponse{
			Success: true,
			Task:    task,
			Data: map[string]interface{}{
				"message":   "Task claimed successfully",
				"task_id":   task.ID,
				"claimed_by": agentID,
			},
		}, nil
	}

	// Otherwise, find and claim the best available task based on criteria
	var bestTask *types.TeamTask
	var bestTaskID string

	for taskID, taskData := range tasksMap {
		task := taskData.(*types.TeamTask)
		if task.Status != types.TaskStatusPending {
			continue
		}

		// Apply filter criteria if provided
		if request.FilterCriteria != nil {
			// Check priority filter
			if len(request.FilterCriteria.Priority) > 0 {
				matched := false
				for _, allowedPriority := range request.FilterCriteria.Priority {
					if string(task.Priority) == allowedPriority {
						matched = true
						break
					}
				}
				if !matched {
					continue
				}
			}

			// Check capabilities filter
			if len(request.FilterCriteria.RequiredCapabilities) > 0 {
				hasAllCaps := true
				for _, requiredCap := range request.FilterCriteria.RequiredCapabilities {
					found := false
					for _, taskCap := range task.RequiredCapabilities {
						if taskCap == requiredCap {
							found = true
							break
						}
					}
					if !found {
						hasAllCaps = false
						break
					}
				}
				if !hasAllCaps {
					continue
				}
			}
		}

		// Select best task (prioritize by priority, then by creation time)
		if bestTask == nil || 
		   task.Priority == types.TaskPriorityUrgent && bestTask.Priority != types.TaskPriorityUrgent ||
		   task.Priority == types.TaskPriorityHigh && bestTask.Priority == types.TaskPriorityMedium ||
		   task.Priority == types.TaskPriorityHigh && bestTask.Priority == types.TaskPriorityLow ||
		   (task.Priority == bestTask.Priority && task.CreatedAt.Before(bestTask.CreatedAt)) {
			bestTask = task
			bestTaskID = taskID
		}
	}

	if bestTask == nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "No suitable tasks available for claiming",
		}, nil
	}

	// Claim the best task
	now := time.Now()
	bestTask.Status = types.TaskStatusClaimed
	bestTask.AssignedTo = agentID
	bestTask.ClaimedAt = &now
	bestTask.UpdatedAt = now

	tasksMap[bestTaskID] = bestTask

	// Save memory
	team.Memory.Metadata.UpdatedAt = now
	err = h.saveTeamMemory(teamID, userID, team.Memory)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to claim task: %v", err),
		}, nil
	}

	return &types.TeamTaskResponse{
		Success: true,
		Task:    bestTask,
		Data: map[string]interface{}{
			"message":   "Task claimed successfully",
			"task_id":   bestTask.ID,
			"claimed_by": agentID,
		},
	}, nil
}

// CompleteTeamTask marks a task as completed
func (h *TeamsHandler) CompleteTeamTask(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}

	// Get team memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}

	if team.Memory == nil || team.Memory.Contexts.Shared == nil || team.Memory.Contexts.Shared["tasks"] == nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Task not found",
		}, nil
	}

	tasksMap := team.Memory.Contexts.Shared["tasks"].(map[string]interface{})
	taskData, exists := tasksMap[request.TaskID]
	if !exists {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Task %s not found", request.TaskID),
		}, nil
	}

	task := taskData.(*types.TeamTask)

	// Verify agent can complete this task
	if task.AssignedTo != agentID {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Task %s is assigned to %s, cannot be completed by %s", request.TaskID, task.AssignedTo, agentID),
		}, nil
	}

	// Update task completion
	now := time.Now()
	switch request.CompletionStatus {
	case "completed":
		task.Status = types.TaskStatusCompleted
	case "failed":
		task.Status = types.TaskStatusFailed
	case "blocked":
		task.Status = types.TaskStatusBlocked
	case "partial":
		task.Status = types.TaskStatusInProgress // Keep as in progress for partial completion
	default:
		task.Status = types.TaskStatusCompleted
	}

	task.UpdatedAt = now
	if task.Status == types.TaskStatusCompleted {
		task.CompletedAt = &now
	}
	task.ActualDuration = request.ActualDuration
	task.Results = request.Results
	task.CompletionNotes = request.CompletionNotes
	task.ArtifactsCreated = request.ArtifactsCreated

	tasksMap[task.ID] = task

	// Create follow-up tasks if requested
	var followUpTaskIDs []string
	if len(request.FollowUpTasks) > 0 {
		for _, followUp := range request.FollowUpTasks {
			followUpTask := &types.TeamTask{
				ID:          generateTaskID(),
				Title:       followUp.Title,
				Description: followUp.Description,
				Priority:    followUp.Priority,
				Status:      types.TaskStatusPending,
				CreatedBy:   agentID,
				CreatedAt:   now,
				UpdatedAt:   now,
			}
			tasksMap[followUpTask.ID] = followUpTask
			followUpTaskIDs = append(followUpTaskIDs, followUpTask.ID)
		}
	}

	// Save memory
	team.Memory.Metadata.UpdatedAt = now
	err = h.saveTeamMemory(teamID, userID, team.Memory)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to complete task: %v", err),
		}, nil
	}

	responseData := map[string]interface{}{
		"message":     "Task completed successfully",
		"task_id":     task.ID,
		"status":      string(task.Status),
		"completed_by": agentID,
	}
	if len(followUpTaskIDs) > 0 {
		responseData["follow_up_tasks_created"] = followUpTaskIDs
	}

	return &types.TeamTaskResponse{
		Success: true,
		Task:    task,
		Data:    responseData,
	}, nil
}

// ListTeamTasks retrieves tasks based on filter criteria
func (h *TeamsHandler) ListTeamTasks(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}

	// Get team memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}

	var tasks []types.TeamTask
	if team.Memory != nil && team.Memory.Contexts.Shared != nil && team.Memory.Contexts.Shared["tasks"] != nil {
		tasksMap := team.Memory.Contexts.Shared["tasks"].(map[string]interface{})

		for _, taskData := range tasksMap {
			task := taskData.(*types.TeamTask)

			// Apply filters
			if len(request.StatusFilter) > 0 {
				matched := false
				for _, allowedStatus := range request.StatusFilter {
					if string(task.Status) == allowedStatus {
						matched = true
						break
					}
				}
				if !matched {
					continue
				}
			}

			if len(request.PriorityFilter) > 0 {
				matched := false
				for _, allowedPriority := range request.PriorityFilter {
					if string(task.Priority) == allowedPriority {
						matched = true
						break
					}
				}
				if !matched {
					continue
				}
			}

			if request.AssignedAgentFilter != "" && task.AssignedTo != request.AssignedAgentFilter {
				continue
			}

			if len(request.CapabilityFilter) > 0 {
				hasAllCaps := true
				for _, requiredCap := range request.CapabilityFilter {
					found := false
					for _, taskCap := range task.RequiredCapabilities {
						if taskCap == requiredCap {
							found = true
							break
						}
					}
					if !found {
						hasAllCaps = false
						break
					}
				}
				if !hasAllCaps {
					continue
				}
			}

			if request.CreatedAfter != nil && task.CreatedAt.Before(*request.CreatedAfter) {
				continue
			}

			if request.DeadlineBefore != nil && (task.Deadline == nil || task.Deadline.After(*request.DeadlineBefore)) {
				continue
			}

			if !request.IncludeCompleted && task.Status == types.TaskStatusCompleted {
				continue
			}

			tasks = append(tasks, *task)
		}
	}

	// Sort tasks
	switch request.SortBy {
	case "priority":
		// Sort by priority (urgent > high > medium > low)
		// Implementation would need custom sorting logic
	case "deadline":
		// Sort by deadline
	case "created_date":
	default:
		// Default sort by creation date
	}

	// Limit results
	if request.Limit > 0 && len(tasks) > request.Limit {
		tasks = tasks[:request.Limit]
	}

	return &types.TeamTaskResponse{
		Success: true,
		Tasks:   tasks,
		Data: map[string]interface{}{
			"total_count": len(tasks),
			"team_id":     teamID,
		},
	}, nil
}

// ErrorTeamTask marks a task as having an error
func (h *TeamsHandler) ErrorTeamTask(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}

	// Get team memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}

	if team.Memory == nil || team.Memory.Contexts.Shared == nil || team.Memory.Contexts.Shared["tasks"] == nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Task not found",
		}, nil
	}

	tasksMap := team.Memory.Contexts.Shared["tasks"].(map[string]interface{})
	taskData, exists := tasksMap[request.TaskID]
	if !exists {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Task %s not found", request.TaskID),
		}, nil
	}

	task := taskData.(*types.TeamTask)

	// Verify agent can report error for this task
	if task.AssignedTo != agentID {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Task %s is assigned to %s, cannot report error from %s", request.TaskID, task.AssignedTo, agentID),
		}, nil
	}

	// Update task with error information
	now := time.Now()
	task.Status = types.TaskStatusFailed
	task.UpdatedAt = now
	task.CompletionNotes = request.ErrorMessage

	// Store error details in metadata
	if task.Metadata == nil {
		task.Metadata = make(map[string]interface{})
	}
	task.Metadata["error"] = map[string]interface{}{
		"type":                        request.ErrorType,
		"message":                     request.ErrorMessage,
		"code":                        request.ErrorCode,
		"attempted_actions":           request.AttemptedActions,
		"retry_count":                 request.RetryCount,
		"is_retryable":                request.IsRetryable,
		"suggested_retry_delay":       request.SuggestedRetryDelay,
		"workaround_suggestions":      request.WorkaroundSuggestions,
		"requires_human_intervention": request.RequiresHumanIntervention,
		"context_data":                request.ContextData,
		"reported_at":                 now,
		"reported_by":                 agentID,
	}

	tasksMap[task.ID] = task

	// Save memory
	team.Memory.Metadata.UpdatedAt = now
	err = h.saveTeamMemory(teamID, userID, team.Memory)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to report task error: %v", err),
		}, nil
	}

	return &types.TeamTaskResponse{
		Success: true,
		Task:    task,
		Data: map[string]interface{}{
			"message":    "Task error reported successfully",
			"task_id":    task.ID,
			"error_type": request.ErrorType,
			"is_retryable": request.IsRetryable,
		},
	}, nil
}

// ClearTeamTasks clears, deletes, or manages team tasks for consolidation
func (h *TeamsHandler) ClearTeamTasks(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}

	// Get team memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}

	// Initialize memory if needed
	var memory *types.TeamMemory
	if team.Memory != nil {
		memory = team.Memory
	} else {
		memory, err = h.InitializeTeamMemory(teamID)
		if err != nil {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to initialize memory: %v", err),
			}, nil
		}
	}

	// Get current tasks
	var tasks []types.TeamTask
	if memory.Tasks != nil {
		tasks = memory.Tasks
	}

	action := request.Action
	if action == "" {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Action is required",
		}, nil
	}

	var tasksRemoved []types.TeamTask
	var tasksKept []types.TeamTask

	switch action {
	case "clear_all":
		if !request.Confirmation {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   "Confirmation required for clear_all action",
			}, nil
		}
		tasksRemoved = tasks
		tasksKept = []types.TeamTask{}

	case "clear_completed":
		for _, task := range tasks {
			if task.Status == "completed" {
				tasksRemoved = append(tasksRemoved, task)
			} else {
				tasksKept = append(tasksKept, task)
			}
		}

	case "clear_failed":
		for _, task := range tasks {
			if task.Status == "failed" {
				tasksRemoved = append(tasksRemoved, task)
			} else {
				tasksKept = append(tasksKept, task)
			}
		}

	case "clear_cancelled":
		for _, task := range tasks {
			if task.Status == "cancelled" {
				tasksRemoved = append(tasksRemoved, task)
			} else {
				tasksKept = append(tasksKept, task)
			}
		}

	case "delete_task":
		if request.TaskID == "" {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   "task_id is required for delete_task action",
			}, nil
		}
		for _, task := range tasks {
			if task.ID == request.TaskID {
				tasksRemoved = append(tasksRemoved, task)
			} else {
				tasksKept = append(tasksKept, task)
			}
		}

	case "clear_by_status":
		if len(request.StatusFilter) == 0 {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   "status_filter is required for clear_by_status action",
			}, nil
		}
		statusMap := make(map[string]bool)
		for _, status := range request.StatusFilter {
			statusMap[status] = true
		}
		for _, task := range tasks {
			if statusMap[task.Status] {
				tasksRemoved = append(tasksRemoved, task)
			} else {
				tasksKept = append(tasksKept, task)
			}
		}

	case "clear_by_priority":
		if len(request.PriorityFilter) == 0 {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   "priority_filter is required for clear_by_priority action",
			}, nil
		}
		priorityMap := make(map[string]bool)
		for _, priority := range request.PriorityFilter {
			priorityMap[priority] = true
		}
		for _, task := range tasks {
			if priorityMap[task.Priority] {
				// Apply age filter if specified
				if request.OlderThanDays > 0 {
					daysDiff := int(time.Since(task.CreatedAt).Hours() / 24)
					if daysDiff >= request.OlderThanDays {
						tasksRemoved = append(tasksRemoved, task)
					} else {
						tasksKept = append(tasksKept, task)
					}
				} else {
					tasksRemoved = append(tasksRemoved, task)
				}
			} else {
				tasksKept = append(tasksKept, task)
			}
		}

	case "clear_old_tasks":
		if request.OlderThanDays <= 0 {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   "older_than_days is required for clear_old_tasks action",
			}, nil
		}
		for _, task := range tasks {
			daysDiff := int(time.Since(task.CreatedAt).Hours() / 24)
			if daysDiff >= request.OlderThanDays {
				tasksRemoved = append(tasksRemoved, task)
			} else {
				tasksKept = append(tasksKept, task)
			}
		}

	case "delete_duplicates":
		criteria := request.DuplicateCriteria
		if criteria == "" {
			criteria = "title"
		}
		keepNewest := true
		if !request.KeepNewest {
			keepNewest = false
		}

		// Group tasks by duplicate criteria
		groups := make(map[string][]types.TeamTask)
		for _, task := range tasks {
			var key string
			switch criteria {
			case "title":
				key = strings.ToLower(strings.TrimSpace(task.Title))
			case "title_and_description":
				key = strings.ToLower(strings.TrimSpace(task.Title + "|" + task.Description))
			case "exact_match":
				key = strings.ToLower(strings.TrimSpace(task.Title + "|" + task.Description + "|" + task.Priority))
			default:
				key = strings.ToLower(strings.TrimSpace(task.Title))
			}
			groups[key] = append(groups[key], task)
		}

		// For each group with duplicates, keep one and mark others for removal
		for _, group := range groups {
			if len(group) > 1 {
				// Sort by creation time
				var keepTask types.TeamTask
				if keepNewest {
					// Keep the newest task
					for i, task := range group {
						if i == 0 || task.CreatedAt.After(keepTask.CreatedAt) {
							keepTask = task
						}
					}
				} else {
					// Keep the oldest task
					for i, task := range group {
						if i == 0 || task.CreatedAt.Before(keepTask.CreatedAt) {
							keepTask = task
						}
					}
				}
				
				// Add all others to removal list
				for _, task := range group {
					if task.ID != keepTask.ID {
						tasksRemoved = append(tasksRemoved, task)
					} else {
						tasksKept = append(tasksKept, task)
					}
				}
			} else {
				// Single task, keep it
				tasksKept = append(tasksKept, group[0])
			}
		}

	default:
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Unknown action: %s", action),
		}, nil
	}

	// Update memory with remaining tasks
	memory.Tasks = tasksKept
	memory.Metadata.UpdatedAt = time.Now()

	// Update team in database
	err = h.updateTeamMemory(teamID, memory)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to update team memory: %v", err),
		}, nil
	}

	// Log the action
	reason := request.Reason
	if reason == "" {
		reason = fmt.Sprintf("Team task %s operation", action)
	}
	log.Printf("✅ Team task clear action '%s' completed: removed %d tasks, kept %d tasks. Reason: %s", 
		action, len(tasksRemoved), len(tasksKept), reason)

	return &types.TeamTaskResponse{
		Success: true,
		Message: fmt.Sprintf("Successfully completed %s action. Removed %d tasks, kept %d tasks.", action, len(tasksRemoved), len(tasksKept)),
		Data: map[string]interface{}{
			"action":        action,
			"tasks_removed": len(tasksRemoved),
			"tasks_kept":    len(tasksKept),
			"removed_tasks": tasksRemoved,
			"reason":        reason,
		},
	}, nil
}

// Helper function to generate unique task IDs
func generateTaskID() string {
	return fmt.Sprintf("task_%d", time.Now().UnixNano())
}
