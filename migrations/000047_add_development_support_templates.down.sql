-- Remove development support execution templates

-- Remove function associations first (due to foreign key constraints)
DELETE FROM execution_template_functions WHERE template_id IN (
    'template-slack-responder',
    'template-github-issue-enhancer', 
    'template-slack-reporter'
);

-- Remove template parameters if any exist
DELETE FROM execution_template_parameters WHERE template_id IN (
    'template-slack-responder',
    'template-github-issue-enhancer',
    'template-slack-reporter'
);

-- Remove auth tokens if any exist
DELETE FROM execution_template_auth_tokens WHERE template_id IN (
    'template-slack-responder',
    'template-github-issue-enhancer',
    'template-slack-reporter'
);

-- Remove the templates themselves
DELETE FROM execution_templates WHERE id IN (
    'template-slack-responder',
    'template-github-issue-enhancer',
    'template-slack-reporter'
);
