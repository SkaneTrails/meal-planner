# Meal Planner API - Production Dockerfile
# Multi-stage build for smaller image size

# Stage 1: Build dependencies
FROM python:3.14-slim@sha256:1a3c6dbfd2173971abba880c3cc2ec4643690901f6ad6742d0827bae6cefc925 AS builder

# Install uv for fast dependency resolution
# Pinned to digest for supply-chain security
COPY --from=ghcr.io/astral-sh/uv@sha256:db9370c2b0b837c74f454bea914343da9f29232035aa7632a1b14dc03add9edb /uv /usr/local/bin/uv

WORKDIR /app

# Create virtual environment and install production dependencies
RUN uv venv && \
    uv pip install --no-cache \
    fastapi \
    uvicorn[standard] \
    google-cloud-firestore \
    google-cloud-storage \
    firebase-admin \
    pydantic \
    python-dotenv \
    python-multipart \
    httpx

# Stage 2: Runtime image
FROM python:3.14-slim@sha256:1a3c6dbfd2173971abba880c3cc2ec4643690901f6ad6742d0827bae6cefc925 AS runtime

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
