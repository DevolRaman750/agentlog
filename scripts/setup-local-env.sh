#!/bin/bash

echo "🔧 Setting up local development environment..."

# Source the config.env file if it exists
if [ -f "config.env" ]; then
    echo "📋 Loading config.env..."
    export $(grep -v '^#' config.env | xargs)
    echo "✅ Config loaded"
else
    echo "⚠️ config.env not found, using defaults"
    export API_ENCRYPTION_KEY="gogent_secure_encryption_key_2025_development_minimum_32_characters"
    export EXPO_PUBLIC_API_ENCRYPTION_KEY="gogent_secure_encryption_key_2025_development_minimum_32_characters"
fi

# Ensure both encryption keys are set to the same value
if [ -n "$API_ENCRYPTION_KEY" ]; then
    export EXPO_PUBLIC_API_ENCRYPTION_KEY="$API_ENCRYPTION_KEY"
    echo "🔐 Synchronized encryption keys:"
    echo "   API_ENCRYPTION_KEY=$API_ENCRYPTION_KEY"
    echo "   EXPO_PUBLIC_API_ENCRYPTION_KEY=$EXPO_PUBLIC_API_ENCRYPTION_KEY"
else
    echo "❌ API_ENCRYPTION_KEY not set in config.env"
    exit 1
fi

echo ""
echo "🚀 Environment ready for local development!"
echo "💡 Run this script with: source scripts/setup-local-env.sh"
echo ""
echo "📝 To verify encryption is working:"
echo "   1. source scripts/setup-local-env.sh"
echo "   2. make run-server"
echo "   3. cd frontend && yarn start" 