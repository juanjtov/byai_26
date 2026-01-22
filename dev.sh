#!/bin/bash
# Starts both backend and frontend dev servers
# Run from project root with: ./dev.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}       REMODLY Development Server       ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Prerequisite checks
check_prereqs() {
    local has_error=0

    # Check if in venv
    if [[ -z "$VIRTUAL_ENV" ]]; then
        echo -e "${RED}[ERROR] Python venv not activated${NC}"
        echo -e "${YELLOW}  Run: source backend/venv/bin/activate${NC}"
        has_error=1
    else
        echo -e "${GREEN}[OK] Python venv active: $VIRTUAL_ENV${NC}"
    fi

    # Check node available
    if ! command -v node &> /dev/null; then
        echo -e "${RED}[ERROR] Node.js not found${NC}"
        echo -e "${YELLOW}  Install Node.js 18+ from https://nodejs.org${NC}"
        has_error=1
    else
        echo -e "${GREEN}[OK] Node.js $(node --version)${NC}"
    fi

    # Check npm available
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}[ERROR] npm not found${NC}"
        has_error=1
    else
        echo -e "${GREEN}[OK] npm $(npm --version)${NC}"
    fi

    # Check backend .env exists
    if [[ ! -f backend/.env ]]; then
        echo -e "${RED}[ERROR] backend/.env not found${NC}"
        echo -e "${YELLOW}  Copy backend/.env.example to backend/.env and configure${NC}"
        has_error=1
    else
        echo -e "${GREEN}[OK] backend/.env exists${NC}"
    fi

    # Check frontend .env exists
    if [[ ! -f frontend/.env ]]; then
        echo -e "${RED}[ERROR] frontend/.env not found${NC}"
        echo -e "${YELLOW}  Copy frontend/.env.example to frontend/.env and configure${NC}"
        has_error=1
    else
        echo -e "${GREEN}[OK] frontend/.env exists${NC}"
    fi

    # Check if node_modules exists
    if [[ ! -d frontend/node_modules ]]; then
        echo -e "${YELLOW}[WARN] frontend/node_modules not found${NC}"
        echo -e "${YELLOW}  Run: cd frontend && npm install${NC}"
        has_error=1
    fi

    echo ""

    if [[ $has_error -eq 1 ]]; then
        echo -e "${RED}Prerequisites check failed. Please fix the issues above.${NC}"
        exit 1
    fi

    echo -e "${GREEN}All prerequisites met!${NC}"
    echo ""
}

check_prereqs

# Trap to cleanup background processes on exit
BACKEND_PID=""
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    if [[ -n "$BACKEND_PID" ]]; then
        kill $BACKEND_PID 2>/dev/null
        wait $BACKEND_PID 2>/dev/null
    fi
    echo -e "${GREEN}Servers stopped.${NC}"
}
trap cleanup EXIT INT TERM

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
echo -e "${BLUE}  API: http://localhost:8000${NC}"
echo -e "${BLUE}  Docs: http://localhost:8000/docs${NC}"
echo ""

cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 2>&1 | while IFS= read -r line; do
    echo -e "${YELLOW}[BACKEND]${NC} $line"
done &
BACKEND_PID=$!
cd ..

# Give backend a moment to start
sleep 2

# Start frontend
echo -e "${BLUE}Starting frontend server...${NC}"
echo -e "${BLUE}  App: http://localhost:5173${NC}"
echo ""

cd frontend
npm run dev
