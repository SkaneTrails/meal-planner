"""Recipe storage service using Firestore."""

from __future__ import annotations

import contextlib
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import cast
from urllib.parse import urlparse

from google.cloud.firestore_v1 import DocumentSnapshot, FieldFilter

from api.models.recipe import DietLabel, MealLabel, OriginalRecipe, Recipe, RecipeCreate, RecipeUpdate
from api.storage.firestore_client import RECIPES_COLLECTION, get_firestore_client


@dataclass
class EnhancementMetadata:
    """Metadata for AI-enhanced recipes.

    Groups enhancement-related fields to reduce parameter count on save_recipe.
    """

    enhanced: bool = False
    enhanced_at: datetime | None = None
    changes_made: list[str] = field(default_factory=list)


def normalize_url(url: str) -> str:
    """Normalize a URL for comparison (remove trailing slashes, fragments, etc.)."""
    if not url:
        return ""
    parsed = urlparse(url.lower().strip())
    path = parsed.path.rstrip("/")
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def _doc_to_recipe(doc_id: str, data: dict) -> Recipe:
    """Convert Firestore document data to Recipe model."""
    diet_label = None
    if data.get("diet_label"):
        with contextlib.suppress(ValueError):
            diet_label = DietLabel(data["diet_label"])

    meal_label = None
    if data.get("meal_label"):
        with contextlib.suppress(ValueError):
            meal_label = MealLabel(data["meal_label"])

    return Recipe(
        id=doc_id,
        title=data.get("title", ""),
        url=data.get("url", ""),
        ingredients=data.get("ingredients", []),
        instructions=data.get("instructions", []),
        image_url=data.get("image_url"),
        thumbnail_url=data.get("thumbnail_url"),
        servings=data.get("servings"),
        prep_time=data.get("prep_time"),
        cook_time=data.get("cook_time"),
        total_time=data.get("total_time"),
        cuisine=data.get("cuisine"),
        category=data.get("category"),
        tags=data.get("tags", []),
        diet_label=diet_label,
        meal_label=meal_label,
        rating=data.get("rating"),
        hidden=data.get("hidden", False),
        favorited=data.get("favorited", False),
        # Timestamp fields
        created_at=data.get("created_at"),
        updated_at=data.get("updated_at"),
        # AI enhancement fields
        enhanced=data.get("enhanced", False),
        enhanced_at=data.get("enhanced_at"),
        tips=data.get("tips"),
        changes_made=data.get("changes_made"),
        original=data.get("original"),
        show_enhanced=data.get("show_enhanced", False),
        enhancement_reviewed=data.get("enhancement_reviewed", False),
        # Household fields
        household_id=data.get("household_id"),
        visibility=raw_vis if (raw_vis := data.get("visibility")) in ("household", "shared") else "household",
        created_by=data.get("created_by"),
    )


def find_recipe_by_url(url: str) -> Recipe | None:
    """
    Find a recipe by its URL.

    Uses a two-step strategy:
    1. Exact URL match via Firestore query
    2. Normalized URL match via indexed ``normalized_url`` field

    Args:
        url: The recipe URL to search for.

    Returns:
        Recipe if found, None otherwise.
    """
    if not url:
        return None

    db = get_firestore_client()
    normalized = normalize_url(url)

    # Step 1: exact URL match
    docs = db.collection(RECIPES_COLLECTION).where(filter=FieldFilter("url", "==", url)).limit(1).stream()

    for doc in docs:
        data = doc.to_dict()
        return _doc_to_recipe(doc.id, data)

    # Step 2: normalized URL match (handles trailing slashes, case differences)
    if normalized:
        docs = (
            db.collection(RECIPES_COLLECTION)
            .where(filter=FieldFilter("normalized_url", "==", normalized))
            .limit(1)
            .stream()
        )
        for doc in docs:
            data = doc.to_dict()
            return _doc_to_recipe(doc.id, data)

    return None


