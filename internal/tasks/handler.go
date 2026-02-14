package tasks

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"gogent/internal/auth"
	"gogent/internal/types"
)

// Handler handles HTTP requests for the structured task system
type Handler struct {
	service *Service
}

// NewHandler creates a new tasks handler
func NewHandler(db *sql.DB) *Handler {
	return &Handler{
		service: NewService(db),
	}
}

// HandleTasks handles GET/POST on /api/tasks
func (h *Handler) HandleTasks(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listTasks(w, r)
	case http.MethodPost:
		h.createTask(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleTaskByID handles GET/PUT/DELETE on /api/tasks/{id} and sub-routes
func (h *Handler) HandleTaskByID(w http.ResponseWriter, r *http.Request) {
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}
	taskID := pathParts[2]

	// Handle sub-routes
	if len(pathParts) > 3 {
		switch pathParts[3] {
		case "transition":
			h.transitionTask(w, r, taskID)
		case "context":
			if len(pathParts) > 4 {
				h.handleContextByIndex(w, r, taskID, pathParts[4])
			} else {
				h.addContext(w, r, taskID)
			}
		case "children":
			h.getChildren(w, r, taskID)
		case "subtree":
			h.getSubtree(w, r, taskID)
		case "ancestors":
			h.getAncestors(w, r, taskID)
		case "dependencies":
			if len(pathParts) > 4 {
				h.handleDependencyByID(w, r, taskID, pathParts[4])
			} else {
				h.addDependency(w, r, taskID)
			}
		case "blockers":
			h.getBlockers(w, r, taskID)
		default:
			http.Error(w, "Invalid endpoint", http.StatusNotFound)
		}
		return
	}

	// Handle operations on the task itself
	switch r.Method {
	case http.MethodGet:
		h.getTask(w, r, taskID)
	case http.MethodPut:
		h.updateTask(w, r, taskID)
	case http.MethodDelete:
		h.deleteTask(w, r, taskID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleNextAvailable handles GET /api/tasks/next-available
func (h *Handler) HandleNextAvailable(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	teamID := r.URL.Query().Get("team_id")
	agentID := r.URL.Query().Get("agent_id")

	task, err := h.service.GetNextAvailable(r.Context(), user.ID, teamID, agentID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if task == nil {
		writeJSON(w, http.StatusOK, &types.TaskResponse{
			Success: true,
			Tasks:   []types.Task{},
			Metadata: map[string]interface{}{
				"message": "no tasks available",
			},
		})
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{
		Success: true,
		Task:    task,
	})
}

// --- Internal API methods (called by core.go dispatch) ---

// CreateTaskInternal creates a task via internal function call
func (h *Handler) CreateTaskInternal(ctx context.Context, userID, agentID, teamID string, req *types.TaskCreateRequest) (*types.TaskResponse, error) {
	task, err := h.service.CreateTask(ctx, userID, agentID, teamID, req)
	if err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{Success: true, Task: task}, nil
}

// GetTaskInternal gets a task via internal function call
func (h *Handler) GetTaskInternal(ctx context.Context, userID, taskID string) (*types.TaskResponse, error) {
	task, err := h.service.GetTask(ctx, userID, taskID)
	if err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	if task == nil {
		return &types.TaskResponse{Success: false, Error: "task not found"}, nil
	}
	return &types.TaskResponse{Success: true, Task: task}, nil
}

// UpdateTaskInternal updates a task via internal function call
func (h *Handler) UpdateTaskInternal(ctx context.Context, userID, taskID string, req *types.TaskUpdateRequest) (*types.TaskResponse, error) {
	task, err := h.service.UpdateTask(ctx, userID, taskID, req)
	if err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{Success: true, Task: task}, nil
}

// DeleteTaskInternal deletes a task via internal function call
func (h *Handler) DeleteTaskInternal(ctx context.Context, userID, taskID string) (*types.TaskResponse, error) {
	if err := h.service.DeleteTask(ctx, userID, taskID); err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{
		Success:  true,
		Metadata: map[string]interface{}{"deleted_task_id": taskID},
	}, nil
}

// TransitionTaskInternal transitions a task via internal function call
func (h *Handler) TransitionTaskInternal(ctx context.Context, userID, agentID string, req *types.TaskTransitionRequest) (*types.TaskResponse, error) {
	task, err := h.service.TransitionTask(ctx, userID, agentID, req)
	if err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{Success: true, Task: task}, nil
}

// AddContextInternal adds a context source via internal function call
func (h *Handler) AddContextInternal(ctx context.Context, userID, taskID string, source types.ContextSource) (*types.TaskResponse, error) {
	task, err := h.service.AddContext(ctx, userID, taskID, source)
	if err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{Success: true, Task: task}, nil
}

// UpdateContextInternal updates a context source via internal function call
func (h *Handler) UpdateContextInternal(ctx context.Context, userID, taskID string, idx int, source types.ContextSource) (*types.TaskResponse, error) {
	task, err := h.service.UpdateContext(ctx, userID, taskID, idx, source)
	if err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{Success: true, Task: task}, nil
}

// RemoveContextInternal removes a context source via internal function call
func (h *Handler) RemoveContextInternal(ctx context.Context, userID, taskID string, idx int) (*types.TaskResponse, error) {
	task, err := h.service.RemoveContext(ctx, userID, taskID, idx)
	if err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{Success: true, Task: task}, nil
}

// ListTasksInternal lists tasks via internal function call
func (h *Handler) ListTasksInternal(ctx context.Context, userID, teamID string, req *types.TaskListRequest) (*types.TaskResponse, error) {
	tasks, err := h.service.ListTasks(ctx, userID, teamID, req)
	if err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{
		Success: true,
		Tasks:   tasks,
		Metadata: map[string]interface{}{
			"count": len(tasks),
		},
	}, nil
}

// GetChildrenInternal lists children via internal function call
func (h *Handler) GetChildrenInternal(ctx context.Context, userID, taskID string, limit, offset int) (*types.TaskResponse, error) {
	tasks, err := h.service.ListChildren(ctx, userID, taskID, limit, offset)
	if err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{
		Success: true,
		Tasks:   tasks,
		Metadata: map[string]interface{}{
			"count":          len(tasks),
			"parent_task_id": taskID,
		},
	}, nil
}

// GetSubtreeInternal lists subtree via internal function call
func (h *Handler) GetSubtreeInternal(ctx context.Context, userID, taskID string) (*types.TaskResponse, error) {
	tasks, err := h.service.ListSubtree(ctx, userID, taskID)
	if err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{
		Success: true,
		Tasks:   tasks,
		Metadata: map[string]interface{}{
			"count":        len(tasks),
			"root_task_id": taskID,
		},
	}, nil
}

// AddDependencyInternal adds a dependency via internal function call
func (h *Handler) AddDependencyInternal(ctx context.Context, userID, taskID, dependsOnID string) (*types.TaskResponse, error) {
	if err := h.service.AddDependency(ctx, userID, taskID, dependsOnID); err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{
		Success: true,
		Metadata: map[string]interface{}{
			"task_id":       taskID,
			"depends_on_id": dependsOnID,
		},
	}, nil
}

// RemoveDependencyInternal removes a dependency via internal function call
func (h *Handler) RemoveDependencyInternal(ctx context.Context, taskID, dependsOnID string) (*types.TaskResponse, error) {
	if err := h.service.RemoveDependency(ctx, taskID, dependsOnID); err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{
		Success: true,
		Metadata: map[string]interface{}{
			"task_id":       taskID,
			"depends_on_id": dependsOnID,
		},
	}, nil
}

// GetBlockersInternal gets blockers via internal function call
func (h *Handler) GetBlockersInternal(ctx context.Context, taskID string) (*types.TaskResponse, error) {
	blockers, err := h.service.GetBlockers(ctx, taskID)
	if err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	return &types.TaskResponse{
		Success: true,
		Tasks:   blockers,
		Metadata: map[string]interface{}{
			"count":   len(blockers),
			"task_id": taskID,
		},
	}, nil
}

// GetNextAvailableInternal gets next available task via internal function call
func (h *Handler) GetNextAvailableInternal(ctx context.Context, userID, teamID, agentID string) (*types.TaskResponse, error) {
	task, err := h.service.GetNextAvailable(ctx, userID, teamID, agentID)
	if err != nil {
		return &types.TaskResponse{Success: false, Error: err.Error()}, nil
	}
	if task == nil {
		return &types.TaskResponse{
			Success: true,
			Tasks:   []types.Task{},
			Metadata: map[string]interface{}{
				"message": "no tasks available",
			},
		}, nil
	}
	return &types.TaskResponse{Success: true, Task: task}, nil
}

// --- HTTP handler implementations ---

func (h *Handler) createTask(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req types.TaskCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Invalid JSON: %v", err))
		return
	}

	agentID := r.URL.Query().Get("agent_id")
	teamID := r.URL.Query().Get("team_id")

	task, err := h.service.CreateTask(r.Context(), user.ID, agentID, teamID, &req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, &types.TaskResponse{Success: true, Task: task})
}

func (h *Handler) getTask(w http.ResponseWriter, r *http.Request, taskID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	task, err := h.service.GetTask(r.Context(), user.ID, taskID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if task == nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{Success: true, Task: task})
}

func (h *Handler) updateTask(w http.ResponseWriter, r *http.Request, taskID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req types.TaskUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Invalid JSON: %v", err))
		return
	}

	task, err := h.service.UpdateTask(r.Context(), user.ID, taskID, &req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{Success: true, Task: task})
}

func (h *Handler) deleteTask(w http.ResponseWriter, r *http.Request, taskID string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.service.DeleteTask(r.Context(), user.ID, taskID); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{
		Success:  true,
		Metadata: map[string]interface{}{"deleted_task_id": taskID},
	})
}

func (h *Handler) listTasks(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	teamID := r.URL.Query().Get("team_id")
	req := &types.TaskListRequest{}

	if states := r.URL.Query().Get("states"); states != "" {
		req.States = strings.Split(states, ",")
	}
	if priority := r.URL.Query().Get("priority"); priority != "" {
		req.Priority = strings.Split(priority, ",")
	}
	if agentID := r.URL.Query().Get("agent_id"); agentID != "" {
		req.AgentID = agentID
	}
	if parentID := r.URL.Query().Get("parent_task_id"); parentID != "" {
		req.ParentTaskID = &parentID
	}
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			req.Limit = limit
		}
	}
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil {
			req.Offset = offset
		}
	}

	tasks, err := h.service.ListTasks(r.Context(), user.ID, teamID, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{
		Success: true,
		Tasks:   tasks,
		Metadata: map[string]interface{}{
			"count": len(tasks),
		},
	})
}

