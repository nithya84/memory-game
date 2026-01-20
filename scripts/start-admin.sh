#!/bin/bash
#
# Start local environment for Admin UI development
# This script starts the admin backend API and frontend with correct configuration
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Memory Game Admin Local Environment ===${NC}"
echo ""

# Load admin tokens from backend/.env.local
if [ -f "$PROJECT_ROOT/backend/.env.local" ]; then
    echo -e "${GREEN}Loading admin tokens from backend/.env.local${NC}"
    export $(grep -E '^ADMIN_TOKEN_' "$PROJECT_ROOT/backend/.env.local" | xargs)
else
    echo -e "${RED}Error: backend/.env.local not found${NC}"
    echo "Please create backend/.env.local with ADMIN_TOKEN_LOCAL"
    exit 1
fi

# Verify ADMIN_TOKEN_LOCAL is set
if [ -z "$ADMIN_TOKEN_LOCAL" ]; then
    echo -e "${RED}Error: ADMIN_TOKEN_LOCAL not set in backend/.env.local${NC}"
    exit 1
fi

echo -e "${GREEN}Admin token loaded successfully${NC}"
echo ""

# Check if node_modules exist
if [ ! -d "$PROJECT_ROOT/backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd "$PROJECT_ROOT/backend" && npm install
fi

if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd "$PROJECT_ROOT/frontend" && npm install
fi

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start admin backend (port 3002)
echo -e "${GREEN}Starting admin backend on port 3002...${NC}"
cd "$PROJECT_ROOT/backend"
npm run build && npx serverless offline start --stage local --config serverless-admin.yml --lambdaPort 3003 &
BACKEND_PID=$!

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for admin backend to start...${NC}"
sleep 5

# Start frontend with admin API URL (port 3002)
echo -e "${GREEN}Starting frontend on port 5173...${NC}"
echo -e "${YELLOW}Note: Admin UI will connect to http://localhost:3002/local${NC}"
cd "$PROJECT_ROOT/frontend"
VITE_API_BASE_URL=http://localhost:3002/local npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}=== Services Started ===${NC}"
echo -e "  Admin Backend: ${GREEN}http://localhost:3002${NC}"
echo -e "  Frontend:      ${GREEN}http://localhost:5173${NC}"
echo -e "  Admin UI:      ${GREEN}http://localhost:5173/admin${NC}"
echo ""
echo -e "${YELLOW}Admin Token (for UI login):${NC}"
echo -e "  $ADMIN_TOKEN_LOCAL"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for processes
wait
