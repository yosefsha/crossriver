#!/bin/bash

# Test setup script for auth service
# This script starts the regular Traefik + DynamoDB setup for testing

set -e

echo "🚀 Setting up test environment for auth service..."

# Navigate to project root
cd "$(dirname "$0")/../.."

# Start Traefik and DynamoDB containers using regular setup
echo "📦 Starting Traefik and DynamoDB containers..."
docker-compose up -d traefik dynamodb

# Wait for Traefik to be ready
echo "⏳ Waiting for Traefik to be ready..."
timeout=60
counter=0
while ! curl -s http://localhost:8080/api/rawdata > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ Traefik failed to start within $timeout seconds"
        exit 1
    fi
    sleep 1
    counter=$((counter + 1))
done

echo "✅ Traefik is ready!"

# Wait for DynamoDB to be accessible through Traefik
echo "⏳ Waiting for DynamoDB Local to be accessible through Traefik..."
counter=0
while ! curl -s -o /dev/null -w "%{http_code}" http://localhost/dynamodb | grep -q "200\|400\|404"; do
    if [ $counter -ge $timeout ]; then
        echo "❌ DynamoDB Local failed to be accessible through Traefik within $timeout seconds"
        echo "💡 Checking Traefik dashboard: http://localhost:8080"
        exit 1
    fi
    sleep 1
    counter=$((counter + 1))
done

echo "✅ DynamoDB Local is accessible through Traefik!"

# Load test environment variables
cd auth
set -o allexport
source .env.test
set +o allexport

echo "🗄️  Environment configured:"
echo "  - AWS_ENDPOINT_URL: $AWS_ENDPOINT_URL"
echo "  - AWS_REGION: $AWS_REGION"
echo "  - DYNAMODB_TABLE_NAME: $DYNAMODB_TABLE_NAME"

echo "✅ Test environment setup complete!"
echo "💡 You can now run: npm run test:e2e"
echo "📝 Note: Using the same Traefik setup as production"
