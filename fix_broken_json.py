#!/usr/bin/env python3
import re
import glob

files_to_fix = [
    "./cmd/gogent/server.go",
    "./internal/apikeys/handlers.go", 
    "./internal/agents/handlers.go",
    "./internal/teams/handlers.go",
    "./internal/templates/public_api.go",
    "./internal/templates/handlers.go"
]

for file_path in files_to_fix:
    print(f"Fixing {file_path}...")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern to find broken JSON encoding lines
    # This matches lines that were incorrectly modified
    pattern = r'(\s*)if err := json\.NewEncoder\(w\)\.Encode\((map\[string\][^{]+\{);[^}]+\}\n(\s+\t[^\n]+\n\s+\})\n(\s+")([^"]+)": '
    
    # Fix by reorganizing the structure
    def fix_match(match):
        indent = match.group(1)
        map_start = match.group(2)
        error_handling = match.group(3)
        next_indent = match.group(4)
        first_key = match.group(5)
        
        # Find the complete map content
        # This is a simplified fix - we'll manually fix the rest
        return f'{indent}if err := json.NewEncoder(w).Encode({map_start}\n{next_indent}"{first_key}": '
    
    # More targeted fix for the specific broken pattern
    # Lines like: " if err := json.NewEncoder(w).Encode(map[string]interface{}{; err != nil {"
    content = re.sub(
        r'(\s*)if err := json\.NewEncoder\(w\)\.Encode\(map\[string\]interface\{\}\{; err != nil \{',
        r'\1if err := json.NewEncoder(w).Encode(map[string]interface{}{',
        content
    )
    
    # Also fix lines like: " if err := json.NewEncoder(w).Encode(map[string]string{; err != nil {"
    content = re.sub(
        r'(\s*)if err := json\.NewEncoder\(w\)\.Encode\(map\[string\]string\{; err != nil \{',
        r'\1if err := json.NewEncoder(w).Encode(map[string]string{',
        content
    )
    
    with open(file_path, 'w') as f:
        f.write(content)

print("Fixed broken JSON encoding syntax")