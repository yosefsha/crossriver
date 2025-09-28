# ADR 003: Dedicated Classification Agent vs Keyword Routing (2025-09-25)

## Status

Accepted

## Context

Our multi-agent system requires accurate routing of user queries to the appropriate specialized agent (Technical, Business, Creative, Data Science, Finance). Initially, we implemented a keyword/domain-based approach within our orchestrator, using pattern matching and domain-specific terms to route queries. However, this approach proved insufficient for nuanced queries that required deeper semantic understanding.

## Decision

Implement a dedicated classification agent in AWS Bedrock specifically trained for query classification and routing decisions, replacing the simpler keyword-based approach.

## Options Considered

1. **Enhanced Keyword/Pattern Matching**: Improve the existing keyword-based approach with more sophisticated pattern matching, regular expressions, and scoring algorithms.

2. **Machine Learning Classification Model**: Train and deploy a custom ML model for query classification, hosted separately.

3. **Dedicated AWS Bedrock Classification Agent**: Create a specialized Bedrock agent with structured JSON output for classification decisions.

4. **Integrated Classification with Specialist Agent**: Use the same agent for both classification and specialized responses, asking it to self-route.

## Decision Rationale

We chose the dedicated AWS Bedrock classification agent approach because:

- **Semantic Understanding**: Foundation models excel at understanding nuance and intent beyond keyword matching
- **Structured Output**: The classification agent returns standardized JSON with confidence scores and rationale
- **Cost Efficiency**: Classification agents use smaller, less expensive models than full specialist agents
- **Separation of Concerns**: Divides the routing logic from the specialist responses for better maintainability
- **Fallback Capability**: We maintained the keyword-based approach as a fallback when classification fails
- **Flexibility**: Updates to classification logic don't require code changes, only prompt engineering

## Technical Implementation

- Created a dedicated classification agent in AWS Bedrock (Agent ID: BZUOBKBE6S, Alias ID: IQZX8OVP9I)
- Implemented a `ClassificationService` to interface with the agent
- Designed the agent to return structured JSON with target specialist and confidence scores
- Added robust error handling and fallback to keyword-based classification
- Implemented content extraction for cases where the agent returns non-JSON responses
- Built comprehensive testing suite with real API integration tests

## Sample Classification Response Format

```json
{
  "needs_clarification": false,
  "question": "",
  "proposed_default": "",
  "target_specialist": "technical",
  "routing_confidence": 0.92,
  "rationale": "Concrete DevOps task with sufficient detail"
}
```

## Testing Results

Testing showed that the dedicated classification agent significantly outperforms the keyword-based approach:

- **Accuracy**: Classification agent correctly identified the specialist domain for 14/15 test cases (93% accuracy), compared to 10/15 (67%) with keyword matching
- **Confidence**: The agent provides meaningful confidence scores that align with routing certainty
- **Explainability**: The agent includes a rationale for its routing decision, increasing transparency
- **Edge Cases**: The agent handles ambiguous queries much better than our keyword approach

## Challenges and Solutions

- **JSON Format Consistency**: Initially, the agent sometimes returned natural language responses instead of JSON, which we solved with:
  1. Improved prompt engineering with strict format requirements
  2. Content extraction for non-JSON responses as a fallback mechanism

- **Latency**: Adding the classification step increased response time by ~300-500ms, which we deemed acceptable given the improved accuracy

## Trade-offs Accepted

- ❌ **Additional API Call**: Extra call to the classification agent before specialist agent
- ❌ **Complexity**: More complex system with additional service and error handling
- ❌ **Cost**: Additional API calls to Bedrock for classification
- ❌ **Latency**: Slight increase in response time due to the additional step

## Success Metrics

- Classification accuracy (target >90%)
- Routing confidence score distribution
- System fallback rate (how often keyword routing is used)
- End-to-end query response time

## Future Considerations

- Fine-tuning the classification model for even higher accuracy
- Caching classification results for similar queries
- Implementing more sophisticated confidence thresholds
- Adding real-time feedback mechanisms to improve classification over time