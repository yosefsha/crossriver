#!/bin/bash

# Quick JWT Test Script
# Simple version for development testing

set -e

echo "🚀 Quick JWT Integration Test"
echo "============================="

# Go to project root
cd "$(dirname "$0")/.."

echo "1. Starting Docker Compose..."
docker-compose up -d

echo "2. Waiting for services (30 seconds)..."
sleep 30

echo "3. Checking services..."
echo "   - Traefik: http://localhost:8080"
echo "   - Auth: http://localhost/auth/.well-known/jwks.json"
echo "   - Server: http://localhost/api/users/public"

echo "4. Running integration tests..."
cd server
export TRAEFIK_URL="http://localhost"
npm run test:e2e

echo "✅ JWT Integration Test completed!"
echo "📊 To view Traefik dashboard: http://localhost:8080"
