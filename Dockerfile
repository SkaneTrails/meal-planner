# Meal Planner API - Production Dockerfile
# Multi-stage build for smaller image size

# Stage 1: Build dependencies
FROM python:3.13-slim AS builder

# Install uv for fast dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Create virtual environment and install production dependencies
RUN uv venv && \
    uv pip install --no-cache \
    fastapi \
    uvicorn[standard] \
    google-cloud-firestore \
    firebase-admin \
    pydantic \
    python-dotenv \
    httpx

# Stage 2: Runtime image
FROM python:3.13-slim AS runtime

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Set PATH to use venv
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

# Copy application code
COPY api/ ./api/

# Cloud Run sets PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Health check (removed - Cloud Run does its own probes)

# Run the application
CMD ["python", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
