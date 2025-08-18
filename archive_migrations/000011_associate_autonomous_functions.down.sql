-- Migration 000011 Down: Remove Function Associations

DELETE FROM execution_template_functions 
WHERE template_id = 'template-autonomous-swe'; 