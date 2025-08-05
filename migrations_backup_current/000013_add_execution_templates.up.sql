-- Add execution templates feature with comprehensive functionality
-- This migration includes: templates, parameters, auth tokens, versioning, rate limiting

-- 1. Main execution templates table
CREATE TABLE execution_templates (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_prompt TEXT NOT NULL,
    context_template TEXT,
    enable_function_calling BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_public BOOLEAN NOT NULL DEFAULT FALSE, -- For future shared templates
    category VARCHAR(100) DEFAULT 'general',
    tags JSON DEFAULT NULL, -- For organizing/searching templates
    execution_timeout_seconds INT DEFAULT 300, -- Default 5 minutes
    
    -- Rate limiting configuration (user-defined)
    rate_limit_per_hour INT DEFAULT 100,
    rate_limit_per_day INT DEFAULT 1000,
    rate_limit_burst INT DEFAULT 10, -- Burst allowance
    
    -- Usage tracking
    total_executions INT DEFAULT 0,
    last_executed_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_template_name (user_id, name),
    
    -- Indexes
    INDEX idx_execution_templates_user_id (user_id),
    INDEX idx_execution_templates_is_active (is_active),
    INDEX idx_execution_templates_is_public (is_public),
    INDEX idx_execution_templates_category (category),
    INDEX idx_execution_templates_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Template parameters with validation
CREATE TABLE execution_template_parameters (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    parameter_name VARCHAR(100) NOT NULL,
    parameter_type ENUM('string', 'number', 'boolean', 'array', 'object') NOT NULL DEFAULT 'string',
    description TEXT,
    default_value TEXT, -- JSON encoded for complex types
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Validation rules
    validation_rules JSON DEFAULT NULL,
    allowed_values JSON DEFAULT NULL, -- For enum-like parameters
    
    -- Security validation
    allow_sql_keywords BOOLEAN NOT NULL DEFAULT FALSE,
    allow_special_chars BOOLEAN NOT NULL DEFAULT TRUE,
    sanitize_html BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Display/UI configuration
    display_order INT DEFAULT 0,
    ui_component ENUM('text', 'textarea', 'select', 'multiselect', 'checkbox', 'number', 'date') DEFAULT 'text',
    placeholder_text VARCHAR(255),
    help_text TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (template_id) REFERENCES execution_templates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_template_parameter_name (template_id, parameter_name),
    
    -- Indexes
    INDEX idx_execution_template_parameters_template_id (template_id),
    INDEX idx_execution_template_parameters_display_order (template_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Authentication tokens for public API access
CREATE TABLE execution_template_auth_tokens (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    token_value VARCHAR(255) NOT NULL UNIQUE, -- The actual API token
    token_name VARCHAR(100) NOT NULL, -- User-friendly name
    description TEXT,
    
    -- Token configuration
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP NULL, -- NULL means no expiration
    
    -- Rate limiting overrides (can override template defaults)
    custom_rate_limit_per_hour INT NULL,
    custom_rate_limit_per_day INT NULL,
    custom_rate_limit_burst INT NULL,
    
    -- Usage tracking
    total_uses INT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    last_used_ip VARCHAR(45) NULL, -- IPv6 compatible
    
    -- Security
    allowed_origins JSON DEFAULT NULL, -- CORS origins
    allowed_ips JSON DEFAULT NULL, -- IP whitelist
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (template_id) REFERENCES execution_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_execution_template_auth_tokens_template_id (template_id),
    INDEX idx_execution_template_auth_tokens_user_id (user_id),
    INDEX idx_execution_template_auth_tokens_token_value (token_value),
    INDEX idx_execution_template_auth_tokens_is_active (is_active),
    INDEX idx_execution_template_auth_tokens_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Template version history for undo/redo functionality
CREATE TABLE execution_template_versions (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    version_number INT NOT NULL, -- Auto-incrementing version
    user_id VARCHAR(255) NOT NULL, -- Who made this version
    
    -- Snapshot of template data at this version
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_prompt TEXT NOT NULL,
    context_template TEXT,
    enable_function_calling BOOLEAN NOT NULL,
    category VARCHAR(100),
    tags JSON DEFAULT NULL,
    
    -- Rate limiting config snapshot
    rate_limit_per_hour INT,
    rate_limit_per_day INT,
    rate_limit_burst INT,
    
    -- Version metadata
    change_summary VARCHAR(500), -- Brief description of changes
    change_type ENUM('create', 'update', 'restore') NOT NULL DEFAULT 'update',
    is_current_version BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (template_id) REFERENCES execution_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_template_version (template_id, version_number),
    
    -- Indexes
    INDEX idx_execution_template_versions_template_id (template_id),
    INDEX idx_execution_template_versions_version_number (template_id, version_number DESC),
    INDEX idx_execution_template_versions_is_current (template_id, is_current_version),
    INDEX idx_execution_template_versions_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. Parameter versions (linked to template versions)
CREATE TABLE execution_template_parameter_versions (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    template_version_id VARCHAR(255) NOT NULL,
    parameter_name VARCHAR(100) NOT NULL,
    parameter_type ENUM('string', 'number', 'boolean', 'array', 'object') NOT NULL,
    description TEXT,
    default_value TEXT,
    is_required BOOLEAN NOT NULL,
    validation_rules JSON DEFAULT NULL,
    allowed_values JSON DEFAULT NULL,
    allow_sql_keywords BOOLEAN NOT NULL DEFAULT FALSE,
    allow_special_chars BOOLEAN NOT NULL DEFAULT TRUE,
    sanitize_html BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT DEFAULT 0,
    ui_component ENUM('text', 'textarea', 'select', 'multiselect', 'checkbox', 'number', 'date') DEFAULT 'text',
    placeholder_text VARCHAR(255),
    help_text TEXT,
    
    -- Constraints
    FOREIGN KEY (template_version_id) REFERENCES execution_template_versions(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_execution_template_parameter_versions_template_version_id (template_version_id),
    INDEX idx_execution_template_parameter_versions_display_order (template_version_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. Rate limiting tracking (for both platform and user-defined limits)
CREATE TABLE execution_template_rate_limits (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    auth_token_id VARCHAR(255) NULL, -- NULL for overall template limits
    
    -- Time window tracking
    window_start TIMESTAMP NOT NULL,
    window_type ENUM('hour', 'day', 'burst') NOT NULL,
    
    -- Usage counters
    request_count INT NOT NULL DEFAULT 0,
    last_request_at TIMESTAMP NULL,
    
    -- Platform limits (system-wide)
    platform_limit_hit BOOLEAN DEFAULT FALSE,
    platform_limit_reset_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (template_id) REFERENCES execution_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (auth_token_id) REFERENCES execution_template_auth_tokens(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rate_limit_window (template_id, auth_token_id, window_start, window_type),
    
    -- Indexes
    INDEX idx_execution_template_rate_limits_template_id (template_id),
    INDEX idx_execution_template_rate_limits_auth_token_id (auth_token_id),
    INDEX idx_execution_template_rate_limits_window_start (window_start),
    INDEX idx_execution_template_rate_limits_window_type (window_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. Template execution history (audit trail)
CREATE TABLE execution_template_executions (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    template_version_id VARCHAR(255) NULL, -- Which version was used
    auth_token_id VARCHAR(255) NULL, -- Which token was used (NULL for authenticated user)
    execution_run_id VARCHAR(255) NULL, -- Link to actual execution
    
    -- Request details
    parameters_provided JSON NOT NULL, -- The parameters passed to the template
    resolved_prompt TEXT NOT NULL, -- The final prompt after parameter substitution
    resolved_context TEXT,
    
    -- Request metadata
    request_ip VARCHAR(45),
    user_agent TEXT,
    referer VARCHAR(500),
    
    -- Execution results
    status ENUM('pending', 'running', 'completed', 'failed', 'rate_limited') NOT NULL DEFAULT 'pending',
    error_message TEXT,
    execution_time_ms INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    -- Constraints
    FOREIGN KEY (template_id) REFERENCES execution_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (template_version_id) REFERENCES execution_template_versions(id) ON DELETE SET NULL,
    FOREIGN KEY (auth_token_id) REFERENCES execution_template_auth_tokens(id) ON DELETE SET NULL,
    FOREIGN KEY (execution_run_id) REFERENCES execution_runs(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_execution_template_executions_template_id (template_id),
    INDEX idx_execution_template_executions_auth_token_id (auth_token_id),
    INDEX idx_execution_template_executions_status (status),
    INDEX idx_execution_template_executions_created_at (created_at),
    INDEX idx_execution_template_executions_execution_run_id (execution_run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert system configuration for platform-wide rate limits
INSERT INTO execution_templates (
    id, user_id, name, description, template_prompt,
    is_active, is_public, category,
    rate_limit_per_hour, rate_limit_per_day, rate_limit_burst
) VALUES (
    'system-example-template',
    'system',
    'Example Weather Template',
    'Example template showing parameter substitution for weather queries',
    'Get the current weather for {{location}}. Include temperature, humidity, and conditions. {{additional_notes}}',
    TRUE,
    TRUE,
    'examples',
    50, 200, 5
);

-- Add example parameters for the system template
INSERT INTO execution_template_parameters (
    id, template_id, parameter_name, parameter_type,
    description, default_value, is_required,
    validation_rules, display_order, ui_component,
    placeholder_text, help_text
) VALUES 
(
    'param-location-example',
    'system-example-template',
    'location',
    'string',
    'The location to get weather for',
    'San Francisco, CA',
    TRUE,
    '{"min_length": 2, "max_length": 100, "pattern": "^[a-zA-Z0-9\\\\s,.-]+$"}',
    1,
    'text',
    'Enter city, state or country',
    'Examples: "New York, NY", "London, UK", "Tokyo, Japan"'
),
(
    'param-additional-example',
    'system-example-template',
    'additional_notes',
    'string',
    'Additional information to include in the weather request',
    'Provide a 5-day forecast if available.',
    FALSE,
    '{"max_length": 500}',
    2,
    'textarea',
    'Any additional instructions...',
    'Optional: Add any specific requirements for the weather information'
); 