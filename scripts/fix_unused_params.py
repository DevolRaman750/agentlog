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

# Filter for unused parameter issues
unused_params = [i for i in issues if "unused-parameter" in i.get("Text", "")]

# Group by file
files_to_fix = {}
for issue in unused_params:
    file = issue["Pos"]["Filename"]
    line = issue["Pos"]["Line"]
    
    # Extract parameter name from the message
    match = re.search(r"parameter '([^']+)'", issue["Text"])
    if match:
        param_name = match.group(1)
        if file not in files_to_fix:
            files_to_fix[file] = []
        files_to_fix[file].append((line, param_name))

# Fix each file
for file, fixes in files_to_fix.items():
    print(f"Fixing {file}...")
    
    # Read the file
    with open(file, 'r') as f:
        lines = f.readlines()
    
    # Apply fixes (in reverse order to maintain line numbers)
    for line_num, param_name in sorted(fixes, reverse=True):
        line_idx = line_num - 1
        if line_idx < len(lines):
            # Replace the parameter name with _ in the function signature
            lines[line_idx] = re.sub(r'\b' + re.escape(param_name) + r'\b', '_', lines[line_idx])
    
    # Write back
    with open(file, 'w') as f:
        f.writelines(lines)

print(f"Fixed {len(unused_params)} unused parameter issues")