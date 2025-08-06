-- Migration 000038: Fix Gemini function calling behavior
-- Update system prompts to encourage function usage

-- Update Gemini Flash Default to be more aggressive about function calling
UPDATE api_configurations 
SET system_prompt = 'You are a helpful AI assistant optimized for quick responses. When you have access to functions and tools, use them actively to provide accurate, real-time information and complete tasks effectively. Always prioritize using available functions when they can help answer the user''s question or fulfill their request.'
WHERE id = 'system-config-gemini-flash' AND user_id = 'system';

-- Update Gemini Pro Default to also encourage function usage
UPDATE api_configurations 
SET system_prompt = 'You are a helpful AI assistant that provides accurate and concise responses. When functions and tools are available, utilize them proactively to gather real-time information and complete tasks effectively. Prioritize using available functions to provide the most accurate and up-to-date information possible.'
WHERE id = 'system-config-gemini-pro' AND user_id = 'system'; 