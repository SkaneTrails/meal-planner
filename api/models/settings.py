"""Household settings models."""

from enum import Enum

from pydantic import BaseModel, Field


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


class EquipmentSettings(BaseModel):
    """Available kitchen equipment."""

    airfryer: bool = Field(default=False, description="Has an airfryer")
    airfryer_model: str | None = Field(default=None, description="Airfryer model for capacity/timing info")
    airfryer_capacity_liters: float | None = Field(default=None, ge=1, le=10, description="Airfryer capacity in liters")

    # Oven features
    convection_oven: bool = Field(default=True, description="Oven has convection/hot air mode")
    grill_function: bool = Field(default=True, description="Oven has grill/broil function")


class HouseholdSettings(BaseModel):
    """Complete household settings."""

    household_size: int = Field(default=2, ge=1, le=20, description="Number of people in household")
    default_servings: int = Field(default=2, ge=1, le=20, description="Default number of servings for recipes")
    language: str = Field(default="sv", description="Preferred language for recipes (sv, en, it)")
    ai_features_enabled: bool = Field(default=True, description="Show AI enhancement controls in UI")
    items_at_home: list[str] = Field(
        default_factory=list,
        description="Ingredients always at home (excluded from grocery lists)",
    )

    dietary: DietarySettings = Field(default_factory=DietarySettings)
    equipment: EquipmentSettings = Field(default_factory=EquipmentSettings)


class DietarySettingsUpdate(BaseModel):
    """Partial update for dietary settings (all fields optional)."""

    seafood_ok: bool | None = None
    meat: MeatPreference | None = None
    minced_meat: MincedMeatPreference | None = None
    dairy: DairyPreference | None = None
    chicken_alternative: str | None = None
    meat_alternative: str | None = None


class EquipmentSettingsUpdate(BaseModel):
    """Partial update for equipment settings (all fields optional)."""

    airfryer: bool | None = None
    airfryer_model: str | None = None
    airfryer_capacity_liters: float | None = Field(default=None, ge=1, le=10)
    convection_oven: bool | None = None
    grill_function: bool | None = None


class HouseholdSettingsUpdate(BaseModel):
    """Partial update for household settings (all fields optional)."""

    household_size: int | None = Field(default=None, ge=1, le=20)
    default_servings: int | None = Field(default=None, ge=1, le=20)
    language: str | None = None
    ai_features_enabled: bool | None = Field(default=None, description="Show AI enhancement controls in UI")
    items_at_home: list[str] | None = Field(
        default=None,
        description="Ingredients always at home (excluded from grocery lists)",
    )

    dietary: DietarySettingsUpdate | None = None
    equipment: EquipmentSettingsUpdate | None = None
