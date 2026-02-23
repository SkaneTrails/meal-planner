"""Household settings models."""

import re
from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator

from api.models.equipment import validate_equipment_keys

MAX_HOUSEHOLD_SIZE = 20
MAX_ALTERNATIVE_LENGTH = 30
MAX_ALTERNATIVE_WORDS = 3
_ALTERNATIVE_RE = re.compile(r"^[\w -]+$", re.UNICODE)


class Language(str, Enum):
    """Supported recipe languages."""

    SV = "sv"  # Swedish
    EN = "en"  # English
    IT = "it"  # Italian


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
    meat_portions: int = Field(
        default=MAX_HOUSEHOLD_SIZE,
        ge=0,
        le=MAX_HOUSEHOLD_SIZE,
        description="How many portions contain meat, relative to default_servings (0 = all vegetarian, max = all meat)",
    )
    minced_meat: MincedMeatPreference = Field(
        default=MincedMeatPreference.MEAT, description="How to handle minced meat"
    )
    dairy: DairyPreference = Field(default=DairyPreference.REGULAR, description="Dairy preferences")

    # Vegetarian alternatives
    chicken_alternative: str | None = Field(
        default=None, max_length=MAX_ALTERNATIVE_LENGTH, description="Alternative for chicken (e.g., Quorn)"
    )
    meat_alternative: str | None = Field(
        default=None, max_length=MAX_ALTERNATIVE_LENGTH, description="Alternative for other meats (e.g., Oumph)"
    )

    @field_validator("chicken_alternative", "meat_alternative", mode="before")
    @classmethod
    def validate_alternative_name(cls, v: str | None) -> str | None:
        """Sanitize free-text alternative names to prevent prompt injection.

        Rejects values that are too long, contain special characters,
        or have more than 3 words.  These fields end up in the Gemini
        system prompt — strict validation is a security boundary.
        """
        if v is None:
            return None
        if not isinstance(v, str):
            return None
        v = v.strip()
        if not v:
            return None
        if len(v) > MAX_ALTERNATIVE_LENGTH:
            msg = f"Alternative name must be at most {MAX_ALTERNATIVE_LENGTH} characters"
            raise ValueError(msg)
        if not _ALTERNATIVE_RE.match(v):
            msg = "Alternative name may only contain letters, numbers, spaces, hyphens, and underscores"
            raise ValueError(msg)
        if len(v.split()) > MAX_ALTERNATIVE_WORDS:
            msg = f"Alternative name must be at most {MAX_ALTERNATIVE_WORDS} words"
            raise ValueError(msg)
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

    @model_validator(mode="before")
    @classmethod
    def coerce_null_nested(cls, values: dict[str, object]) -> dict[str, object]:
        """Coerce null nested objects to defaults so Firestore nulls don't cause 500s."""
        if values.get("dietary") is None:
            values.pop("dietary", None)
        return values

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

    seafood_ok: bool | None = None
    meat: MeatPreference | None = None
    meat_portions: int | None = Field(default=None, ge=0, le=MAX_HOUSEHOLD_SIZE)
    minced_meat: MincedMeatPreference | None = None
    dairy: DairyPreference | None = None
    chicken_alternative: str | None = Field(default=None, max_length=MAX_ALTERNATIVE_LENGTH)
    meat_alternative: str | None = Field(default=None, max_length=MAX_ALTERNATIVE_LENGTH)

    @field_validator("chicken_alternative", "meat_alternative", mode="before")
    @classmethod
    def validate_alternative_name(cls, v: str | None) -> str | None:
        """Reuse the same validation as DietarySettings."""
        return DietarySettings.validate_alternative_name(v)


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
