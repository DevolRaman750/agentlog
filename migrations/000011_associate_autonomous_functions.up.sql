-- Migration 000011: Associate Functions with Autonomous SWE Template
-- This migration properly associates all GitHub functions with the autonomous template

-- Associate all GitHub functions with the autonomous template
INSERT INTO execution_template_functions (id, template_id, function_id, is_required, execution_order, created_at) VALUES
(UUID(), 'template-autonomous-swe', 'func-github-read-issues', 1, 1, NOW()),
(UUID(), 'template-autonomous-swe', 'func-github-read-code', 1, 2, NOW()),
(UUID(), 'template-autonomous-swe', 'github-create-branch-uuid', 1, 3, NOW()),
(UUID(), 'template-autonomous-swe', 'github-create-file-uuid', 1, 4, NOW()),
(UUID(), 'template-autonomous-swe', 'func-github-create-pr', 1, 5, NOW()),
(UUID(), 'template-autonomous-swe', 'func-github-add-comment', 0, 6, NOW()),
(UUID(), 'template-autonomous-swe', 'func-github-update-issue', 0, 7, NOW()),
(UUID(), 'template-autonomous-swe', 'func-github-get-file-sha', 0, 8, NOW()),
(UUID(), 'template-autonomous-swe', 'func-github-list-branches', 0, 9, NOW()),
(UUID(), 'template-autonomous-swe', 'func-github-merge-pr', 0, 10, NOW()),
(UUID(), 'template-autonomous-swe', 'func-github-search-code', 0, 11, NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW(); 