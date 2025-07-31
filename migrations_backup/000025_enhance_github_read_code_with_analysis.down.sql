-- Revert github_read_code function back to original functionality

UPDATE function_definitions 
SET 
    description = 'REQUIRED: Use this function immediately when you need to examine code files or directory structure from a GitHub repository. When an issue mentions specific files or directories (like cmd/gogent), you MUST call this function to read the actual code before providing solutions. For files, returns base64-encoded content that can be decoded. For directories, returns a list of files and subdirectories. Never ask the user to provide function calls - call this function automatically whenever code analysis is needed.',
    result_transformer = 'default'
WHERE name = 'github_read_code'; 