-- Migration 000038 down: Revert Gemini function calling behavior changes

-- Revert Gemini Flash Default to original prompt
UPDATE api_configurations 
SET system_prompt = 'You are a helpful AI assistant optimized for quick responses.'
WHERE id = 'system-config-gemini-flash' AND user_id = 'system';

-- Revert Gemini Pro Default to original prompt
UPDATE api_configurations 
SET system_prompt = 'You are a helpful AI assistant that provides accurate and concise responses.'
WHERE id = 'system-config-gemini-pro' AND user_id = 'system'; 