"""Recipe notes API endpoints — household-scoped notes on recipes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from api.auth.firebase import require_auth
from api.auth.helpers import require_household
from api.auth.models import AuthenticatedUser
from api.models.recipe_note import RecipeNote, RecipeNoteCreate
from api.storage import recipe_notes_storage

router = APIRouter(tags=["recipe-notes"])


@router.get("/{recipe_id}/notes")
async def list_notes(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    recipe_id: str,
) -> list[RecipeNote]:
    """List all notes for a recipe within the user's household."""
    household_id = require_household(user)
    return recipe_notes_storage.list_notes(recipe_id, household_id)


@router.post("/{recipe_id}/notes", status_code=status.HTTP_201_CREATED)
async def create_note(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    recipe_id: str,
    body: RecipeNoteCreate,
) -> RecipeNote:
    """Add a note to a recipe for the user's household."""
    household_id = require_household(user)
    return recipe_notes_storage.create_note(
        recipe_id=recipe_id,
        household_id=household_id,
        text=body.text,
        created_by=user.email,
    )


@router.delete("/{recipe_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    recipe_id: str,  # noqa: ARG001 — required by path template
    note_id: str,
) -> None:
    """Delete a note by ID. Only household members can delete their household's notes."""
    household_id = require_household(user)
    if not recipe_notes_storage.delete_note(note_id, household_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
