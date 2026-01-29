#!/usr/bin/env bash
# Start all services for local development

set -e

cd "$(dirname "$0")/.."

echo "================================================"
echo "  Meal Planner - Local Development"
echo "================================================"
echo ""
echo "Starting services:"
echo "  - FastAPI:         http://localhost:8000"
echo "  - API Docs:        http://localhost:8000/api/docs"
echo "  - Cloud Function:  http://localhost:8001"
echo ""
echo "Press Ctrl+C to stop all services"
echo "================================================"
echo ""

# Start Cloud Function in background
./scripts/run-function.sh &
FUNCTION_PID=$!

# Cleanup on exit (must be set before any blocking command)
trap "kill $FUNCTION_PID 2>/dev/null" EXIT INT TERM

# Give function time to start
sleep 2

# Start API (foreground)
./scripts/run-api.sh
