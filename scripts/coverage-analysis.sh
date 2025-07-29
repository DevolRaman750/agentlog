#!/bin/bash

# Coverage Analysis Script for GoGent
# Analyzes both backend (Go) and frontend (React Native TypeScript) coverage
# Identifies gaps and generates unified reports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_COVERAGE_FILE="coverage.out"
BACKEND_COVERAGE_HTML="coverage.html"
BACKEND_COVERAGE_JSON="backend-coverage.json"
FRONTEND_COVERAGE_DIR="frontend/coverage"
FRONTEND_COVERAGE_JSON="frontend/coverage/coverage-final.json"
REPORTS_DIR="coverage-reports"
UNIFIED_REPORT="$REPORTS_DIR/unified-coverage-report.html"
GAPS_REPORT="$REPORTS_DIR/coverage-gaps.txt"
SUMMARY_REPORT="$REPORTS_DIR/coverage-summary.json"

# Minimum coverage thresholds
MIN_BACKEND_COVERAGE=80
MIN_FRONTEND_COVERAGE=80
MIN_OVERALL_COVERAGE=80

echo -e "${CYAN}🔍 GoGent Coverage Analysis${NC}"
echo -e "${CYAN}=============================${NC}"

# Create reports directory
mkdir -p "$REPORTS_DIR"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Go coverage tools if needed
install_go_coverage_tools() {
    echo -e "${BLUE}📦 Installing Go coverage tools...${NC}"
    
    if ! command_exists gocov; then
        echo "Installing gocov..."
        go install github.com/axw/gocov/gocov@latest
    fi
    
    # Note: We only need gocov for JSON conversion, the built-in go tool cover handles HTML
    echo -e "${GREEN}✅ Go coverage tools ready${NC}"
}

# Function to run backend coverage
run_backend_coverage() {
    echo -e "${BLUE}🧪 Running backend coverage analysis...${NC}"
    
    # Clean previous coverage files
    rm -f $BACKEND_COVERAGE_FILE $BACKEND_COVERAGE_HTML $BACKEND_COVERAGE_JSON
    
    # Run tests with coverage (continue even if some tests fail)
    echo "Running Go tests with coverage..."
    go test -coverprofile=$BACKEND_COVERAGE_FILE -covermode=atomic ./... || echo "⚠️  Some Go tests failed, but coverage data was generated"
    
    if [ ! -f "$BACKEND_COVERAGE_FILE" ]; then
        echo -e "${RED}❌ Failed to generate backend coverage file${NC}"
        return 1
    fi
    
    # Generate HTML report
    go tool cover -html=$BACKEND_COVERAGE_FILE -o $BACKEND_COVERAGE_HTML
    
    # Generate JSON report using gocov
    if command_exists gocov; then
        gocov convert $BACKEND_COVERAGE_FILE > $BACKEND_COVERAGE_JSON
    fi
    
    # Calculate coverage percentage
    BACKEND_COVERAGE=$(go tool cover -func=$BACKEND_COVERAGE_FILE | grep "total:" | awk '{print $3}' | sed 's/%//')
    
    echo -e "${GREEN}✅ Backend coverage: ${BACKEND_COVERAGE}%${NC}"
    
    # Check if coverage meets threshold
    if (( $(echo "$BACKEND_COVERAGE < $MIN_BACKEND_COVERAGE" | bc -l) )); then
        echo -e "${YELLOW}⚠️  Backend coverage (${BACKEND_COVERAGE}%) is below threshold (${MIN_BACKEND_COVERAGE}%)${NC}"
    fi
}

