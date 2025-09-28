# Agent Router Service

A NestJS microservice that provides a REST API interface for Amazon Bedrock Agent interactions.

## Features

- 🤖 **Agent Management**: List and retrieve Bedrock agent details
- 💬 **Conversational AI**: Start and maintain chat sessions with agents
- 🔄 **Session Management**: Handle conversation continuity
- 📚 **API Documentation**: Swagger/OpenAPI documentation
- 🛡️ **Validation**: Request/response validation with class-validator
- 🏥 **Health Checks**: Service health monitoring endpoints

## API Endpoints

### Health Endpoints
- `GET /` - Basic health check
- `GET /health` - Detailed health status

### Agent Endpoints
- `GET /agents` - List all available Bedrock agents
- `GET /agents/:agentId` - Get specific agent details
- `POST /agents/:agentId/:agentAliasId/start-session` - Start new conversation
- `POST /agents/:agentId/:agentAliasId/chat` - Send message to agent

## Environment Variables

```bash
NODE_ENV=development
PORT=3002
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SESSION_TOKEN=your-session-token  # Optional
```

## Usage Examples

### List all agents
```bash
curl http://localhost/agents
```

### Start a conversation
```bash
curl -X POST http://localhost/agents/YOUR_AGENT_ID/YOUR_ALIAS_ID/start-session \
  -H "Content-Type: application/json" \
  -d '{"initialMessage": "Hello, how can you help me?"}'
```

### Continue conversation
```bash
curl -X POST http://localhost/agents/YOUR_AGENT_ID/YOUR_ALIAS_ID/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about AWS services",
    "sessionId": "session-1234567890-abc123"
  }'
```

## Docker Integration

The service is integrated into the main Docker Compose stack:

- **Service Name**: `agentrouter`
- **Internal Port**: 3002
- **External Route**: `http://localhost/agents/*` (via Traefik)
- **Documentation**: `http://localhost/agents/api/docs`

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

## API Documentation

Swagger documentation is available at `/api/docs` when the service is running.

## Architecture

- **BedrockService**: AWS SDK integration for Bedrock Agent operations
- **AgentService**: Business logic layer for agent interactions
- **OrchestratorService**: Intelligent routing of user queries to specialized agents
- **ClassificationService**: Dedicated classification for query intent analysis
- **AgentController**: REST API endpoints and validation
- **DTOs**: Request/response data transfer objects with validation

## Classification System

The service uses a dedicated AWS Bedrock classification agent to intelligently route user queries to specialized domain experts:

- **Technical Specialist**: Programming, DevOps, architecture, infrastructure
- **Business Analyst**: Strategy, ROI, project management, market analysis
- **Creative Specialist**: Content, marketing, design, copywriting
- **Data Scientist**: ML, analytics, statistics, experiments
- **Financial Analyst**: Finance, investments, valuation, accounting

### Classification Agent

- **Agent ID**: BZUOBKBE6S
- **Alias ID**: IQZX8OVP9I
- **Purpose**: Analyze query intent and determine the most appropriate specialist
- **Output**: Structured JSON with specialist target and confidence scores
- **Fallback**: Keyword-based classification when the agent call fails

### Implementation Details

- Confidence-based scoring system for agent selection
- Fallback mechanisms to keyword-based routing when needed
- Content extraction for handling non-JSON responses
- Comprehensive logging and error handling
- Test suite with real API calls

## Architecture Decision Records (ADRs)

### ADR 001: Agent Orchestration Architecture (2024-09-22)

**Decision**: Use pure TypeScript implementation with intelligent routing and context management instead of AWS Bedrock multi-agent orchestration with Lambda functions.

**Status**: Accepted

**Context**: Need to implement hierarchical agent orchestration with specialized agents (Technical, Business, Creative, Data Science) to reduce hallucinations through domain expertise.

**Options Considered**:
1. AWS Bedrock multi-agent orchestration with Lambda routing functions
2. Pure TypeScript implementation with intelligent routing and context management

**Decision Rationale**:
- **Performance**: TypeScript implementation provides faster routing decisions
- **Cost Efficiency**: Eliminates additional Lambda execution costs
- **Development Speed**: Faster iteration and debugging in single codebase
- **Flexibility**: Dynamic routing logic can be easily modified and tested

**Consequences**: Requires building custom routing intelligence but provides better control over orchestration logic.

---

### ADR 002: Runtime System Prompts vs Multiple Bedrock Agents (2024-09-22)

**Decision**: Implement agent specialization through Runtime System Prompts using a single Bedrock agent rather than creating multiple specialized Bedrock agents.

**Status**: Accepted

**Context**: Need to create truly specialized agent behaviors for Technical Specialist, Business Analyst, Creative Specialist, and Data Scientist roles while maintaining system simplicity and cost efficiency.

