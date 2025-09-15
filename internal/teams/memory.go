package teams

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"gogent/internal/types"
)

// InitializeTeamMemory creates a new empty memory structure for a team
func (h *Handler) InitializeTeamMemory(teamID string) (*types.TeamMemory, error) {
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
func (h *Handler) ReadTeamMemory(ctx context.Context, teamID, agentID, userID string, request *types.TeamMemoryRequest) (*types.TeamMemoryResponse, error) {
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
func (h *Handler) WriteTeamMemory(ctx context.Context, teamID, agentID, userID string, request *types.TeamMemoryRequest) (*types.TeamMemoryResponse, error) {
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
func (h *Handler) SearchTeamMemory(ctx context.Context, teamID, agentID, userID string, request *types.TeamMemoryRequest) (*types.TeamMemoryResponse, error) {
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
func (h *Handler) ClearTeamMemory(ctx context.Context, teamID, agentID, userID string, request *types.TeamMemoryRequest) (*types.TeamMemoryResponse, error) {
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
func (h *Handler) getValueByPath(data map[string]interface{}, path string) (interface{}, error) {
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

func (h *Handler) writeToContext(context map[string]interface{}, path string, data interface{}, mergeStrategy string) error {
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

func (h *Handler) performMemorySearch(memory *types.TeamMemory, query string, limit int) []types.MemorySearchResult {
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

func (h *Handler) searchRecursive(data interface{}, path, context, query string, results *[]types.MemorySearchResult) {
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

func (h *Handler) clearContext(memory *types.TeamMemory, contextName string) error {
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

func (h *Handler) clearPath(memory *types.TeamMemory, path string) error {
	// Implementation for clearing specific paths
	// This would need to traverse the memory structure and remove the specified path
	return fmt.Errorf("clear path not implemented yet")
}

func (h *Handler) compactMemory(memory *types.TeamMemory) error {
	// Implementation for memory compaction
	// This could remove empty contexts, optimize storage, etc.
	return nil
}

// StoreTeamTask stores a new task in the team's task memory
func (h *Handler) StoreTeamTask(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
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
func (h *Handler) ClaimTeamTask(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
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
		task, err := convertToTeamTask(taskData)
		if err != nil {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to convert task data for task ID %s: %v", request.TaskID, err),
			}, nil
		}
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
				"message":    "Task claimed successfully",
				"task_id":    task.ID,
				"claimed_by": agentID,
			},
		}, nil
	}

	// Otherwise, find and claim the best available task based on criteria
	var bestTask *types.TeamTask
	var bestTaskID string

	for taskID, taskData := range tasksMap {
		task, err := convertToTeamTask(taskData)
		if err != nil || task.Status != types.TaskStatusPending {
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

	tasksMap[bestTaskID] = *bestTask

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
			"message":    "Task claimed successfully",
			"task_id":    bestTask.ID,
			"claimed_by": agentID,
		},
	}, nil
}

// CompleteTeamTask marks a task as completed
func (h *Handler) CompleteTeamTask(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
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

	task, err := convertToTeamTask(taskData)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to convert task data for task ID %s: %v", request.TaskID, err),
		}, nil
	}

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
		"message":      "Task completed successfully",
		"task_id":      task.ID,
		"status":       string(task.Status),
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
func (h *Handler) ListTeamTasks(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
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
			task, err := convertToTeamTask(taskData)
			if err != nil {
				continue
			}

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
func (h *Handler) ErrorTeamTask(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
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

	task, err := convertToTeamTask(taskData)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to convert task data for task ID %s: %v", request.TaskID, err),
		}, nil
	}

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
			"message":      "Task error reported successfully",
			"task_id":      task.ID,
			"error_type":   request.ErrorType,
			"is_retryable": request.IsRetryable,
		},
	}, nil
}

// ClearTeamTasks clears, deletes, or manages team tasks for consolidation
func (h *Handler) ClearTeamTasks(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
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

	// Get current tasks from memory contexts
	var tasks []types.TeamTask
	if memory.Contexts.Shared != nil && memory.Contexts.Shared["tasks"] != nil {
		tasksMap := memory.Contexts.Shared["tasks"].(map[string]interface{})
		for _, taskData := range tasksMap {
			if task, err := convertToTeamTask(taskData); err == nil {
				tasks = append(tasks, *task)
			}
		}
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
			if string(task.Status) == "completed" {
				tasksRemoved = append(tasksRemoved, task)
			} else {
				tasksKept = append(tasksKept, task)
			}
		}

	case "clear_failed":
		for _, task := range tasks {
			if string(task.Status) == "failed" {
				tasksRemoved = append(tasksRemoved, task)
			} else {
				tasksKept = append(tasksKept, task)
			}
		}

	case "clear_canceled":
		for _, task := range tasks {
			if string(task.Status) == "canceled" {
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
			if statusMap[string(task.Status)] {
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
			if priorityMap[string(task.Priority)] {
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
				key = strings.ToLower(strings.TrimSpace(task.Title + "|" + task.Description + "|" + string(task.Priority)))
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
	if memory.Contexts.Shared == nil {
		memory.Contexts.Shared = make(map[string]interface{})
	}

	// Clear the tasks map and rebuild with remaining tasks
	tasksMap := make(map[string]interface{})
	for _, task := range tasksKept {
		tasksMap[task.ID] = task
	}
	memory.Contexts.Shared["tasks"] = tasksMap
	memory.Metadata.UpdatedAt = time.Now()

	// Update team in database (using the same method as other functions)
	query := `UPDATE teams SET memory = ? WHERE id = ? AND user_id = ?`
	memoryJSON, err := json.Marshal(memory)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to serialize team memory: %v", err),
		}, nil
	}
	_, err = h.db.Exec(query, string(memoryJSON), teamID, userID)
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
		Data: map[string]interface{}{
			"message":       fmt.Sprintf("Successfully completed %s action. Removed %d tasks, kept %d tasks.", action, len(tasksRemoved), len(tasksKept)),
			"action":        action,
			"tasks_removed": len(tasksRemoved),
			"tasks_kept":    len(tasksKept),
			"removed_tasks": tasksRemoved,
			"reason":        reason,
		},
	}, nil
}

// DeleteTeamTask deletes a specific task from the team's task memory by task ID
func (h *Handler) DeleteTeamTask(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}

	if request.TaskID == "" {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "task_id is required",
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
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Team has no tasks to delete",
		}, nil
	}

	// Get current tasks map
	if memory.Contexts.Shared == nil || memory.Contexts.Shared["tasks"] == nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "No tasks found to delete",
		}, nil
	}

	tasksMap := memory.Contexts.Shared["tasks"].(map[string]interface{})

	// Check if task exists
	taskData, exists := tasksMap[request.TaskID]
	if !exists {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Task with ID %s not found", request.TaskID),
		}, nil
	}

	// Convert task data to get task info for response
	deletedTask, err := convertToTeamTask(taskData)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to process task data: %v", err),
		}, nil
	}

	// Delete the task
	delete(tasksMap, request.TaskID)
	memory.Contexts.Shared["tasks"] = tasksMap
	memory.Metadata.UpdatedAt = time.Now()

	// Save to database
	err = h.saveTeamMemory(teamID, userID, memory)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save team memory: %v", err),
		}, nil
	}

	reason := request.Reason
	if reason == "" {
		reason = "Task deleted via team_task_delete function"
	}

	log.Printf("✅ Task deleted successfully: %s from team %s. Reason: %s", request.TaskID, teamID, reason)

	return &types.TeamTaskResponse{
		Success: true,
		Task:    deletedTask,
		Data: map[string]interface{}{
			"message":      "Task deleted successfully",
			"task_id":      request.TaskID,
			"deleted_task": deletedTask,
			"reason":       reason,
		},
	}, nil
}

