#!/bin/bash

# Coverage Gaps Finder Script for GoGent
# Identifies specific uncovered code areas and provides actionable recommendations

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
FRONTEND_COVERAGE_JSON="frontend/coverage/coverage-final.json"
GAPS_SUMMARY="coverage-gaps-summary.md"

echo -e "${CYAN}🔍 GoGent Coverage Gaps Finder${NC}"
echo -e "${CYAN}===============================${NC}"

# Function to analyze backend gaps in detail
analyze_backend_gaps() {
    echo -e "${BLUE}🔍 Analyzing Go backend coverage gaps...${NC}"
    
    if [ ! -f "$BACKEND_COVERAGE_FILE" ]; then
        echo -e "${YELLOW}⚠️  Backend coverage file not found. Run 'make coverage' first.${NC}"
        return 1
    fi
    
    echo "## Backend Coverage Gaps" >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    
    # Find files with low coverage
    echo "### Files with Low Coverage (<70%)" >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    
    go tool cover -func=$BACKEND_COVERAGE_FILE | grep -v "total:" | while read line; do
        file=$(echo "$line" | awk '{print $1}')
        func=$(echo "$line" | awk '{print $2}')
        coverage=$(echo "$line" | awk '{print $3}' | sed 's/%//')
        
        if (( $(echo "$coverage < 70" | bc -l) )); then
            echo "- **$file::$func**: ${coverage}% coverage" >> "$GAPS_SUMMARY"
            
            # Provide recommendations based on file type
            if echo "$file" | grep -q "_test.go"; then
                echo "  - 📝 *Recommendation: Add more test cases for edge conditions*" >> "$GAPS_SUMMARY"
            elif echo "$file" | grep -q "handler"; then
                echo "  - 📝 *Recommendation: Add tests for HTTP error cases and validation*" >> "$GAPS_SUMMARY"
            elif echo "$file" | grep -q "auth"; then
                echo "  - 📝 *Recommendation: Test authentication failure scenarios*" >> "$GAPS_SUMMARY"
            elif echo "$file" | grep -q "db"; then
                echo "  - 📝 *Recommendation: Add database error handling tests*" >> "$GAPS_SUMMARY"
            else
                echo "  - 📝 *Recommendation: Add unit tests for this function*" >> "$GAPS_SUMMARY"
            fi
            echo "" >> "$GAPS_SUMMARY"
        fi
    done
    
    # Find completely uncovered functions
    echo "### Completely Uncovered Functions (0% coverage)" >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    
    go tool cover -func=$BACKEND_COVERAGE_FILE | grep "0.0%" | while read line; do
        file=$(echo "$line" | awk '{print $1}')
        func=$(echo "$line" | awk '{print $2}')
        echo "- **$file::$func** - No coverage" >> "$GAPS_SUMMARY"
        echo "  - 🚨 *Priority: HIGH - Function is completely untested*" >> "$GAPS_SUMMARY"
        echo "" >> "$GAPS_SUMMARY"
    done
}

