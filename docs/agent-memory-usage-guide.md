# Agent Memory System Usage Guide

## Overview

The Agent Memory System provides AI agents with persistent memory capabilities to store, retrieve, and manage information across executions. This enables agents to:

- Remember workflow progress and state
- Store session-specific temporary data  
- Learn patterns and preferences over time
- Maintain context between interactions

## 🧠 Memory Contexts

### 1. **Workflow Memory** (`workflow`)
- **Purpose**: Current task state and progress
- **Duration**: Until workflow completes
- **Use Cases**:
  - Current step in multi-step process
  - Intermediate results and calculations
  - Task-specific configurations
  - Progress tracking

```json
{
  "current_step": "data_analysis",
  "completed_steps": ["data_collection", "preprocessing"],
  "analysis_config": {
    "method": "regression",
    "features": ["price", "location", "size"]
  },
  "progress_percentage": 60
}
```

### 2. **Session Memory** (`session`)
- **Purpose**: Temporary data for current interaction
- **Duration**: Current session only
- **Use Cases**:
  - User preferences for this session
  - Temporary variables and state
  - Conversation context
  - Quick cache for API responses

```json
{
  "user_preferences": {
    "output_format": "detailed",
    "language": "english"
  },
  "conversation_context": {
    "topic": "market_analysis",
    "last_query": "What are the trends?"
  }
}
```

### 3. **Persistent Memory** (`persistent`)
- **Purpose**: Long-term learned patterns and knowledge
- **Duration**: Permanent (until explicitly cleared)
- **Use Cases**:
  - Learned user patterns
  - Successful strategies and configurations
  - Error patterns to avoid
  - Domain knowledge accumulation

```json
{
  "learned_patterns": {
    "user_typically_wants_graphs": true,
    "best_analysis_method": "ensemble",
    "common_errors": ["timeout_on_large_datasets"]
  },
  "successful_configs": {
    "data_preprocessing": {
      "method": "standardization",
      "success_rate": 0.92
    }
  }
}
```

## 🔧 Available Functions

### 1. `agent_memory_write`
**Store data in agent memory**

```json
{
  "context": "workflow",
  "path": "current_analysis",
  "data": {
    "method": "linear_regression",
    "features": ["price", "location"],
    "status": "in_progress"
  },
  "merge_strategy": "merge"
}
```

**Parameters:**
- `context`: `"workflow"`, `"session"`, or `"persistent"`
- `path`: JSON path (optional) - e.g., `"analysis.config"`
- `data`: Object to store
- `merge_strategy`: `"merge"`, `"replace"`, or `"append"`

### 2. `agent_memory_read`
**Retrieve data from agent memory**

```json
{
  "context": "persistent",
  "path": "learned_patterns.best_analysis_method"
}
```

**Parameters:**
- `context`: `"workflow"`, `"session"`, `"persistent"`, or `"all"`
- `path`: Specific JSON path to retrieve (optional)

### 3. `agent_memory_search`
**Search through memory using queries**

```json
{
  "query": "error timeout analysis",
  "contexts": ["persistent", "workflow"],
  "search_type": "semantic",
  "limit": 10
}
```

**Parameters:**
- `query`: Search keywords or semantic description
- `contexts`: Array of contexts to search
- `search_type`: `"semantic"`, `"exact"`, `"pattern"`, `"fuzzy"`
- `limit`: Maximum results (default: 20)

### 4. `agent_memory_clear`
**Manage and clean memory**

```json
{
  "context": "clear_context",
  "path": "session"
}
```

**Actions:**
- `clear_context`: Clear entire context (workflow/session/persistent)
- `clear_path`: Clear specific path
- `clear_all`: Clear all memory
- `compact`: Remove empty entries and optimize

## 📋 Best Practices

### 1. **Memory Organization**
```json
// Good: Hierarchical structure
{
  "analysis": {
    "config": {...},
    "results": {...},
    "metrics": {...}
  }
}

// Avoid: Flat structure with many keys
{
  "analysis_config": {...},
  "analysis_results": {...},
  "analysis_metrics": {...}
}
```

### 2. **Context Selection**
- Use **workflow** for task-specific state
- Use **session** for temporary user preferences
- Use **persistent** for learned knowledge and patterns

### 3. **Path Naming**
- Use descriptive, hierarchical paths
- Examples: `"user.preferences.format"`, `"analysis.current_step"`
- Avoid spaces and special characters

### 4. **Data Types**
- Store structured objects when possible
- Use consistent data formats
- Include timestamps for time-sensitive data

## 💡 Usage Examples

### Example 1: Multi-Step Data Analysis
```javascript
// Step 1: Initialize workflow
await agent_memory_write({
  context: "workflow",
  data: {
    steps: ["collect", "clean", "analyze", "report"],
    current_step: "collect",
    start_time: new Date().toISOString()
  }
});

// Step 2: Update progress
await agent_memory_write({
  context: "workflow", 
  path: "current_step",
  data: "clean"
});

// Step 3: Store intermediate results
await agent_memory_write({
  context: "workflow",
  path: "results.cleaned_data",
  data: {
    rows: 1000,
    removed_outliers: 45
  }
});
```

### Example 2: Learning User Preferences
```javascript
// Save user preference
await agent_memory_write({
  context: "persistent",
  path: "user.preferences",
  data: {
    chart_type: "line",
    detail_level: "high",
    format: "markdown"
  }
});

// Retrieve preferences for future use
const prefs = await agent_memory_read({
  context: "persistent",
  path: "user.preferences"
});
```

### Example 3: Error Pattern Learning
```javascript
// Store error pattern
await agent_memory_write({
  context: "persistent",
  path: "error_patterns",
  data: [
    {
      error_type: "timeout",
      context: "large_dataset_analysis",
      solution: "use_batch_processing",
      success_rate: 0.95
    }
  ],
  merge_strategy: "append"
});

// Search for relevant error solutions
const solutions = await agent_memory_search({
  query: "timeout large dataset",
  contexts: ["persistent"],
  search_type: "semantic"
});
```

## 🎯 Integration with Frontend

The memory system is now integrated into the frontend:

1. **Memory Viewer**: Click the 📚 icon in agent details to view memory
2. **Memory Indicators**: Agents with memory show a 📚 badge
3. **Search & Filter**: Browse memory by context (workflow/session/persistent)
4. **Visual Tree**: Hierarchical view of memory structure

## 🔍 Troubleshooting

### Common Issues:
1. **Memory not persisting**: Ensure you're using the correct context
2. **Path not found**: Check path syntax and structure  
3. **Search returns no results**: Try different search terms or broader context
4. **Memory too large**: Use `clear` function to clean up old data

### Memory Limits:
- No hard limits, but monitor memory size via metadata
- Consider periodic cleanup of session and workflow memory
- Use `compact` action to optimize memory structure

## 🚀 Advanced Features

### Relationships
Memory supports relationship tracking between different memory elements:

```json
{
  "from": "workflow.current_step",
  "to": "persistent.successful_methods.regression",
  "type": "influenced_by",
  "strength": 0.8
}
```

### Metadata
All memory includes automatic metadata:
- Creation and update timestamps
- Access count
- Memory size in bytes
- Version information