// Helper function to convert task data from map[string]interface{} to TeamTask
func convertToTeamTask(taskData interface{}) (*types.TeamTask, error) {
	// If it's already a pointer to TeamTask, return it
	if task, ok := taskData.(*types.TeamTask); ok {
		return task, nil
	}

	// If it's a TeamTask struct, return pointer to it
	if task, ok := taskData.(types.TeamTask); ok {
		return &task, nil
	}

	// If it's a map (from JSON unmarshaling), convert it
	if taskMap, ok := taskData.(map[string]interface{}); ok {
		// Marshal back to JSON and unmarshal to TeamTask
		taskJSON, err := json.Marshal(taskMap)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal task data: %w", err)
		}

		var task types.TeamTask
		err = json.Unmarshal(taskJSON, &task)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal task data: %w", err)
		}

		return &task, nil
	}

	return nil, fmt.Errorf("invalid task data type: %T", taskData)
}

// Helper function to generate unique task IDs
func generateTaskID() string {
	return fmt.Sprintf("task_%d", time.Now().UnixNano())
}

// UpdateTeamTask updates an existing task in the team's task memory
func (h *Handler) UpdateTeamTask(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 UpdateTeamTask called with teamID: %s, agentID: %s, userID: %s, taskID: %s", teamID, agentID, userID, request.TaskID)

	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		log.Printf("❌ UpdateTeamTask access validation failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}
	log.Printf("✅ UpdateTeamTask access validation passed")

	// Validate task ID
	if request.TaskID == "" {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Task ID is required for task update",
		}, nil
	}

	// Get team memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		log.Printf("❌ UpdateTeamTask team lookup failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}
	log.Printf("✅ UpdateTeamTask team found: %s", team.Name)

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
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Task '%s' not found - no tasks exist", request.TaskID),
		}, nil
	}

	// Get tasks map
	tasksInterface := memory.Contexts.Shared["tasks"]
	tasks, ok := tasksInterface.(map[string]interface{})
	if !ok {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Invalid tasks data format",
		}, nil
	}

	// Check if task exists
	existingTaskData, exists := tasks[request.TaskID]
	if !exists {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Task '%s' not found", request.TaskID),
		}, nil
	}

	// Convert existing task to proper format
	existingTask, err := convertToTeamTask(existingTaskData)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to parse existing task: %v", err),
		}, nil
	}

	// Create updated task by copying existing task and applying updates
	updatedTask := *existingTask
	now := time.Now()
	updatedTask.UpdatedAt = now

	// Apply field updates if provided
	if request.TaskTitle != "" {
		updatedTask.Title = request.TaskTitle
	}
	if request.TaskDescription != "" {
		updatedTask.Description = request.TaskDescription
	}
	if request.Priority != "" {
		updatedTask.Priority = types.TeamTaskPriority(request.Priority)
	}
	if request.EstimatedDuration != "" {
		updatedTask.EstimatedDuration = request.EstimatedDuration
	}
	if len(request.RequiredCapabilities) > 0 {
		updatedTask.RequiredCapabilities = request.RequiredCapabilities
	}
	if len(request.Dependencies) > 0 {
		updatedTask.Dependencies = request.Dependencies
	}
	if request.Deadline != nil {
		updatedTask.Deadline = request.Deadline
	}

	// Handle metadata updates
	if request.Metadata != nil {
		mergeMetadata := true
		if mergeValue, ok := request.Metadata["merge_metadata"]; ok {
			if mergeBool, ok := mergeValue.(bool); ok {
				mergeMetadata = mergeBool
			}
		}

		if mergeMetadata {
			// Merge with existing metadata
			if updatedTask.Metadata == nil {
				updatedTask.Metadata = make(map[string]interface{})
			}
			for key, value := range request.Metadata {
				if key != "merge_metadata" { // Don't store the merge flag
					updatedTask.Metadata[key] = value
				}
			}
		} else {
			// Replace all metadata
			filteredMetadata := make(map[string]interface{})
			for key, value := range request.Metadata {
				if key != "merge_metadata" { // Don't store the merge flag
					filteredMetadata[key] = value
				}
			}
			updatedTask.Metadata = filteredMetadata
		}
	}

	// Store updated task
	tasks[request.TaskID] = updatedTask

	// Update memory metadata
	memory.Metadata.UpdatedAt = now
	memory.Metadata.Version = "1.0"

	// Save the team memory
	err = h.saveTeamMemory(teamID, userID, memory)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save updated task: %v", err),
		}, nil
	}

	log.Printf("✅ Task updated successfully: %s", request.TaskID)

	return &types.TeamTaskResponse{
		Success: true,
		Task:    &updatedTask,
		Data: map[string]interface{}{
			"message":      "Task updated successfully",
			"task_id":      request.TaskID,
			"updated_task": updatedTask,
		},
	}, nil
}

