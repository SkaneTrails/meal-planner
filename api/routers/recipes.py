"""Recipe API endpoints."""

import os
from typing import Annotated

import httpx
from fastapi import APIRouter, HTTPException, Query, status

from api.models.recipe import Recipe, RecipeCreate, RecipeScrapeRequest, RecipeUpdate
from api.storage import recipe_storage
from api.storage.firestore_client import DEFAULT_DATABASE, ENHANCED_DATABASE

router = APIRouter(prefix="/recipes", tags=["recipes"])

# URL for the scrape Cloud Function (local or production)
SCRAPE_FUNCTION_URL = os.getenv("SCRAPE_FUNCTION_URL", "http://localhost:8001")

# HTTP status code for unprocessable entity
_HTTP_422 = 422


@router.get("")
async def list_recipes(
    search: Annotated[str | None, Query(description="Search recipes by title")] = None,
    *,
    include_duplicates: Annotated[bool, Query(description="Include duplicate URLs")] = False,
    enhanced: Annotated[bool, Query(description="Use AI-enhanced recipes database")] = False,
) -> list[Recipe]:
    """Get all recipes, optionally filtered by search query."""
    database = ENHANCED_DATABASE if enhanced else DEFAULT_DATABASE
    if search:
        return recipe_storage.search_recipes(search)
    return recipe_storage.get_all_recipes(include_duplicates=include_duplicates, database=database)


@router.get("/{recipe_id}")
async def get_recipe(
    recipe_id: str, *, enhanced: Annotated[bool, Query(description="Use AI-enhanced recipes database")] = False
) -> Recipe:
    """Get a single recipe by ID."""
    database = ENHANCED_DATABASE if enhanced else DEFAULT_DATABASE
    recipe = recipe_storage.get_recipe(recipe_id, database=database)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return recipe


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_recipe(recipe: RecipeCreate) -> Recipe:
    """Create a new recipe manually."""
    return recipe_storage.save_recipe(recipe)


@router.post("/scrape", status_code=status.HTTP_201_CREATED)
async def scrape_recipe(request: RecipeScrapeRequest) -> Recipe:
    """Scrape a recipe from a URL and save it.

    This endpoint proxies to the scrape Cloud Function for isolation.
    """
    url = str(request.url)

    # Check if recipe already exists
    existing = recipe_storage.find_recipe_by_url(url)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Recipe from this URL already exists", "recipe_id": existing.id},
        )

    # Call the scrape function
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(SCRAPE_FUNCTION_URL, json={"url": url})

            if response.status_code == _HTTP_422:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Failed to scrape recipe from {url}"
                )

            response.raise_for_status()
            scraped_data = response.json()
    except httpx.TimeoutException as e:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Scraping request timed out") from e
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Scraping service error: {e.response.text}"
        ) from e
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Scraping service unavailable: {e!s}"
        ) from e

    # Create recipe from scraped data
    recipe_create = RecipeCreate(
        title=scraped_data["title"],
        url=scraped_data["url"],
        ingredients=scraped_data.get("ingredients", []),
        instructions=scraped_data.get("instructions", []),
        image_url=scraped_data.get("image_url"),
        servings=scraped_data.get("servings"),
        prep_time=scraped_data.get("prep_time"),
        cook_time=scraped_data.get("cook_time"),
        total_time=scraped_data.get("total_time"),
    )

    return recipe_storage.save_recipe(recipe_create)


@router.put("/{recipe_id}")
async def update_recipe(recipe_id: str, updates: RecipeUpdate) -> Recipe:
    """Update an existing recipe."""
    recipe = recipe_storage.update_recipe(recipe_id, updates)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(recipe_id: str) -> None:
    """Delete a recipe."""
    if not recipe_storage.delete_recipe(recipe_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