func (h *Handler) transitionTask(w http.ResponseWriter, r *http.Request, taskID string) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req types.TaskTransitionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Invalid JSON: %v", err))
		return
	}
	req.TaskID = taskID

	agentID := r.URL.Query().Get("agent_id")
	task, err := h.service.TransitionTask(r.Context(), user.ID, agentID, &req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{Success: true, Task: task})
}

func (h *Handler) addContext(w http.ResponseWriter, r *http.Request, taskID string) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var source types.ContextSource
	if err := json.NewDecoder(r.Body).Decode(&source); err != nil {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Invalid JSON: %v", err))
		return
	}

	task, err := h.service.AddContext(r.Context(), user.ID, taskID, source)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{Success: true, Task: task})
}

func (h *Handler) handleContextByIndex(w http.ResponseWriter, r *http.Request, taskID, idxStr string) {
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	idx, err := strconv.Atoi(idxStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid context index")
		return
	}

	switch r.Method {
	case http.MethodPut:
		var source types.ContextSource
		if err := json.NewDecoder(r.Body).Decode(&source); err != nil {
			writeError(w, http.StatusBadRequest, fmt.Sprintf("Invalid JSON: %v", err))
			return
		}
		task, err := h.service.UpdateContext(r.Context(), user.ID, taskID, idx, source)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, &types.TaskResponse{Success: true, Task: task})

	case http.MethodDelete:
		task, err := h.service.RemoveContext(r.Context(), user.ID, taskID, idx)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, &types.TaskResponse{Success: true, Task: task})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) getChildren(w http.ResponseWriter, r *http.Request, taskID string) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	limit, offset := parseLimitOffset(r)
	tasks, err := h.service.ListChildren(r.Context(), user.ID, taskID, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{
		Success: true,
		Tasks:   tasks,
		Metadata: map[string]interface{}{
			"count":          len(tasks),
			"parent_task_id": taskID,
		},
	})
}

