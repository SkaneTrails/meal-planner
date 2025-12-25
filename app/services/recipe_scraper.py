"""Recipe scraping service using recipe-scrapers library."""

import httpx
from recipe_scrapers import scrape_html

from app.models.recipe import Recipe


def _safe_get(func, default=None):
    """Safely call a scraper method, returning default if it raises an exception."""
    try:
        return func()
    except Exception:  # noqa: BLE001
        return default


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
        instructions = _safe_get(scraper.instructions_list, [])
        if not instructions:
            # Fall back to splitting by newlines if instructions_list() is empty
            raw_instructions = _safe_get(scraper.instructions, "")
            instructions = [step.strip() for step in raw_instructions.split("\n") if step.strip()]

        return Recipe(
            title=_safe_get(scraper.title, "Unknown Recipe"),
            url=url,
            ingredients=_safe_get(scraper.ingredients, []),
            instructions=instructions,
            image_url=_safe_get(scraper.image),
            servings=_safe_int(_safe_get(scraper.yields)),
            prep_time=_safe_get(scraper.prep_time),
            cook_time=_safe_get(scraper.cook_time),
            total_time=_safe_get(scraper.total_time),
        )
    except Exception as e:  # noqa: BLE001
        # Log the error for debugging
        import sys

        print(f"Recipe scraping error for {url}: {type(e).__name__}: {e}", file=sys.stderr)
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
