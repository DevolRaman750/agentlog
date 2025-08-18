-- Fix function associations for development support templates with proper IDs
-- This migration corrects the function associations by providing required ID fields

-- First, clear any existing associations for these templates
DELETE FROM execution_template_functions WHERE template_id IN (
    'template-slack-responder',
    'template-github-issue-enhancer', 
    'template-slack-reporter'
);

-- Add correct function associations for Slack Responder template
INSERT IGNORE INTO execution_template_functions (id, template_id, function_id, execution_order, is_required) VALUES
('etf-slack-responder-1', 'template-slack-responder', '00000000-0000-0000-0000-000000000081', 1, 1), -- slack_read_messages
('etf-slack-responder-2', 'template-slack-responder', '00000000-0000-0000-0000-000000000082', 2, 1), -- slack_list_channels
('etf-slack-responder-3', 'template-slack-responder', 'slack_send_message', 3, 1), -- slack_send_message
('etf-slack-responder-4', 'template-slack-responder', '00000000-0000-0000-0000-000000000083', 4, 0), -- slack_get_channel_info
('etf-slack-responder-5', 'template-slack-responder', '00000000-0000-0000-0000-000000000086', 5, 0), -- slack_search_messages
('etf-slack-responder-6', 'template-slack-responder', '00000000-0000-0000-0000-000000000087', 6, 1), -- slack_add_reaction
('etf-slack-responder-7', 'template-slack-responder', '00000000-0000-0000-0000-000000000088', 7, 0), -- slack_get_thread_replies
('etf-slack-responder-8', 'template-slack-responder', '00000000-0000-0000-0000-000000000095', 8, 0), -- slack_find_channel
('etf-slack-responder-9', 'template-slack-responder', 'func-github-read-issues', 9, 1),
('etf-slack-responder-10', 'template-slack-responder', 'func-github-read-code', 10, 1),
('etf-slack-responder-11', 'template-slack-responder', 'func-github-read-commits', 11, 1),
('etf-slack-responder-12', 'template-slack-responder', 'func-github-search-code', 12, 1),
('etf-slack-responder-13', 'template-slack-responder', 'func-github-create-issue', 13, 0),
('etf-slack-responder-14', 'template-slack-responder', 'func-github-add-comment', 14, 0),
('etf-slack-responder-15', 'template-slack-responder', 'func-github-update-issue', 15, 0);

-- Add correct function associations for GitHub Issue Enhancer template
INSERT IGNORE INTO execution_template_functions (id, template_id, function_id, execution_order, is_required) VALUES
('etf-github-enhancer-1', 'template-github-issue-enhancer', 'func-github-read-issues', 1, 1),
('etf-github-enhancer-2', 'template-github-issue-enhancer', 'func-github-read-code', 2, 1),
('etf-github-enhancer-3', 'template-github-issue-enhancer', 'func-github-read-commits', 3, 0),
('etf-github-enhancer-4', 'template-github-issue-enhancer', 'func-github-search-code', 4, 1),
('etf-github-enhancer-5', 'template-github-issue-enhancer', 'func-github-add-comment', 5, 1),
('etf-github-enhancer-6', 'template-github-issue-enhancer', 'func-github-update-issue', 6, 1);

-- Add correct function associations for Slack Reporter template
INSERT IGNORE INTO execution_template_functions (id, template_id, function_id, execution_order, is_required) VALUES
('etf-slack-reporter-1', 'template-slack-reporter', 'func-github-read-issues', 1, 1),
('etf-slack-reporter-2', 'template-slack-reporter', 'func-github-read-code', 2, 0),
('etf-slack-reporter-3', 'template-slack-reporter', 'func-github-read-commits', 3, 1),
('etf-slack-reporter-4', 'template-slack-reporter', 'func-github-search-code', 4, 0),
('etf-slack-reporter-5', 'template-slack-reporter', '00000000-0000-0000-0000-000000000081', 5, 0), -- slack_read_messages
('etf-slack-reporter-6', 'template-slack-reporter', '00000000-0000-0000-0000-000000000082', 6, 0), -- slack_list_channels
('etf-slack-reporter-7', 'template-slack-reporter', 'slack_send_message', 7, 1), -- slack_send_message
('etf-slack-reporter-8', 'template-slack-reporter', '00000000-0000-0000-0000-000000000083', 8, 0), -- slack_get_channel_info
('etf-slack-reporter-9', 'template-slack-reporter', '00000000-0000-0000-0000-000000000086', 9, 0), -- slack_search_messages
('etf-slack-reporter-10', 'template-slack-reporter', '00000000-0000-0000-0000-000000000087', 10, 1), -- slack_add_reaction
('etf-slack-reporter-11', 'template-slack-reporter', '00000000-0000-0000-0000-000000000088', 11, 0), -- slack_get_thread_replies
('etf-slack-reporter-12', 'template-slack-reporter', '00000000-0000-0000-0000-000000000095', 12, 0); -- slack_find_channel
