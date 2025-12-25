"""Recipe scraping service using recipe-scrapers library."""

import httpx
from recipe_scrapers import scrape_html

from app.models.recipe import Recipe


def scrape_recipe(url: str) -> Recipe | None:
    """
    Scrape a recipe from a URL.

    Args:
        url: The URL of the recipe to scrape.

    Returns:
        A Recipe object if successful, None otherwise.
    """
    try:
        # Fetch the HTML content
        response = httpx.get(url, follow_redirects=True, timeout=30.0)
        response.raise_for_status()
        html = response.text

        # Parse the recipe
        scraper = scrape_html(html, org_url=url)

        # Extract instructions as a list
        instructions = scraper.instructions_list()
        if not instructions:
            # Fall back to splitting by newlines if instructions_list() is empty
            raw_instructions = scraper.instructions()
            instructions = [step.strip() for step in raw_instructions.split("\n") if step.strip()]

        return Recipe(
            title=scraper.title(),
            url=url,
            ingredients=scraper.ingredients(),
            instructions=instructions,
            image_url=scraper.image(),
            servings=_safe_int(scraper.yields()),
            prep_time=scraper.prep_time(),
            cook_time=scraper.cook_time(),
            total_time=scraper.total_time(),
        )
    except Exception:  # noqa: BLE001
        # Return None for any scraping errors
        return None


def _safe_int(value: str | int | None) -> int | None:
    """Safely convert a value to int, extracting numbers from strings like '4 servings'."""
    if value is None:
        return None
    if isinstance(value, int):
        return value
    # Try to extract a number from the string
    import re

    match = re.search(r"\d+", str(value))
    return int(match.group()) if match else None
