# Supported Models - Function Calling Optimized

## Overview

AgentLog now only supports models that work reliably with function calling and tool use. Models that caused repeated function calls or loops have been removed.

## ✅ Supported Models (5 Total)

### 1. **Gemini 2.5 Pro** ⭐ NEW - Most Intelligent
- **Model ID:** `gemini-2.5-pro`
- **Provider:** Google
- **Configuration:** `system-config-gemini-2-5-pro`
- **Strengths:**
  - Google's most advanced model (June 2025)
  - Exceptional function calling and reasoning
  - 1M+ token context window (1,048,576 tokens)
  - Leads coding benchmarks (WebDev Arena, Aider Polyglot)
  - Multimodal: text, images, audio, video
  - Superior performance in math, STEM, and coding
- **Temperature:** 0.40
- **Max Tokens:** 8192
- **Cost:** $1.25/M input, $10/M output tokens

### 2. **Kimi K2** (Recommended for Tool Use)
- **Model ID:** `moonshotai/kimi-k2`
- **Provider:** Moonshot AI
- **Configuration:** `system-config-kimi-k2`
- **Strengths:**
  - Excellent function calling behavior
  - Reliable tool use without loops
  - Good at complex agentic workflows
  - Cost-effective
- **Temperature:** 0.60
- **Max Tokens:** 4096

### 3. **Gemini 1.5 Pro**
- **Model ID:** `gemini-1.5-pro`
- **Provider:** Google
- **Configuration:** `system-config-gemini-pro`
- **Strengths:**
  - Native provider with good function support
  - Large context window
  - Advanced reasoning
- **Temperature:** 0.50
- **Max Tokens:** 4096

### 4. **Claude 3.5 Sonnet**
- **Model ID:** `anthropic/claude-3.5-sonnet-20241022`
- **Provider:** OpenRouter (Anthropic)
- **Configuration:** `system-config-claude-3-5-sonnet`
- **Strengths:**
  - Excellent tool use capabilities
  - Advanced reasoning
  - Reliable function calling
- **Temperature:** 0.30
- **Max Tokens:** 4096

### 5. **GPT-4o**
- **Model ID:** `openai/gpt-4o-2024-08-06`
- **Provider:** OpenRouter (OpenAI)
- **Configuration:** `system-config-gpt-4o`
- **Strengths:**
  - Fast and intelligent
  - Good function calling support
  - Optimized for speed
- **Temperature:** 0.20
- **Max Tokens:** 4096

## ❌ Removed Models

The following models were removed due to poor function calling behavior:

### 1. **DeepSeek V3**
- **Reason:** Repeatedly called the same functions with similar parameters
- **Issue:** Would call `github_read_issues` 10+ times in a loop
- **File Removed:** `system/models/deepseek-v3.json`

### 2. **Llama 3.1 405B**
- **Reason:** Not designed for function calling workflows
- **Issue:** Poor tool use behavior, unreliable function calls
- **File Removed:** `system/models/llama-3-1-405b.json`

### 3. **Qwen 2.5 Coder**
- **Reason:** Optimized for coding, not tool use
- **Issue:** Inconsistent function calling behavior
- **File Removed:** `system/models/qwen-2-5-coder.json`

## Changes Made

### Backend (System Configurations)
- ✅ Removed `/system/models/deepseek-v3.json`
- ✅ Removed `/system/models/llama-3-1-405b.json`
- ✅ Removed `/system/models/qwen-2-5-coder.json`
- ✅ Added `/system/models/gemini-2-5-pro.json` ⭐ NEW
- ✅ Supporting 5 reliable models: Gemini 2.5 Pro, Kimi K2, Gemini 1.5 Pro, Claude 3.5 Sonnet, GPT-4o

### Frontend
- ✅ Updated `ModelSelector.tsx`:
  - Removed references to `qwen-2-5-coder`, `deepseek-v3`, `llama-3-1-405b`
  - Added `gemini-2-5-pro` to supported models
  - Updated new models list to include Gemini 2.5 Pro
  - Updated recommended models list
  - Updated system config ID filter
- ✅ Updated `ApiKeyOnboarding.tsx`:
  - Changed OpenRouter example from DeepSeek V3 to Claude 3.5 Sonnet
  - Updated pricing information
  - Updated badge from "COST EFFECTIVE" to "ADVANCED TOOLS"
- ✅ Updated `internal/providers/factory.go`:
  - Added `gemini-2.5-pro` to Gemini provider supported models list

## Testing Recommendations

After these changes, test each remaining model with:

1. **Simple function call**: Single function execution
2. **Multi-step workflow**: Multiple functions in sequence
3. **Complex agentic task**: GitHub issue analysis, Slack workflows, etc.

Expected behavior:
- ✅ Functions called only when needed
- ✅ No repeated calls with identical parameters
- ✅ Natural completion without hitting max depth
- ✅ Reasonable execution times (< 1 minute for most tasks)

## Future Model Additions

Before adding new models, verify:
1. ✅ Native function calling support
2. ✅ Doesn't repeat function calls unnecessarily
3. ✅ Respects context and previous function results
4. ✅ Completes tasks within reasonable iterations (< 6-8)
5. ✅ Test with complex multi-function workflows

## Configuration Sync

The system will automatically sync these changes on next deployment:
- Database will load only the 4 remaining model configurations
- Frontend will show only supported models in dropdowns
- API onboarding will guide users to working providers

