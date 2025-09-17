#!/bin/bash

# Convenient wrapper to setup AWS and start services
# Usage: ./start-services.sh [docker-compose-args]

set -e  # Exit on any error

echo "🔧 Starting MyAssistant services with AWS setup..."

# Source the AWS setup script to get environment variables
source ./aws-setup.sh

# Pass any additional arguments to docker-compose
echo "🐳 Starting Docker Compose services..."
docker-compose "$@"