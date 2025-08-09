#!/bin/bash

# Agent Memory System Test Script
# This script tests the agent memory functions with sample data

set -e

echo "🧠 Testing Agent Memory System..."

# Configuration
BASE_URL="http://localhost:8080"
AGENT_ID="test-agent-1"  # Replace with actual agent ID

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to make API call
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    echo -e "${BLUE}→ $method $endpoint${NC}"
    if [ -n "$data" ]; then
        echo "  Data: $data"
    fi
    
    if [ -n "$data" ]; then
        curl -s -X $method \
             -H "Content-Type: application/json" \
             -d "$data" \
             "$BASE_URL$endpoint"
    else
        curl -s -X $method \
             -H "Content-Type: application/json" \
             "$BASE_URL$endpoint"
    fi
    echo
}

# Test 1: Write workflow memory
echo -e "${GREEN}Test 1: Writing workflow memory${NC}"
api_call POST "/api/agents/$AGENT_ID/memory/write" '{
  "agentId": "'$AGENT_ID'",
  "context": "workflow",
  "data": {
    "current_task": "data_analysis",
    "steps": ["collect", "clean", "analyze", "report"],
    "current_step": 2,
    "progress": 50,
    "config": {
      "method": "regression",
      "features": ["price", "location", "size"]
    }
  }
}'

echo -e "${GREEN}✓ Workflow memory written${NC}\n"

# Test 2: Write session memory
echo -e "${GREEN}Test 2: Writing session memory${NC}"
api_call POST "/api/agents/$AGENT_ID/memory/write" '{
  "agentId": "'$AGENT_ID'",
  "context": "session",
  "data": {
    "user_preferences": {
      "output_format": "detailed",
      "chart_type": "line",
      "language": "english"
    },
    "session_start": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }
}'

echo -e "${GREEN}✓ Session memory written${NC}\n"

# Test 3: Write persistent memory
echo -e "${GREEN}Test 3: Writing persistent memory${NC}"
api_call POST "/api/agents/$AGENT_ID/memory/write" '{
  "agentId": "'$AGENT_ID'",
  "context": "persistent",
  "data": {
    "learned_patterns": {
      "user_prefers_graphs": true,
      "best_analysis_method": "ensemble",
      "common_errors": ["timeout_on_large_datasets"]
    },
    "successful_configs": {
      "preprocessing": "standardization",
      "model_type": "linear_regression"
    }
  }
}'

echo -e "${GREEN}✓ Persistent memory written${NC}\n"

# Test 4: Read all memory
echo -e "${GREEN}Test 4: Reading all memory${NC}"
api_call GET "/api/agents/$AGENT_ID/memory/read?context=all"

echo -e "${GREEN}✓ All memory retrieved${NC}\n"

# Test 5: Read specific context
echo -e "${GREEN}Test 5: Reading workflow context${NC}"
api_call GET "/api/agents/$AGENT_ID/memory/read?context=workflow"

echo -e "${GREEN}✓ Workflow memory retrieved${NC}\n"

# Test 6: Search memory
echo -e "${GREEN}Test 6: Searching memory${NC}"
api_call POST "/api/agents/$AGENT_ID/memory/search" '{
  "agentId": "'$AGENT_ID'",
  "searchQuery": "analysis regression",
  "limit": 10
}'

echo -e "${GREEN}✓ Memory search completed${NC}\n"

# Test 7: Update specific path
echo -e "${GREEN}Test 7: Updating specific path${NC}"
api_call POST "/api/agents/$AGENT_ID/memory/write" '{
  "agentId": "'$AGENT_ID'",
  "context": "workflow",
  "path": "current_step",
  "data": 3
}'

echo -e "${GREEN}✓ Specific path updated${NC}\n"

# Test 8: Read updated memory
echo -e "${GREEN}Test 8: Verifying update${NC}"
api_call GET "/api/agents/$AGENT_ID/memory/read?context=workflow&path=current_step"

echo -e "${GREEN}✓ Update verified${NC}\n"

# Test 9: Clear session memory
echo -e "${GREEN}Test 9: Clearing session memory${NC}"
api_call POST "/api/agents/$AGENT_ID/memory/clear" '{
  "agentId": "'$AGENT_ID'",
  "context": "clear_context",
  "path": "session"
}'

echo -e "${GREEN}✓ Session memory cleared${NC}\n"

# Test 10: Verify session is cleared
echo -e "${GREEN}Test 10: Verifying session is cleared${NC}"
api_call GET "/api/agents/$AGENT_ID/memory/read?context=session"

echo -e "${GREEN}✓ Session cleared verification${NC}\n"

echo -e "${GREEN}🎉 All memory tests completed successfully!${NC}"
echo
echo "To use this script:"
echo "1. Make sure the backend server is running on localhost:8080"
echo "2. Replace AGENT_ID with an actual agent ID"
echo "3. Run: ./scripts/test-agent-memory.sh"
echo
echo "To view the memory in the frontend:"
echo "1. Go to the Agents screen"
echo "2. Click on an agent card"
echo "3. Click the 📚 (memory) button in the agent details"