// StoreAgentTask stores a task record in the agent's task memory
func (h *Handler) StoreAgentTask(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 StoreAgentTask called with teamID: %s, agentID: %s, userID: %s", teamID, agentID, userID)

	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		log.Printf("❌ StoreAgentTask access validation failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}
	log.Printf("✅ StoreAgentTask access validation passed")

	// Get team memory to access agent memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		log.Printf("❌ StoreAgentTask team lookup failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}
	log.Printf("✅ StoreAgentTask team found: %s", team.Name)

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

	// Ensure shared context exists for agent task storage
	if memory.Contexts.Shared == nil {
		memory.Contexts.Shared = make(map[string]interface{})
	}

	// Get context from metadata or default
	context := "reported_tasks"
	if contextValue, ok := request.Metadata["context"]; ok {
		if contextStr, ok := contextValue.(string); ok && contextStr != "" {
			context = contextStr
		}
	}

	// Create agent-specific task storage path
	agentTasksKey := fmt.Sprintf("agent_tasks_%s", agentID)
	if memory.Contexts.Shared[agentTasksKey] == nil {
		memory.Contexts.Shared[agentTasksKey] = make(map[string]interface{})
	}

	agentTasks := memory.Contexts.Shared[agentTasksKey].(map[string]interface{})

	// Ensure context exists in agent tasks
	contextKey := fmt.Sprintf("context_%s", context)
	if agentTasks[contextKey] == nil {
		agentTasks[contextKey] = make(map[string]interface{})
	}

	// Get task ID from request
	taskID := request.TaskID
	if taskID == "" {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Task ID is required for agent task storage",
		}, nil
	}

	// Store the task data (use metadata as the task data)
	tasks := agentTasks[contextKey].(map[string]interface{})
	tasks[taskID] = request.Metadata

	// Update memory metadata
	now := time.Now()
	memory.Metadata.UpdatedAt = now
	memory.Metadata.Version = "1.0"

	// Save the team memory
	err = h.saveTeamMemory(teamID, userID, memory)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save agent task: %v", err),
		}, nil
	}

	log.Printf("✅ Agent task stored successfully: %s in context %s for agent %s", taskID, context, agentID)

	return &types.TeamTaskResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":   "Agent task stored successfully",
			"task_id":   taskID,
			"context":   context,
			"agent_id":  agentID,
			"task_data": request.Metadata,
		},
	}, nil
}

