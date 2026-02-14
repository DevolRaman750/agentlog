package teams

import (
	"context"
	"fmt"
	"strings"
	"time"

	"gogent/internal/types"
)

// String constants for memory operations
const (
	MemoryVersion = "1.0"

	// Memory context types
	ContextWorkflow   = "workflow"
	ContextSession    = "session"
	ContextPersistent = "persistent"
	ContextShared     = "shared"

	// Task status constants
	TaskStatusCompleted = "completed"
	TaskStatusFailed    = "failed"

	// Memory operation types
	OpClearAll       = "clear_all"
	OpClearCompleted = "clear_completed"
	OpReplace        = "replace"
	OpAppend         = "append"

	// Memory context keys
	ContextReportedTasks = "reported_tasks"
	ContextMergeMetadata = "merge_metadata"

	// Search criteria
	SearchCriteriaTitle = "title"
)

// InitializeTeamMemory creates a new empty memory structure for a team
func (h *Handler) InitializeTeamMemory(_ string) (*types.TeamMemory, error) {
	now := time.Now()
	memory := &types.TeamMemory{
		Version: MemoryVersion,
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
func (h *Handler) ReadTeamMemory(_ context.Context, teamID, agentID, userID string, request *types.TeamMemoryRequest) (*types.TeamMemoryResponse, error) {
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

	// Filter by context if specified
	var responseData map[string]interface{}
	switch strings.ToLower(request.Context) {
	case ContextWorkflow:
		responseData = map[string]interface{}{"workflow": memory.Contexts.Workflow}
	case ContextSession:
		responseData = map[string]interface{}{"session": memory.Contexts.Session}
	case ContextPersistent:
		responseData = map[string]interface{}{"persistent": memory.Contexts.Persistent}
	case ContextShared:
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

	// NOTE: Previously saved memory on every read just to update access count.
	// This caused a lost-update race condition: if a read loaded stale memory
	// (before a concurrent task store saved), then saved after, it would
	// overwrite the task data with the stale copy. Access count tracking is
	// not worth the data loss risk, so reads no longer write back to the DB.

	return &types.TeamMemoryResponse{
		Success:  true,
		Data:     responseData,
		Metadata: memory.Metadata,
	}, nil
}

// WriteTeamMemory stores or updates memory data for a team
func (h *Handler) WriteTeamMemory(_ context.Context, teamID, agentID, userID string, request *types.TeamMemoryRequest) (*types.TeamMemoryResponse, error) {
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
	case ContextWorkflow:
		if memory.Contexts.Workflow == nil {
			memory.Contexts.Workflow = make(map[string]interface{})
		}
		targetContext = memory.Contexts.Workflow
	case ContextSession:
		if memory.Contexts.Session == nil {
			memory.Contexts.Session = make(map[string]interface{})
		}
		targetContext = memory.Contexts.Session
	case ContextPersistent:
		if memory.Contexts.Persistent == nil {
			memory.Contexts.Persistent = make(map[string]interface{})
		}
		targetContext = memory.Contexts.Persistent
	case ContextShared:
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
func (h *Handler) SearchTeamMemory(_ context.Context, teamID, agentID, userID string, request *types.TeamMemoryRequest) (*types.TeamMemoryResponse, error) {
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

	// NOTE: Do not save memory on read-only operations (search).
	// Saving just for access count caused lost-update race conditions
	// that could overwrite task data stored by concurrent operations.

	return &types.TeamMemoryResponse{
		Success:  true,
		Results:  results,
		Metadata: team.Memory.Metadata,
	}, nil
}

// ClearTeamMemory clears or manages team memory based on the request
func (h *Handler) ClearTeamMemory(_ context.Context, teamID, agentID, userID string, request *types.TeamMemoryRequest) (*types.TeamMemoryResponse, error) {
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
	case OpClearAll:
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

//nolint:unparam // error return kept for interface compatibility
func (h *Handler) writeToContext(context map[string]interface{}, path string, data interface{}, mergeStrategy string) error {
	if path == "" {
		// Write to context root
		switch mergeStrategy {
		case OpReplace:
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
		case OpAppend:
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
			case OpReplace:
				current[part] = data
			case OpAppend:
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
	case ContextWorkflow:
		memory.Contexts.Workflow = make(map[string]interface{})
	case ContextSession:
		memory.Contexts.Session = make(map[string]interface{})
	case ContextPersistent:
		memory.Contexts.Persistent = make(map[string]interface{})
	case ContextShared:
		memory.Contexts.Shared = make(map[string]interface{})
	default:
		return fmt.Errorf("invalid context: %s", contextName)
	}
	return nil
}

func (h *Handler) clearPath(_ *types.TeamMemory, _ string) error {
	// Implementation for clearing specific paths
	// This would need to traverse the memory structure and remove the specified path
	return fmt.Errorf("clear path not implemented yet")
}

func (h *Handler) compactMemory(_ *types.TeamMemory) error {
	// Implementation for memory compaction
	// This could remove empty contexts, optimize storage, etc.
	return nil
}
