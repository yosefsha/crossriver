#!/bin/bash

# Comprehensive Test Suite for Multi-Agent Orchestrator
# Step 8: Test Multi-Agent Conversations

echo "🧪 Starting Orchestrator Test Suite..."
echo "=================================="

# Change to server directory
cd "$(dirname "$0")/../../../"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js dependencies are installed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "Node modules not found. Installing dependencies..."
    npm install
fi

# Run individual test suites
print_status "Running Unit Tests..."
echo "------------------------"

print_status "1. Query Analysis Service Tests"
npm test -- --testPathPattern=query-analysis.service.spec.ts --verbose

print_status "2. Confidence Scoring Service Tests"
npm test -- --testPathPattern=confidence-scoring.service.spec.ts --verbose

print_status "3. Session Management Service Tests"
npm test -- --testPathPattern=session-management.service.spec.ts --verbose

print_status "4. Integration Tests"
npm test -- --testPathPattern=orchestrator.integration.spec.ts --verbose

print_status "5. End-to-End API Tests"
npm test -- --testPathPattern=orchestrator.e2e.spec.ts --verbose

print_status "6. Performance Tests"
npm test -- --testPathPattern=orchestrator.performance.spec.ts --verbose

# Run all orchestrator tests together
print_status "Running Complete Orchestrator Test Suite..."
echo "--------------------------------------------"
npm test -- --testPathPattern=src/orchestrator/tests --coverage --verbose

# Generate test report
print_status "Generating Test Coverage Report..."
npm test -- --testPathPattern=src/orchestrator/tests --coverage --coverageReporters=html --coverageDirectory=coverage/orchestrator

# Summary
echo ""
echo "🎯 Test Suite Complete!"
echo "======================="
print_success "All orchestrator tests have been executed."
print_status "Coverage report available in: coverage/orchestrator/index.html"
print_status "View detailed results in the terminal output above."

# Performance summary
echo ""
echo "📊 Test Summary:"
echo "- Unit Tests: Query Analysis, Confidence Scoring, Session Management"
echo "- Integration Tests: End-to-End orchestration workflow"
echo "- API Tests: Complete REST endpoint validation"
echo "- Performance Tests: Throughput, memory management, error recovery"
echo ""
print_success "Multi-Agent Orchestrator testing complete! ✅"