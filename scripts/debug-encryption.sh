#!/bin/bash

echo "🔍 GoGent Encryption Debug Tool"
echo "==============================="
echo ""

echo "📋 Checking environment variables..."
echo "API_ENCRYPTION_KEY: ${API_ENCRYPTION_KEY:-'(not set)'}"
echo "EXPO_PUBLIC_API_ENCRYPTION_KEY: ${EXPO_PUBLIC_API_ENCRYPTION_KEY:-'(not set)'}"
echo ""

# Test backend encryption setup
echo "🔧 Testing backend encryption setup..."
go run -c '
package main

import (
	"fmt"
	"gogent/internal/auth"
)

func main() {
	he := auth.NewHeaderEncryption()
	
	// Test encryption/decryption roundtrip
	testData := "test-api-key-12345"
	fmt.Printf("Test data: %s\n", testData)
	
	// This simulates how our tests work
	encrypted, err := simulateCryptoJSEncryption(testData, he.GetSharedSecret())
	if err != nil {
		fmt.Printf("❌ Encryption failed: %v\n", err)
		return
	}
	
	fmt.Printf("Encrypted: %s\n", encrypted)
	
	decrypted, err := he.DecryptAPIKey(encrypted)
	if err != nil {
		fmt.Printf("❌ Decryption failed: %v\n", err)
		return
	}
	
	fmt.Printf("Decrypted: %s\n", decrypted)
	
	if testData == decrypted {
		fmt.Println("✅ Backend encryption is working correctly!")
	} else {
		fmt.Println("❌ Backend encryption roundtrip failed!")
	}
}
' 2>/dev/null || echo "❌ Could not run Go test"

echo ""
echo "💡 To fix encryption issues:"
echo "1. Make sure both frontend and backend use the same encryption key"
echo "2. Set environment variable: export API_ENCRYPTION_KEY='your_secure_key_here'"
echo "3. Or in your .env file: API_ENCRYPTION_KEY=your_secure_key_here"
echo "4. Restart both frontend and backend after setting the key"
echo ""
echo "🚀 If you're still getting 'invalid padding' errors:"
echo "1. Check that your frontend app is rebuilt with the same encryption key"
echo "2. Verify no special characters or encoding issues in your API keys"
echo "3. Try setting a simple test key like: export API_ENCRYPTION_KEY='test123'" 