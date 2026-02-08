#!/bin/bash

echo "🔧 Fixing magic numbers by extracting to constants..."

# Add constants to internal/gogent/api_management.go
sed -i '' '/^import (/a\
\
const (\
	DefaultMaxTokens = 100\
	DefaultTimeoutSeconds = 30\
	DefaultMaxRetries = 3\
)' internal/gogent/api_management.go

# Replace magic numbers in api_management.go
sed -i '' 's/100)/DefaultMaxTokens)/g' internal/gogent/api_management.go

# Add constants to internal/gogent/core.go
sed -i '' '/^import (/a\
\
const (\
	DefaultMaxResults = 50\
	DefaultPageSize = 100\
	DefaultTimeoutMs = 300\
	DefaultMaxDepth = 10\
)' internal/gogent/core.go

# Replace magic numbers in core.go
sed -i '' 's/50)/DefaultMaxResults)/g' internal/gogent/core.go
sed -i '' 's/100)/DefaultPageSize)/g' internal/gogent/core.go
sed -i '' 's/300)/DefaultTimeoutMs)/g' internal/gogent/core.go

# Add constants to internal/gogent/execution_engine.go
sed -i '' '/^import (/a\
\
const (\
	DefaultMaxTokens = 200\
	DefaultTimeoutMs = 300\
	DefaultMaxLength = 500\
	DefaultMaxDepth = 10\
)' internal/gogent/execution_engine.go

# Replace magic numbers in execution_engine.go
sed -i '' 's/200)/DefaultMaxTokens)/g' internal/gogent/execution_engine.go
sed -i '' 's/300)/DefaultTimeoutMs)/g' internal/gogent/execution_engine.go
sed -i '' 's/500)/DefaultMaxLength)/g' internal/gogent/execution_engine.go

echo "✅ Magic numbers fixed!"
