#!/usr/bin/env bash
# Start the FastAPI server locally for development

set -e

cd "$(dirname "$0")/.."

echo "Starting FastAPI server on http://localhost:8000"
echo "API docs available at http://localhost:8000/api/docs"
echo ""

uv run uvicorn api.main:app --reload --port 8000
