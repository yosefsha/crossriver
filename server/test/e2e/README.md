# JWT Integration Testing with Traefik

This directory contains comprehensive integration tests that validate the JWT authentication flow through Traefik reverse proxy routing.

## Test Architecture

The tests simulate the production environment by using Traefik routing:

- **Auth Service**: `http://localhost/auth/*` → Routes to auth service (port 3001)
- **Server Service**: `http://localhost/api/*` → Routes to server service (port 3000)
- **JWKS Endpoint**: `http://localhost/auth/.well-known/jwks.json` → RSA public keys

## Test Scenarios

### 1. JWKS Integration (`JWKS Integration via Traefik`)
- ✅ Validates JWKS endpoint is accessible through Traefik
- ✅ Verifies RSA public key structure (kty, use, alg, n, e)

### 2. Protected Endpoints (`Protected Endpoints via Traefik`)
- ✅ Returns 401 for missing JWT token
- ✅ Returns 401 for invalid JWT token
- ✅ Returns user data with valid JWT from auth service
- ✅ Works with different roles (user vs admin) and scopes

## Complete Flow Test

### User Role Test:
1. **Register**: `POST /auth/register` (via Traefik) → Creates user with 'user' role
2. **Login**: `POST /auth/login` (via Traefik) → Returns RS256 JWT token
3. **Access**: `GET /api/users/profile` (via Traefik) → Validates JWT using JWKS
4. **Verify**: Scopes = `['read:own', 'write:own']`

### Admin Role Test:
1. **Register**: `POST /auth/register` (via Traefik) → Creates user with 'admin' role
2. **Login**: `POST /auth/login` (via Traefik) → Returns RS256 JWT token
3. **Access**: `GET /api/users/profile` (via Traefik) → Validates JWT using JWKS
4. **Verify**: Scopes = `['read:all', 'write:all', 'delete:all']`

## Running Tests

### Prerequisites
1. Start the complete stack with Traefik:
   ```bash
   cd /Users/yosefshachnovsky/dev/myassistant
   docker-compose up -d
   ```

2. Verify services are running:
   - Traefik Dashboard: http://localhost:8080
   - Auth Service (via Traefik): http://localhost/auth/health
   - Server Service (via Traefik): http://localhost/api/health

### Run Integration Tests
```bash
cd server
npm run test:e2e
```

### Environment Variables
- `TRAEFIK_URL`: Base URL for Traefik (default: `http://localhost`)
- Set to test against different environments

### Test Behavior
- Tests will **skip gracefully** if Traefik is not running
- Each test uses unique email addresses to avoid conflicts
- Tests validate complete JWT flow including:
  - RSA key generation and distribution
  - JWT signing with RS256 algorithm
  - JWKS-based token verification
  - Role-based scope mapping
  - Traefik reverse proxy routing

## Key Validation Points

✅ **JWT Security**: RS256 algorithm with RSA key pairs  
✅ **Microservices**: Auth and server services communicate via JWT  
✅ **JWKS Protocol**: Public key distribution and caching  
✅ **Traefik Routing**: Production-like reverse proxy setup  
✅ **Role-Based Access**: Different scopes for user vs admin  
✅ **Error Handling**: Proper 401 responses for invalid tokens  

This ensures the JWT implementation works exactly as it will in production with Traefik routing.
