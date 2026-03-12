"""Featured recipe category models."""

from __future__ import annotations

from pydantic import BaseModel

from api.models.recipe import Recipe  # noqa: TC001 — Pydantic needs runtime access


class CategoryDefinition(BaseModel):
    """Static definition of a recipe category with tag-matching rules."""

    key: str
    required_tags: list[str] = []
    any_tags: list[str] = []
    seasons: list[str] = []
    times: list[str] = []


class FeaturedCategory(BaseModel):
    """A single featured category with its matched recipes."""

    key: str
    recipes: list[Recipe]


class FeaturedCategoriesResponse(BaseModel):
    """Response for the featured categories endpoint."""

    categories: list[FeaturedCategory]
    season: str
    time_of_day: str
