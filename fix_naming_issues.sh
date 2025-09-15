#!/bin/bash

echo "🔧 Fixing naming issues..."

# Fix ApiKey -> APIKey in all Go files
find . -name "*.go" -not -path "./vendor/*" -not -path "./proto/*" -print0 | xargs -0 sed -i '' 's/ApiKey/APIKey/g'
find . -name "*.go" -not -path "./vendor/*" -not -path "./proto/*" -print0 | xargs -0 sed -i '' 's/ApiKeys/APIKeys/g'

# Fix Http -> HTTP
find . -name "*.go" -not -path "./vendor/*" -not -path "./proto/*" -print0 | xargs -0 sed -i '' 's/HttpMethod/HTTPMethod/g'
find . -name "*.go" -not -path "./vendor/*" -not -path "./proto/*" -print0 | xargs -0 sed -i '' 's/hasHttp/hasHTTP/g'

# Fix Url -> URL
find . -name "*.go" -not -path "./vendor/*" -not -path "./proto/*" -print0 | xargs -0 sed -i '' 's/Neo4jUrl/Neo4jURL/g'

# Fix Id -> ID
find . -name "*.go" -not -path "./vendor/*" -not -path "./proto/*" -print0 | xargs -0 sed -i '' 's/FunctionIds/FunctionIDs/g'
find . -name "*.go" -not -path "./vendor/*" -not -path "./proto/*" -print0 | xargs -0 sed -i '' 's/TeamConfigId/TeamConfigID/g'

echo "✅ Naming issues fixed!"
