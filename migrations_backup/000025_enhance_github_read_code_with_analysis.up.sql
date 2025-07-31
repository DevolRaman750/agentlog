-- Enhance github_read_code function to automatically decode and analyze code content

UPDATE function_definitions 
SET 
    description = 'REQUIRED: Use this function immediately when you need to examine code files or directory structure from a GitHub repository. When an issue mentions specific files or directories (like cmd/gogent), you MUST call this function to read the actual code before providing solutions. For FILES: automatically decodes base64 content and provides code analysis including functions, imports, and structure. For DIRECTORIES: returns a list of files and subdirectories. Never ask the user to provide function calls - call this function automatically whenever code analysis is needed.',
    result_transformer = 'github_code_analyzer'
WHERE name = 'github_read_code'; 