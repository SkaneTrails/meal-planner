"""Recipe scraping Cloud Function.

This Cloud Function scrapes recipes from URLs using the recipe-scrapers library.
It runs in isolation from the main API for better fault tolerance and auto-scaling.

Supports two modes:
1. Server-side scraping: POST {"url": "..."} - Function fetches HTML
2. Client-side parsing: POST {"url": "...", "html": "..."} - Client provides HTML
"""

import functions_framework
from flask import Request, jsonify
from recipe_scraper import parse_recipe_html, scrape_recipe


@functions_framework.http
def scrape_recipe_handler(request: Request) -> tuple:
    """HTTP Cloud Function to scrape a recipe from a URL.

    Args:
        request: The Flask request object.
            Expected JSON body: {"url": "https://example.com/recipe"}

    Returns:
        JSON response with the scraped recipe or an error message.
    """
    # Handle CORS preflight
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        }
        return ("", 204, headers)

    # Set CORS headers for the main request
    headers = {"Access-Control-Allow-Origin": "*"}

    # Validate request
    if request.method != "POST":
        return (jsonify({"error": "Method not allowed"}), 405, headers)

    try:
        request_json = request.get_json(silent=True)
    except Exception:
        return (jsonify({"error": "Invalid JSON"}), 400, headers)

    if not request_json or "url" not in request_json:
        return (jsonify({"error": "Missing 'url' in request body"}), 400, headers)

    url = request_json["url"]
    html = request_json.get("html")

    # If HTML is provided, parse it directly (client-side scraping)
    # Otherwise, fetch the HTML from the URL (server-side scraping)
    recipe = parse_recipe_html(html, url) if html else scrape_recipe(url)

    if recipe is None:
        return (jsonify({"error": f"Failed to scrape recipe from {url}"}), 422, headers)

    # Return the recipe as JSON
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
        headers,
    )