def save_recipe(
    recipe: RecipeCreate,
    *,
    recipe_id: str | None = None,
    enhancement: EnhancementMetadata | None = None,
    household_id: str | None = None,
    created_by: str | None = None,
) -> Recipe:
    """Save a new recipe to Firestore.

    Args:
        recipe: The recipe to save.
        recipe_id: Optional ID to use (for saving enhanced versions with same ID).
        enhancement: Optional AI enhancement metadata.
        household_id: The household that owns this recipe.
        created_by: Email of the user who created the recipe.

    Returns:
        The saved recipe with its document ID.
    """
    meta = enhancement or EnhancementMetadata()
    db = get_firestore_client()
    doc_ref = (
        db.collection(RECIPES_COLLECTION).document(recipe_id)
        if recipe_id
        else db.collection(RECIPES_COLLECTION).document()
    )

    # Snapshot original data before overwriting with enhanced version
    original_snapshot: OriginalRecipe | None = None
    existing_created_at: datetime | None = None
    if meta.enhanced and recipe_id:
        existing = cast("DocumentSnapshot", doc_ref.get())
        if existing.exists:
            existing_data = existing.to_dict() or {}
            existing_created_at = existing_data.get("created_at")

            # Reuse preserved original snapshot if recipe was already enhanced
            existing_original = existing_data.get("original")
            if isinstance(existing_original, dict) and existing_original:
                original_snapshot = OriginalRecipe(
                    title=existing_original.get("title", ""),
                    ingredients=existing_original.get("ingredients", []),
                    instructions=existing_original.get("instructions", []),
                    servings=existing_original.get("servings"),
                    prep_time=existing_original.get("prep_time"),
                    cook_time=existing_original.get("cook_time"),
                    total_time=existing_original.get("total_time"),
                    image_url=existing_original.get("image_url"),
                )
            else:
                original_snapshot = OriginalRecipe(
                    title=existing_data.get("title", ""),
                    ingredients=existing_data.get("ingredients", []),
                    instructions=existing_data.get("instructions", []),
                    servings=existing_data.get("servings"),
                    prep_time=existing_data.get("prep_time"),
                    cook_time=existing_data.get("cook_time"),
                    total_time=existing_data.get("total_time"),
                    image_url=existing_data.get("image_url"),
                )

    now = datetime.now(tz=UTC)
    created_at = existing_created_at if existing_created_at else now
    data = {
        "title": recipe.title,
        "url": recipe.url,
        "normalized_url": normalize_url(recipe.url),
        "ingredients": recipe.ingredients,
        "instructions": recipe.instructions,
        "image_url": recipe.image_url,
        "thumbnail_url": recipe.thumbnail_url,
        "servings": recipe.servings,
        "prep_time": recipe.prep_time,
        "cook_time": recipe.cook_time,
        "total_time": recipe.total_time,
        "cuisine": recipe.cuisine,
        "category": recipe.category,
        "tags": recipe.tags,
        "tips": recipe.tips,
        "diet_label": recipe.diet_label.value if recipe.diet_label else None,
        "meal_label": recipe.meal_label.value if recipe.meal_label else None,
        "created_at": created_at,
        "updated_at": now,
        # Household fields
        "household_id": household_id,
        "visibility": recipe.visibility if hasattr(recipe, "visibility") else "household",
        "created_by": created_by,
    }

    # Add enhancement fields if present
    if meta.enhanced:
        data["enhanced"] = meta.enhanced
        data["show_enhanced"] = False
        data["enhancement_reviewed"] = False
    if meta.enhanced_at:
        data["enhanced_at"] = meta.enhanced_at
    if meta.changes_made:
        data["changes_made"] = meta.changes_made
    if original_snapshot:
        data["original"] = original_snapshot.model_dump()

    doc_ref.set(data, merge=True)

    # Type cast visibility to match Recipe model's Literal type
    visibility_value = data["visibility"]
    if visibility_value not in ("household", "shared"):
        visibility_value = "household"

    return Recipe(
        id=doc_ref.id,
        created_at=created_at,
        updated_at=now,
        enhanced=meta.enhanced,
        enhanced_at=meta.enhanced_at,
        changes_made=meta.changes_made or None,
        original=original_snapshot,
        show_enhanced=False,
        enhancement_reviewed=False,
        household_id=household_id,
        visibility=visibility_value,  # type: ignore[arg-type]
        created_by=created_by,
        **recipe.model_dump(exclude={"household_id", "visibility", "created_by"}),
    )


