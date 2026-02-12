"""Household settings models."""

from enum import Enum

from pydantic import BaseModel, Field, field_validator

from api.models.equipment import validate_equipment_keys


class MeatPreference(str, Enum):
    """How to handle meat in recipes."""

    ALL = "all"  # Everyone eats meat
    SPLIT = "split"  # 50% meat, 50% vegetarian alternative
    NONE = "none"  # All vegetarian


class MincedMeatPreference(str, Enum):
    """How to handle minced meat."""

    MEAT = "meat"  # Use regular minced meat
    SOY = "soy"  # Always use soy-based mince
    SPLIT = "split"  # Half and half


class DairyPreference(str, Enum):
    """Dairy preferences."""

    REGULAR = "regular"  # No restrictions
    LACTOSE_FREE = "lactose_free"  # Prefer lactose-free alternatives
    DAIRY_FREE = "dairy_free"  # No dairy at all


class DietarySettings(BaseModel):
    """Dietary preferences for the household."""

    seafood_ok: bool = Field(default=True, description="Household eats seafood")
    meat: MeatPreference = Field(default=MeatPreference.ALL, description="How to handle meat dishes")
    minced_meat: MincedMeatPreference = Field(
        default=MincedMeatPreference.MEAT, description="How to handle minced meat"
    )
    dairy: DairyPreference = Field(default=DairyPreference.REGULAR, description="Dairy preferences")

    # Vegetarian alternatives
    chicken_alternative: str | None = Field(default=None, description="Alternative for chicken (e.g., Quorn)")
    meat_alternative: str | None = Field(default=None, description="Alternative for other meats (e.g., Oumph)")


class HouseholdSettings(BaseModel):
    """Complete household settings."""

    household_size: int = Field(default=2, ge=1, le=20, description="Number of people in household")
    default_servings: int = Field(default=2, ge=1, le=20, description="Default number of servings for recipes")
    language: str = Field(default="sv", description="Preferred language for recipes (sv, en, it)")
    ai_features_enabled: bool = Field(default=True, description="Show AI enhancement controls in UI")
    items_at_home: list[str] = Field(
        default_factory=list, description="Ingredients always at home (excluded from grocery lists)"
    )
    favorite_recipes: list[str] = Field(default_factory=list, description="Recipe IDs favorited by the household")

    dietary: DietarySettings = Field(default_factory=DietarySettings)
    equipment: list[str] = Field(default_factory=list, description="Equipment keys from the equipment catalog")

    @field_validator("equipment", mode="before")
    @classmethod
    def validate_equipment(cls, v: object) -> list[str]:
        """Validate equipment keys against the catalog and discard old dict format."""
        if isinstance(v, dict):
            return []
        if not isinstance(v, list):
            return []
        try:
            return validate_equipment_keys(v)
        except ValueError:
            return [k for k in v if isinstance(k, str)]


class DietarySettingsUpdate(BaseModel):
    """Partial update for dietary settings (all fields optional)."""

    seafood_ok: bool | None = None
    meat: MeatPreference | None = None
    minced_meat: MincedMeatPreference | None = None
    dairy: DairyPreference | None = None
    chicken_alternative: str | None = None
    meat_alternative: str | None = None


class HouseholdSettingsUpdate(BaseModel):
    """Partial update for household settings (all fields optional).

    Note: items_at_home is NOT included here - use the dedicated
    /items-at-home endpoints which handle normalization and deduplication.
    """

    household_size: int | None = Field(default=None, ge=1, le=20)
    default_servings: int | None = Field(default=None, ge=1, le=20)
    language: str | None = None
    ai_features_enabled: bool | None = Field(default=None, description="Show AI enhancement controls in UI")

    dietary: DietarySettingsUpdate | None = None
    equipment: list[str] | None = None

    @field_validator("equipment", mode="before")
    @classmethod
    def validate_equipment(cls, v: object) -> list[str] | None:
        """Validate equipment keys against the catalog."""
        if v is None:
            return None
        if not isinstance(v, list):
            return None
        return validate_equipment_keys(v)
