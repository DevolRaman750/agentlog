-- Revert api_key_validation column to allow NULLs (no default)
ALTER TABLE function_definitions
MODIFY api_key_validation JSON NULL; 