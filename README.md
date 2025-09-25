# MyAssistant Application

A full-stack application with React frontend, NestJS backend, and DynamoDB database, all orchestrated with Docker Compose and Traefik for routing.

## Architecture

This application consists of:

1. **DynamoDB** - Local DynamoDB instance for data storage
2. **DynamoDB Admin GUI** - Web interface for managing DynamoDB tables and data
3. **Auth Service** - JWT authentication microservice with user management
4. **Agent Router Service** - Multi-agent orchestrator with specialized AI assistants
5. **React App** - Frontend client application
6. **Traefik** - Reverse proxy for routing and load balancing

## Authentication System (JWT + JWKS)

### Architecture
- **Auth Service**: Issues RS256 JWTs and serves JWKS endpoint
- **Other Services**: Verify tokens using JWKS URI with caching
- **Role-based Access**: Guards enforce roles/scopes on endpoints

### Endpoints
**Auth Service:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication  
- `GET /auth/.well-known/jwks.json` - Public keys for token verification

**Protected Endpoints:**
- Require `Authorization: Bearer <token>` header
- Support role-based access control (admin, user)
- Automatic token validation via JWKS

### Architecture Decision: Direct Service Routing

We chose to route requests **directly to specialized services via Traefik** rather than having a central API gateway server.

#### Current Architecture ✅
```
Client → Traefik → Auth Service (POST /auth/login, /auth/register)
                → Agent Router (POST /agents/*)
                → React App (GET /)
```

**Why we chose this approach:**
- ✅ **Microservices Best Practice**: Clean service separation and single responsibility
- ✅ **Performance**: Direct routing, no extra hops or proxy layers
- ✅ **Scalability**: Each service scales independently based on demand
- ✅ **Fault Isolation**: Service failure doesn't affect other services
- ✅ **Simplified Architecture**: Fewer moving parts, easier to maintain
- ✅ **Production Ready**: Standard API gateway pattern with Traefik

#### Implementation Benefits
- **Client Simplicity**: Single API endpoint (`localhost`) with clear path prefixes
- **Service Independence**: All services are completely decoupled
- **Operational Excellence**: Each service can be deployed, scaled, and monitored independently  
- **Security**: Authentication and AI logic are isolated and specialized
- **Cost Efficiency**: No redundant API layer, optimal resource utilization

### Environment Variables
```env
# Auth Service
PORT=3001
JWKS_URI=http://localhost:3001/.well-known/jwks.json

# Agent Router Service  
PORT=3002
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
```

## Architecture Decision Records

### ADR 001: Use Pure Code Implementation for Agent Orchestration
**Status:** Accepted

**Context:**  
We need to implement a hierarchical agent system with an orchestrator that routes user queries to specialized agents (technical, business, creative, data science). We evaluated three approaches: pure code implementation, Bedrock + Lambda functions, and a hybrid approach.

**Decision:**  
We will implement the orchestration logic using pure TypeScript code within the existing NestJS service, utilizing keyword matching, confidence scoring, and rule-based routing.

**Consequences:**  
- ✅ **Performance**: Faster response times with no Lambda cold starts or additional service calls
- ✅ **Cost Efficiency**: Lower operational costs without additional Lambda invocations
- ✅ **Development Speed**: Easier debugging, testing, and development within familiar codebase
- ✅ **Simplicity**: Single service architecture reduces complexity and maintenance overhead
- ✅ **Control**: Full control over routing logic and algorithms
- ❌ **Scalability**: Orchestration logic scales with the service rather than independently
- ❌ **AI Sophistication**: May require manual tuning compared to AI-powered routing decisions
- 🔄 **Future Path**: Can evolve to hybrid approach if more sophisticated AI routing is needed

### ADR 002: Single Bedrock Agent for Multi-Role Operation
**Status:** Accepted  
**Date:** September 25, 2025

