-- Remove system execution templates

-- Delete template version records
DELETE FROM execution_template_versions 
WHERE template_id IN ('system-template-weatherman', 'system-template-scrum-master');

-- Delete template function associations
DELETE FROM execution_template_functions 
WHERE template_id IN ('system-template-weatherman', 'system-template-scrum-master');

-- Delete template parameters
DELETE FROM execution_template_parameters 
WHERE template_id IN ('system-template-weatherman', 'system-template-scrum-master');

-- Delete the templates themselves
DELETE FROM execution_templates 
WHERE id IN ('system-template-weatherman', 'system-template-scrum-master') 
    AND user_id = 'system'; 