#!/usr/bin/env bash
# Start all services for local development (API + Expo)

set -e

cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

echo "================================================"
echo "  Meal Planner - Local Development"
echo "================================================"
echo ""
echo "Starting services:"
echo "  - FastAPI:    http://localhost:8000"
echo "  - API Docs:   http://localhost:8000/api/docs"
echo "  - Expo Web:   http://localhost:8081"
echo ""
echo "Press Ctrl+C to stop all services"
echo "================================================"
echo ""

# Kill any existing processes on our ports
echo "Cleaning up old processes..."
pkill -f "uvicorn api.main:app" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
sleep 1

# Start API server in background
echo "Starting API server..."
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload &
API_PID=$!

# Give API time to start
sleep 2

# Verify API is running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "ERROR: API server failed to start"
    kill $API_PID 2>/dev/null
    exit 1
fi
echo "✓ API server running on http://localhost:8000"

# Start Expo in background
echo "Starting Expo..."
cd "$PROJECT_ROOT/mobile"
npx expo start --lan &
EXPO_PID=$!

# Cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $API_PID 2>/dev/null || true
    kill $EXPO_PID 2>/dev/null || true
    exit 0
}
trap cleanup EXIT INT TERM

# Wait for both processes
echo ""
echo "✓ All services started. Press Ctrl+C to stop."
echo ""
wait
