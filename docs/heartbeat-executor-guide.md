# HeartbeatExecutor Feature Guide

The HeartbeatExecutor is a background service that automatically executes agents based on their configured heartbeat intervals. This enables truly autonomous agent behavior where agents can run continuously according to their schedules.

## Overview

The HeartbeatExecutor implements [Issue #42](https://github.com/imran31415/agentlog/issues/42) by providing:

- **Continuous Monitoring**: Checks every 5 minutes for agents that are overdue for execution
- **Agent Lifecycle Management**: Only executes agents with `ACTIVE` lifecycle status
- **Token Limit Enforcement**: Respects daily token limits for each agent
- **Concurrency Control**: Limits concurrent executions to prevent system overload
- **Comprehensive Logging**: Detailed logging and metrics for monitoring

## Architecture

### Components

1. **HeartbeatExecutor** (`internal/heartbeat/executor.go`)
   - Main service that orchestrates agent execution
   - Runs as a goroutine in the background
   - Manages concurrency and execution flow

2. **AgentQueries** (`internal/heartbeat/queries.go`)
   - Database operations for agent management
   - Handles agent selection, token tracking, and execution updates

3. **Configuration** (`internal/heartbeat/config.go`)
   - Environment-based configuration
   - Validation and default values

## Database Schema

The HeartbeatExecutor uses the existing `agents` table:

```sql
CREATE TABLE agents (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    template_id VARCHAR(255) NOT NULL,
    
    -- Agent behavior configuration
    max_tokens_per_day INT NOT NULL DEFAULT 10000,
    heartbeat_minutes INT NOT NULL DEFAULT 5, -- Minimum 5 minutes
    lifecycle_status ENUM('STANDBY', 'ACTIVE', 'PAUSED', 'KILLED') NOT NULL DEFAULT 'STANDBY',
    
    -- Token usage tracking (reset daily)
    tokens_used_today INT NOT NULL DEFAULT 0,
    tokens_reset_date DATE NOT NULL DEFAULT (CURDATE()),
    
    -- Execution tracking
    last_execution_at TIMESTAMP NULL,
    next_scheduled_at TIMESTAMP NULL,
    total_executions INT NOT NULL DEFAULT 0,
    
    -- Foreign keys and constraints...
);
```

### Agent Lifecycle States

- **STANDBY**: Agent exists but won't execute automatically
- **ACTIVE**: Agent will be executed by HeartbeatExecutor when overdue
- **PAUSED**: Temporarily stopped, can be resumed
- **KILLED**: Permanently disabled

## Configuration

Configure the HeartbeatExecutor via environment variables in `config.env`:

```bash
# Enable/disable the heartbeat executor
HEARTBEAT_ENABLED=true

# Check interval in minutes (minimum 1)
HEARTBEAT_CHECK_INTERVAL=5

# Maximum concurrent agent executions
HEARTBEAT_MAX_CONCURRENT=10

# Execution timeout per agent in minutes
HEARTBEAT_EXECUTION_TIMEOUT=10

# Number of retry attempts for failed executions
HEARTBEAT_RETRY_ATTEMPTS=3

# Enable/disable token limit enforcement
HEARTBEAT_TOKEN_CHECK=true
```

## Usage

### 1. Agent Creation

Create agents via the API or database:

```sql
INSERT INTO agents (
    id, user_id, first_name, last_name, template_id,
    heartbeat_minutes, lifecycle_status, max_tokens_per_day
) VALUES (
    'agent-001', 'user-123', 'Research', 'Agent',
    'template-456', 15, 'ACTIVE', 2000
);
```

### 2. Monitoring

#### Health Check Endpoint

The main health endpoint includes HeartbeatExecutor status:

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:30:00Z",
  "database": true,
  "heartbeat_executor": {
    "status": "running",
    "metrics": {
      "total_executions": 147,
      "successful_executions": 142,
      "failed_executions": 5,
      "success_rate": 96.6,
      "active_executions": 2,
      "agents_processed": 25,
      "last_check_time": "2025-01-15T10:29:00Z",
      "config": {
        "check_interval": "5m0s",
        "max_concurrent_executions": 10,
        "enabled": true
      }
    }
  }
}
```

#### Dedicated Monitoring Endpoint

For detailed HeartbeatExecutor monitoring:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/heartbeat/status
```

Response:
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": "running",
  "metrics": {
    "total_executions": 147,
    "successful_executions": 142,
    "failed_executions": 5,
    "success_rate": 96.6,
    "active_executions": 2,
    "agents_processed": 25
  },
  "agent_stats": {
    "total_agents": 15,
    "active_agents": 8,
    "paused_agents": 2,
    "standby_agents": 4,
    "killed_agents": 1,
    "total_executions": 1250,
    "total_tokens_today": 45000
  },
  "active_agent_count": 8
}
```

## Execution Logic

### Agent Selection Criteria

An agent is executed if ALL conditions are met:

1. **Lifecycle Status**: `lifecycle_status = 'ACTIVE'`
2. **Overdue**: 
   - Never executed before (`last_execution_at IS NULL`), OR
   - Last execution + heartbeat interval ≤ current time
3. **Token Limit**: `tokens_used_today < max_tokens_per_day` OR tokens need daily reset
4. **Not Currently Executing**: Agent is not already being processed

### Execution Flow

```
Every 5 minutes:
1. Query overdue ACTIVE agents
2. For each agent:
   a. Check token limits
   b. Load agent's template
   c. Execute template with agent context
   d. Update execution timestamps
   e. Track token usage