// ListAgentTasks retrieves tasks from the agent's task memory
func (h *Handler) ListAgentTasks(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 ListAgentTasks called with teamID: %s, agentID: %s, userID: %s", teamID, agentID, userID)

	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		log.Printf("❌ ListAgentTasks access validation failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}

	// Get team memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		log.Printf("❌ ListAgentTasks team lookup failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}

	// Check if memory exists
	if team.Memory == nil || team.Memory.Contexts.Shared == nil {
		log.Printf("✅ No agent tasks found - returning empty list")
		return &types.TeamTaskResponse{
			Success: true,
			Data: map[string]interface{}{
				"tasks":   []interface{}{},
				"count":   0,
				"context": "reported_tasks",
			},
		}, nil
	}

	// Get context from metadata or default
	context := "reported_tasks"
	if contextValue, ok := request.Metadata["context"]; ok {
		if contextStr, ok := contextValue.(string); ok && contextStr != "" {
			context = contextStr
		}
	}

	// Check agent-specific task storage
	agentTasksKey := fmt.Sprintf("agent_tasks_%s", agentID)
	agentTasksInterface := team.Memory.Contexts.Shared[agentTasksKey]

	if agentTasksInterface == nil {
		log.Printf("✅ No agent tasks found - returning empty list")
		return &types.TeamTaskResponse{
			Success: true,
			Data: map[string]interface{}{
				"tasks":   []interface{}{},
				"count":   0,
				"context": context,
			},
		}, nil
	}

	agentTasks, ok := agentTasksInterface.(map[string]interface{})
	if !ok {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Invalid agent tasks data format",
		}, nil
	}

	contextKey := fmt.Sprintf("context_%s", context)
	tasksInterface := agentTasks[contextKey]

	if tasksInterface == nil {
		log.Printf("✅ No tasks found in context %s - returning empty list", context)
		return &types.TeamTaskResponse{
			Success: true,
			Data: map[string]interface{}{
				"tasks":   []interface{}{},
				"count":   0,
				"context": context,
			},
		}, nil
	}

	tasks, ok := tasksInterface.(map[string]interface{})
	if !ok {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Invalid agent tasks data format",
		}, nil
	}

	// Convert to array format and apply filters
	var taskList []interface{}
	for taskID, taskData := range tasks {
		taskRecord := map[string]interface{}{
			"task_id":   taskID,
			"task_data": taskData,
		}
		taskList = append(taskList, taskRecord)
	}

	// Apply limit if specified
	limit := len(taskList)
	if request.Limit > 0 && request.Limit < limit {
		limit = request.Limit
		taskList = taskList[:limit]
	}

	log.Printf("✅ Found %d agent tasks in context %s", len(taskList), context)

	return &types.TeamTaskResponse{
		Success: true,
		Data: map[string]interface{}{
			"tasks":   taskList,
			"count":   len(taskList),
			"context": context,
		},
	}, nil
}

