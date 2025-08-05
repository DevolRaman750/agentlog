-- Add function associations for execution templates
-- This migration adds support for templates to be associated with specific functions

-- 1. Create junction table for template-function associations
CREATE TABLE execution_template_functions (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    function_id VARCHAR(255) NOT NULL,
    
    -- Optional configuration per function association
    is_required BOOLEAN NOT NULL DEFAULT FALSE, -- Whether this function is required for template execution
    execution_order INT DEFAULT 0, -- Order in which functions should be called
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (template_id) REFERENCES execution_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (function_id) REFERENCES function_definitions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_template_function (template_id, function_id),
    
    -- Indexes
    INDEX idx_execution_template_functions_template_id (template_id),
    INDEX idx_execution_template_functions_function_id (function_id),
    INDEX idx_execution_template_functions_execution_order (template_id, execution_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Fix the NULL handling issue in auth tokens table
-- The last_used_ip column should allow NULL values properly
ALTER TABLE execution_template_auth_tokens 
MODIFY COLUMN last_used_ip VARCHAR(45) NULL DEFAULT NULL;

-- 3. Add version tracking for function associations in template versions
CREATE TABLE execution_template_version_functions (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    template_version_id VARCHAR(255) NOT NULL,
    function_id VARCHAR(255) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    execution_order INT DEFAULT 0,
    
    -- Constraints
    FOREIGN KEY (template_version_id) REFERENCES execution_template_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (function_id) REFERENCES function_definitions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_template_version_function (template_version_id, function_id),
    
    -- Indexes
    INDEX idx_execution_template_version_functions_template_version_id (template_version_id),
    INDEX idx_execution_template_version_functions_function_id (function_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Add index to help with template function lookups
ALTER TABLE execution_templates 
ADD INDEX idx_execution_templates_enable_function_calling (enable_function_calling);

-- 5. Create a view for easy template function lookups
CREATE VIEW template_function_summary AS
SELECT 
    t.id as template_id,
    t.name as template_name,
    t.enable_function_calling,
    COUNT(tf.function_id) as total_functions,
    COUNT(CASE WHEN tf.is_required = TRUE THEN 1 END) as required_functions,
    GROUP_CONCAT(f.name ORDER BY tf.execution_order SEPARATOR ', ') as function_names,
    GROUP_CONCAT(f.id ORDER BY tf.execution_order SEPARATOR ',') as function_ids
FROM execution_templates t
LEFT JOIN execution_template_functions tf ON t.id = tf.template_id
LEFT JOIN function_definitions f ON tf.function_id = f.id
GROUP BY t.id, t.name, t.enable_function_calling;

-- 6. Add some example function associations for the system template
-- First, let's check if we have any github functions available
INSERT INTO execution_template_functions (
    id, template_id, function_id, is_required, execution_order
)
SELECT 
    CONCAT('tf-', UUID()) as id,
    'system-example-template' as template_id,
    f.id as function_id,
    FALSE as is_required,
    1 as execution_order
FROM function_definitions f 
WHERE f.name IN ('github_read_repository_info', 'github_read_issues') 
AND f.is_active = TRUE
LIMIT 2; 