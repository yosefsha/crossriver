#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Function to check health endpoints
check_health() {
  local name=$1
  local url=$2
  
  echo -e "${BLUE}Checking $name...${NC}"
  response=$(curl -s -o /dev/null -w "%{http_code}" $url)
  
  if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓ $name is healthy ($response)${NC}"
    return 0
  else
    echo -e "${RED}✗ $name returned $response${NC}"
    return 1
  fi
}

# Main function to check all health endpoints
check_all_health() {
  echo -e "${YELLOW}===== Health Check =====${NC}"
  
  local has_error=0
  
  # Check root endpoint
  check_health "Agent Router Root" "http://localhost/" || has_error=1
  
  # Check status endpoint
  check_health "Agent Router Status" "http://localhost/status" || has_error=1
  
  # Check orchestrator status endpoint
  check_health "Orchestrator Status" "http://localhost/agents/orchestrator/status" || has_error=1
  
  # Check health endpoint
  check_health "Agent Router Health" "http://localhost/health" || has_error=1
  
  # Check health detailed endpoint
  check_health "Agent Router Health Detailed" "http://localhost/health/detailed" || has_error=1
  
  # Check auth health
  check_health "Auth Service Health" "http://localhost/auth/health" || has_error=1
  
  echo ""
  if [ $has_error -eq 0 ]; then
    echo -e "${GREEN}All health checks passed!${NC}"
  else
    echo -e "${RED}Some health checks failed!${NC}"
  fi
}

check_all_health