**Context:**  
Our multi-agent orchestrator system requires different AI capabilities: orchestration decisions, domain-specific expertise (technical, financial, business, creative, data science), and general assistance. We evaluated using multiple specialized Bedrock agents versus a single versatile agent with role-based prompting.

**Decision:**  
We will use a single AWS Bedrock agent (`YWBU6XB7W7`) to handle all roles through dynamic prompt engineering, rather than deploying separate agents for each specialist domain.

**Alternatives Considered:**
1. **Multiple Specialized Agents** - Separate Bedrock agents for each domain (technical, financial, etc.)
2. **Hybrid Approach** - Orchestrator + general assistant on one agent, specialists on dedicated agents
3. **Single Agent Architecture** - One foundation model with role-based prompting (chosen)

**Consequences:**
- ✅ **Cost Optimization**: Single agent pricing instead of 6+ separate agent costs
- ✅ **Architectural Simplicity**: One agent to configure, monitor, and maintain
- ✅ **Consistent Quality**: Same underlying Claude intelligence across all specialist roles
- ✅ **Reduced Infrastructure**: Single authentication, permission, and connection management
- ✅ **Deployment Efficiency**: Simpler CI/CD with fewer AWS resources to manage
- ✅ **Session Management**: Unified session handling across all agent interactions
- ✅ **Performance**: No agent-switching overhead, reduced latency from connection reuse
- ✅ **Proven Pattern**: Role-based prompting is a well-established multi-agent technique

**Implementation Details:**
```typescript
// Single agent handles all roles through prompt engineering:
orchestrator_agent_id: 'YWBU6XB7W7'

// Role examples:
// Orchestration: "Analyze this query and determine routing..."
// Technical: "You are a Technical Specialist with expertise in..."
// Financial: "You are a Financial Analyst specializing in..."
// General: "Please provide a helpful response to this query..."
```

**Risks & Mitigations:**
- **Risk**: Single point of failure for all AI functionality
- **Mitigation**: AWS Bedrock provides high availability and automatic failover
- **Risk**: Context pollution between different roles
- **Mitigation**: Each invocation uses isolated sessions and clear role prompts

**Success Metrics:**
- ✅ FBAR queries correctly route to financial-analyst (confidence ≥ 0.3)
- ✅ Tax queries route to financial-analyst with enhanced keywords
- ✅ Technical queries route to technical-specialist (confidence ≥ 0.7)
- ✅ General queries handled by general-assistant role
- ✅ Cost reduction: ~83% savings vs 6 separate agents

## 🎯 Multi-Agent Orchestrator: Model in Action

### **System Overview**
Our modular multi-agent system features intelligent routing that automatically delegates queries to specialized AI agents based on content analysis and confidence scoring. The system uses **Runtime System Prompts** to make a single Bedrock agent behave as multiple domain specialists.

### **Available Specialist Agents**

| Specialist | Expertise | Confidence Threshold |
|------------|-----------|---------------------|
| 🔧 **Technical Specialist** | Software development, DevOps, cloud computing, cybersecurity | 70% |
| 📊 **Data Scientist** | Statistical analysis, ML, data visualization, big data | 70% |
| 💰 **Financial Analyst** | Financial modeling, investment analysis, risk management | 70% |
| 📈 **Business Analyst** | Strategy, project management, process optimization | 60% |
| 🎨 **Creative Specialist** | Content creation, marketing, design, communications | 60% |

### **Routing Algorithm**
The orchestrator uses a **multi-factor confidence scoring system**:
- **60% Keyword Match**: Direct relevance to specialist vocabulary
- **20% Domain Relevance**: Match with specialist expertise areas  
- **20% Context Continuity**: Conversation history and agent consistency

### **Real Examples: Watch the Orchestrator Work**

