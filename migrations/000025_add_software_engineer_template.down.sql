-- Migration 000025 Down: Remove Software Engineer Execution Template

-- Remove function associations for Software Engineer template
DELETE FROM execution_template_functions WHERE template_id = 'system-template-software-engineer';

-- Remove template parameters
DELETE FROM execution_template_parameters WHERE template_id = 'system-template-software-engineer';

-- Remove the Software Engineer template
DELETE FROM execution_templates WHERE id = 'system-template-software-engineer'; 