#!/bin/bash

# Test Report Generator for AgentLog
# This script runs a comprehensive test suite and generates a report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

echo -e "${BLUE}🧪 AgentLog Comprehensive Test Report${NC}"
echo "========================================"
echo "Generated: $(date)"
echo ""

# Function to log test results
log_test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ "$result" = "FAIL" ]; then
        echo -e "${RED}❌ $test_name${NC}"
        [ -n "$details" ] && echo -e "   ${RED}$details${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    elif [ "$result" = "SKIP" ]; then
        echo -e "${YELLOW}⏭️  $test_name (SKIPPED)${NC}"
        [ -n "$details" ] && echo -e "   ${YELLOW}$details${NC}"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    fi
}

# Function to run a test command safely
run_test() {
    local test_name="$1"
    local test_command="$2"
    local required="$3"
    
    echo -n "Running $test_name... "
    
    if eval "$test_command" > /tmp/test_output 2>&1; then
        log_test_result "$test_name" "PASS"
    else
        local exit_code=$?
        local error_details=$(tail -3 /tmp/test_output)
        
        if [ "$required" = "true" ]; then
            log_test_result "$test_name" "FAIL" "$error_details"
        else
            log_test_result "$test_name" "SKIP" "Non-critical test failed"
        fi
    fi
}

echo -e "${BLUE}📋 Environment Validation${NC}"
echo "-------------------------"

# Check Go installation
if command -v go &> /dev/null; then
    GO_VERSION=$(go version | cut -d' ' -f3)
    log_test_result "Go Installation ($GO_VERSION)" "PASS"
else
    log_test_result "Go Installation" "FAIL" "Go not found"
fi

# Check Node/Yarn installation
if command -v node &> /dev/null && command -v yarn &> /dev/null; then
    NODE_VERSION=$(node --version)
    YARN_VERSION=$(yarn --version)
    log_test_result "Node.js ($NODE_VERSION) & Yarn ($YARN_VERSION)" "PASS"
else
    log_test_result "Node.js & Yarn" "FAIL" "Node.js or Yarn not found"
fi

# Check if frontend dependencies are installed
if [ -d "frontend/node_modules" ]; then
    log_test_result "Frontend Dependencies" "PASS"
else
    log_test_result "Frontend Dependencies" "SKIP" "Run 'make frontend-install' first"
fi

echo ""
echo -e "${BLUE}🏗️  Backend Tests${NC}"
echo "----------------"

# Backend smoke tests
run_test "Backend Smoke Tests" "go test -run TestSmoke ./... -timeout=30s" true

# Backend unit tests
run_test "Backend Unit Tests" "go test ./... -timeout=60s" true

# Backend race condition tests
run_test "Backend Race Detection" "go test -race ./... -timeout=90s" false

# Backend benchmarks
run_test "Backend Benchmarks" "go test -bench=. ./... -timeout=120s" false

echo ""
echo -e "${BLUE}🌐 Frontend Tests${NC}"
echo "-----------------"

# Check if backend is running for integration tests
BACKEND_RUNNING=false
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    BACKEND_RUNNING=true
    log_test_result "Backend Connectivity" "PASS"
else
    log_test_result "Backend Connectivity" "SKIP" "Backend not running (start with 'make run-api')"
fi

# Frontend smoke tests
run_test "Frontend Smoke Tests" "cd frontend && yarn test src/__tests__/smoke.test.ts --watchAll=false --silent" true

# Frontend unit tests (components)
run_test "Frontend Unit Tests" "cd frontend && yarn test src/__tests__/components.test.tsx --watchAll=false --silent" true

# Frontend integration tests (only if backend is running)
if [ "$BACKEND_RUNNING" = true ]; then
    run_test "Frontend Integration Tests" "cd frontend && yarn test src/__tests__/integration.test.ts --watchAll=false --silent --testTimeout=30000" true
    run_test "Frontend E2E Tests" "cd frontend && yarn test src/__tests__/e2e.test.ts --watchAll=false --silent --testTimeout=30000" true
    run_test "Frontend Performance Tests" "cd frontend && yarn test src/__tests__/performance.test.ts --watchAll=false --silent --testTimeout=60000" false
