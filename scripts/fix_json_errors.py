#!/usr/bin/env python3
import json
import subprocess
import re

# Get all lint issues
result = subprocess.run(
    ["golangci-lint", "run", "--max-issues-per-linter=0", "--max-same-issues=0", "--out-format=json"],
    capture_output=True, text=True
)

issues = json.loads(result.stdout)["Issues"]

# Filter for json.Encoder.Encode error checking issues
json_errors = [i for i in issues if "json.Encoder).Encode" in i.get("Text", "")]

# Group by file
files_to_fix = {}
for issue in json_errors:
    file = issue["Pos"]["Filename"]
    line = issue["Pos"]["Line"]
    
    if file not in files_to_fix:
        files_to_fix[file] = []
    files_to_fix[file].append(line)

print(f"Found {len(json_errors)} json.Encoder.Encode errors to fix")

# Fix each file
for file, line_numbers in files_to_fix.items():
    print(f"Fixing {file}...")
    
    # Read the file
    with open(file, 'r') as f:
        lines = f.readlines()
    
    # Sort line numbers in reverse to maintain line positions
    for line_num in sorted(line_numbers, reverse=True):
        line_idx = line_num - 1
        if line_idx < len(lines):
            line = lines[line_idx]
            
            # Check if this is a json.NewEncoder().Encode() line
            if 'json.NewEncoder(w).Encode(' in line:
                indent = len(line) - len(line.lstrip())
                indent_str = '\t' * (indent // 4) + ' ' * (indent % 4)
                
                # Replace the line with error checking version
                lines[line_idx] = f'{indent_str}if err := json.NewEncoder(w).Encode(' + line.strip()[len('json.NewEncoder(w).Encode('):].rstrip() + '; err != nil {\n'
                lines.insert(line_idx + 1, f'{indent_str}\tlog.Printf("Failed to encode JSON response: %v", err)\n')
                lines.insert(line_idx + 2, f'{indent_str}' + '}\n')
    
    # Write back
    with open(file, 'w') as f:
        f.writelines(lines)

print(f"Fixed {len(json_errors)} json.Encoder.Encode error issues")