"""FastAPI application entry point."""  # pragma: no cover

import os

from dotenv import load_dotenv
from fastapi import FastAPI
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

# CORS configuration
# Allows both local development and production domains
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:8081,http://localhost:8085,http://localhost:19006,http://localhost:3000,https://hikes-482104.web.app,https://hikes-482104.firebaseapp.com",
).split(",")

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


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for Cloud Run."""
    return {"status": "healthy"}


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint with API information."""
    return {"name": "Meal Planner API", "version": "0.1.0", "docs": "/api/docs"}