func (h *Handler) getSubtree(w http.ResponseWriter, r *http.Request, taskID string) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tasks, err := h.service.ListSubtree(r.Context(), user.ID, taskID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{
		Success: true,
		Tasks:   tasks,
		Metadata: map[string]interface{}{
			"count":        len(tasks),
			"root_task_id": taskID,
		},
	})
}

func (h *Handler) getAncestors(w http.ResponseWriter, r *http.Request, taskID string) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tasks, err := h.service.GetAncestors(r.Context(), user.ID, taskID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{
		Success: true,
		Tasks:   tasks,
		Metadata: map[string]interface{}{
			"count":   len(tasks),
			"task_id": taskID,
		},
	})
}

func (h *Handler) addDependency(w http.ResponseWriter, r *http.Request, taskID string) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body struct {
		DependsOnID string `json:"depends_on_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Invalid JSON: %v", err))
		return
	}

	if body.DependsOnID == "" {
		writeError(w, http.StatusBadRequest, "depends_on_id is required")
		return
	}

	if err := h.service.AddDependency(r.Context(), user.ID, taskID, body.DependsOnID); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{
		Success: true,
		Metadata: map[string]interface{}{
			"task_id":       taskID,
			"depends_on_id": body.DependsOnID,
		},
	})
}

func (h *Handler) handleDependencyByID(w http.ResponseWriter, r *http.Request, taskID, depID string) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := h.service.RemoveDependency(r.Context(), taskID, depID); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{
		Success: true,
		Metadata: map[string]interface{}{
			"task_id":       taskID,
			"depends_on_id": depID,
		},
	})
}

func (h *Handler) getBlockers(w http.ResponseWriter, r *http.Request, taskID string) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	blockers, err := h.service.GetBlockers(r.Context(), taskID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, &types.TaskResponse{
		Success: true,
		Tasks:   blockers,
		Metadata: map[string]interface{}{
			"count":   len(blockers),
			"task_id": taskID,
		},
	})
}

// --- Helpers ---

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, &types.TaskResponse{
		Success: false,
		Error:   message,
	})
}

func parseLimitOffset(r *http.Request) (int, int) {
	limit := 50
	offset := 0
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}
	return limit, offset
}

