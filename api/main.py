"""FastAPI application entry point."""

import os
from collections.abc import Awaitable, Callable

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from api.routers import admin, grocery, meal_plans, recipes

load_dotenv()

app = FastAPI(
    title="Meal Planner API",
    description="Recipe collector and weekly meal planner API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS configuration — must be set via ALLOWED_ORIGINS env var or .env
ALLOWED_ORIGINS = os.environ["ALLOWED_ORIGINS"].split(",")

app.add_middleware(
    CORSMiddleware,  # type: ignore[arg-type]  # Starlette stubs issue
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api/v1 prefix
app.include_router(recipes.router, prefix="/api/v1")
app.include_router(meal_plans.router, prefix="/api/v1")
app.include_router(grocery.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.middleware("http")
async def security_headers(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    """Add standard security headers to every response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for Cloud Run."""
    return {"status": "healthy"}


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint with API information."""
    return {"name": "Meal Planner API", "version": "0.1.0", "docs": "/api/docs"}
