"""Firestore storage for recipe notes (household-scoped)."""

from datetime import UTC, datetime
from typing import Any

from google.cloud.firestore_v1 import CollectionReference, FieldFilter

from api.models.recipe_note import RecipeNote
from api.storage.firestore_client import RECIPE_NOTES_COLLECTION, get_firestore_client


def _get_collection() -> CollectionReference:  # pragma: no cover
    """Get the recipe_notes Firestore collection reference."""
    return get_firestore_client().collection(RECIPE_NOTES_COLLECTION)


def _doc_to_note(doc: Any) -> RecipeNote:
    """Convert a Firestore document snapshot to a RecipeNote model."""
    data = doc.to_dict()
    return RecipeNote(
        id=doc.id,
        recipe_id=data["recipe_id"],
        household_id=data["household_id"],
        text=data["text"],
        created_by=data["created_by"],
        created_at=data["created_at"],
    )


def list_notes(recipe_id: str, household_id: str) -> list[RecipeNote]:
    """List all notes for a recipe within a household, ordered by creation time."""
    docs = (
        _get_collection()
        .where(filter=FieldFilter("recipe_id", "==", recipe_id))
        .where(filter=FieldFilter("household_id", "==", household_id))
        .order_by("created_at")
        .stream()
    )
    return [_doc_to_note(doc) for doc in docs]


def create_note(recipe_id: str, household_id: str, text: str, created_by: str) -> RecipeNote:
    """Create a new note on a recipe for a household."""
    data = {
        "recipe_id": recipe_id,
        "household_id": household_id,
        "text": text,
        "created_by": created_by,
        "created_at": datetime.now(tz=UTC),
    }
    _, doc_ref = _get_collection().add(data)
    return RecipeNote(id=doc_ref.id, **data)


def delete_note(note_id: str, household_id: str) -> bool:
    """Delete a note by ID, scoped to the household.

    Returns True if the note was deleted, False if not found or wrong household.
    """
    doc_ref = _get_collection().document(note_id)
    doc = doc_ref.get()
    if not doc.exists:
        return False

    data = doc.to_dict()
    if data.get("household_id") != household_id:
        return False

    doc_ref.delete()
    return True
