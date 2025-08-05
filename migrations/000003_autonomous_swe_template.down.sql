-- Migration 000003 Down: Remove Autonomous SWE Template and Configuration

-- Remove Autonomous SWE execution template
DELETE FROM execution_templates WHERE id = 'template-autonomous-swe';

-- Remove Autonomous SWE API configuration  
DELETE FROM api_configurations WHERE id = 'system-config-autonomous-swe'; 