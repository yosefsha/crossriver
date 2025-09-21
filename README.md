# MyAssistant Application

A full-stack application with React frontend, NestJS backend, and DynamoDB database, all orchestrated with Docker Compose and Traefik for routing.

## Architecture

This application consists of:

1. **DynamoDB** - Local DynamoDB instance for data storage
2. **DynamoDB Admin GUI** - Web interface for managing DynamoDB tables and data
3. **Auth Service** - JWT authentication microservice
4. **Server Service** - Main API server with authentication
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

### Architecture Decision: Direct Auth Routing vs Server Forwarding

We chose to route authentication requests **directly to the auth service via Traefik** rather than forwarding through the main server service.

#### Option 1: Server Forwarding (Rejected)
```
Client → Server Service → Auth Service
       (POST /api/auth/login)    (internal call)
```

**Why we rejected this approach:**
- ❌ **Coupling**: Server service becomes coupled to auth service
- ❌ **Single Point of Failure**: Server service must handle auth routing
- ❌ **Performance**: Extra network hop adds latency
- ❌ **Complexity**: Server service needs auth-specific routing logic
- ❌ **Violates Single Responsibility**: Server service handles business logic AND auth routing

#### Option 2: Direct Traefik Routing (Chosen) ✅
```
Client → Traefik → Auth Service (POST /auth/login)
                → Server Service (POST /api/*)
```

**Why we chose this approach:**
- ✅ **Microservices Best Practice**: Clean service separation
- ✅ **Performance**: Direct routing, no extra hops
- ✅ **Scalability**: Each service scales independently
- ✅ **Single Responsibility**: Auth service only handles auth, server service only handles business logic
- ✅ **Production Ready**: Standard API gateway pattern
- ✅ **Fault Isolation**: Auth service failure doesn't affect other services
- ✅ **Easy Maintenance**: Changes to auth don't require server service updates

#### Implementation Benefits
- **Client Simplicity**: Single API endpoint (`localhost`) with clear path prefixes
- **Service Independence**: Auth and server services are completely decoupled
- **Operational Excellence**: Each service can be deployed, scaled, and monitored independently
- **Security**: Authentication logic is isolated and specialized

### Environment Variables
```env
# Auth Service
PORT=3001
JWKS_URI=http://localhost:3001/.well-known/jwks.json

# Server Service  
PORT=3000
JWKS_URI=http://auth:3001/.well-known/jwks.json
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

## Services

### 1. DynamoDB
- **Purpose**: Local DynamoDB instance for development
- **Access**: Available internally at `http://dynamodb:8000`
- **Data Persistence**: Data stored in `./dynamodb-data` directory

### 2. DynamoDB Admin GUI
- **Purpose**: Web interface for managing DynamoDB
- **Access**: [http://localhost/dbadmin](http://localhost/dbadmin)
- **Features**: Create tables, view data, manage items

### 3. React App
- **Purpose**: Frontend client application
- **Access**: [http://localhost/](http://localhost/)
- **Technology**: React with TypeScript
- **Build**: Nginx-served production build

### 4. NestJS App
- **Purpose**: Backend API server
- **Access**: [http://localhost/api](http://localhost/api)
- **Technology**: NestJS with TypeScript
- **Features**: 
  - REST API endpoints
  - Health check at `/api/health`
  - CORS enabled
  - DynamoDB integration

### 5. Traefik
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
   - API: [http://localhost/api](http://localhost/api)
   - DynamoDB Admin: [http://localhost/dbadmin](http://localhost/dbadmin)
   - Traefik Dashboard: [http://localhost:8080](http://localhost:8080)

### Development

For development with hot reload:

```bash
# Start all services
docker-compose up --build

# View logs for specific service
docker-compose logs -f server
docker-compose logs -f client
```

### API Endpoints

- `GET /api` - Hello World message
- `GET /api/health` - Health check endpoint

## Project Structure

```
myassistant/
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── server/                 # NestJS backend
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   └── app.service.ts
│   ├── Dockerfile
│   └── package.json
├── dynamodb-data/          # DynamoDB data persistence
├── docker-compose.yaml     # Docker services configuration
└── README.md
```

## Environment Variables

### Server (NestJS)
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: DynamoDB endpoint (http://dynamodb:8000)

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

### 4. Added NestJS App
- Implemented NestJS backend with TypeScript
- Configured API routing with path prefix stripping
- Added health check endpoints and CORS support
- Integrated with DynamoDB for data operations

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


explain the suggested flow . 
1. client calls api register with name email and password
2. main server recerives register request forwards to users service 
3. user service save credentials in db
4. return success to client
5. now client can login. client posts login request with email and password
6. server gets request and forwards to auth service

```