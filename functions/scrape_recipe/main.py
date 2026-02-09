"""Recipe scraping Cloud Function.

This Cloud Function scrapes recipes from URLs using the recipe-scrapers library.
It runs in isolation from the main API for better fault tolerance and auto-scaling.

Supports two modes:
1. Server-side scraping: POST {"url": "..."} - Function fetches HTML
2. Client-side parsing: POST {"url": "...", "html": "..."} - Client provides HTML
"""

import functions_framework
from flask import Request, jsonify
from recipe_scraper import ScrapeError, parse_recipe_html, scrape_recipe

_CORS_HEADERS = {"Access-Control-Allow-Origin": "*"}


def _validate_request(request: Request) -> tuple | dict:
    """Validate the incoming request, returning parsed JSON or an error tuple."""
    if request.method != "POST":
        return (jsonify({"error": "Method not allowed"}), 405, _CORS_HEADERS)

    try:
        request_json = request.get_json(silent=True)
    except Exception:
        return (jsonify({"error": "Invalid JSON"}), 400, _CORS_HEADERS)

    if not isinstance(request_json, dict) or "url" not in request_json:
        return (jsonify({"error": "Missing 'url' in request body"}), 400, _CORS_HEADERS)

    return request_json


@functions_framework.http
def scrape_recipe_handler(request: Request) -> tuple:
    """HTTP Cloud Function to scrape a recipe from a URL.

    Args:
        request: The Flask request object.
            Expected JSON body: {"url": "https://example.com/recipe"}

    Returns:
        JSON response with the scraped recipe or an error message.
    """
    if request.method == "OPTIONS":
        preflight_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        }
        return ("", 204, preflight_headers)

    validated = _validate_request(request)
    if isinstance(validated, tuple):
        return validated

    url = validated["url"]
    html = validated.get("html")

    if html:
        recipe = parse_recipe_html(html, url)
        if recipe is None:
            return (
                jsonify({"error": f"Failed to parse recipe from {url}", "reason": "parse_failed"}),
                422,
                _CORS_HEADERS,
            )
    else:
        result = scrape_recipe(url)
        if isinstance(result, ScrapeError):
            status_code = 422 if result.reason == ScrapeError.PARSE_FAILED else 403
            return (jsonify({"error": result.message, "reason": result.reason}), status_code, _CORS_HEADERS)
        recipe = result

    return (
        jsonify(
            {
                "title": recipe.title,
                "url": recipe.url,
                "ingredients": recipe.ingredients,
                "instructions": recipe.instructions,
                "image_url": recipe.image_url,
                "servings": recipe.servings,
                "prep_time": recipe.prep_time,
                "cook_time": recipe.cook_time,
                "total_time": recipe.total_time,
            }
        ),
        200,
        _CORS_HEADERS,
    )
