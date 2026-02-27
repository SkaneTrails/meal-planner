"""Household settings models."""

import re
from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator

from api.models.equipment import validate_equipment_keys

MAX_HOUSEHOLD_SIZE = 20
MAX_ALTERNATIVE_LENGTH = 30
MAX_ALTERNATIVE_WORDS = 3
MAX_REPLACEMENTS = 10
MAX_STORES = 10
MAX_STORE_NAME_LENGTH = 40
_ALTERNATIVE_RE = re.compile(r"^[\w -]+$", re.UNICODE)
_STORE_NAME_RE = re.compile(r"^[\w ,.'&/-]+$", re.UNICODE)


def _validate_ingredient_name(v: object) -> str:
    """Validate a free-text ingredient name for prompt-injection safety.

    Used by IngredientReplacement for both original and replacement fields.
    Values end up in the Gemini system prompt, so strict validation is
    a security boundary.

    Raises:
        ValueError: If value is empty, too long, has banned chars, or too many words.
        TypeError: If value is not a string.
    """
    if v is None:
        msg = "Ingredient name must not be empty"
        raise ValueError(msg)
    if not isinstance(v, str):
        msg = "Ingredient name must be a string"
        raise TypeError(msg)
    v = v.strip()
    if not v:
        msg = "Ingredient name must not be empty"
        raise ValueError(msg)
    if len(v) > MAX_ALTERNATIVE_LENGTH:
        msg = f"Ingredient name must be at most {MAX_ALTERNATIVE_LENGTH} characters"
        raise ValueError(msg)
    if not _ALTERNATIVE_RE.match(v):
        msg = "Ingredient name may only contain letters, numbers, spaces, hyphens, and underscores"
        raise ValueError(msg)
    if len(v.split()) > MAX_ALTERNATIVE_WORDS:
        msg = f"Ingredient name must be at most {MAX_ALTERNATIVE_WORDS} words"
        raise ValueError(msg)
    return v


class Language(str, Enum):
    """Supported recipe languages."""

    SV = "sv"  # Swedish
    EN = "en"  # English
    IT = "it"  # Italian


class GroceryStore(BaseModel):
    """A grocery store with a learned item ordering."""

    id: str = Field(..., description="Unique store identifier")
    name: str = Field(..., max_length=MAX_STORE_NAME_LENGTH, description="Display name, e.g. 'ICA Maxi'")

    @field_validator("name", mode="before")
    @classmethod
    def validate_store_name(cls, v: object) -> str:
        """Validate store name for safety and readability."""
        if not isinstance(v, str):
            msg = "Store name must be a string"
            raise TypeError(msg)
        v = v.strip()
        if not v:
            msg = "Store name must not be empty"
            raise ValueError(msg)
        if len(v) > MAX_STORE_NAME_LENGTH:
            msg = f"Store name must be at most {MAX_STORE_NAME_LENGTH} characters"
            raise ValueError(msg)
        if not _STORE_NAME_RE.match(v):
            msg = "Store name may only contain letters, numbers, spaces, commas, periods, apostrophes, ampersands, slashes, and hyphens"
            raise ValueError(msg)
        return v


class DietType(str, Enum):
    """High-level diet type for the household."""

    NO_RESTRICTIONS = "no_restrictions"  # Eats everything
    PESCATARIAN = "pescatarian"  # No meat, but fish/seafood ok
    VEGETARIAN = "vegetarian"  # No meat or fish
    VEGAN = "vegan"  # No animal products


class MeatPreference(str, Enum):
    """How to handle meat in recipes."""

    ALL = "all"  # Everyone eats meat
    SPLIT = "split"  # 50% meat, 50% vegetarian alternative
    NONE = "none"  # All vegetarian


class DairyPreference(str, Enum):
    """Dairy preferences."""

    REGULAR = "regular"  # No restrictions
    LACTOSE_FREE = "lactose_free"  # Prefer lactose-free alternatives
    DAIRY_FREE = "dairy_free"  # No dairy at all


class IngredientReplacement(BaseModel):
    """A single ingredient substitution rule.

    Both field values are validated against prompt-injection rules
    (max length, max words, safe characters only).
    """

    original: str = Field(..., max_length=MAX_ALTERNATIVE_LENGTH, description="Ingredient to replace")
    replacement: str = Field(..., max_length=MAX_ALTERNATIVE_LENGTH, description="Replacement ingredient")
    meat_substitute: bool = Field(
        default=True,
        description="When true, participates in proportional meat/veg split; when false, replaces 100% for all portions",
    )

    @field_validator("original", "replacement", mode="before")
    @classmethod
    def validate_ingredient_name(cls, v: object) -> str:
        return _validate_ingredient_name(v)


