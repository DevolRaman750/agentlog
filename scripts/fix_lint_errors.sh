#!/bin/bash

echo "🔧 Starting automated lint fixes..."

# Fix 1: Replace all unused parameters with _ 
echo "📝 Fixing unused parameters..."
golangci-lint run --max-issues-per-linter=0 --max-same-issues=0 --out-format=json 2>&1 | \
  jq -r '.Issues[] | select(.FromLinter == "revive" and .Text | contains("unused-parameter")) | "\(.Pos.Filename):\(.Pos.Line):\(.Pos.Column)"' | \
  while read location; do
    file=$(echo $location | cut -d: -f1)
    line=$(echo $location | cut -d: -f2)
    
    # Extract the parameter name from the error
    param=$(golangci-lint run --max-issues-per-linter=0 --max-same-issues=0 --out-format=tab 2>&1 | grep "$file:$line" | head -1 | sed -n "s/.*parameter '\([^']*\)'.*/\1/p")
    
    if [ ! -z "$param" ]; then
      echo "  Fixing $file:$line - replacing parameter '$param' with '_'"
      # Use sed to replace the parameter name with _ in function signatures
      sed -i '' "${line}s/\b${param}\b/_/g" "$file"
    fi
  done

# Fix 2: Fix variable naming issues
echo "📝 Fixing variable naming..."
sed -i '' 's/functionIds/functionIDs/g' $(find . -name "*.go" -type f)
sed -i '' 's/neo4jUrl/neo4jURL/g' $(find . -name "*.go" -type f)
sed -i '' 's/totalApiRequests/totalAPIRequests/g' $(find . -name "*.go" -type f)
sed -i '' 's/totalApiResponses/totalAPIResponses/g' $(find . -name "*.go" -type f)

# Fix 3: Fix emptyStringTest issues
echo "📝 Fixing emptyStringTest issues..."
find . -name "*.go" -type f -exec sed -i '' 's/len(\([^)]*\)) > 0/\1 != ""/g' {} \;

# Fix 4: Add missing error checks for json.Encoder.Encode
echo "📝 Adding error checks for json.Encoder.Encode..."
# This is more complex and needs manual intervention for proper error handling

echo "✅ Automated fixes complete. Running lint check..."
golangci-lint run --max-issues-per-linter=0 --max-same-issues=0 --out-format=tab 2>&1 | wc -l