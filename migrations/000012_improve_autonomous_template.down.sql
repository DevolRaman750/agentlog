-- Migration 000012 Down: Revert Autonomous Template

UPDATE execution_templates 
SET template_prompt = 'You are an autonomous software engineering agent that analyzes GitHub issues and implements solutions.',
description = 'Autonomous software engineering agent for GitHub issue analysis and implementation'
WHERE id = 'template-autonomous-swe'; 