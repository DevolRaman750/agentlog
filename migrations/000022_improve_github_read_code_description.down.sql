-- Revert github_read_code function description back to original

UPDATE function_definitions 
SET 
    description = 'Read file contents or list directory contents from a GitHub repository. For files, returns base64-encoded content that can be decoded. For directories, returns a list of files and subdirectories with their metadata. Essential for analyzing code structure, reading configuration files, and understanding repository layout.'
WHERE name = 'github_read_code'; 