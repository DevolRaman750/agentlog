# Agent Task Data Storage Guide

## Overview

This guide explains how agents can store and retrieve task-specific data (code snippets, API responses, research findings) using the new strict `agent_task_data_*` functions that enforce proper data structure and validation.

## Why This Approach

We created dedicated functions that provide:
- **Strict validation**: All required fields are enforced at the function level
- **Task-specific organization**: Data is automatically organized by task ID
- **Rich metadata**: Each data entry includes categorization and usage context
- **Type safety**: Proper data types and validation prevent errors
- **Easy retrieval**: Built-in filtering and search capabilities
- **Future-proof**: Extensible structure for different data types

## Function Overview

### Available Functions
- **`agent_task_data_store`**: Store task-specific data with strict validation
- **`agent_task_data_retrieve`**: Retrieve task-specific data with filtering
- **`agent_task_data_clear`**: Clear task-specific data with optional filtering

### Required Fields for Storage
All data storage requires these fields:
- `task_id`: The task ID this data is associated with
- `data_key`: A descriptive key/name for this data (snake_case)
- `data_content`: The actual data content (code, text, JSON, etc.)
- `data_type`: Type of data (code, api_response, research, analysis, documentation, error_log, configuration, other)
- `current_step`: The execution step where this was gathered
- `future_use`: How this data will be used in future steps

### Optional Fields
- `priority`: Priority level (low, medium, high, critical) - defaults to medium
- `metadata`: Additional metadata object with source, size, tags, etc.

## Usage Examples

### 1. Store Code Snippet

**Function Call:**
```json
{
  "function_name": "agent_task_data_store",
  "parameters": {
    "task_id": "task_123",
    "data_key": "code_snippet_main_function",
    "data_content": "function validateLogin(credentials) {\n  if (!credentials.username || !credentials.password) {\n    throw new Error('Missing credentials');\n  }\n  return authenticate(credentials);\n}",
    "data_type": "code",
    "current_step": "code_analysis",
    "future_use": "This is the main function that needs fixing, will reference it when implementing the solution",
    "priority": "critical",
    "metadata": {
      "source": "file_read",
      "size": 245,
      "tags": ["function", "validation", "authentication"]
    }
  }
}
```

### 2. Store API Response

**Function Call:**
```json
{
  "function_name": "agent_task_data_store",
  "parameters": {
    "task_id": "task_123",
    "data_key": "github_issues_response",
    "data_content": "[{\"id\": 123, \"title\": \"Fix login bug\", \"body\": \"The login function has a validation issue...\", \"state\": \"open\"}]",
    "data_type": "api_response",
    "current_step": "issue_research",
    "future_use": "Will use this issue data when creating the fix and updating the issue status",
    "priority": "high",
    "metadata": {
      "source": "github_api",
      "size": 156,
      "tags": ["issue", "bug", "login"]
    }
  }
}
```

### 3. Store Research Findings

**Function Call:**
```json
{
  "function_name": "agent_task_data_store",
  "parameters": {
    "task_id": "task_123",
    "data_key": "research_similar_issues",
    "data_content": "Found 3 similar issues: #42 (authentication), #67 (validation), #89 (error handling). Pattern: all involve missing input validation.",
    "data_type": "research",
    "current_step": "research_phase",
    "future_use": "Will use this pattern analysis to ensure comprehensive fix",
    "priority": "high",
    "metadata": {
      "source": "manual_analysis",
      "size": 156,
      "tags": ["research", "pattern", "validation"]
    }
  }
}
```

## Retrieval Examples

### 1. Retrieve All Task Data

**Function Call:**
```json
{
  "function_name": "agent_task_data_retrieve",
  "parameters": {
    "task_id": "task_123"
  }
}
```

### 2. Retrieve Specific Data Entry

**Function Call:**
```json
{
  "function_name": "agent_task_data_retrieve",
  "parameters": {
    "task_id": "task_123",
    "data_key": "github_issues_response"
  }
}
```

### 3. Retrieve Code Snippets Only

**Function Call:**
```json
{
  "function_name": "agent_task_data_retrieve",
  "parameters": {
    "task_id": "task_123",
    "data_type": "code",
    "priority": "critical"
  }
}
```

### 4. Search for Specific Content

**Function Call:**
```json
{
  "function_name": "agent_task_data_retrieve",
  "parameters": {
    "task_id": "task_123",
    "search_query": "authentication",
    "limit": 5
  }
}
```

## Clearing Data Examples

### 1. Clear All Task Data

**Function Call:**
```json
{
  "function_name": "agent_task_data_clear",
  "parameters": {
    "task_id": "task_123",
    "confirmation": true,
    "reason": "Task completed successfully"
  }
}
```

### 2. Clear Specific Data Entry

**Function Call:**
```json
{
  "function_name": "agent_task_data_clear",
  "parameters": {
    "task_id": "task_123",
    "data_key": "old_research_data",
    "confirmation": true,
    "reason": "Data no longer relevant"
  }
}
```

### 3. Clear Low Priority Data

**Function Call:**
```json
{
  "function_name": "agent_task_data_clear",
  "parameters": {
    "task_id": "task_123",
    "priority": "low",
    "confirmation": true,
    "reason": "Cleanup old reference data"
  }
}
```

## Best Practices

### 1. Naming Convention
- Use descriptive `data_key` names: `github_issues_response`, `code_snippet_main_function`, `research_findings`
- Use snake_case for consistency
- Include the data type in the key name when helpful

### 2. Data Types
- **code**: Source code, configuration files, scripts
- **api_response**: JSON responses from external APIs
- **research**: Analysis, findings, patterns discovered
- **analysis**: Results of code analysis, debugging info
- **documentation**: README content, API docs, specifications
- **error_log**: Error messages, stack traces, debugging info
- **configuration**: Settings, environment variables, config files
- **other**: Any other type of data

### 3. Priority Levels
- **critical**: Essential data needed for task completion
- **high**: Important context that significantly helps execution
- **medium**: Helpful information for better understanding
- **low**: Reference material, nice-to-have context

### 4. Step Naming
Use descriptive step names that indicate the execution phase:
- `code_analysis`, `issue_research`, `api_integration`
- `debugging`, `testing`, `implementation`
- `documentation`, `review`, `cleanup`

### 5. Future Use Descriptions
Be specific about how the data will be used:
- "Will reference this code pattern when implementing similar functionality"
- "Need this API response structure for creating the PR description"
- "Use this research to ensure comprehensive error handling"

## Task Executor Workflow

### On Task Start
1. Check for existing progress with `agent_task_progress_read`
2. If resuming, retrieve stored data with `agent_task_data_retrieve` using the current `task_id`

### During Execution
1. After gathering any significant data, store it using `agent_task_data_store`
2. Update progress with `agent_task_progress_update`
3. Continue execution using stored data as needed

### On Task Completion
1. Store final results and learnings
2. Clear progress with `agent_task_progress_clear`
3. Optionally clear old data if no longer needed

## Error Handling

If data retrieval fails or returns empty results:
1. Log the issue in progress tracking
2. Continue execution without the stored data
3. Regather the necessary information
4. Store the new data for future use

## Data Lifecycle

- **Active Task**: Data is actively used and updated
- **Completed Task**: Data is preserved for reference and learning
- **Cleanup**: Old data can be cleared using `agent_task_data_clear`

## Validation and Error Messages

The functions provide strict validation with helpful error messages:
- Missing required fields will return specific error messages
- Invalid data types or priorities will be rejected
- Confirmation is required for all clear operations to prevent accidental data loss

This approach provides a robust, type-safe system for task-specific data storage with comprehensive validation and error handling.