"""Sync status response model."""

from pydantic import BaseModel, Field


class SyncStatusResponse(BaseModel):
    """Opaque version per data kind; a changed value means that kind changed on the server."""

    scope: str = Field(description="Role and household the versions apply to; a change means refetch everything")
    recipes: str | None = None
    meal_plan: str | None = None
    grocery: str | None = None
    settings: str | None = None