// DeleteAgentTask removes a task from the agent's task memory
func (h *Handler) DeleteAgentTask(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 DeleteAgentTask called with teamID: %s, agentID: %s, userID: %s, taskID: %s", teamID, agentID, userID, request.TaskID)

	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		log.Printf("❌ DeleteAgentTask access validation failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}

	// Validate task ID
	if request.TaskID == "" {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Task ID is required for agent task deletion",
		}, nil
	}

	// Get team memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		log.Printf("❌ DeleteAgentTask team lookup failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}

	// Check if memory exists
	if team.Memory == nil || team.Memory.Contexts.Shared == nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Agent task memory not found",
		}, nil
	}

	// Get context from metadata or default
	context := "reported_tasks"
	if contextValue, ok := request.Metadata["context"]; ok {
		if contextStr, ok := contextValue.(string); ok && contextStr != "" {
			context = contextStr
		}
	}

	// Check agent-specific task storage
	agentTasksKey := fmt.Sprintf("agent_tasks_%s", agentID)
	agentTasksInterface := team.Memory.Contexts.Shared[agentTasksKey]

	if agentTasksInterface == nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Agent task memory not found",
		}, nil
	}

	agentTasks, ok := agentTasksInterface.(map[string]interface{})
	if !ok {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Invalid agent tasks data format",
		}, nil
	}

	contextKey := fmt.Sprintf("context_%s", context)
	tasksInterface := agentTasks[contextKey]

	if tasksInterface == nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Agent task context '%s' not found", context),
		}, nil
	}

	tasks, ok := tasksInterface.(map[string]interface{})
	if !ok {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Invalid agent tasks data format",
		}, nil
	}

	// Check if task exists
	deletedTask, exists := tasks[request.TaskID]
	if !exists {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Agent task '%s' not found in context '%s'", request.TaskID, context),
		}, nil
	}

	// Delete the task
	delete(tasks, request.TaskID)

	// Update memory metadata
	now := time.Now()
	team.Memory.Metadata.UpdatedAt = now

	// Save the updated memory
	err = h.saveTeamMemory(teamID, userID, team.Memory)
	if err != nil {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save updated agent memory: %v", err),
		}, nil
	}

	log.Printf("✅ Agent task deleted successfully: %s from context %s for agent %s", request.TaskID, context, agentID)

	return &types.TeamTaskResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":      "Agent task deleted successfully",
			"task_id":      request.TaskID,
			"context":      context,
			"agent_id":     agentID,
			"deleted_task": deletedTask,
		},
	}, nil
}

