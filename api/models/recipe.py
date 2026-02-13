"""Recipe Pydantic models."""

import re
from datetime import datetime
from enum import Enum
from typing import Any, Literal, cast

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, computed_field, field_validator

MIN_RATING = 1
MAX_RATING = 5
_ERR_RATING_RANGE = "Rating must be between 1 and 5"

# Input limits to prevent abuse and prompt injection
MAX_INGREDIENTS = 100
MAX_INSTRUCTIONS = 50
MAX_TAGS = 30
MAX_INGREDIENT_LENGTH = 300
MAX_INSTRUCTION_LENGTH = 5000
MAX_TAG_LENGTH = 100
MAX_TIPS_LENGTH = 2000

# Control characters to strip (C0 controls except tab/newline/carriage-return)
_CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def _sanitize_text(text: str, max_length: int) -> str:
    """Strip control characters and truncate to max length."""
    cleaned = _CONTROL_CHAR_RE.sub("", text)
    return cleaned[:max_length]


def flatten_ingredient_dict(data: dict[str, Any]) -> str:
    """Flatten a structured ingredient dict into a single string.

    Args:
        data: A mapping that may contain keys like ``quantity``, ``unit``,
            ``item``, or ``name`` representing a single ingredient.

    Returns:
        A human-readable ingredient string built from the known fields.
        Returns an empty string if no relevant fields are present.
    """
    quantity = str(data.get("quantity", "") or "").strip()
    unit = str(data.get("unit", "") or "").strip()
    name = str(data.get("item") or data.get("name") or "").strip()
    parts = [part for part in (quantity, unit, name) if part]
    return " ".join(parts)


def _coerce_ingredient(item: object) -> str:
    """Coerce a single ingredient to a plain string.

    Gemini sometimes returns structured dicts like
    ``{"item": "Salt", "quantity": "1 tsp", "unit": ""}""
    instead of flat strings.  This flattens them so Pydantic
    validation on ``list[str]`` never fails.
    """
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        data = cast("dict[str, Any]", item)
        return flatten_ingredient_dict(data) or str(item)
    return str(item)


class DietLabel(str, Enum):
    """Diet type labels for recipes."""

    VEGGIE = "veggie"
    FISH = "fish"
    MEAT = "meat"


class MealLabel(str, Enum):
    """Meal type labels for recipes."""

    BREAKFAST = "breakfast"
    STARTER = "starter"
    SALAD = "salad"
    MEAL = "meal"
    DESSERT = "dessert"
    DRINK = "drink"
    SAUCE = "sauce"
    PICKLE = "pickle"
    GRILL = "grill"


class InstructionType(str, Enum):
    """Types of instruction entries for enhanced rendering."""

    STEP = "step"  # Regular cooking step
    TIMELINE = "timeline"  # ⏱️ X min: Timing coordination entry
    TIP = "tip"  # 💡 Inline tip or note
    HEADING = "heading"  # ## Section heading


class StructuredInstruction(BaseModel):
    """A parsed instruction with type information for UI rendering."""

    type: InstructionType
    content: str = Field(..., description="The instruction text (without type prefix)")
    time: int | None = Field(default=None, description="For timeline entries, the time in minutes")
    step_number: int | None = Field(default=None, description="Step number (only for 'step' type, 1-indexed)")


def parse_instruction(text: str, step_counter: int) -> StructuredInstruction:
    """Parse a raw instruction string into a structured instruction.

    Detects patterns:
    - ⏱️ X min: ... -> timeline entry
    - ÖVERSIKT: ... -> overview/timeline entry (Swedish)
    - 💡 ... or TIP: ... -> inline tip
    - ## ... or ### ... -> section heading
    - Everything else -> regular step
    """
    text = text.strip()

    # Timeline pattern: ⏱️ 0 min: or ⏱️ 25 min:
    timeline_match = re.match(r"^⏱️\s*(\d+)\s*min[:\s]+(.+)$", text, re.IGNORECASE | re.DOTALL)
    if timeline_match:
        return StructuredInstruction(
            type=InstructionType.TIMELINE, content=timeline_match.group(2).strip(), time=int(timeline_match.group(1))
        )

    # Overview pattern: ÖVERSIKT: ... (Swedish) - treated as timeline without specific time
    overview_match = re.match(r"^ÖVERSIKT:\s*(.+)$", text, re.IGNORECASE | re.DOTALL)
    if overview_match:
        return StructuredInstruction(type=InstructionType.TIMELINE, content=overview_match.group(1).strip(), time=None)

    # Tip pattern: 💡 ... or TIP: ... or Tips: ...
    tip_match = re.match(r"^(?:💡|tips?:)\s*(.+)$", text, re.IGNORECASE | re.DOTALL)
    if tip_match:
        return StructuredInstruction(type=InstructionType.TIP, content=tip_match.group(1).strip())

    # Heading pattern: ## ... or ### ...
    heading_match = re.match(r"^#{2,3}\s+(.+)$", text)
    if heading_match:
        return StructuredInstruction(type=InstructionType.HEADING, content=heading_match.group(1).strip())

    # Default: regular step
    return StructuredInstruction(type=InstructionType.STEP, content=text, step_number=step_counter)


