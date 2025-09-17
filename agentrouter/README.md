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
- **AgentController**: REST API endpoints and validation
- **DTOs**: Request/response data transfer objects with validation

## Error Handling

The service includes comprehensive error handling:
- AWS SDK errors are caught and transformed to HTTP exceptions
- Input validation using class-validator decorators
- Detailed logging for debugging and monitoring
- Proper HTTP status codes for different error scenarios