def update_recipe(recipe_id: str, updates: RecipeUpdate, *, household_id: str | None = None) -> Recipe | None:
    """
    Update an existing recipe in Firestore.

    Args:
        recipe_id: The Firestore document ID.
        updates: The fields to update.
        household_id: If provided, verify the recipe belongs to this household before updating.

    Returns:
        The updated recipe, or None if not found or not authorized.
    """
    db = get_firestore_client()
    doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)

    doc = cast("DocumentSnapshot", doc_ref.get())
    if not doc.exists:
        return None

    data = doc.to_dict()

    # Verify household ownership if specified
    if household_id is not None:
        recipe_household = data.get("household_id") if data else None
        # Only allow update if recipe is owned by this household
        if recipe_household != household_id:
            return None

    # Only update fields that are set
    update_data = {"updated_at": datetime.now(tz=UTC)}
    for field_name, value in updates.model_dump(exclude_unset=True).items():
        if field_name in ("diet_label", "meal_label") and value is not None:
            update_data[field_name] = value.value if hasattr(value, "value") else value
        else:
            update_data[field_name] = value

    # Keep normalized_url in sync when URL changes
    if "url" in update_data:
        update_data["normalized_url"] = normalize_url(str(update_data["url"]))

    doc_ref.update(update_data)

    # Return the updated recipe
    return get_recipe(recipe_id)


def get_recipe(recipe_id: str) -> Recipe | None:
    """
    Get a recipe by ID.

    Args:
        recipe_id: The Firestore document ID.

    Returns:
        The recipe if found, None otherwise.
    """
    db = get_firestore_client()
    doc = cast("DocumentSnapshot", db.collection(RECIPES_COLLECTION).document(recipe_id).get())

    if not doc.exists:
        return None

    data = doc.to_dict()
    if data is None:
        return None

    return _doc_to_recipe(doc.id, data)


def delete_recipe(recipe_id: str, *, household_id: str | None = None) -> bool:
    """
    Delete a recipe by ID.

    Args:
        recipe_id: The Firestore document ID.
        household_id: If provided, verify the recipe belongs to this household before deleting.

    Returns:
        True if deleted, False if not found or not authorized.
    """
    db = get_firestore_client()
    doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)

    doc = cast("DocumentSnapshot", doc_ref.get())
    if not doc.exists:
        return False

    data = doc.to_dict()

    # Verify household ownership if specified
    if household_id is not None and data:
        recipe_household = data.get("household_id")
        # Only allow delete if recipe is owned by this household
        if recipe_household != household_id:
            return False

    doc_ref.delete()
    return True


def review_enhancement(recipe_id: str, *, approve: bool, household_id: str) -> Recipe | None:
    """
    Review an enhanced recipe - approve or reject the enhancement.

    Args:
        recipe_id: The Firestore document ID.
        approve: True to show enhanced version, False to show original.
        household_id: Verify the recipe belongs to this household.

    Returns:
        The updated recipe, or None if not found/not authorized/not enhanced.
    """
    db = get_firestore_client()
    doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)

    doc = cast("DocumentSnapshot", doc_ref.get())
    if not doc.exists:
        return None

    data = doc.to_dict()
    if not data:
        return None

    # Verify household ownership
    if data.get("household_id") != household_id:
        return None

    # Recipe must be enhanced
    if not data.get("enhanced", False):
        return None

    # Update the review status
    update_data = {"enhancement_reviewed": True, "show_enhanced": approve, "updated_at": datetime.now(tz=UTC)}
    doc_ref.update(update_data)
    data.update(update_data)

    return _doc_to_recipe(recipe_id, data)


