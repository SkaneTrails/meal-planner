# Meal Planner API - Production Dockerfile
# Multi-stage build for smaller image size

# Stage 1: Build dependencies
FROM python:3.14-slim@sha256:fa0acdcd760f0bf265bc2c1ee6120776c4d92a9c3a37289e17b9642ad2e5b83b AS builder

# Install uv for fast dependency resolution
# Pinned to digest for supply-chain security
COPY --from=ghcr.io/astral-sh/uv@sha256:78a7ff97cd27b7124a5f3c2aefe146170793c56a1e03321dd31a289f6d82a04f /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Create virtual environment and install from lockfile (production deps only)
RUN uv sync --frozen --no-dev --no-install-project

# Stage 2: Runtime image
FROM python:3.14-slim@sha256:fa0acdcd760f0bf265bc2c1ee6120776c4d92a9c3a37289e17b9642ad2e5b83b AS runtime

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
