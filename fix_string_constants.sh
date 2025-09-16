#!/bin/bash

# Script to fix repeated strings by adding constants

echo "🔧 Fixing string constants..."

# Find files with repeated strings and add constants
find . -name "*.go" -not -path "./vendor/*" -not -path "./node_modules/*" | while read file; do
    # Fix common repeated strings
    if grep -q '"github"' "$file" && [ $(grep -c '"github"' "$file") -gt 1 ]; then
        # Add constant at top of file after imports
        sed -i '' '/^import (/,/^)/ {
            /^)/a\
\
const (\
	// IntegrationName is the name of the GitHub integration\
	IntegrationName = "github"\
)
        }' "$file"
        # Replace string literals with constant
        sed -i '' 's/"github"/IntegrationName/g' "$file"
    fi
    
    # Fix "GET" strings
    if grep -q '"GET"' "$file" && [ $(grep -c '"GET"' "$file") -gt 1 ]; then
        # Add constant if not exists
        if ! grep -q "HTTPMethodGET" "$file"; then
            sed -i '' '/^import (/,/^)/ {
                /^)/a\
\
const (\
	// HTTPMethodGET is the GET HTTP method\
	HTTPMethodGET = "GET"\
)
            }' "$file"
        fi
        # Replace string literals with constant
        sed -i '' 's/"GET"/HTTPMethodGET/g' "$file"
    fi
    
    # Fix "No data returned" strings
    if grep -q '"No data returned"' "$file" && [ $(grep -c '"No data returned"' "$file") -gt 1 ]; then
        # Add constant if not exists
        if ! grep -q "NoDataReturned" "$file"; then
            sed -i '' '/^import (/,/^)/ {
                /^)/a\
\
const (\
	// NoDataReturned is the message when no data is returned\
	NoDataReturned = "No data returned"\
)
            }' "$file"
        fi
        # Replace string literals with constant
        sed -i '' 's/"No data returned"/NoDataReturned/g' "$file"
    fi
    
    # Fix "FAILED: Unknown error" strings
    if grep -q '"FAILED: Unknown error"' "$file" && [ $(grep -c '"FAILED: Unknown error"' "$file") -gt 1 ]; then
        # Add constant if not exists
        if ! grep -q "FailedUnknownError" "$file"; then
            sed -i '' '/^import (/,/^)/ {
                /^)/a\
\
const (\
	// FailedUnknownError is the message for unknown failures\
	FailedUnknownError = "FAILED: Unknown error"\
)
            }' "$file"
        fi
        # Replace string literals with constant
        sed -i '' 's/"FAILED: Unknown error"/FailedUnknownError/g' "$file"
    fi
done

echo "✅ String constants fixed!"
