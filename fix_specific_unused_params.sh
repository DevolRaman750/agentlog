#!/bin/bash

# More targeted script to fix only specific unused parameters

echo "🔧 Fixing specific unused parameters..."

# Fix only test files and specific patterns
find . -name "*_test.go" -not -path "./vendor/*" | while read file; do
    # Only fix unused context parameters in test files
    sed -i '' 's/ctx context\.Context/_ context.Context/g' "$file"
    sed -i '' 's/ctx, /_, /g' "$file"
    sed -i '' 's/, ctx)/, _)/g' "$file"
done

# Fix specific files with known unused parameters
echo "Fixing pkg/engine files..."
sed -i '' 's/functionName string/_ string/g' pkg/engine/summarize.go
sed -i '' 's/functionName string/_ string/g' pkg/engine/params.go

echo "Fixing engine test files..."
sed -i '' 's/ctx context\.Context/_ context.Context/g' pkg/engine/engine_test.go
sed -i '' 's/ctx context\.Context/_ context.Context/g' pkg/engine/engine_multi_test.go
sed -i '' 's/seq int/_ int/g' pkg/engine/engine_test.go

echo "Fixing basic comparator..."
sed -i '' 's/ctx context\.Context/_ context.Context/g' pkg/engine/basic_comparator.go

echo "✅ Specific unused parameters fixed!"
