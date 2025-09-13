-- Add effective_context column to agents table
-- This column stores the combined template context + shared team context
ALTER TABLE agents ADD COLUMN effective_context TEXT;