#### **Example 1: Technical Query → Technical Specialist**
```
🔍 User Query: "How do I optimize this SQL query for better performance?"

📊 Analysis Results:
├── Intent: "optimization_request"
├── Keywords: ["optimize", "SQL", "query", "performance"] 
├── Domains: ["software_development", "database"]
└── Context: No previous specialist (new conversation)

🎯 Confidence Scoring:
├── Technical Specialist: 95% ✅
│   ├── Keyword Match: 100% (SQL, query, performance, optimize)
│   ├── Domain Match: 100% (software_development)
│   └── Context Score: 50% (new conversation)
├── Data Scientist: 30%
│   ├── Keyword Match: 25% (query, performance)
│   ├── Domain Match: 0% (not data_science domain)
│   └── Context Score: 50%
└── Other Agents: <20%

✅ Decision: Route to Technical Specialist
📝 Reasoning: "Selected Technical Specialist with 95% confidence. 
           Key factors: 4 matching keywords (SQL, query, performance, optimize) 
           and domain expertise in software_development, database."

🤖 Runtime System Prompt Generated:
"You are Technical Specialist, a senior software engineer and technical architect 
with deep expertise in programming, system design, DevOps, and emerging technologies...
Current Context: User query intent: optimization_request
Key topics: SQL, query, performance, optimize
Domain areas: software_development, database"

💬 Specialist Response:
"As a Technical Specialist, I can help you optimize your SQL query. Here are the key 
strategies for better performance: [detailed technical advice about indexing, 
query structure, execution plans, etc.]"
```

#### **Example 2: Financial Analysis → Financial Analyst**
```
🔍 User Query: "What's the ROI calculation for a $100k marketing campaign 
                that generated $150k in revenue?"

📊 Analysis Results:
├── Intent: "analysis_request"
├── Keywords: ["ROI", "calculation", "marketing", "campaign", "revenue"]
├── Domains: ["finance", "financial_analysis"]
└── Context: No previous specialist

🎯 Confidence Scoring:
├── Financial Analyst: 88% ✅
│   ├── Keyword Match: 80% (ROI, calculation, revenue)
│   ├── Domain Match: 100% (finance, financial_analysis)
│   └── Context Score: 50%
├── Business Analyst: 65%
│   ├── Keyword Match: 60% (marketing, campaign, ROI)
│   ├── Domain Match: 33% (overlap with financial_analysis)
│   └── Context Score: 50%
└── Creative Specialist: 45%

✅ Decision: Route to Financial Analyst
📝 Reasoning: "Selected Financial Analyst with 88% confidence. 
           Strong ROI and financial calculation focus."

💬 Specialist Response:
"As a Financial Analyst, I'll calculate the ROI for your marketing campaign:
ROI = (Revenue - Investment) / Investment × 100
ROI = ($150k - $100k) / $100k × 100 = 50%
This 50% ROI indicates a successful campaign..."
```

#### **Example 3: Agent Switching Mid-Conversation**
```
🔍 Conversation Flow:

Message 1: "Create a machine learning model to predict customer churn"
├── Routes to: Data Scientist (95% confidence)
├── Keywords: ["machine learning", "model", "predict", "customer"]
└── Response: "I'll help you build a churn prediction model using classification algorithms..."

Message 2: "What's the business impact if we reduce churn by 15%?"
├── Context: Previous agent was Data Scientist
├── Keywords: ["business", "impact", "reduce", "churn"]
├── Intent: "business_analysis_request"
└── Confidence Scoring:
    ├── Business Analyst: 82% ✅ (business impact focus)
    ├── Data Scientist: 45% (context continuity bonus, but not business-focused)
    └── Financial Analyst: 70% (impact analysis overlap)

🔄 Agent Switch Detected: Data Scientist → Business Analyst
📝 Switch Reasoning: "Query shifted from technical ML implementation to business 
                    impact analysis. Business Analyst better suited for ROI and 
                    impact calculations."

💬 Business Analyst Response:
"From a business perspective, reducing churn by 15% would have significant impact:
1. Revenue retention: [calculation]
2. Customer lifetime value improvement: [analysis]
3. Cost savings from reduced acquisition needs: [breakdown]..."
```