def search_recipes(query: str, *, household_id: str | None = None, show_hidden: bool = False) -> list[Recipe]:
    """
    Search recipes by title (case-sensitive prefix match).

    Note: Firestore range queries are case-sensitive. For case-insensitive
    search, consider storing a normalized title field.

    Args:
        query: The search query.
        household_id: If provided, filter to recipes owned by this household OR shared recipes.
                      If None, return all matching recipes (for superusers).
        show_hidden: If False (default), exclude hidden recipes.

    Returns:
        List of matching recipes.
    """
    db = get_firestore_client()
    base_query = (
        db.collection(RECIPES_COLLECTION)
        .where(filter=FieldFilter("title", ">=", query))
        .where(filter=FieldFilter("title", "<=", query + "\uf8ff"))
    )
    if not show_hidden:
        base_query = base_query.where(filter=FieldFilter("hidden", "==", False))  # noqa: FBT003
    docs = base_query.stream()

    recipes = []
    for doc in docs:
        data = doc.to_dict()
        recipe = _doc_to_recipe(doc.id, data)

        # Apply household filtering if specified
        if household_id is not None:
            is_owned = recipe.household_id == household_id
            is_shared = recipe.visibility == "shared"

            if not (is_owned or is_shared):
                continue

        recipes.append(recipe)

    return recipes


def copy_recipe(recipe_id: str, *, to_household_id: str, copied_by: str) -> Recipe | None:
    """
    Create a copy of a recipe for a different household.

    This is used when:
    - A user wants to copy a shared recipe to their household
    - Before enhancing a shared recipe (creates household-owned copy first)

    Args:
        recipe_id: The recipe to copy.
        to_household_id: The household that will own the copy.
        copied_by: Email of the user creating the copy.

    Returns:
        The new copied recipe, or None if source recipe not found.
    """
    # Get the source recipe
    source = get_recipe(recipe_id)
    if source is None:
        return None

    # Create a RecipeCreate from the source
    from api.models.recipe import RecipeCreate

    recipe_data = RecipeCreate(
        title=source.title,
        url=source.url,
        ingredients=source.ingredients,
        instructions=source.instructions,
        image_url=source.image_url,
        thumbnail_url=source.thumbnail_url,
        servings=source.servings,
        prep_time=source.prep_time,
        cook_time=source.cook_time,
        total_time=source.total_time,
        cuisine=source.cuisine,
        category=source.category,
        tags=source.tags,
        tips=source.tips,
        diet_label=source.diet_label,
        meal_label=source.meal_label,
        visibility="household",  # Copies are private by default
    )

    # Preserve enhancement metadata if copying from an enhanced recipe
    return save_recipe(
        recipe_data,
        household_id=to_household_id,
        created_by=copied_by,
        enhancement=EnhancementMetadata(
            enhanced=source.enhanced, enhanced_at=source.enhanced_at, changes_made=source.changes_made or []
        ),
    )


def transfer_recipe_to_household(recipe_id: str, to_household_id: str) -> Recipe | None:
    """
    Transfer a recipe to a different household.

    This is an admin operation that changes the household_id of a recipe
    without copying it. The recipe keeps its ID and all other data.

    Args:
        recipe_id: The recipe ID to transfer.
        to_household_id: The target household ID.

    Returns:
        The updated recipe, or None if recipe not found.
    """
    db = get_firestore_client()
    doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)

    doc = cast("DocumentSnapshot", doc_ref.get())
    if not doc.exists:
        return None

    # Update household_id
    doc_ref.update({"household_id": to_household_id, "updated_at": datetime.now(tz=UTC)})

    return get_recipe(recipe_id)
