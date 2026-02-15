"""Recipe note models — household-scoped notes on recipes."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RecipeNoteCreate(BaseModel):
    """Request body for creating a recipe note."""

    model_config = ConfigDict(from_attributes=True)

    text: str = Field(..., min_length=1, max_length=2000)


class RecipeNote(BaseModel):
    """A single note on a recipe, scoped to a household."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    recipe_id: str
    household_id: str
    text: str
    created_by: str
    created_at: datetime