#### **Example 4: Creative Content → Creative Specialist**
```
🔍 User Query: "Write a compelling blog post about sustainable technology"

📊 Analysis Results:
├── Intent: "content_creation_request"
├── Keywords: ["write", "blog", "post", "compelling", "content"]
├── Domains: ["content_creation", "marketing"]
└── Context: No previous specialist

🎯 Confidence Scoring:
├── Creative Specialist: 92% ✅
│   ├── Keyword Match: 100% (write, blog, post, compelling)
│   ├── Domain Match: 100% (content_creation, marketing)
│   └── Context Score: 50%
├── Technical Specialist: 35% (technology keyword)
└── Other Agents: <25%

✅ Decision: Route to Creative Specialist

💬 Specialist Response:
"As a Creative Specialist, I'll craft a compelling blog post that engages your 
audience while highlighting sustainable technology innovations. Here's a strategic 
approach: [detailed content strategy, headline options, narrative structure, 
engagement tactics, SEO considerations]..."
```

### **System Intelligence Features**

#### **1. Context-Aware Routing**
- Remembers conversation history for better decisions
- Detects when to switch specialists mid-conversation
- Maintains topic coherence while optimizing expertise

#### **2. Confidence Threshold Management**
- Each specialist has a minimum confidence threshold
- Falls back to general assistant if no specialist qualifies
- Transparent reasoning for all routing decisions

#### **3. Session Analytics**
- Tracks specialist switches per conversation
- Monitors conversation flow and topic evolution
- Provides routing decision history for analysis

#### **4. Runtime System Prompts**
- Single Bedrock agent behaves as multiple specialists
- Cost-efficient compared to multiple trained models
- Authentic specialist behavior through detailed prompts

### **API Endpoints**
```bash
# Start new orchestrated conversation
POST /orchestrator/session/start
{
  "message": "How do I optimize database performance?"
}

# Continue conversation
POST /orchestrator/query  
{
  "sessionId": "orch_1234567890_abc123",
  "message": "What about indexing strategies?"
}

# Get system status
GET /orchestrator/status

# View session analytics
GET /orchestrator/session/{sessionId}/stats
```

### **Benefits of This Approach**

✅ **Automatic Expertise**: Users get the right specialist without choosing  
✅ **Transparent Decisions**: Full visibility into routing reasoning  
✅ **Cost Efficient**: One Bedrock agent with runtime specialization  
✅ **Seamless Switching**: Intelligent agent changes mid-conversation  
✅ **Production Ready**: Session management, cleanup, monitoring  
✅ **Extensible**: Easy to add new specialists via configuration

---

## Services

### 1. DynamoDB
- **Purpose**: Local DynamoDB instance for development
- **Access**: Available internally at `http://dynamodb:8000`
- **Data Persistence**: Data stored in `./dynamodb-data` directory