# Function to analyze frontend gaps in detail
analyze_frontend_gaps() {
    echo -e "${BLUE}🔍 Analyzing React Native frontend coverage gaps...${NC}"
    
    if [ ! -f "$FRONTEND_COVERAGE_JSON" ]; then
        echo -e "${YELLOW}⚠️  Frontend coverage file not found. Run 'make coverage' first.${NC}"
        return 1
    fi
    
    echo "" >> "$GAPS_SUMMARY"
    echo "## Frontend Coverage Gaps" >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    
    # Use Node.js to analyze detailed frontend gaps
    node << 'EOF' >> "$GAPS_SUMMARY"
const fs = require('fs');
const path = require('path');

try {
    const coverage = JSON.parse(fs.readFileSync('frontend/coverage/coverage-final.json', 'utf8'));
    
    console.log('### Files with Low Coverage (<70%)');
    console.log('');
    
    const lowCoverageFiles = [];
    const uncoveredFiles = [];
    
    Object.keys(coverage).forEach(file => {
        const fileCoverage = coverage[file];
        const statements = fileCoverage.s;
        const functions = fileCoverage.f;
        const branches = fileCoverage.b;
        
        // Calculate coverage percentages
        const statementHits = Object.values(statements).filter(count => count > 0).length;
        const statementTotal = Object.values(statements).length;
        const statementPct = statementTotal > 0 ? (statementHits / statementTotal * 100) : 100;
        
        const functionHits = Object.values(functions).filter(count => count > 0).length;
        const functionTotal = Object.values(functions).length;
        const functionPct = functionTotal > 0 ? (functionHits / functionTotal * 100) : 100;
        
        const branchHits = Object.values(branches).flat().filter(count => count > 0).length;
        const branchTotal = Object.values(branches).flat().length;
        const branchPct = branchTotal > 0 ? (branchHits / branchTotal * 100) : 100;
        
        const fileName = file.replace(process.cwd() + '/frontend/', '');
        
        if (statementPct === 0) {
            uncoveredFiles.push({
                file: fileName,
                statements: statementPct,
                functions: functionPct,
                branches: branchPct
            });
        } else if (statementPct < 70) {
            lowCoverageFiles.push({
                file: fileName,
                statements: statementPct,
                functions: functionPct,
                branches: branchPct
            });
            
            // Find uncovered lines
            const uncoveredLines = [];
            Object.keys(statements).forEach(line => {
                if (statements[line] === 0) {
                    uncoveredLines.push(line);
                }
            });
            
            console.log(`- **${fileName}**: ${statementPct.toFixed(1)}% statements, ${functionPct.toFixed(1)}% functions, ${branchPct.toFixed(1)}% branches`);
            
            // Provide recommendations based on file type
            if (fileName.includes('Screen')) {
                console.log('  - 📝 *Recommendation: Add tests for user interactions and navigation*');
            } else if (fileName.includes('component') || fileName.includes('Component')) {
                console.log('  - 📝 *Recommendation: Test component props and state changes*');
            } else if (fileName.includes('context') || fileName.includes('Context')) {
                console.log('  - 📝 *Recommendation: Test context provider and consumer scenarios*');
            } else if (fileName.includes('api') || fileName.includes('client')) {
                console.log('  - 📝 *Recommendation: Mock API calls and test error handling*');
            } else if (fileName.includes('utils') || fileName.includes('helper')) {
                console.log('  - 📝 *Recommendation: Add unit tests for utility functions*');
            } else {
                console.log('  - 📝 *Recommendation: Add comprehensive tests for this module*');
            }
            
            if (uncoveredLines.length > 0) {
                console.log(`  - 🔍 *Uncovered lines: ${uncoveredLines.slice(0, 5).join(', ')}${uncoveredLines.length > 5 ? '...' : ''}*`);
            }
            console.log('');
        }
    });
    
    console.log('');
    console.log('### Completely Uncovered Files (0% coverage)');
    console.log('');
    
    uncoveredFiles.forEach(item => {
        console.log(`- **${item.file}** - No coverage`);
        console.log('  - 🚨 *Priority: HIGH - File is completely untested*');
        
        // Provide specific recommendations based on file type
        if (item.file.includes('Screen')) {
            console.log('  - 📝 *Recommendation: Create integration tests for screen functionality*');
        } else if (item.file.includes('component') || item.file.includes('Component')) {
            console.log('  - 📝 *Recommendation: Add React component tests with @testing-library/react-native*');
        } else if (item.file.includes('hook')) {
            console.log('  - 📝 *Recommendation: Test custom hook behavior with @testing-library/react-hooks*');
        } else {
            console.log('  - 📝 *Recommendation: Create unit tests for this module*');
        }
        console.log('');
    });
    
    // Provide test file suggestions
    console.log('');
    console.log('### Suggested Test Files to Create');
    console.log('');
    
    [...lowCoverageFiles, ...uncoveredFiles].forEach(item => {
        const testFile = item.file
            .replace(/\.(ts|tsx|js|jsx)$/, '.test.$1')
            .replace('src/', 'src/__tests__/');
        console.log(`- \`${testFile}\` for \`${item.file}\``);
    });
    
} catch (error) {
    console.log('Error analyzing frontend coverage:', error.message);
}
EOF
}

# Function to generate actionable recommendations
generate_recommendations() {
    echo "" >> "$GAPS_SUMMARY"
    echo "## 🎯 Actionable Recommendations" >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    
    echo "### Immediate Actions (High Priority)" >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    echo "1. **Focus on 0% coverage files** - These represent the highest risk" >> "$GAPS_SUMMARY"
    echo "2. **Add error handling tests** - Often the most uncovered code paths" >> "$GAPS_SUMMARY"
    echo "3. **Test edge cases** - Boundary conditions and error scenarios" >> "$GAPS_SUMMARY"
    echo "4. **Mock external dependencies** - Ensure isolated unit tests" >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    
    echo "### Test Strategy by Component Type" >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    echo "#### Backend (Go)" >> "$GAPS_SUMMARY"
    echo "- **Handlers**: Test HTTP status codes, validation, authentication" >> "$GAPS_SUMMARY"
    echo "- **Database**: Test CRUD operations, constraints, transactions" >> "$GAPS_SUMMARY"
    echo "- **Auth**: Test token validation, permissions, session management" >> "$GAPS_SUMMARY"
    echo "- **Utils**: Test data transformation, validation functions" >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    
    echo "#### Frontend (React Native)" >> "$GAPS_SUMMARY"
    echo "- **Screens**: Test navigation, user interactions, data loading" >> "$GAPS_SUMMARY"
    echo "- **Components**: Test props, state changes, event handlers" >> "$GAPS_SUMMARY"
    echo "- **Contexts**: Test provider/consumer patterns, state updates" >> "$GAPS_SUMMARY"
    echo "- **API Client**: Test request/response handling, error scenarios" >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    
    echo "### Sample Test Commands" >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    echo "\`\`\`bash" >> "$GAPS_SUMMARY"
    echo "# Run backend tests for specific package" >> "$GAPS_SUMMARY"
    echo "go test -coverprofile=coverage.out ./internal/auth/..." >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    echo "# Run frontend tests for specific component" >> "$GAPS_SUMMARY"
    echo "cd frontend && yarn test src/components/MyComponent.test.tsx" >> "$GAPS_SUMMARY"
    echo "" >> "$GAPS_SUMMARY"
    echo "# Watch mode for TDD" >> "$GAPS_SUMMARY"
    echo "cd frontend && yarn test --watch src/components/" >> "$GAPS_SUMMARY"
    echo "\`\`\`" >> "$GAPS_SUMMARY"
}