class RecipeBase(BaseModel):
    """Base recipe fields shared across models."""

    title: str = Field(..., min_length=1, max_length=500)
    url: str
    ingredients: list[str] = Field(default_factory=list, max_length=MAX_INGREDIENTS)
    instructions: list[str] = Field(default_factory=list, max_length=MAX_INSTRUCTIONS)
    image_url: str | None = None
    thumbnail_url: str | None = Field(default=None, description="Thumbnail image URL (400x300) for cards/lists")
    servings: int | None = Field(default=None, ge=1)
    prep_time: int | None = Field(default=None, ge=0, description="Prep time in minutes")
    cook_time: int | None = Field(default=None, ge=0, description="Cook time in minutes")
    total_time: int | None = Field(default=None, ge=0, description="Total time in minutes")
    cuisine: str | None = Field(default=None, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    tags: list[str] = Field(default_factory=list, max_length=MAX_TAGS)
    diet_label: DietLabel | None = None
    meal_label: MealLabel | None = None
    rating: int | None = Field(default=None, ge=1, le=5, description="Recipe rating (5 = approved/tested)")
    hidden: bool = Field(default=False, description="Hidden from recipe lists (thumbs down)")
    favorited: bool = Field(default=False, description="Household favorite (heart)")
    tips: str | None = Field(default=None, max_length=MAX_TIPS_LENGTH, description="Cooking tips")
    # Household fields (for multi-tenancy)
    household_id: str | None = Field(default=None, description="Household that owns this recipe (None = legacy/shared)")
    visibility: Literal["household", "shared"] = Field(
        default="household", description="'household' = private, 'shared' = visible to all"
    )
    created_by: str | None = Field(default=None, description="Email of user who created the recipe")

    @field_validator("ingredients", mode="before")
    @classmethod
    def coerce_ingredient_items(cls, v: Any) -> Any:
        """Coerce structured ingredient dicts from Gemini into plain strings."""
        if not isinstance(v, list):
            return v
        return [_coerce_ingredient(item) for item in v]

    @field_validator("ingredients", mode="after")
    @classmethod
    def validate_ingredient_lengths(cls, v: list[str]) -> list[str]:
        """Ensure each ingredient is within length limit and strip control characters."""
        return [_sanitize_text(item, MAX_INGREDIENT_LENGTH) for item in v]

    @field_validator("instructions", mode="after")
    @classmethod
    def validate_instruction_lengths(cls, v: list[str]) -> list[str]:
        """Ensure each instruction is within length limit and strip control characters."""
        return [_sanitize_text(item, MAX_INSTRUCTION_LENGTH) for item in v]

    @field_validator("tags", mode="after")
    @classmethod
    def validate_tag_lengths(cls, v: list[str]) -> list[str]:
        """Ensure each tag is within length limit."""
        return [_sanitize_text(item, MAX_TAG_LENGTH) for item in v]


class OriginalRecipe(BaseModel):
    """Snapshot of the original recipe before AI enhancement.

    Applies the same sanitization and length constraints as RecipeBase
    to keep API responses consistent and prevent unsanitized data.
    """

    title: str = Field(..., max_length=500)
    ingredients: list[str] = Field(default_factory=list, max_length=MAX_INGREDIENTS)
    instructions: list[str] = Field(default_factory=list, max_length=MAX_INSTRUCTIONS)
    servings: int | None = None
    prep_time: int | None = None
    cook_time: int | None = None
    total_time: int | None = None
    image_url: str | None = None

    @field_validator("ingredients", mode="after")
    @classmethod
    def validate_ingredient_lengths(cls, v: list[str]) -> list[str]:
        """Sanitize ingredient strings and enforce length limits."""
        return [_sanitize_text(item, MAX_INGREDIENT_LENGTH) for item in v]

    @field_validator("instructions", mode="after")
    @classmethod
    def validate_instruction_lengths(cls, v: list[str]) -> list[str]:
        """Sanitize instruction strings and enforce length limits."""
        return [_sanitize_text(item, MAX_INSTRUCTION_LENGTH) for item in v]


class Recipe(RecipeBase):
    """A recipe with all fields including database ID."""

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Firestore document ID")
    # Timestamp fields
    created_at: datetime | None = Field(default=None, description="When the recipe was created")
    updated_at: datetime | None = Field(default=None, description="When the recipe was last updated")
    # AI enhancement fields
    enhanced: bool = Field(default=False, description="Whether this recipe has been AI-enhanced")
    enhanced_at: datetime | None = Field(default=None, description="When the recipe was enhanced")
    changes_made: list[str] | None = Field(default=None, description="List of changes made by AI")
    original: OriginalRecipe | None = Field(default=None, description="Original recipe data before enhancement")
    show_enhanced: bool = Field(
        default=False, description="Display enhanced version (False = show original until approved)"
    )
    enhancement_reviewed: bool = Field(default=False, description="User has reviewed the enhancement")

    @computed_field
    @property
    def structured_instructions(self) -> list[StructuredInstruction]:
        """Parse instructions into structured format for enhanced UI rendering.

        Automatically detects:
        - ⏱️ X min: ... -> timeline entries
        - 💡 or TIP: ... -> inline tips
        - ## ... -> section headings
        - Regular text -> cooking steps (with step numbers)
        """
        result = []
        step_counter = 1
        for instruction in self.instructions:
            parsed = parse_instruction(instruction, step_counter)
            result.append(parsed)
            # Only increment step counter for actual steps
            if parsed.type == InstructionType.STEP:
                step_counter += 1
        return result

    @property
    def total_time_calculated(self) -> int | None:
        """Calculate total time from prep and cook time if not provided."""
        if self.total_time:
            return self.total_time
        if self.prep_time and self.cook_time:
            return self.prep_time + self.cook_time
        return self.prep_time or self.cook_time


class RecipeCreate(RecipeBase):
    """Recipe creation model (without ID)."""


class RecipeUpdate(BaseModel):
    """Recipe update model (all fields optional)."""

    title: str | None = Field(default=None, min_length=1, max_length=500)
    url: str | None = None
    ingredients: list[str] | None = None
    instructions: list[str] | None = None
    image_url: str | None = None
    thumbnail_url: str | None = None
    servings: int | None = Field(default=None, ge=1)
    prep_time: int | None = Field(default=None, ge=0)
    cook_time: int | None = Field(default=None, ge=0)
    total_time: int | None = Field(default=None, ge=0)
    cuisine: str | None = None
    category: str | None = None
    tags: list[str] | None = None
    tips: str | None = None
    diet_label: DietLabel | None = None
    meal_label: MealLabel | None = None
    rating: int | None = Field(default=None, description="Recipe rating: null to clear, 5 to approve")
    hidden: bool | None = Field(default=None, description="Hide from recipe lists")
    favorited: bool | None = Field(default=None, description="Mark as household favorite")
    visibility: Literal["household", "shared"] | None = Field(default=None, description="'household' or 'shared'")

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int | None) -> int | None:
        """Allow None to clear rating, or validate 1-5 range."""
        if v is not None and (v < MIN_RATING or v > MAX_RATING):
            raise ValueError(_ERR_RATING_RANGE)
        return v


