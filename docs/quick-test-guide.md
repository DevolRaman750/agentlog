# 🧪 Quick Test Guide - Encryption Fix Verification

This guide helps you quickly verify that the API key encryption/decryption is working correctly.

## ✅ Before Testing

1. **Load Environment:**
   ```bash
   source scripts/setup-local-env.sh
   ```

2. **Start Backend:**
   ```bash
   make run-server
   ```

3. **Start Frontend (in another terminal):**
   ```bash
   source scripts/setup-local-env.sh
   cd frontend && yarn start
   ```

## 🔍 What to Look For

### ✅ SUCCESS Indicators

When working correctly, you should see these logs in your backend:

```
🔓 Successfully decrypted Gemini API key: your_key...
🔓 Successfully decrypted OpenWeather API key: your_key...
🔓 Successfully decrypted Neo4j URL
🔓 Successfully decrypted Neo4j username
🔓 Successfully decrypted Neo4j password
```

### ❌ FAILURE Indicators

If still broken, you'll see:

```
❌ Failed to decrypt Gemini API key: invalid padding
❌ Failed to decrypt OpenWeather API key: invalid padding
```

OR:

```
🔍 DEBUG: Decrypted keys: map[]
⚠️ No OpenWeather API key provided
```

## 🚀 Quick Test Steps

1. **Open your app** in browser/mobile
2. **Go to Execute screen**
3. **Enter a weather query**: "What's the weather in Santa Ana CA?"
4. **Click Execute**
5. **Check backend logs** for the success indicators above

## 🔧 If Still Not Working

1. **Check environment variables are synced:**
   ```bash
   echo "Backend: $API_ENCRYPTION_KEY"
   echo "Frontend: $EXPO_PUBLIC_API_ENCRYPTION_KEY"
   ```

2. **Restart both services:**
   ```bash
   pkill -f "go run cmd/gogent"
   source scripts/setup-local-env.sh
   make run-server
   ```

3. **Clear app cache and restart frontend**

## ✨ Success Confirmation

When everything works, your weather function should:
- ✅ Decrypt API keys successfully
- ✅ Make real weather API calls (if you have OpenWeather API key)
- ✅ Return weather data instead of fallback data

🎉 **Encryption issue resolved!** 