# Function to run frontend coverage
run_frontend_coverage() {
    echo -e "${BLUE}🧪 Running frontend coverage analysis...${NC}"
    
    # Clean previous coverage files
    rm -rf "$FRONTEND_COVERAGE_DIR"
    
    # Run tests with coverage (continue even if tests fail, we still get coverage data)
    echo "Running React Native tests with coverage..."
    cd frontend
    yarn test --coverage --watchAll=false --coverageReporters=json --coverageReporters=json-summary --coverageReporters=html --coverageReporters=text --coverageReporters=lcov --coverageDirectory=coverage || echo "⚠️  Some tests failed, but coverage data was generated"
    cd ..
    
    if [ ! -f "$FRONTEND_COVERAGE_JSON" ]; then
        echo -e "${RED}❌ Failed to generate frontend coverage file${NC}"
        return 1
    fi
    
    # Extract coverage percentage from Jest coverage report
    if [ -f "$FRONTEND_COVERAGE_DIR/coverage-summary.json" ]; then
        FRONTEND_COVERAGE=$(node -p "
            const coverage = require('./$FRONTEND_COVERAGE_DIR/coverage-summary.json');
            coverage.total.lines.pct;
        ")
        echo -e "${GREEN}✅ Frontend coverage: ${FRONTEND_COVERAGE}%${NC}"
        
        # Check if coverage meets threshold
        if (( $(echo "$FRONTEND_COVERAGE < $MIN_FRONTEND_COVERAGE" | bc -l) )); then
            echo -e "${YELLOW}⚠️  Frontend coverage (${FRONTEND_COVERAGE}%) is below threshold (${MIN_FRONTEND_COVERAGE}%)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Could not extract frontend coverage percentage${NC}"
        FRONTEND_COVERAGE="N/A"
    fi
}

# Function to analyze coverage gaps
analyze_coverage_gaps() {
    echo -e "${BLUE}🔍 Analyzing coverage gaps...${NC}"
    
    # Initialize gaps report
    cat > "$GAPS_REPORT" << EOF
GoGent Coverage Gaps Analysis
==============================
Generated: $(date)

EOF

    # Backend gaps analysis
    if [ -f "$BACKEND_COVERAGE_FILE" ]; then
        echo "Backend Coverage Gaps:" >> "$GAPS_REPORT"
        echo "=====================" >> "$GAPS_REPORT"
        
        # Find uncovered files and low coverage areas
        go tool cover -func=$BACKEND_COVERAGE_FILE | while read line; do
            if echo "$line" | grep -E "(0\.0%|[0-4]\.[0-9]%)" >/dev/null; then
                echo "❌ $line" >> "$GAPS_REPORT"
            elif echo "$line" | grep -E "([5-6][0-9]\.[0-9]%)" >/dev/null; then
                echo "⚠️  $line" >> "$GAPS_REPORT"
            fi
        done
        
        echo "" >> "$GAPS_REPORT"
        
        # List uncovered lines for each file
        echo "Detailed Uncovered Areas:" >> "$GAPS_REPORT"
        echo "========================" >> "$GAPS_REPORT"
        
        # Extract uncovered lines using go tool cover
        go tool cover -func=$BACKEND_COVERAGE_FILE | grep -v "total:" | while read line; do
            file=$(echo "$line" | awk '{print $1}')
            coverage=$(echo "$line" | awk '{print $3}' | sed 's/%//')
            
            if (( $(echo "$coverage < 70" | bc -l) )); then
                echo "File: $file (${coverage}% coverage)" >> "$GAPS_REPORT"
                
                # Note: Removed automatic HTML generation that previously opened a browser window.
                # go tool cover -html=$BACKEND_COVERAGE_FILE >/dev/null 2>&1 || true
                # Generating detailed uncovered areas will be handled by the main coverage HTML file.
            fi
        done
    fi
    
    # Frontend gaps analysis
    if [ -f "$FRONTEND_COVERAGE_JSON" ]; then
        echo "" >> "$GAPS_REPORT"
        echo "Frontend Coverage Gaps:" >> "$GAPS_REPORT"
        echo "======================" >> "$GAPS_REPORT"
        
        # Use Node.js to parse JSON and find gaps
        node << 'EOF' >> "$GAPS_REPORT"
const fs = require('fs');
const coverage = JSON.parse(fs.readFileSync('frontend/coverage/coverage-final.json', 'utf8'));

Object.keys(coverage).forEach(file => {
    const fileCoverage = coverage[file];
    const statements = fileCoverage.s;
    const functions = fileCoverage.f;
    const branches = fileCoverage.b;
    
    // Calculate coverage percentages
    const statementHits = Object.values(statements).filter(count => count > 0).length;
    const statementTotal = Object.values(statements).length;
    const statementPct = statementTotal > 0 ? (statementHits / statementTotal * 100).toFixed(1) : 100;
    
    const functionHits = Object.values(functions).filter(count => count > 0).length;
    const functionTotal = Object.values(functions).length;
    const functionPct = functionTotal > 0 ? (functionHits / functionTotal * 100).toFixed(1) : 100;
    
    if (statementPct < 70) {
        console.log(`❌ ${file.replace(process.cwd() + '/frontend/', '')}: ${statementPct}% statements, ${functionPct}% functions`);
        
        // Find uncovered lines
        const uncoveredLines = [];
        Object.keys(statements).forEach(line => {
            if (statements[line] === 0) {
                uncoveredLines.push(line);
            }
        });
        
        if (uncoveredLines.length > 0) {
            console.log(`   Uncovered lines: ${uncoveredLines.slice(0, 10).join(', ')}${uncoveredLines.length > 10 ? '...' : ''}`);
        }
        console.log('');
    } else if (statementPct < 80) {
        console.log(`⚠️  ${file.replace(process.cwd() + '/frontend/', '')}: ${statementPct}% statements, ${functionPct}% functions`);
    }
});
EOF
    fi
    
    echo -e "${GREEN}✅ Coverage gaps analysis saved to: ${GAPS_REPORT}${NC}"
}

# Function to generate unified coverage report
generate_unified_report() {
    echo -e "${BLUE}📊 Generating unified coverage report...${NC}"
    
    # Calculate overall coverage
    if [ "$BACKEND_COVERAGE" != "N/A" ] && [ "$FRONTEND_COVERAGE" != "N/A" ]; then
        OVERALL_COVERAGE=$(echo "scale=2; ($BACKEND_COVERAGE + $FRONTEND_COVERAGE) / 2" | bc)
    else
        OVERALL_COVERAGE="N/A"
    fi
    
    # Generate JSON summary
    cat > "$SUMMARY_REPORT" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "overall": {
        "coverage": "$OVERALL_COVERAGE",
        "threshold": $MIN_OVERALL_COVERAGE,
        "status": "$([ "$OVERALL_COVERAGE" != "N/A" ] && (( $(echo "$OVERALL_COVERAGE >= $MIN_OVERALL_COVERAGE" | bc -l) )) && echo "PASS" || echo "FAIL")"
    },
    "backend": {
        "coverage": "$BACKEND_COVERAGE",
        "threshold": $MIN_BACKEND_COVERAGE,
        "status": "$([ "$BACKEND_COVERAGE" != "N/A" ] && (( $(echo "$BACKEND_COVERAGE >= $MIN_BACKEND_COVERAGE" | bc -l) )) && echo "PASS" || echo "FAIL")"
    },
    "frontend": {
        "coverage": "$FRONTEND_COVERAGE",
        "threshold": $MIN_FRONTEND_COVERAGE,
        "status": "$([ "$FRONTEND_COVERAGE" != "N/A" ] && (( $(echo "$FRONTEND_COVERAGE >= $MIN_FRONTEND_COVERAGE" | bc -l) )) && echo "PASS" || echo "FAIL")"
    }
}
EOF

    # Generate HTML unified report
    cat > "$UNIFIED_REPORT" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>GoGent Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333; border-bottom: 2px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .metrics { display: flex; justify-content: space-around; margin: 30px 0; }
        .metric { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; min-width: 150px; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .warning { color: #ffc107; }
        .links { margin: 30px 0; text-align: center; }
        .links a { display: inline-block; margin: 0 10px; padding: 10px 20px; background: #007acc; color: white; text-decoration: none; border-radius: 5px; }
        .links a:hover { background: #0056b3; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 GoGent Coverage Report</h1>
            <p>Comprehensive test coverage analysis for backend and frontend</p>
        </div>
        
        <div class="metrics">
            <div class="metric">
                <h3>Overall Coverage</h3>
                <div class="value $([ "$OVERALL_COVERAGE" != "N/A" ] && (( $(echo "$OVERALL_COVERAGE >= $MIN_OVERALL_COVERAGE" | bc -l) )) && echo "pass" || echo "fail")">
                    ${OVERALL_COVERAGE}%
                </div>
                <div>Target: ${MIN_OVERALL_COVERAGE}%</div>
            </div>
            
            <div class="metric">
                <h3>Backend (Go)</h3>
                <div class="value $([ "$BACKEND_COVERAGE" != "N/A" ] && (( $(echo "$BACKEND_COVERAGE >= $MIN_BACKEND_COVERAGE" | bc -l) )) && echo "pass" || echo "fail")">
                    ${BACKEND_COVERAGE}%
                </div>
                <div>Target: ${MIN_BACKEND_COVERAGE}%</div>
            </div>
            
            <div class="metric">
                <h3>Frontend (TS)</h3>
                <div class="value $([ "$FRONTEND_COVERAGE" != "N/A" ] && (( $(echo "$FRONTEND_COVERAGE >= $MIN_FRONTEND_COVERAGE" | bc -l) )) && echo "pass" || echo "fail")">
                    ${FRONTEND_COVERAGE}%
                </div>
                <div>Target: ${MIN_FRONTEND_COVERAGE}%</div>
            </div>
        </div>
        
        <div class="links">
            <a href="../coverage.html">📊 Backend Coverage Details</a>
            <a href="../frontend/coverage/index.html">🌐 Frontend Coverage Details</a>
            <a href="coverage-gaps.txt">🔍 Coverage Gaps Report</a>
        </div>
        
        <div class="timestamp">
            Generated: $(date)
        </div>
    </div>
</body>
</html>
EOF

    echo -e "${GREEN}✅ Unified coverage report generated: ${UNIFIED_REPORT}${NC}"
}

# Function to display summary
display_summary() {
    echo ""
    echo -e "${CYAN}📋 Coverage Summary${NC}"
    echo -e "${CYAN}==================${NC}"
    echo -e "Backend Coverage:  ${BACKEND_COVERAGE}% $([ "$BACKEND_COVERAGE" != "N/A" ] && (( $(echo "$BACKEND_COVERAGE >= $MIN_BACKEND_COVERAGE" | bc -l) )) && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}")"
    echo -e "Frontend Coverage: ${FRONTEND_COVERAGE}% $([ "$FRONTEND_COVERAGE" != "N/A" ] && (( $(echo "$FRONTEND_COVERAGE >= $MIN_FRONTEND_COVERAGE" | bc -l) )) && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}")"
    echo -e "Overall Coverage:  ${OVERALL_COVERAGE}% $([ "$OVERALL_COVERAGE" != "N/A" ] && (( $(echo "$OVERALL_COVERAGE >= $MIN_OVERALL_COVERAGE" | bc -l) )) && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}")"
    echo ""
    echo -e "${PURPLE}📁 Generated Files:${NC}"
    echo -e "  📊 Unified Report: ${UNIFIED_REPORT}"
    echo -e "  🔍 Gaps Analysis:  ${GAPS_REPORT}"
    echo -e "  📋 JSON Summary:   ${SUMMARY_REPORT}"
    echo -e "  🌐 Backend HTML:   ${BACKEND_COVERAGE_HTML}"
    echo -e "  📱 Frontend HTML:  ${FRONTEND_COVERAGE_DIR}/index.html"
    echo ""
}

# Main execution
main() {
    # Check if bc is available for calculations
    if ! command_exists bc; then
        echo -e "${RED}❌ 'bc' command is required for coverage calculations. Please install it.${NC}"
        exit 1
    fi
    
    # Install Go coverage tools
    install_go_coverage_tools
    
    # Run backend coverage
    run_backend_coverage
    
    # Run frontend coverage
    run_frontend_coverage
    
    # Analyze coverage gaps
    analyze_coverage_gaps
    
    # Generate unified report
    generate_unified_report
    
    # Display summary
    display_summary
    
    # Exit with appropriate code
    if [ "$OVERALL_COVERAGE" != "N/A" ] && (( $(echo "$OVERALL_COVERAGE >= $MIN_OVERALL_COVERAGE" | bc -l) )); then
        echo -e "${GREEN}🎉 Coverage analysis completed successfully!${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Coverage analysis completed with warnings. Some thresholds not met.${NC}"
        exit 1
    fi
}

# Parse command line arguments
case "$1" in
    --backend-only)
        install_go_coverage_tools
        run_backend_coverage
        echo -e "${GREEN}✅ Backend coverage analysis completed${NC}"
        ;;
    --frontend-only)
        run_frontend_coverage
        echo -e "${GREEN}✅ Frontend coverage analysis completed${NC}"
        ;;
    --gaps-only)
        analyze_coverage_gaps
        echo -e "${GREEN}✅ Coverage gaps analysis completed${NC}"
        ;;
    --help)
        echo "Usage: $0 [--backend-only|--frontend-only|--gaps-only|--help]"
        echo ""
        echo "Options:"
        echo "  --backend-only   Run only backend coverage analysis"
        echo "  --frontend-only  Run only frontend coverage analysis"
        echo "  --gaps-only      Run only coverage gaps analysis"
        echo "  --help          Show this help message"
        echo ""
        echo "Default: Run complete coverage analysis"
        ;;
    *)
        main
        ;;
esac 