"""Recipe query and pagination helpers.

Extracted from recipe_storage to keep modules within the 500-line limit.
Provides batch fetch, household-scoped listing, and cursor-based pagination.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, cast

from google.cloud.firestore_v1 import FieldFilter

if TYPE_CHECKING:
    from google.cloud.firestore_v1.client import Client as FirestoreClient

    from api.models.recipe import Recipe

from api.storage.firestore_client import RECIPES_COLLECTION, get_firestore_client
from api.storage.recipe_storage import _doc_to_recipe, normalize_url

_HIDDEN_FILTER = FieldFilter("hidden", "==", False)  # noqa: FBT003


def get_recipes_by_ids(recipe_ids: set[str]) -> dict[str, Recipe]:
    """Batch-fetch multiple recipes by their IDs using Firestore get_all().

    Args:
        recipe_ids: Set of Firestore document IDs to fetch.

    Returns:
        Dict mapping recipe ID to Recipe for documents that exist.
    """
    if not recipe_ids:
        return {}

    db = get_firestore_client()
    doc_refs = [db.collection(RECIPES_COLLECTION).document(rid) for rid in recipe_ids]
    snapshots = db.get_all(doc_refs)

    recipes: dict[str, Recipe] = {}
    for doc in snapshots:
        if doc.exists:
            data = doc.to_dict()
            if data is not None:
                recipes[doc.id] = _doc_to_recipe(doc.id, data)

    return recipes


def count_recipes(*, household_id: str | None = None, show_hidden: bool = False) -> int:
    """Count total recipes visible to a household using Firestore aggregation.

    Uses server-side COUNT aggregation to avoid fetching all documents.
    For household-scoped queries, counts owned + shared recipes (deduplication
    may cause the actual unique count to be slightly lower).

    Args:
        household_id: If provided, count owned + shared recipes.
                      If None, count all recipes (for superusers).
        show_hidden: If False (default), exclude hidden recipes from count.

    Returns:
        Total number of matching recipes.
    """
    db = get_firestore_client()
    collection = db.collection(RECIPES_COLLECTION)

    if household_id is None:
        q = collection
        if not show_hidden:
            q = q.where(filter=_HIDDEN_FILTER)
        result = q.count().get()
        return result[0][0].value  # type: ignore[index]

    owned_query = collection.where(filter=FieldFilter("household_id", "==", household_id))
    if not show_hidden:
        owned_query = owned_query.where(filter=_HIDDEN_FILTER)
    owned_result = owned_query.count().get()
    owned_count = owned_result[0][0].value  # type: ignore[index]

    shared_not_owned_query = collection.where(filter=FieldFilter("visibility", "==", "shared")).where(
        filter=FieldFilter("household_id", "!=", household_id)
    )
    if not show_hidden:
        shared_not_owned_query = shared_not_owned_query.where(filter=_HIDDEN_FILTER)
    shared_result = shared_not_owned_query.count().get()
    shared_count = shared_result[0][0].value  # type: ignore[index]

    return owned_count + shared_count


def _build_household_query(db: FirestoreClient, household_id: str | None, *, show_hidden: bool = False) -> list:
    """Build Firestore queries for recipes visible to a household.

    For regular users, we need two queries: owned recipes + shared recipes.
    Firestore doesn't support OR filters across different fields, so we
    run two queries and merge results.

    Uses secondary sort on document ID for deterministic ordering.

    Args:
        db: Firestore client instance.
        household_id: If provided, scope to this household. None = all recipes (superuser).
        show_hidden: If False (default), exclude hidden recipes.

    Returns:
        List of Firestore query objects to execute.
    """
    collection = db.collection(RECIPES_COLLECTION)

    if household_id is None:
        q = collection
        if not show_hidden:
            q = q.where(filter=_HIDDEN_FILTER)
        return [q.order_by("created_at", direction="DESCENDING").order_by("__name__", direction="DESCENDING")]

    owned_query = collection.where(filter=FieldFilter("household_id", "==", household_id))
    if not show_hidden:
        owned_query = owned_query.where(filter=_HIDDEN_FILTER)
    owned_query = owned_query.order_by("created_at", direction="DESCENDING").order_by(
        "__name__", direction="DESCENDING"
    )
    shared_query = collection.where(filter=FieldFilter("visibility", "==", "shared"))
    if not show_hidden:
        shared_query = shared_query.where(filter=_HIDDEN_FILTER)
    shared_query = shared_query.order_by("created_at", direction="DESCENDING").order_by(
        "__name__", direction="DESCENDING"
    )
    return [owned_query, shared_query]


def _deduplicate_recipes(recipes: list[Recipe]) -> list[Recipe]:
    """Deduplicate recipes by normalized URL, keeping the most recent."""
    seen_urls: set[str] = set()
    unique: list[Recipe] = []
    for recipe in recipes:
        normalized = normalize_url(recipe.url) if recipe.url else f"__no_url_{recipe.id}"
        if normalized not in seen_urls:
            seen_urls.add(normalized)
            unique.append(recipe)
    return unique


def get_all_recipes(
    *, include_duplicates: bool = False, household_id: str | None = None, show_hidden: bool = False
) -> list[Recipe]:
    """Get all recipes visible to a household.

    Uses Firestore server-side filtering when household_id is provided,
    avoiding full collection scans.

    Args:
        include_duplicates: If False (default), deduplicate by URL.
        household_id: If provided, filter to owned + shared recipes server-side.
                      If None, return all recipes (for superusers).
        show_hidden: If False (default), exclude hidden recipes.

    Returns:
        List of recipes, newest first.
    """
    db = get_firestore_client()
    queries = _build_household_query(db, household_id, show_hidden=show_hidden)

    seen_ids: set[str] = set()
    recipes: list[Recipe] = []

    for query in queries:
        for doc in query.stream():
            if doc.id in seen_ids:
                continue
            seen_ids.add(doc.id)
            data = doc.to_dict()
            recipes.append(_doc_to_recipe(doc.id, data))

    # Re-sort after merging multiple queries
    if len(queries) > 1:
        recipes.sort(key=lambda r: (r.created_at or "", r.id), reverse=True)

    if include_duplicates:
        return recipes

    return _deduplicate_recipes(recipes)


def _stream_unique_recipes(
    queries: list, *, cursor_doc: object | None, target: int, include_duplicates: bool
) -> list[Recipe]:
    """Stream recipes from queries, deduplicating by ID and optionally by URL.

    Collects up to `target` unique recipes across all queries.
    """
    seen_ids: set[str] = set()
    seen_urls: set[str] = set()
    results: list[Recipe] = []

    for query in queries:
        q = query
        if cursor_doc is not None:
            q = q.start_after(cursor_doc)

        for doc in q.limit(target).stream():
            if doc.id in seen_ids:
                continue
            seen_ids.add(doc.id)

            data = doc.to_dict()
            recipe = _doc_to_recipe(doc.id, data)

            if not include_duplicates:
                normalized = normalize_url(recipe.url) if recipe.url else f"__no_url_{recipe.id}"
                if normalized in seen_urls:
                    continue
                seen_urls.add(normalized)

            results.append(recipe)
            if len(results) >= target:
                return results

    return results


def get_recipes_paginated(
    *,
    household_id: str | None = None,
    limit: int = 50,
    cursor: str | None = None,
    include_duplicates: bool = False,
    show_hidden: bool = False,
) -> tuple[list[Recipe], str | None]:
    """Get a paginated page of recipes visible to a household.

    Uses cursor-based pagination (recipe ID as cursor). Fetches limit+1
    documents to determine if more pages exist.

    For household users (2 queries), results are merged, sorted by (created_at, id),
    and deduplicated by URL. The function collects enough unique items to reliably
    determine whether more pages exist even after deduplication.

    Args:
        household_id: If provided, filter to owned + shared recipes.
        limit: Maximum number of recipes to return per page.
        cursor: Recipe ID from which to start (exclusive). None for first page.
        include_duplicates: If False, deduplicate by URL.
        show_hidden: If False (default), exclude hidden recipes.

    Returns:
        Tuple of (recipes, next_cursor). next_cursor is None if no more pages.
    """
    db = get_firestore_client()
    queries = _build_household_query(db, household_id, show_hidden=show_hidden)

    cursor_doc = None
    if cursor:
        cursor_doc = cast("Any", db.collection(RECIPES_COLLECTION).document(cursor).get())
        if not cursor_doc.exists:
            cursor_doc = None

    all_recipes = _stream_unique_recipes(
        queries, cursor_doc=cursor_doc, target=limit + 1, include_duplicates=include_duplicates
    )

    # Re-sort after merging multiple queries
    if len(queries) > 1:
        all_recipes.sort(key=lambda r: (r.created_at or "", r.id), reverse=True)

    if len(all_recipes) > limit:
        page = all_recipes[:limit]
        next_cursor = page[-1].id
        return page, next_cursor

    return all_recipes, None