### 2. DynamoDB Admin GUI
- **Purpose**: Web interface for managing DynamoDB
- **Access**: [http://localhost/dbadmin](http://localhost/dbadmin)
- **Features**: Create tables, view data, manage items

### 3. Auth Service
- **Purpose**: JWT authentication and user management
- **Access**: [http://localhost/auth](http://localhost/auth)
- **Technology**: NestJS with TypeScript
- **Features**: 
  - User registration and login
  - JWT token generation and validation
  - JWKS endpoint for token verification
  - User management (CRUD operations)
  - DynamoDB integration

### 4. Agent Router Service
- **Purpose**: Multi-agent orchestrator with AI specialists
- **Access**: [http://localhost/agents](http://localhost/agents)
- **Technology**: NestJS with TypeScript, AWS Bedrock
- **Features**:
  - Intelligent query routing to specialized agents
  - Technical, Financial, Business, Creative, and Data Science specialists
  - Session management and conversation tracking
  - Single Bedrock agent with role-based prompting

### 5. React App
- **Purpose**: Frontend client application
- **Access**: [http://localhost/](http://localhost/)
- **Technology**: React with TypeScript
- **Build**: Nginx-served production build

### 6. Traefik
- **Purpose**: Reverse proxy and load balancer
- **Dashboard**: [http://localhost:8080](http://localhost:8080)
- **Features**: Path-based routing, middleware support

## Getting Started

### Prerequisites
- Docker
- Docker Compose

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd myassistant
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: [http://localhost/](http://localhost/)
   - Auth Service: [http://localhost/auth](http://localhost/auth)
   - Agent Router: [http://localhost/agents](http://localhost/agents)
   - DynamoDB Admin: [http://localhost/dbadmin](http://localhost/dbadmin)
   - Traefik Dashboard: [http://localhost:8080](http://localhost:8080)

### Development

For development with hot reload:

```bash
# Start all services
docker-compose up --build

# View logs for specific service
docker-compose logs -f auth
docker-compose logs -f agentrouter
docker-compose logs -f client
```

## Project Structure

```
myassistant/
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── auth/                   # Authentication service
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   ├── Dockerfile
│   └── package.json
├── agentrouter/           # Multi-agent orchestrator service
│   ├── src/
│   │   ├── orchestrator/
│   │   └── bedrock/
│   ├── Dockerfile
│   └── package.json
├── dynamodb-data/          # DynamoDB data persistence
├── docker-compose.yaml     # Docker services configuration
└── README.md
```

## Environment Variables

### Auth Service (NestJS)
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3001)
- `AWS_ENDPOINT_URL`: DynamoDB endpoint (http://dynamodb:8000)
- `AWS_REGION`: AWS region (us-east-1)
- `AWS_ACCESS_KEY_ID`: Local access key
- `AWS_SECRET_ACCESS_KEY`: Local secret key

### Agent Router Service (NestJS)
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3002)
- `AWS_REGION`: AWS region for Bedrock (us-east-1)
- `AWS_ACCESS_KEY_ID`: AWS access key for Bedrock
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for Bedrock
- `AWS_SESSION_TOKEN`: AWS session token for Bedrock

### DynamoDB Admin
- `AWS_REGION`: AWS region (eu-west-1)
- `AWS_ACCESS_KEY_ID`: Local access key
- `AWS_SECRET_ACCESS_KEY`: Local secret key
- `DYNAMO_ENDPOINT`: DynamoDB endpoint (http://dynamodb:8000)

## Development Setup Steps

This project was built incrementally with the following steps:

### 1. Added DynamoDB
- Configured local DynamoDB instance using `amazon/dynamodb-local`
- Set up data persistence with volume mounting
- Configured Traefik routing for DynamoDB API access

### 2. Added GUI for DynamoDB
- Integrated `aaronshaf/dynamodb-admin` for database management
- Configured path-based routing with middleware for path stripping
- Set up proper environment variables for DynamoDB connection

### 3. Added React App
- Created React frontend application with TypeScript
- Configured Docker build with Nginx for production serving
- Set up Traefik routing with priority for root path handling

### 4. Added Auth Service
- Implemented NestJS authentication service with TypeScript
- Added JWT token generation and validation with JWKS endpoint
- Integrated user management with DynamoDB
- Configured direct routing via Traefik

### 5. Added Agent Router Service
- Implemented multi-agent orchestrator with NestJS and TypeScript
- Integrated AWS Bedrock for AI specialist agents
- Added intelligent query routing and session management
- Configured specialized agents: Technical, Financial, Business, Creative, Data Science

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 80 and 8080 are available
2. **Container startup**: Check logs with `docker-compose logs <service-name>`
3. **Network issues**: Verify all services are on the same Docker network
4. **Database connection**: Ensure DynamoDB is ready before dependent services start

### Useful Commands

```bash
# Stop all services
docker-compose down

# Rebuild specific service
docker-compose up --build <service-name>

# View service logs
docker-compose logs -f <service-name>

# Check running containers
docker-compose ps

```