-- Add execution flow tracking for comprehensive execution graphs

-- 1. Add sequence tracking to function_calls table
ALTER TABLE function_calls 
ADD COLUMN sequence_number INT NOT NULL DEFAULT 0,
ADD COLUMN parent_call_id VARCHAR(255) NULL,
ADD COLUMN execution_depth INT NOT NULL DEFAULT 0;

-- Add foreign key for parent call tracking
ALTER TABLE function_calls 
ADD CONSTRAINT fk_function_calls_parent 
FOREIGN KEY (parent_call_id) REFERENCES function_calls(id) ON DELETE SET NULL;

-- Add index for sequence queries
CREATE INDEX idx_function_calls_sequence ON function_calls(request_id, sequence_number);
CREATE INDEX idx_function_calls_parent ON function_calls(parent_call_id);

-- 2. Create execution_flow_events table for tracking the complete conversation flow
CREATE TABLE execution_flow_events (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    execution_run_id VARCHAR(255) NOT NULL,
    request_id VARCHAR(255) NULL,
    event_type ENUM(
        'prompt_start', 
        'ai_model_call', 
        'function_call_start', 
        'function_call_end', 
        'ai_response', 
        'error_occurred', 
        'retry_attempt',
        'execution_complete'
    ) NOT NULL,
    sequence_number INT NOT NULL DEFAULT 0,
    parent_event_id VARCHAR(255) NULL,
    event_data JSON NULL,
    duration_ms INT NULL,
    status ENUM('pending', 'success', 'error', 'timeout') DEFAULT 'pending',
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_execution_flow_events_execution_run 
        FOREIGN KEY (execution_run_id) REFERENCES execution_runs(id) ON DELETE CASCADE,
    CONSTRAINT fk_execution_flow_events_request 
        FOREIGN KEY (request_id) REFERENCES api_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_execution_flow_events_parent 
        FOREIGN KEY (parent_event_id) REFERENCES execution_flow_events(id) ON DELETE SET NULL,
        
    -- Indexes for performance
    INDEX idx_execution_flow_events_execution_run (execution_run_id),
    INDEX idx_execution_flow_events_sequence (execution_run_id, sequence_number),
    INDEX idx_execution_flow_events_type (event_type),
    INDEX idx_execution_flow_events_parent (parent_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Add timing and response tracking to execution_logs table
ALTER TABLE execution_logs 
ADD COLUMN sequence_number INT NULL,
ADD COLUMN duration_ms INT NULL,
ADD COLUMN related_event_id VARCHAR(255) NULL;

-- Add foreign key to link logs with flow events
ALTER TABLE execution_logs 
ADD CONSTRAINT fk_execution_logs_flow_event 
FOREIGN KEY (related_event_id) REFERENCES execution_flow_events(id) ON DELETE SET NULL;

-- Add index for sequence-based log queries
CREATE INDEX idx_execution_logs_sequence ON execution_logs(execution_run_id, sequence_number);
CREATE INDEX idx_execution_logs_event ON execution_logs(related_event_id);

-- 4. Create execution_stats table for performance metrics
CREATE TABLE execution_stats (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    execution_run_id VARCHAR(255) NOT NULL,
    total_function_calls INT DEFAULT 0,
    total_ai_model_calls INT DEFAULT 0,
    total_errors INT DEFAULT 0,
    total_retries INT DEFAULT 0,
    total_execution_time_ms INT DEFAULT 0,
    avg_function_call_time_ms DECIMAL(10,2) DEFAULT 0,
    avg_ai_response_time_ms DECIMAL(10,2) DEFAULT 0,
    max_execution_depth INT DEFAULT 0,
    function_call_breakdown JSON NULL, -- e.g., {"github_read_code": 3, "weather": 1}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_execution_stats_execution_run 
        FOREIGN KEY (execution_run_id) REFERENCES execution_runs(id) ON DELETE CASCADE,
        
    -- Index
    INDEX idx_execution_stats_execution_run (execution_run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; 