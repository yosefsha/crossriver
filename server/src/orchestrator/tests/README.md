# Multi-Agent Orchestrator Test Suite

## Overview

This comprehensive test suite validates the complete multi-agent orchestration system implemented in Step 8. The tests ensure that intelligent routing, conversation management, and system performance all work correctly.

## Test Structure

### 1. Unit Tests

#### Query Analysis Service (`query-analysis.service.spec.ts`)
- **Intent Classification**: Validates accurate identification of technical, financial, creative, business, and data science queries
- **Keyword Extraction**: Tests proper extraction and weighting of domain-specific keywords  
- **Domain Identification**: Ensures correct mapping of queries to specialist domains
- **Context Analysis**: Validates conversation context influence on routing decisions
- **Edge Cases**: Handles empty queries, long text, special characters, and multi-domain requests

#### Confidence Scoring Service (`confidence-scoring.service.spec.ts`)
- **Multi-Factor Scoring**: Tests the weighted algorithm (60% keywords, 20% domain, 20% context)
- **Agent Selection Logic**: Validates selection of highest confidence agent
- **Alternative Rankings**: Ensures proper ranking of alternative agents
- **Fallback Scenarios**: Tests behavior when confidence thresholds aren't met
- **Context Integration**: Validates how conversation history influences scoring

#### Session Management Service (`session-management.service.spec.ts`)
- **Session Lifecycle**: Tests creation, updates, and cleanup of conversation sessions
- **Conversation Tracking**: Validates proper storage and retrieval of conversation history
- **Statistics Calculation**: Tests session metrics like message count and agent switches
- **Context Management**: Ensures proper trimming and memory management
- **Cleanup Operations**: Validates automatic and manual session cleanup

### 2. Integration Tests

#### Orchestrator Integration (`orchestrator.integration.spec.ts`)
- **End-to-End Workflow**: Tests complete orchestration from query to response
- **Agent Switching**: Validates seamless transitions between different specialists
- **System Status**: Tests orchestrator health and availability monitoring
- **Performance Validation**: Ensures acceptable response times under load
- **Error Handling**: Tests graceful degradation and error recovery

### 3. End-to-End Tests

#### API Controller E2E (`orchestrator.e2e.spec.ts`)
- **Session Start Endpoint**: Tests `/orchestrator/session/start` with various inputs
- **Query Processing**: Validates `/orchestrator/query` for ongoing conversations
- **Status Monitoring**: Tests `/orchestrator/status` and system health endpoints
- **Session Statistics**: Validates `/orchestrator/session/:id/stats` endpoint
- **Session Management**: Tests session clearing and cleanup endpoints
- **Multi-Agent Flows**: End-to-end validation of cross-domain conversations

### 4. Performance Tests

#### Performance Validation (`orchestrator.performance.spec.ts`)
- **Query Analysis Speed**: Sub-100ms processing for individual queries
- **Batch Processing**: Efficient handling of multiple concurrent queries
- **Routing Decision Speed**: Sub-50ms confidence scoring and agent selection
- **Session Concurrency**: Support for 20+ concurrent sessions
- **Memory Efficiency**: Proper memory management with large conversation histories
- **Error Recovery**: Fast recovery from invalid inputs and edge cases

## Test Execution

### Run All Tests
```bash
# From server directory
./src/orchestrator/tests/run-tests.sh
```

### Run Individual Test Suites
```bash
# Unit tests
npm test -- --testPathPattern=query-analysis.service.spec.ts
npm test -- --testPathPattern=confidence-scoring.service.spec.ts
npm test -- --testPathPattern=session-management.service.spec.ts

# Integration tests
npm test -- --testPathPattern=orchestrator.integration.spec.ts

# E2E tests
npm test -- --testPathPattern=orchestrator.e2e.spec.ts

# Performance tests
npm test -- --testPathPattern=orchestrator.performance.spec.ts
```

### Generate Coverage Report
```bash
npm test -- --testPathPattern=src/orchestrator/tests --coverage
```

## Performance Benchmarks

### Expected Performance Metrics
- **Query Analysis**: < 100ms per query
- **Confidence Scoring**: < 50ms per decision
- **Session Creation**: < 25ms per session
- **Conversation Step**: < 5ms per step
- **Full Orchestration Cycle**: < 200ms (excluding Bedrock API call)
- **Concurrent Load**: 10+ requests simultaneously
- **Memory Usage**: < 50MB for 500 conversation steps

### Load Testing Scenarios
- **Burst Requests**: 10 concurrent queries processed efficiently
- **Long Sessions**: 500+ conversation steps with proper memory management
- **High Concurrency**: 50+ simultaneous sessions
- **Memory Pressure**: Efficient cleanup and garbage collection

## Test Coverage Goals

### Target Coverage Metrics
- **Line Coverage**: > 90%
- **Function Coverage**: > 95%
- **Branch Coverage**: > 85%
- **Statement Coverage**: > 90%

### Coverage Areas
- All service methods and edge cases
- Error handling and fallback scenarios
- Configuration validation
- Session lifecycle management
- Performance optimization paths

## Continuous Integration

### Test Automation
The test suite is designed to run in CI/CD pipelines with:
- Automated test execution on code changes
- Coverage reporting and trend analysis
- Performance regression detection
- Integration with deployment gates

### Test Results Interpretation
- **Green Tests**: All functionality working correctly
- **Yellow Warnings**: Performance within acceptable ranges but monitoring needed
- **Red Failures**: Critical issues requiring immediate attention

## Troubleshooting

### Common Test Issues
1. **Memory Tests Failing**: Check Node.js heap size settings
2. **Performance Tests Slow**: Verify system resources and concurrent processes
3. **E2E Tests Timeout**: Ensure test database/services are running
4. **Coverage Low**: Add tests for uncovered edge cases

### Debug Mode
```bash
# Run tests with verbose output
npm test -- --testPathPattern=src/orchestrator/tests --verbose

# Run single test for debugging
npm test -- --testPathPattern=query-analysis.service.spec.ts --detectOpenHandles
```

## Test Maintenance

### Adding New Tests
1. Follow existing test patterns and naming conventions
2. Include both positive and negative test cases
3. Add performance validations for new features
4. Update this documentation with new test scenarios

### Test Data Management
- Use factory functions for consistent test data
- Mock external dependencies (Bedrock API calls)
- Clean up test data after each test run
- Ensure tests are deterministic and repeatable

---

This comprehensive test suite validates that the multi-agent orchestrator correctly routes queries, manages conversations, and maintains high performance standards across all operational scenarios.