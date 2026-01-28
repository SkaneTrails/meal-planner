"""Recipe scraping service using recipe-scrapers library."""

import re
import sys
from collections.abc import Callable
from dataclasses import dataclass, field

import httpx
from recipe_scrapers import scrape_html


@dataclass
class Recipe:
    """A scraped recipe (simplified model for the Cloud Function)."""

    title: str
    url: str
    ingredients: list[str] = field(default_factory=list)
    instructions: list[str] = field(default_factory=list)
    image_url: str | None = None
    servings: int | None = None
    prep_time: int | None = None
    cook_time: int | None = None
    total_time: int | None = None


def _safe_get[T](func: Callable[[], T], default: T) -> T:
    """Safely call a scraper method, returning default if it raises an exception."""
    try:
        result = func()
        return result if result is not None else default
    except Exception:
        return default


def _safe_get_optional[T](func: Callable[[], T]) -> T | None:
    """Safely call a scraper method, returning None if it raises an exception."""
    try:
        return func()
    except Exception:
        return None


def _safe_int(value: str | int | None) -> int | None:
    """Safely convert a value to int, extracting numbers from strings like '4 servings'."""
    if value is None:
        return None
    if isinstance(value, int):
        return value
    match = re.search(r"\d+", str(value))
    return int(match.group()) if match else None


def scrape_recipe(url: str) -> Recipe | None:
    """
    Scrape a recipe from a URL.

    Args:
        url: The URL of the recipe to scrape.

    Returns:
        A Recipe object if successful, None otherwise.
    """
    try:
        response = httpx.get(url, follow_redirects=True, timeout=30.0)
        response.raise_for_status()
        html = response.text

        scraper = scrape_html(html, org_url=url)

        instructions = _safe_get(scraper.instructions_list, [])
        if not instructions:
            raw_instructions = _safe_get(scraper.instructions, "")
            instructions = [step.strip() for step in raw_instructions.split("\n") if step.strip()]

        return Recipe(
            title=_safe_get(scraper.title, "Unknown Recipe"),
            url=url,
            ingredients=_safe_get(scraper.ingredients, []),
            instructions=instructions,
            image_url=_safe_get_optional(scraper.image),
            servings=_safe_int(_safe_get_optional(scraper.yields)),
            prep_time=_safe_get_optional(scraper.prep_time),
            cook_time=_safe_get_optional(scraper.cook_time),
            total_time=_safe_get_optional(scraper.total_time),
        )
    except Exception as e:
        print(f"Recipe scraping error for {url}: {type(e).__name__}: {e}", file=sys.stderr)
        return None