class DietarySettings(BaseModel):
    """Dietary preferences for the household."""

    diet_type: DietType = Field(default=DietType.NO_RESTRICTIONS, description="High-level diet type")
    seafood_ok: bool = Field(default=True, description="Household eats seafood")
    meat: MeatPreference = Field(default=MeatPreference.ALL, description="How to handle meat dishes")
    meat_portions: int = Field(
        default=MAX_HOUSEHOLD_SIZE,
        ge=0,
        le=MAX_HOUSEHOLD_SIZE,
        description="How many portions contain meat, relative to default_servings (0 = all vegetarian, max = all meat)",
    )
    dairy: DairyPreference = Field(default=DairyPreference.REGULAR, description="Dairy preferences")
    ingredient_replacements: list[IngredientReplacement] = Field(
        default_factory=list, max_length=MAX_REPLACEMENTS, description="Ingredient substitution rules (max 10)"
    )

    @field_validator("ingredient_replacements", mode="before")
    @classmethod
    def coerce_replacements(cls, v: object) -> list:
        """Coerce None/non-list to empty list for Firestore compatibility."""
        if v is None:
            return []
        if not isinstance(v, list):
            return []
        return v

    @field_validator("meat_portions", mode="before")
    @classmethod
    def coerce_meat_portions(cls, v: int | None) -> int:
        """Default meat_portions for legacy data without the field."""
        if v is None:
            return MAX_HOUSEHOLD_SIZE
        return int(v)

    def derive_meat_strategy(self, household_size: int) -> MeatPreference:
        """Derive the meat strategy from the numeric meat_portions field."""
        if self.meat_portions == 0:
            return MeatPreference.NONE
        if self.meat_portions >= household_size:
            return MeatPreference.ALL
        return MeatPreference.SPLIT


class HouseholdSettings(BaseModel):
    """Complete household settings."""

    household_size: int = Field(default=2, ge=1, le=20, description="Number of people in household")
    default_servings: int = Field(default=2, ge=1, le=20, description="Default number of servings for recipes")
    language: Language = Field(default=Language.SV, description="Preferred language for recipes")
    week_start: str = Field(default="monday", description="Day the week starts on (monday or saturday)")
    ai_features_enabled: bool = Field(default=True, description="Show AI enhancement controls in UI")
    include_breakfast: bool = Field(default=False, description="Include breakfast slot in weekly planner")
    items_at_home: list[str] = Field(
        default_factory=list, description="Ingredients always at home (excluded from grocery lists)"
    )
    favorite_recipes: list[str] = Field(default_factory=list, description="Recipe IDs favorited by the household")

    note_suggestions: list[str] = Field(
        default_factory=list, description="Custom note suggestions for meal plan day labels"
    )

    dietary: DietarySettings = Field(default_factory=DietarySettings)
    equipment: list[str] = Field(default_factory=list, description="Equipment keys from the equipment catalog")
    grocery_stores: list[GroceryStore] = Field(
        default_factory=list, max_length=MAX_STORES, description="Grocery stores with learned sort orders"
    )
    active_store_id: str | None = Field(default=None, description="Active store ID for grocery auto-sort")

    @model_validator(mode="before")
    @classmethod
    def coerce_null_nested(cls, values: dict[str, object]) -> dict[str, object]:
        """Coerce null nested objects to defaults so Firestore nulls don't cause 500s."""
        if values.get("dietary") is None:
            values.pop("dietary", None)
        return values

    @field_validator("grocery_stores", mode="before")
    @classmethod
    def coerce_grocery_stores(cls, v: object) -> list:
        """Coerce None/non-list to empty list for Firestore compatibility."""
        if v is None:
            return []
        if not isinstance(v, list):
            return []
        return v

    @field_validator("language", mode="before")
    @classmethod
    def coerce_language(cls, v: object) -> Language:
        """Coerce Firestore language strings to enum, falling back to SV."""
        if isinstance(v, Language):
            return v
        if isinstance(v, str):
            try:
                return Language(v)
            except ValueError:
                return Language.SV
        return Language.SV

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

    diet_type: DietType | None = None
    seafood_ok: bool | None = None
    meat: MeatPreference | None = None
    meat_portions: int | None = Field(default=None, ge=0, le=MAX_HOUSEHOLD_SIZE)
    dairy: DairyPreference | None = None
    ingredient_replacements: list[IngredientReplacement] | None = Field(
        default=None, max_length=MAX_REPLACEMENTS, description="Ingredient substitution rules (max 10)"
    )


class HouseholdSettingsUpdate(BaseModel):
    """Partial update for household settings (all fields optional).

    Note: items_at_home is NOT included here - use the dedicated
    /items-at-home endpoints which handle normalization and deduplication.
    """

    household_size: int | None = Field(default=None, ge=1, le=20)
    default_servings: int | None = Field(default=None, ge=1, le=20)
    language: Language | None = None
    week_start: str | None = None
    ai_features_enabled: bool | None = Field(default=None, description="Show AI enhancement controls in UI")
    include_breakfast: bool | None = Field(default=None, description="Include breakfast slot in weekly planner")

    note_suggestions: list[str] | None = None

    dietary: DietarySettingsUpdate | None = None
    equipment: list[str] | None = None
    grocery_stores: list[GroceryStore] | None = Field(
        default=None, max_length=MAX_STORES, description="Grocery stores with learned sort orders"
    )
    active_store_id: str | None = None

    @field_validator("equipment", mode="before")
    @classmethod
    def validate_equipment(cls, v: object) -> list[str] | None:
        """Validate equipment keys against the catalog."""
        if v is None:
            return None
        if not isinstance(v, list):
            msg = "equipment must be a list of strings or null"
            raise TypeError(msg)
        return validate_equipment_keys(v)

    @field_validator("grocery_stores", mode="before")
    @classmethod
    def coerce_grocery_stores(cls, v: object) -> list | None:
        """Coerce non-list to None for Firestore compatibility."""
        if v is None:
            return None
        if not isinstance(v, list):
            return None
        return v
