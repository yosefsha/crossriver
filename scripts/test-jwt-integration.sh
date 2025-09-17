#!/bin/bash

# JWT Integration Test Script
# Tests complete JWT authentication flow through Traefik routing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TRAEFIK_URL="http://localhost"
TIMEOUT=60  # seconds to wait for services
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 JWT Integration Test - Docker Compose${NC}"
echo "=============================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if a service is responding
check_service() {
    local url="$1"
    local name="$2"
    local max_attempts=30
    local attempt=1

    print_info "Checking $name at $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            print_status "$name is responding"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$name is not responding after $max_attempts attempts"
    return 1
}

# Function to cleanup Docker containers
cleanup() {
    print_info "Cleaning up Docker containers..."
    cd "$PROJECT_ROOT"
    docker-compose down -v --remove-orphans || true
    print_status "Cleanup completed"
}

# Function to wait for all services
wait_for_services() {
    print_info "Waiting for services to start..."
    
    # Wait for Traefik
    check_service "$TRAEFIK_URL:8080/api/rawdata" "Traefik Dashboard"
    
    # Wait for Auth service through Traefik
    check_service "$TRAEFIK_URL/auth/.well-known/jwks.json" "Auth Service (JWKS)"
    
    # Wait for Server service through Traefik  
    check_service "$TRAEFIK_URL/api/users/public" "Server Service (Public endpoint)"
    
    print_status "All services are running!"
}

# Function to run tests
run_tests() {
    print_info "Running integration tests..."
    
    cd "$PROJECT_ROOT/server"
    
    # Set environment variable for tests
    export TRAEFIK_URL="$TRAEFIK_URL"
    
    # Run the e2e tests
    if npm run test:e2e; then
        print_status "Integration tests passed!"
        return 0
    else
        print_error "Integration tests failed!"
        return 1
    fi
}

# Function to show service status
show_service_status() {
    print_info "Service Status Check:"
    echo "======================================"
    
    # Traefik Dashboard
    if curl -s -f "$TRAEFIK_URL:8080/api/rawdata" > /dev/null 2>&1; then
        echo -e "Traefik Dashboard:   ${GREEN}✅ Running${NC} - http://localhost:8080"
    else
        echo -e "Traefik Dashboard:   ${RED}❌ Not responding${NC}"
    fi
    
    # Auth Service
    if curl -s -f "$TRAEFIK_URL/auth/.well-known/jwks.json" > /dev/null 2>&1; then
        echo -e "Auth Service:        ${GREEN}✅ Running${NC} - http://localhost/auth"
    else
        echo -e "Auth Service:        ${RED}❌ Not responding${NC}"
    fi
    
    # Server Service
    if curl -s -f "$TRAEFIK_URL/api/users/public" > /dev/null 2>&1; then
        echo -e "Server Service:      ${GREEN}✅ Running${NC} - http://localhost/api"
    else
        echo -e "Server Service:      ${RED}❌ Not responding${NC}"
    fi
    
    echo "======================================"
}

# Main execution
main() {
    # Trap cleanup on exit
    trap cleanup EXIT
    
    print_info "Starting JWT Integration Test..."
    echo "Project Root: $PROJECT_ROOT"
    echo "Traefik URL: $TRAEFIK_URL"
    echo ""
    
    # Step 1: Cleanup any existing containers
    print_info "Step 1: Cleaning up existing containers..."
    cleanup
    
    # Step 2: Start Docker Compose
    print_info "Step 2: Starting Docker Compose stack..."
    cd "$PROJECT_ROOT"
    
    if docker-compose up -d; then
        print_status "Docker Compose started successfully"
    else
        print_error "Failed to start Docker Compose"
        exit 1
    fi
    
    # Step 3: Wait for services to be ready
    print_info "Step 3: Waiting for services to be ready..."
    if wait_for_services; then
        print_status "All services are ready"
    else
        print_error "Services failed to start properly"
        show_service_status
        exit 1
    fi
    
    # Step 4: Show service status
    print_info "Step 4: Service status check..."
    show_service_status
    
    # Step 5: Run integration tests
    print_info "Step 5: Running integration tests..."
    if run_tests; then
        print_status "JWT Integration Test completed successfully! 🎉"
        echo ""
        echo -e "${GREEN}=== INTEGRATION TEST SUMMARY ===${NC}"
        echo -e "✅ Traefik routing working"
        echo -e "✅ Auth service JWT generation working"
        echo -e "✅ Server service JWT validation working"
        echo -e "✅ JWKS endpoint accessible"
        echo -e "✅ Role-based access control working"
        echo -e "✅ Complete JWT flow functional"
        return 0
    else
        print_error "Integration tests failed"
        show_service_status
        return 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "cleanup")
        cleanup
        exit 0
        ;;
    "status")
        show_service_status
        exit 0
        ;;
    "test-only")
        print_info "Running tests without starting Docker Compose..."
        run_tests
        exit $?
        ;;
    "help"|"-h"|"--help")
        echo "JWT Integration Test Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)   Run complete integration test"
        echo "  cleanup     Stop and remove all containers"
        echo "  status      Check service status"
        echo "  test-only   Run tests against existing services"
        echo "  help        Show this help message"
        echo ""
        exit 0
        ;;
    "")
        main
        exit $?
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
