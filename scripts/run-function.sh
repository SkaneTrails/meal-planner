#!/usr/bin/env bash
# Start the Cloud Function locally for development

set -e

cd "$(dirname "$0")/../functions/scrape_recipe"

# Check if virtualenv exists, create if not
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment for Cloud Function..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi

echo "Starting scrape_recipe Cloud Function on http://localhost:8001"
.venv/bin/functions-framework --target=scrape_recipe_handler --port=8001