// UpdateAgentTaskProgress stores progress tracking data for a task the agent is working on
func (h *Handler) UpdateAgentTaskProgress(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 UpdateAgentTaskProgress called with teamID: %s, agentID: %s, userID: %s, taskID: %s", teamID, agentID, userID, request.TaskID)

	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		log.Printf("❌ UpdateAgentTaskProgress access validation failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}
	log.Printf("✅ UpdateAgentTaskProgress access validation passed")

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

	// Get team memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		log.Printf("❌ UpdateAgentTaskProgress team lookup failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}
	log.Printf("✅ UpdateAgentTaskProgress team found: %s", team.Name)

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

	// Ensure shared context exists for agent progress storage
	if memory.Contexts.Shared == nil {
		memory.Contexts.Shared = make(map[string]interface{})
	}

	// Create agent-specific progress storage path
	agentProgressKey := fmt.Sprintf("agent_progress_%s", agentID)
	if memory.Contexts.Shared[agentProgressKey] == nil {
		memory.Contexts.Shared[agentProgressKey] = make(map[string]interface{})
	}

	agentProgress := memory.Contexts.Shared[agentProgressKey].(map[string]interface{})

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

	// Store progress data
	agentProgress[request.TaskID] = progressData

	// Update memory metadata
	memory.Metadata.UpdatedAt = now

	// Save updated memory
	err = h.saveTeamMemory(teamID, userID, memory)
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

// ReadAgentTaskProgress retrieves saved progress data for tasks the agent is working on
func (h *Handler) ReadAgentTaskProgress(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 ReadAgentTaskProgress called with teamID: %s, agentID: %s, userID: %s", teamID, agentID, userID)

	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		log.Printf("❌ ReadAgentTaskProgress access validation failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}
	log.Printf("✅ ReadAgentTaskProgress access validation passed")

	// Get team memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		log.Printf("❌ ReadAgentTaskProgress team lookup failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}
	log.Printf("✅ ReadAgentTaskProgress team found: %s", team.Name)

	// Check if memory exists
	if team.Memory == nil || team.Memory.Contexts.Shared == nil {
		return &types.TeamTaskResponse{
			Success: true,
			Data: map[string]interface{}{
				"message":          "No agent progress data found",
				"progress_records": []interface{}{},
			},
		}, nil
	}

	// Get agent-specific progress storage
	agentProgressKey := fmt.Sprintf("agent_progress_%s", agentID)
	agentProgressInterface := team.Memory.Contexts.Shared[agentProgressKey]

	if agentProgressInterface == nil {
		return &types.TeamTaskResponse{
			Success: true,
			Data: map[string]interface{}{
				"message":          "No agent progress data found",
				"progress_records": []interface{}{},
			},
		}, nil
	}

	agentProgress, ok := agentProgressInterface.(map[string]interface{})
	if !ok {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Invalid agent progress data format",
		}, nil
	}

	var progressRecords []interface{}

	// If specific task ID requested
	if request.TaskID != "" {
		if progressData, exists := agentProgress[request.TaskID]; exists {
			progressRecords = append(progressRecords, map[string]interface{}{
				"task_id":       request.TaskID,
				"progress_data": progressData,
			})
		}
	} else {
		// Return all progress records
		for taskID, progressData := range agentProgress {
			// Apply status filter if provided
			if len(request.StatusFilter) > 0 {
				if progressMap, ok := progressData.(map[string]interface{}); ok {
					if status, ok := progressMap["status"].(string); ok {
						filterMatch := false
						for _, filterStatus := range request.StatusFilter {
							if status == filterStatus {
								filterMatch = true
								break
							}
						}
						if !filterMatch {
							continue
						}
					}
				}
			}

			// Apply include_completed filter
			if !request.IncludeCompleted {
				if progressMap, ok := progressData.(map[string]interface{}); ok {
					if status, ok := progressMap["status"].(string); ok {
						if status == "completed" || status == "error" {
							continue
						}
					}
				}
			}

			progressRecords = append(progressRecords, map[string]interface{}{
				"task_id":       taskID,
				"progress_data": progressData,
			})

			// Apply limit
			if len(progressRecords) >= request.Limit {
				break
			}
		}
	}

	log.Printf("✅ ReadAgentTaskProgress completed: found %d progress records for agent %s", len(progressRecords), agentID)

	return &types.TeamTaskResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":          "Agent task progress retrieved successfully",
			"agent_id":         agentID,
			"progress_records": progressRecords,
			"total_count":      len(progressRecords),
		},
	}, nil
}