3. Log results and update metrics
```

### Token Management

- Daily token limits are enforced per agent
- Token counters reset automatically at midnight
- Estimated token usage is calculated from API responses
- Agents hitting limits are skipped until reset

## Error Handling

The HeartbeatExecutor is designed to be resilient:

- **Template Errors**: Log error, continue with other agents
- **Token Limits**: Skip agent until daily reset
- **Execution Failures**: Log and optionally retry with backoff
- **Database Issues**: Log critical errors, attempt reconnection
- **Concurrent Execution**: Prevent double-execution with mutexes

## Logging

The HeartbeatExecutor provides comprehensive logging:

```
🚀 Starting HeartbeatExecutor with config: check_interval=5m0s, max_concurrent=10
🎯 Found 3 overdue ACTIVE agents to execute
🤖 Executing agent Research Agent (agent-001) - heartbeat: 15m, tokens: 150/2000
✅ Agent Research Agent executed successfully in 2.3s
📊 HeartbeatExecutor check completed in 4.7s - processed 3 agents
```

## Testing

### Running Tests

```bash
# Run HeartbeatExecutor tests
go test ./internal/heartbeat/

# Run with verbose output
go test -v ./internal/heartbeat/
```

### Test Data Setup

Use the provided test script to create sample agents:

```bash
# Apply test data to your local database
mysql -u username -p database_name < scripts/test_heartbeat_executor.sql
```

This creates test agents with different configurations to verify HeartbeatExecutor behavior.

## Performance Considerations

### Scalability

- **Concurrent Executions**: Limited to `HEARTBEAT_MAX_CONCURRENT` (default: 10)
- **Check Frequency**: Configurable via `HEARTBEAT_CHECK_INTERVAL` (default: 5 minutes)
- **Database Queries**: Optimized with proper indexes on `lifecycle_status` and `last_execution_at`

### Resource Usage

- **Memory**: Minimal overhead per agent (< 1KB)
- **CPU**: Low impact, only active during check intervals
- **Database**: Efficient queries with LIMIT clauses

### Monitoring Recommendations

1. **Monitor success rate**: Should be > 95%
2. **Watch active executions**: Should not consistently hit max concurrent limit
3. **Check agent distribution**: Ensure even execution across agents
4. **Token usage patterns**: Monitor for agents hitting limits frequently

## Troubleshooting

### Common Issues

1. **Agents Not Executing**
   - Check `lifecycle_status = 'ACTIVE'`
   - Verify heartbeat interval has passed
   - Check token limits
   - Review template validity

2. **High Failure Rate**
   - Check template configurations
   - Verify API key availability
   - Review execution logs
   - Monitor system resources

3. **Performance Issues**
   - Reduce `HEARTBEAT_MAX_CONCURRENT`
   - Increase `HEARTBEAT_CHECK_INTERVAL`
   - Optimize database queries
   - Check system resource usage

### Debug Commands

```sql
-- Check agent status
SELECT id, first_name, last_name, lifecycle_status, 
       heartbeat_minutes, last_execution_at,
       tokens_used_today, max_tokens_per_day
FROM agents 
WHERE lifecycle_status = 'ACTIVE'
ORDER BY last_execution_at ASC;

-- Check overdue agents (manual query)
SELECT id, CONCAT(first_name, ' ', last_name) as name,
       TIMESTAMPDIFF(MINUTE, last_execution_at, NOW()) as minutes_since_last,
       heartbeat_minutes
FROM agents 
WHERE lifecycle_status = 'ACTIVE'
  AND (last_execution_at IS NULL 
       OR last_execution_at <= DATE_SUB(NOW(), INTERVAL heartbeat_minutes MINUTE))
  AND tokens_used_today < max_tokens_per_day;
```

## Future Enhancements

Potential improvements for the HeartbeatExecutor:

1. **Function Calling Support**: Enable autonomous agents to use function tools
2. **Priority Queuing**: Execute high-priority agents first
3. **Distributed Execution**: Scale across multiple instances
4. **Advanced Scheduling**: Support cron-like schedules
5. **Notification System**: Alert on execution failures
6. **Agent Grouping**: Execute related agents together
7. **Dynamic Heartbeats**: Adjust intervals based on performance

## Integration

The HeartbeatExecutor integrates seamlessly with existing AgentLog components:

- **Agent Management**: Uses existing agent CRUD operations
- **Template System**: Executes existing execution templates
- **Authentication**: Respects user permissions and isolation
- **Monitoring**: Extends existing health check infrastructure
- **Configuration**: Follows existing environment variable patterns

## Security Considerations

- **User Isolation**: Agents only execute within their user context
- **Token Limits**: Prevent runaway executions
- **Authentication**: Monitoring endpoints require valid tokens
- **Resource Limits**: Prevent system overload with concurrency controls
- **Error Handling**: Sensitive information not exposed in logs
