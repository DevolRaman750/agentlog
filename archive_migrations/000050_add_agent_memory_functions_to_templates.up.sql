-- Add agent memory functions to development support templates
-- This migration adds the four agent memory functions to all three templates

-- Add agent memory functions to Slack Responder template
INSERT IGNORE INTO execution_template_functions (id, template_id, function_id, execution_order, is_required) VALUES
('etf-slack-responder-16', 'template-slack-responder', 'func-agent_memory_clear-1754951707', 16, 0),
('etf-slack-responder-17', 'template-slack-responder', 'func-agent_memory_read-1754754882', 17, 1),
('etf-slack-responder-18', 'template-slack-responder', 'func-agent_memory_search-1754754882', 18, 0),
('etf-slack-responder-19', 'template-slack-responder', 'func-agent_memory_write-1754754882', 19, 1);

-- Add agent memory functions to GitHub Issue Enhancer template
INSERT IGNORE INTO execution_template_functions (id, template_id, function_id, execution_order, is_required) VALUES
('etf-github-enhancer-7', 'template-github-issue-enhancer', 'func-agent_memory_clear-1754951707', 7, 0),
('etf-github-enhancer-8', 'template-github-issue-enhancer', 'func-agent_memory_read-1754754882', 8, 1),
('etf-github-enhancer-9', 'template-github-issue-enhancer', 'func-agent_memory_search-1754754882', 9, 0),
('etf-github-enhancer-10', 'template-github-issue-enhancer', 'func-agent_memory_write-1754754882', 10, 1);

-- Add agent memory functions to Slack Reporter template
INSERT IGNORE INTO execution_template_functions (id, template_id, function_id, execution_order, is_required) VALUES
('etf-slack-reporter-13', 'template-slack-reporter', 'func-agent_memory_clear-1754951707', 13, 0),
('etf-slack-reporter-14', 'template-slack-reporter', 'func-agent_memory_read-1754754882', 14, 1),
('etf-slack-reporter-15', 'template-slack-reporter', 'func-agent_memory_search-1754754882', 15, 0),
('etf-slack-reporter-16', 'template-slack-reporter', 'func-agent_memory_write-1754754882', 16, 1);