**Options Considered**:

1. **Multiple Bedrock Agents**: Create separate agents in AWS Console with pre-configured prompts
2. **Runtime System Prompts**: Single agent with dynamic specialization prompts generated at runtime

**Decision**: Runtime System Prompts

**Rationale**:

#### **Infrastructure & Management**
- ✅ **Single Agent Management**: One Bedrock agent to deploy, monitor, and maintain
- ✅ **Simplified Architecture**: Reduces AWS infrastructure complexity
- ✅ **Cost Efficiency**: Single agent usage vs. multiple agent deployments
- ✅ **Faster Deployment**: No need for multiple agent provisioning in AWS Console

#### **Development & Maintenance**
- ✅ **Code-Based Prompts**: Specialization prompts are versioned with application code
- ✅ **Dynamic Flexibility**: Can modify specialist behavior without AWS Console changes
- ✅ **A/B Testing**: Easy to test different prompt strategies programmatically
- ✅ **Environment Consistency**: Same prompts across dev/staging/production

#### **Prompt Versioning & Control**
- ✅ **Git Versioning**: All specialization prompts tracked in version control
- ✅ **Code Reviews**: Prompt changes go through standard PR review process
- ✅ **Rollback Capability**: Easy to revert prompt changes with Git
- ✅ **Testing**: Unit tests can validate prompt generation logic
- ✅ **Documentation**: Prompts are self-documenting in code

#### **Operational Benefits**
- ✅ **Debugging**: Full visibility into prompt generation and agent selection
- ✅ **Monitoring**: Detailed logging of routing decisions and confidence scores
- ✅ **Transparency**: Users can see why specific specialists were selected
- ✅ **Fallback Handling**: Graceful degradation when routing fails

**Implementation Details**:

```typescript
// Each specialist gets comprehensive behavioral instructions
const specializationPrompt = `
You are a ${agent.name}, a highly experienced professional specialist.
${agent.description}

**Your Core Expertise:**
${agent.capabilities.map(cap => `• ${cap}`).join('\n')}

**How You Should Respond:**
• Focus on technical accuracy and implementation details
• Provide code examples when relevant
• Discuss performance, scalability, and security considerations
...
`;
```

**Critical Importance of Prompt Versioning**:

1. **Consistency**: Ensures same specialist behavior across deployments
2. **Auditability**: Track what prompts were used for specific responses  
3. **Collaboration**: Team can review and improve prompts together
4. **Regression Prevention**: Avoid accidentally breaking specialist behavior
5. **A/B Testing**: Compare prompt effectiveness scientifically
6. **Compliance**: Maintain audit trail for regulated environments

**Trade-offs Accepted**:
- ❌ **Prompt Size**: Larger prompts sent to Bedrock (manageable with current limits)
- ❌ **Runtime Overhead**: Small processing time for prompt generation
- ❌ **Single Point of Failure**: One agent serves all specialists (mitigated with fallback)

**Success Metrics**:
- Specialist behavior authenticity (measured through user feedback)
- Response relevance and domain expertise (confidence scores)
- System reliability and fallback effectiveness
- Prompt maintenance velocity (time to update specialist behavior)

**Future Considerations**:
- Could evolve to multiple physical agents if scaling requires
- Prompt optimization through usage analytics
- Potential integration with prompt engineering tools

---

### ADR 003: Dedicated Classification Agent vs Keyword Routing (2025-09-25)

**Decision**: Implement a dedicated classification agent in AWS Bedrock specifically trained for query classification and routing decisions, replacing the simpler keyword-based approach.

**Status**: Accepted

**Context**: Our multi-agent system requires accurate routing of user queries to the appropriate specialized agent. The initial keyword/domain-based approach proved insufficient for nuanced queries that required deeper semantic understanding.

**Options Considered**:
1. Enhanced keyword/pattern matching
2. Machine learning classification model
3. Dedicated AWS Bedrock classification agent
4. Integrated classification with specialist agent

**Decision Rationale**:
- **Semantic Understanding**: Foundation models excel at understanding query intent beyond keywords
- **Structured Output**: Returns standardized JSON with confidence scores
- **Cost Efficiency**: Classification agents use smaller models than full specialist agents
- **Separation of Concerns**: Divides routing logic from specialist responses
- **Fallback Capability**: Maintained keyword-based approach as fallback

[Read full ADR](/docs/adr-003-dedicated-classification-agent.md)

---

## Error Handling

The service includes comprehensive error handling:
- AWS SDK errors are caught and transformed to HTTP exceptions
- Input validation using class-validator decorators
- Detailed logging for debugging and monitoring
- Proper HTTP status codes for different error scenarios