// ClearAgentTaskProgress clears saved progress data for tasks
func (h *Handler) ClearAgentTaskProgress(ctx context.Context, teamID, agentID, userID string, request *types.TeamTaskRequest) (*types.TeamTaskResponse, error) {
	log.Printf("🔍 ClearAgentTaskProgress called with teamID: %s, agentID: %s, userID: %s", teamID, agentID, userID)

	// Validate access
	err := h.validateTeamMemoryAccess(agentID, teamID, userID)
	if err != nil {
		log.Printf("❌ ClearAgentTaskProgress access validation failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Access denied: %v", err),
		}, nil
	}
	log.Printf("✅ ClearAgentTaskProgress access validation passed")

	// Get team memory
	team, err := h.getTeamByID(teamID, userID)
	if err != nil {
		log.Printf("❌ ClearAgentTaskProgress team lookup failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Team not found: %v", err),
		}, nil
	}
	log.Printf("✅ ClearAgentTaskProgress team found: %s", team.Name)

	// Check if memory exists
	if team.Memory == nil || team.Memory.Contexts.Shared == nil {
		return &types.TeamTaskResponse{
			Success: true,
			Data: map[string]interface{}{
				"message":       "No agent progress data to clear",
				"cleared_count": 0,
			},
		}, nil
	}

	// Get agent-specific progress storage
	agentProgressKey := fmt.Sprintf("agent_progress_%s", agentID)
	agentProgressInterface := team.Memory.Contexts.Shared[agentProgressKey]

	if agentProgressInterface == nil {
		return &types.TeamTaskResponse{
			Success: true,
			Data: map[string]interface{}{
				"message":       "No agent progress data to clear",
				"cleared_count": 0,
			},
		}, nil
	}

	agentProgress, ok := agentProgressInterface.(map[string]interface{})
	if !ok {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Invalid agent progress data format",
		}, nil
	}

	var clearedTasks []string
	var clearedCount int

	action := request.Action
	if action == "" {
		return &types.TeamTaskResponse{
			Success: false,
			Error:   "Action is required for clearing progress",
		}, nil
	}

	now := time.Now()

	switch action {
	case "clear_task":
		if request.TaskID == "" {
			return &types.TeamTaskResponse{
				Success: false,
				Error:   "Task ID is required for clear_task action",
			}, nil
		}
		if _, exists := agentProgress[request.TaskID]; exists {
			delete(agentProgress, request.TaskID)
			clearedTasks = append(clearedTasks, request.TaskID)
			clearedCount = 1
		}

	case "clear_completed":
		cutoffTime := now.Add(-time.Duration(request.OlderThanHours) * time.Hour)
		for taskID, progressData := range agentProgress {
			if progressMap, ok := progressData.(map[string]interface{}); ok {
				if status, ok := progressMap["status"].(string); ok {
					if status == "completed" {
						// Check if old enough
						if lastUpdatedStr, ok := progressMap["last_updated"].(string); ok {
							if lastUpdated, err := time.Parse(time.RFC3339, lastUpdatedStr); err == nil {
								if lastUpdated.Before(cutoffTime) {
									delete(agentProgress, taskID)
									clearedTasks = append(clearedTasks, taskID)
									clearedCount++
								}
							}
						}
					}
				}
			}
		}

	case "clear_abandoned":
		cutoffTime := now.Add(-time.Duration(request.OlderThanHours) * time.Hour)
		for taskID, progressData := range agentProgress {
			if progressMap, ok := progressData.(map[string]interface{}); ok {
				if lastUpdatedStr, ok := progressMap["last_updated"].(string); ok {
					if lastUpdated, err := time.Parse(time.RFC3339, lastUpdatedStr); err == nil {
						if lastUpdated.Before(cutoffTime) {
							delete(agentProgress, taskID)
							clearedTasks = append(clearedTasks, taskID)
							clearedCount++
						}
					}
				}
			}
		}

	case "clear_all":
		for taskID := range agentProgress {
			delete(agentProgress, taskID)
			clearedTasks = append(clearedTasks, taskID)
			clearedCount++
		}

	default:
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid clear action: %s", action),
		}, nil
	}

	// Update memory metadata
	team.Memory.Metadata.UpdatedAt = now

	// Save updated memory
	err = h.saveTeamMemory(teamID, userID, team.Memory)
	if err != nil {
		log.Printf("❌ ClearAgentTaskProgress save failed: %v", err)
		return &types.TeamTaskResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save cleared progress: %v", err),
		}, nil
	}

	log.Printf("✅ Agent task progress cleared successfully: %d tasks for agent %s", clearedCount, agentID)

	return &types.TeamTaskResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":       "Agent task progress cleared successfully",
			"action":        action,
			"agent_id":      agentID,
			"cleared_tasks": clearedTasks,
			"cleared_count": clearedCount,
			"reason":        request.Reason,
		},
	}, nil
}
