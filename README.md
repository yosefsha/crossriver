# CrossRiver Application

A full-stack application with React frontend, NestJS backend, and DynamoDB database, all orchestrated with Docker Compose and Traefik for routing.

## Architecture

This application consists of:

1. **DynamoDB** - Local DynamoDB instance for data storage
2. **DynamoDB Admin GUI** - Web interface for managing DynamoDB tables and data
3. **React App** - Frontend client application
4. **NestJS App** - Backend API server with TypeScript
5. **Traefik** - Reverse proxy for routing and load balancing

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
   cd crossriver
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
crossriver/
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
```