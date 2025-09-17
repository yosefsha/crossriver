# JWT Integration Test Scripts

This directory contains scripts to test the complete JWT authentication flow through Traefik routing.

## Scripts

### 🚀 `test-jwt-integration.sh` (Comprehensive)
Full-featured integration test with error handling, service monitoring, and detailed reporting.

**Usage:**
```bash
# Run complete integration test
./scripts/test-jwt-integration.sh

# Show help
./scripts/test-jwt-integration.sh help

# Check service status
./scripts/test-jwt-integration.sh status

# Run tests only (against existing services)
./scripts/test-jwt-integration.sh test-only

# Cleanup containers
./scripts/test-jwt-integration.sh cleanup
```

**Features:**
- ✅ Automatic Docker Compose management
- ✅ Service health checks with timeout
- ✅ Colored output and status indicators
- ✅ Automatic cleanup on exit
- ✅ Detailed error reporting
- ✅ Service status dashboard

### ⚡ `quick-test.sh` (Simple)
Quick and simple test for development workflows.

**Usage:**
```bash
# Run quick test
./scripts/quick-test.sh
```

**Features:**
- ✅ Minimal setup and execution
- ✅ 30-second service wait time
- ✅ Direct test execution

## What Gets Tested

### 🔐 JWT Flow
1. **Register User** → `POST /auth/register` (via Traefik)
2. **Login** → `POST /auth/login` (via Traefik) 
3. **Access Protected** → `GET /api/users/profile` (via Traefik)
4. **Verify JWT** → Token validated using JWKS

### 🌐 Traefik Routing
- `/auth/*` → Auth Service (port 3001)
- `/api/*` → Server Service (port 3000)
- `/.well-known/jwks.json` → JWKS endpoint

### 👥 Role-Based Access
- **User Role**: `['read:own', 'write:own']`
- **Admin Role**: `['read:all', 'write:all', 'delete:all']`

### 🔑 Security Features
- **RS256 Algorithm**: RSA-based JWT signing
- **JWKS Distribution**: Public key sharing via endpoint
- **Token Validation**: Server validates tokens using auth service public keys
- **Scope-Based Authorization**: Different permissions per role

## Prerequisites

1. **Docker & Docker Compose** installed
2. **Node.js & npm** for running tests
3. **Ports Available**: 80 (Traefik), 8080 (Traefik Dashboard)

## Expected Output

```
🚀 JWT Integration Test - Docker Compose
==============================================
✅ All services are running!
✅ Integration tests passed!

=== INTEGRATION TEST SUMMARY ===
✅ Traefik routing working
✅ Auth service JWT generation working  
✅ Server service JWT validation working
✅ JWKS endpoint accessible
✅ Role-based access control working
✅ Complete JWT flow functional
```

## Troubleshooting

### Services Not Starting
```bash
# Check service logs
docker-compose logs auth
docker-compose logs server
docker-compose logs traefik
```

### Port Conflicts
```bash
# Check what's using port 80
lsof -i :80

# Use different ports if needed
export TRAEFIK_URL="http://localhost:8080"
```

### Test Failures
```bash
# Run tests with verbose output
cd server
npm run test:e2e -- --verbose
```

## Manual Testing

You can also test manually using curl:

```bash
# 1. Register user
curl -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","roles":["user"]}'

# 2. Login 
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. Use token (replace TOKEN with actual token)
curl -X GET http://localhost/api/users/profile \
  -H "Authorization: Bearer TOKEN"
```

This validates the complete JWT implementation works exactly as it will in production! 🎉
