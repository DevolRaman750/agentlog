-- Remove function associations for development support templates

DELETE FROM execution_template_functions WHERE template_id IN (
    'template-slack-responder',
    'template-github-issue-enhancer',
    'template-slack-reporter'
);