# Function to create test templates
create_test_templates() {
    echo -e "${BLUE}📝 Creating test templates...${NC}"
    
    mkdir -p "test-templates"
    
    # Go test template
    cat > "test-templates/go-test-template.go" << 'EOF'
package packagename

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

func TestFunctionName(t *testing.T) {
    tests := []struct {
        name     string
        input    InputType
        expected OutputType
        wantErr  bool
    }{
        {
            name:     "valid input",
            input:    validInput,
            expected: expectedOutput,
            wantErr:  false,
        },
        {
            name:     "invalid input",
            input:    invalidInput,
            expected: OutputType{},
            wantErr:  true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := FunctionName(tt.input)
            
            if tt.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
                assert.Equal(t, tt.expected, result)
            }
        })
    }
}
EOF

    # React Native test template
    cat > "test-templates/react-native-test-template.test.tsx" << 'EOF'
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MyComponent } from '../MyComponent';

// Mock dependencies
jest.mock('../dependency', () => ({
    useDependency: () => ({ data: 'mock data' }),
}));

describe('MyComponent', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correctly with default props', () => {
        const { getByTestId } = render(<MyComponent />);
        
        expect(getByTestId('my-component')).toBeTruthy();
    });

    it('should handle user interactions', async () => {
        const mockOnPress = jest.fn();
        const { getByTestId } = render(
            <MyComponent onPress={mockOnPress} />
        );
        
        fireEvent.press(getByTestId('button'));
        
        await waitFor(() => {
            expect(mockOnPress).toHaveBeenCalledTimes(1);
        });
    });

    it('should handle error states', () => {
        const { getByText } = render(
            <MyComponent hasError={true} />
        );
        
        expect(getByText('Error message')).toBeTruthy();
    });
});
EOF

    echo -e "${GREEN}✅ Test templates created in test-templates/${NC}"
}

# Main execution
main() {
    # Initialize gaps summary
    cat > "$GAPS_SUMMARY" << EOF
# GoGent Coverage Gaps Analysis

Generated: $(date)

This report identifies specific areas in the codebase that lack test coverage and provides actionable recommendations for improving coverage.

EOF

    # Analyze gaps
    analyze_backend_gaps
    analyze_frontend_gaps
    
    # Generate recommendations
    generate_recommendations
    
    # Create test templates
    create_test_templates
    
    echo -e "${GREEN}✅ Coverage gaps analysis completed!${NC}"
    echo -e "${CYAN}📋 Report saved to: ${GAPS_SUMMARY}${NC}"
    echo -e "${CYAN}📁 Test templates available in: test-templates/${NC}"
    echo ""
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo -e "  1. Review the gaps summary: cat ${GAPS_SUMMARY}"
    echo -e "  2. Use test templates to create missing tests"
    echo -e "  3. Run 'make coverage' to verify improvements"
}

# Parse command line arguments
case "$1" in
    --backend-only)
        analyze_backend_gaps
        echo -e "${GREEN}✅ Backend gaps analysis completed${NC}"
        ;;
    --frontend-only)
        analyze_frontend_gaps
        echo -e "${GREEN}✅ Frontend gaps analysis completed${NC}"
        ;;
    --templates-only)
        create_test_templates
        echo -e "${GREEN}✅ Test templates created${NC}"
        ;;
    --help)
        echo "Usage: $0 [--backend-only|--frontend-only|--templates-only|--help]"
        echo ""
        echo "Options:"
        echo "  --backend-only    Analyze only backend coverage gaps"
        echo "  --frontend-only   Analyze only frontend coverage gaps"
        echo "  --templates-only  Create test templates only"
        echo "  --help           Show this help message"
        echo ""
        echo "Default: Run complete gaps analysis"
        ;;
    *)
        main
        ;;
esac 