#!/bin/bash

# Script to fix unused parameters by replacing them with _

echo "🔧 Fixing unused parameters..."

# Fix common unused parameter patterns
find . -name "*.go" -not -path "./vendor/*" -not -path "./node_modules/*" | while read file; do
    # Fix unused context parameters
    sed -i '' 's/ctx context\.Context/_ context.Context/g' "$file"
    sed -i '' 's/ctx, /_, /g' "$file"
    sed -i '' 's/, ctx)/, _)/g' "$file"
    
    # Fix unused functionName parameters
    sed -i '' 's/functionName string/_ string/g' "$file"
    sed -i '' 's/functionName, /_, /g' "$file"
    sed -i '' 's/, functionName)/, _)/g' "$file"
    
    # Fix unused userID parameters
    sed -i '' 's/userID string/_ string/g' "$file"
    sed -i '' 's/userID, /_, /g' "$file"
    sed -i '' 's/, userID)/, _)/g' "$file"
    
    # Fix unused seq parameters
    sed -i '' 's/seq int/_ int/g' "$file"
    sed -i '' 's/seq, /_, /g' "$file"
    sed -i '' 's/, seq)/, _)/g' "$file"
    
    # Fix unused r parameters
    sed -i '' 's/r \*http\.Request/_ \*http.Request/g' "$file"
    sed -i '' 's/r, /_, /g' "$file"
    sed -i '' 's/, r)/, _)/g' "$file"
    
    # Fix unused agentID parameters
    sed -i '' 's/agentID string/_ string/g' "$file"
    sed -i '' 's/agentID, /_, /g' "$file"
    sed -i '' 's/, agentID)/, _)/g' "$file"
    
    # Fix unused conversationHistory parameters
    sed -i '' 's/conversationHistory \[\]ConversationMessage/_ \[\]ConversationMessage/g' "$file"
    sed -i '' 's/conversationHistory, /_, /g' "$file"
    sed -i '' 's/, conversationHistory)/, _)/g' "$file"
done

echo "✅ Unused parameters fixed!"