DEFAULT_PAGE_LIMIT = 50
MAX_PAGE_LIMIT = 200


class PaginatedRecipeList(BaseModel):
    """Paginated list of recipes with cursor for next page."""

    items: list[Recipe]
    total_count: int | None = Field(default=None, description="Total number of recipes available (first page only)")
    next_cursor: str | None = Field(default=None, description="Cursor for the next page (recipe ID), null if last page")
    has_more: bool = Field(default=False, description="Whether more results exist beyond this page")


class RecipeScrapeRequest(BaseModel):
    """Request body for recipe scraping."""

    url: HttpUrl = Field(..., description="URL of the recipe to scrape")


class RecipeParseRequest(BaseModel):
    """Request body for client-side recipe parsing.

    Used when the client fetches the HTML directly (to avoid cloud IP blocking)
    and sends it to the API for parsing.
    """

    url: HttpUrl = Field(..., description="URL of the recipe (for metadata)")
    html: str = Field(
        ..., min_length=100, max_length=10_000_000, description="HTML content of the recipe page (max 10 MB)"
    )


class EnhancementReviewAction(str, Enum):
    """Actions for reviewing an AI enhancement."""

    APPROVE = "approve"
    REJECT = "reject"


class EnhancementReviewRequest(BaseModel):
    """Request body for reviewing an AI enhancement."""

    action: EnhancementReviewAction = Field(..., description="'approve' to show enhanced, 'reject' to show original")


class RecipePreview(BaseModel):
    """Preview of a scraped recipe before saving.

    Contains the original scraped data and optionally the AI-enhanced version.
    The client can review both versions and choose which to save.
    """

    original: RecipeCreate = Field(..., description="Original scraped recipe data")
    enhanced: RecipeCreate | None = Field(default=None, description="AI-enhanced version (if enhance=true)")
    changes_made: list[str] = Field(default_factory=list, description="List of AI enhancement changes")
    image_url: str | None = Field(default=None, description="Original image URL from the recipe")
