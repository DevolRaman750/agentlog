# Template Model Optimization Plan

## Model Selection Criteria

### **Gemini 2.5 Pro** (`system-config-gemini-2-5-pro`) ⭐
**Best for:** Complex reasoning, code generation, multi-step workflows, large context needs
- 1M+ token context window
- Superior coding benchmarks
- Best for software engineering tasks
- Cost: $1.25/M input, $10/M output

### **Kimi K2** (`system-config-kimi-k2`)
**Best for:** Tool use, function calling, reliable workflows, cost-effective
- Proven excellent function calling (from logs)
- No looping issues
- Good for orchestration tasks
- Most cost-effective for frequent executions

### **Claude 3.5 Sonnet** (`system-config-claude-3-5-sonnet`)
**Best for:** Analysis, reasoning, detailed investigation
- Excellent for code analysis
- Strong reasoning capabilities
- Good for investigation tasks

### **GPT-4o** (`system-config-gpt-4o`)
**Best for:** Fast responses, general tasks, balanced performance
- Fastest response times
- Good all-around performance
- Lower temperature (0.20) for consistency

### **Gemini 1.5 Pro** (`system-config-gemini-pro`) 
**Legacy:** Keep for backward compatibility but migrate away

---

## Optimized Template Assignments

### 1. **Task Creator** (`template-task-creator`)
- **Current:** `system-config-gemini-pro` ❌
- **Optimized:** `system-config-kimi-k2` ✅
- **Reasoning:** 
  - Heavy tool use (team_task_*, slack_*, github_*)
  - Orchestration focus
  - Needs reliable function calling
  - Runs frequently (heartbeat: 15min)
  - Kimi K2 perfect for this

### 2. **Task Executor** (`template-task-executor`)
- **Current:** `system-config-gemini-pro` ❌
- **Optimized:** `system-config-gemini-2-5-pro` ✅
- **Reasoning:**
  - Most complex template (GitHub workflows, code generation)
  - Long execution timeout (1800s = 30min)
  - Needs superior coding capabilities
  - Handles branches, files, PRs - complex dev workflows
  - Gemini 2.5 Pro's coding excellence is key

### 3. **Task Reporter** (`template-task-reporter`)
- **Current:** `system-config-gemini-pro` ❌
- **Optimized:** `system-config-gpt-4o` ✅
- **Reasoning:**
  - Simple monitoring and reporting
  - Needs fast responses
  - Low complexity task
  - GPT-4o's speed is perfect here
  - Lower temperature (0.20) for consistent reports

### 4. **Slack Responder** (`template-slack-responder`)
- **Current:** `system-config-gemini-pro` ❌
- **Optimized:** `system-config-claude-3-5-sonnet` ✅
- **Reasoning:**
  - Needs to understand questions deeply
  - Research and analysis of GitHub data
  - Craft thoughtful responses
  - Claude's reasoning strength shines here
  - Good balance of speed and quality

### 5. **Software Engineer** (`template-software-engineer`)
- **Current:** `system-config-gemini-pro` ❌
- **Optimized:** `system-config-gemini-2-5-pro` ✅
- **Reasoning:**
  - Full dev capabilities (branches, PRs, code changes)
  - Needs best coding performance
  - Complex problem-solving
  - Gemini 2.5 Pro leads coding benchmarks

### 6. **GitHub Issue Enhancer** (`template-github-issue-enhancer`)
- **Current:** `system-config-gemini-pro` ❌
- **Optimized:** `system-config-claude-3-5-sonnet` ✅
- **Reasoning:**
  - Code analysis and investigation
  - Needs strong reasoning for relevance
  - Non-destructive updates require careful thought
  - Claude excellent for analysis tasks

### 7. **Intern SWE** (`template-intern-swe`)
- **Current:** `system-config-gemini-flash` ❌ (NOT EVEN SUPPORTED!)
- **Optimized:** `system-config-kimi-k2` ✅
- **Reasoning:**
  - Read-only operations
  - Learning and analysis focus
  - Needs cost-effective option for entry-level work
  - Kimi K2 perfect for this (cost-effective, reliable)

### 8. **Slack Reporter** (`template-slack-reporter`)
- **Current:** Need to check...
- **Optimized:** `system-config-gpt-4o` ✅
- **Reasoning:**
  - Similar to Task Reporter
  - Fast, consistent reporting
  - GPT-4o's speed advantage

### 9. **Weatherman** (`template-weatherman`)
- **Current:** Need to check...
- **Optimized:** `system-config-gpt-4o` ✅
- **Reasoning:**
  - Simple utility function
  - Fast responses needed
  - GPT-4o is perfect

---

## Summary of Changes

| Template | Old Model | New Model | Reason |
|----------|-----------|-----------|---------|
| Task Creator | Gemini 1.5 Pro | **Kimi K2** | Tool use orchestration |
| Task Executor | Gemini 1.5 Pro | **Gemini 2.5 Pro** | Complex coding |
| Task Reporter | Gemini 1.5 Pro | **GPT-4o** | Fast reporting |
| Slack Responder | Gemini 1.5 Pro | **Claude 3.5 Sonnet** | Analysis & reasoning |
| Software Engineer | Gemini 1.5 Pro | **Gemini 2.5 Pro** | Best coding |
| Issue Enhancer | Gemini 1.5 Pro | **Claude 3.5 Sonnet** | Code analysis |
| Intern SWE | Gemini Flash (broken!) | **Kimi K2** | Cost-effective learning |
| Slack Reporter | TBD | **GPT-4o** | Fast reporting |
| Weatherman | TBD | **GPT-4o** | Simple utility |

---

## Expected Benefits

1. **Better Tool Calling:** Kimi K2 for orchestration = no more loops
2. **Superior Coding:** Gemini 2.5 Pro for complex dev = better code quality
3. **Faster Responses:** GPT-4o for simple tasks = quicker reporting
4. **Better Analysis:** Claude for investigation = deeper insights
5. **Cost Optimization:** Right model for each task = efficient spending
6. **Reliability:** Each model matched to its strengths = fewer failures

---

## Migration Path

1. ✅ Update template JSON files with new `preferred_configuration_id`
2. ✅ Ensure all referenced configs exist in system/models/
3. ✅ Update any hardcoded references in code
4. ✅ Test each template with new model assignment
5. ✅ Monitor execution logs for improvements
6. ✅ Measure token usage and cost changes