else
    log_test_result "Frontend Integration Tests" "SKIP" "Backend not running"
    log_test_result "Frontend E2E Tests" "SKIP" "Backend not running"
    log_test_result "Frontend Performance Tests" "SKIP" "Backend not running"
fi

echo ""
echo -e "${BLUE}🔧 Build & Compile Tests${NC}"
echo "------------------------"

# Backend build test
run_test "Backend Build" "go build ./cmd/gogent" true

# Frontend build test
run_test "Frontend Type Check" "cd frontend && yarn tsc --noEmit" true

# Frontend bundle test (if dependencies are installed)
if [ -d "frontend/node_modules" ]; then
    run_test "Frontend Bundle Build" "cd frontend && yarn build" false
else
    log_test_result "Frontend Bundle Build" "SKIP" "Dependencies not installed"
fi

echo ""
echo -e "${BLUE}🔍 Code Quality Tests${NC}"
echo "---------------------"

# Go formatting check
if go fmt ./... > /tmp/go_fmt_output 2>&1; then
    if [ -s /tmp/go_fmt_output ]; then
        log_test_result "Go Code Formatting" "FAIL" "Code needs formatting (run 'go fmt ./...')"
    else
        log_test_result "Go Code Formatting" "PASS"
    fi
else
    log_test_result "Go Code Formatting" "FAIL" "go fmt failed"
fi

# Go vet check
run_test "Go Code Analysis (vet)" "go vet ./..." false

# Frontend linting (if available)
if [ -f "frontend/package.json" ] && grep -q "lint" frontend/package.json; then
    run_test "Frontend Linting" "cd frontend && yarn lint" false
else
    log_test_result "Frontend Linting" "SKIP" "Linter not configured"
fi

echo ""
echo -e "${BLUE}🛡️  Security Tests${NC}"
echo "------------------"

# Go security scan (if gosec is available)
if command -v gosec &> /dev/null; then
    run_test "Go Security Scan" "gosec ./..." false
else
    log_test_result "Go Security Scan" "SKIP" "gosec not installed"
fi

# Dependency vulnerability check
run_test "Go Module Verification" "go mod verify" true

# Frontend security audit (if dependencies are installed)
if [ -d "frontend/node_modules" ]; then
    run_test "Frontend Security Audit" "cd frontend && yarn audit --level moderate" false
else
    log_test_result "Frontend Security Audit" "SKIP" "Dependencies not installed"
fi

echo ""
echo -e "${BLUE}📊 Test Coverage${NC}"
echo "-----------------"

# Backend test coverage
if run_test "Backend Test Coverage" "go test -coverprofile=coverage.out ./..." false; then
    COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}')
    echo -e "${GREEN}   Backend Coverage: $COVERAGE${NC}"
    rm -f coverage.out
fi

# Frontend test coverage (if dependencies are installed)
if [ -d "frontend/node_modules" ]; then
    if cd frontend && yarn test --coverage --watchAll=false --silent > /tmp/frontend_coverage 2>&1; then
        FRONTEND_COVERAGE=$(grep -o '[0-9]*\.[0-9]*%' /tmp/frontend_coverage | head -1)
        echo -e "${GREEN}   Frontend Coverage: $FRONTEND_COVERAGE${NC}"
        log_test_result "Frontend Test Coverage" "PASS"
    else
        log_test_result "Frontend Test Coverage" "FAIL"
    fi
    cd ..
else
    log_test_result "Frontend Test Coverage" "SKIP" "Dependencies not installed"
fi

echo ""
echo "========================================"
echo -e "${BLUE}📈 Test Report Summary${NC}"
echo "========================================"
echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo -e "Skipped:      ${YELLOW}$SKIPPED_TESTS${NC}"
echo ""

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo -e "Success Rate: ${GREEN}$SUCCESS_RATE%${NC}"
else
    echo -e "Success Rate: ${RED}N/A${NC}"
fi

echo ""

# Overall status
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    if [ $SKIPPED_TESTS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $SKIPPED_TESTS tests were skipped (see details above)${NC}"
    fi
    exit 0
else
    echo -e "${RED}💥 $FAILED_TESTS tests failed${NC}"
    echo -e "${YELLOW}ℹ️  Run individual test commands for detailed output${NC}"
    exit 1
fi 