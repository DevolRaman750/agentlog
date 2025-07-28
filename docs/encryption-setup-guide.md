# 🔐 API Key Encryption Setup Guide

This guide explains how to properly configure encryption for API keys between your frontend and backend to avoid "invalid padding" errors.

## 🛠 Quick Setup for Local Development

### 1. Environment Configuration

Ensure your `config.env` file has both encryption keys set to the same value:

```env
# API Key Encryption (must match between frontend and backend)
API_ENCRYPTION_KEY=gogent_secure_encryption_key_2025_development_minimum_32_characters
EXPO_PUBLIC_API_ENCRYPTION_KEY=gogent_secure_encryption_key_2025_development_minimum_32_characters
```

### 2. Automated Setup Script

Use the provided setup script to synchronize environment variables:

```bash
# Load environment with synchronized keys
source scripts/setup-local-env.sh

# Start backend server
make run-server

# In another terminal, start frontend
source scripts/setup-local-env.sh
cd frontend && yarn start
```

### 3. Manual Environment Setup

If you prefer manual setup:

```bash
# Export both variables with the same value
export API_ENCRYPTION_KEY="your_secure_key_here"
export EXPO_PUBLIC_API_ENCRYPTION_KEY="your_secure_key_here"

# Start backend
make run-server

# Start frontend (in another terminal with same env vars)
cd frontend && yarn start
```

## 🔧 Understanding the Fix

### Problem
The "invalid padding" errors occurred because:
1. Frontend used `EXPO_PUBLIC_API_ENCRYPTION_KEY` for encryption
2. Backend used `API_ENCRYPTION_KEY` for decryption  
3. If these keys were different, decryption would fail

### Solution
1. **Fixed backend decryption logic** - Properly handles CryptoJS encrypted data
2. **Synchronized environment variables** - Backend now checks both env var names
3. **Automated setup** - Makefile and scripts ensure keys are always synchronized

## 📋 Verification

### Test Backend Encryption
```bash
# Run encryption tests
source scripts/setup-local-env.sh
go test ./internal/auth -v -run TestHeaderEncryption_CryptoJSCompatibility
```

### Expected Success Logs
When working correctly, you should see:
```
🔓 Successfully decrypted Gemini API key: your_key...
🔓 Successfully decrypted Neo4j URL
🔓 Successfully decrypted Neo4j username
🔓 Successfully decrypted Neo4j password
```

Instead of:
```
❌ Failed to decrypt Gemini API key: invalid padding
```

## 🚨 Troubleshooting

### Still Getting "Invalid Padding" Errors?

1. **Check environment variables are synchronized**:
   ```bash
   echo "Backend: $API_ENCRYPTION_KEY"
   echo "Frontend: $EXPO_PUBLIC_API_ENCRYPTION_KEY"
   ```

2. **Restart both services after setting variables**:
   ```bash
   # Kill existing processes
   pkill -f "go run cmd/gogent"
   pkill -f "expo start"
   
   # Source environment and restart
   source scripts/setup-local-env.sh
   make run-server
   cd frontend && yarn start
   ```

3. **Verify config.env is loaded**:
   ```bash
   # Check if config.env exists and has encryption keys
   grep "API_ENCRYPTION_KEY" config.env
   ```

4. **Test with simple key**:
   ```bash
   export API_ENCRYPTION_KEY="test123"
   export EXPO_PUBLIC_API_ENCRYPTION_KEY="test123"
   ```

### Production Deployment

For production, ensure:
1. Both environment variables are set in your deployment environment
2. Use a secure, randomly generated encryption key (minimum 32 characters)
3. Never commit actual encryption keys to version control

### Environment Variable Hierarchy

The backend checks for encryption keys in this order:
1. `API_ENCRYPTION_KEY` (primary)
2. `EXPO_PUBLIC_API_ENCRYPTION_KEY` (fallback for compatibility)
3. `"gogent_shared_secret_v1_default"` (default if none set)

## 🎯 Key Takeaways

- ✅ **Both frontend and backend must use the same encryption key**
- ✅ **Use `source scripts/setup-local-env.sh` for local development**
- ✅ **The Makefile automatically loads config.env for the backend**
- ✅ **Restart both services after changing encryption keys**
- ✅ **Test encryption with the provided test suite**

Following this guide ensures your API key encryption works seamlessly between frontend and backend! 🚀 