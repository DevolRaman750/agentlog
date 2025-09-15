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

# Filter for rows.Err issues
rows_errors = [i for i in issues if "rows.Err must be checked" in i.get("Text", "")]

# Group by file
files_to_fix = {}
for issue in rows_errors:
    file = issue["Pos"]["Filename"]
    line = issue["Pos"]["Line"]
    
    if file not in files_to_fix:
        files_to_fix[file] = []
    files_to_fix[file].append(line)

print(f"Found {len(rows_errors)} rows.Err errors to fix")

# Fix each file
for file, line_numbers in files_to_fix.items():
    print(f"Fixing {file}...")
    
    # Read the file
    with open(file, 'r') as f:
        lines = f.readlines()
    
    # For each line that needs fixing (in reverse order)
    for line_num in sorted(line_numbers, reverse=True):
        line_idx = line_num - 1
        if line_idx < len(lines):
            # Find the closing brace of the for loop that iterates over rows
            # We need to add rows.Err() check after the loop
            
            # Look backwards to find the for loop
            for i in range(line_idx, max(0, line_idx - 20), -1):
                if 'for dbRows.Next()' in lines[i] or 'for rows.Next()' in lines[i]:
                    # Find the closing brace of this for loop
                    brace_count = 0
                    found_start = False
                    for j in range(i, min(len(lines), i + 200)):
                        if '{' in lines[j]:
                            brace_count += lines[j].count('{')
                            found_start = True
                        if '}' in lines[j] and found_start:
                            brace_count -= lines[j].count('}')
                            if brace_count == 0:
                                # Found the closing brace, add error check after it
                                indent = len(lines[j]) - len(lines[j].lstrip())
                                indent_str = '\t' * (indent // 4) + ' ' * (indent % 4)
                                
                                # Check if we're working with dbRows or rows
                                var_name = 'dbRows' if 'dbRows' in lines[i] else 'rows'
                                
                                # Insert error check after the closing brace
                                lines.insert(j + 1, f'{indent_str}if err := {var_name}.Err(); err != nil {{\n')
                                lines.insert(j + 2, f'{indent_str}\tlog.Printf("Error iterating rows: %v", err)\n')
                                lines.insert(j + 3, f'{indent_str}\treturn\n')
                                lines.insert(j + 4, f'{indent_str}}}\n')
                                break
                    break
    
    # Write back
    with open(file, 'w') as f:
        f.writelines(lines)

print(f"Fixed {len(rows_errors)} rows.Err error issues")