-- Fix function associations for development support templates
-- This migration corrects the function IDs that were incorrect in the previous migration

-- First, clear any existing associations for these templates
DELETE FROM execution_template_functions WHERE template_id IN (
    'template-slack-responder',
    'template-github-issue-enhancer', 
    'template-slack-reporter'
);

-- Add correct function associations for Slack Responder template
INSERT IGNORE INTO execution_template_functions (template_id, function_id, execution_order) VALUES
('template-slack-responder', '00000000-0000-0000-0000-000000000081', 1), -- slack_read_messages
('template-slack-responder', '00000000-0000-0000-0000-000000000082', 2), -- slack_list_channels
('template-slack-responder', 'slack_send_message', 3), -- slack_send_message (correct ID)
('template-slack-responder', '00000000-0000-0000-0000-000000000083', 4), -- slack_get_channel_info
('template-slack-responder', '00000000-0000-0000-0000-000000000086', 5), -- slack_search_messages
('template-slack-responder', '00000000-0000-0000-0000-000000000087', 6), -- slack_add_reaction
('template-slack-responder', '00000000-0000-0000-0000-000000000088', 7), -- slack_get_thread_replies
('template-slack-responder', '00000000-0000-0000-0000-000000000095', 8), -- slack_find_channel
('template-slack-responder', 'func-github-read-issues', 9),
('template-slack-responder', 'func-github-read-code', 10),
('template-slack-responder', 'func-github-read-commits', 11),
('template-slack-responder', 'func-github-search-code', 12),
('template-slack-responder', 'func-github-create-issue', 13),
('template-slack-responder', 'func-github-add-comment', 14),
('template-slack-responder', 'func-github-update-issue', 15);

-- Add correct function associations for GitHub Issue Enhancer template
INSERT IGNORE INTO execution_template_functions (template_id, function_id, execution_order) VALUES
('template-github-issue-enhancer', 'func-github-read-issues', 1),
('template-github-issue-enhancer', 'func-github-read-code', 2),
('template-github-issue-enhancer', 'func-github-read-commits', 3),
('template-github-issue-enhancer', 'func-github-search-code', 4),
('template-github-issue-enhancer', 'func-github-add-comment', 5),
('template-github-issue-enhancer', 'func-github-update-issue', 6);

-- Add correct function associations for Slack Reporter template
INSERT IGNORE INTO execution_template_functions (template_id, function_id, execution_order) VALUES
('template-slack-reporter', 'func-github-read-issues', 1),
('template-slack-reporter', 'func-github-read-code', 2),
('template-slack-reporter', 'func-github-read-commits', 3),
('template-slack-reporter', 'func-github-search-code', 4),
('template-slack-reporter', '00000000-0000-0000-0000-000000000081', 5), -- slack_read_messages
('template-slack-reporter', '00000000-0000-0000-0000-000000000082', 6), -- slack_list_channels
('template-slack-reporter', 'slack_send_message', 7), -- slack_send_message (correct ID)
('template-slack-reporter', '00000000-0000-0000-0000-000000000083', 8), -- slack_get_channel_info
('template-slack-reporter', '00000000-0000-0000-0000-000000000086', 9), -- slack_search_messages
('template-slack-reporter', '00000000-0000-0000-0000-000000000087', 10), -- slack_add_reaction
('template-slack-reporter', '00000000-0000-0000-0000-000000000088', 11), -- slack_get_thread_replies
('template-slack-reporter', '00000000-0000-0000-0000-000000000095', 12); -- slack_find_channel
