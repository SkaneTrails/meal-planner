"""Recipe AI enhancement endpoints and configuration.

Contains the enhance endpoint, household config reader, and
enhancement helper functions used by both enhance and scraping endpoints.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from api.auth.firebase import require_auth
from api.auth.helpers import require_household
from api.auth.models import AuthenticatedUser
from api.models.recipe import EnhancementReviewAction, EnhancementReviewRequest, Recipe, RecipeCreate
from api.services.prompt_loader import DEFAULT_LANGUAGE
from api.services.recipe_mapper import build_recipe_create_from_enhanced
from api.storage import recipe_storage
from api.storage.recipe_storage import EnhancementMetadata

logger = logging.getLogger(__name__)

router = APIRouter()


class HouseholdConfig:
    """Household settings for recipe enhancement."""

    def __init__(self, settings: dict) -> None:
        from api.services.dietary_prompt_builder import DietaryConfig

        self.language: str = settings.get("language", DEFAULT_LANGUAGE)
        equipment_raw = settings.get("equipment", [])
        self.equipment: list[str] = equipment_raw if isinstance(equipment_raw, list) else []
        self.target_servings: int = self._coerce_positive_int(settings.get("default_servings"), default=4, min_value=1)
        self.people_count: int = self._coerce_positive_int(settings.get("household_size"), default=2, min_value=1)
        self.dietary: DietaryConfig = DietaryConfig.from_firestore(
            settings.get("dietary"), household_size=self.people_count
        )

    @staticmethod
    def _coerce_positive_int(value: object, *, default: int, min_value: int) -> int:
        """Safely coerce a Firestore value to a positive int with fallback."""
        if isinstance(value, bool) or value is None:
            return max(default, min_value)
        try:
            result = int(value)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            return max(default, min_value)
        return max(result, min_value)


def _get_household_config(household_id: str) -> HouseholdConfig:  # pragma: no cover
    """Read the household's enhancement settings.

    Returns:
        HouseholdConfig with language, equipment, target_servings,
        people_count, and dietary preferences.
    """
    from api.storage.household_storage import get_household_settings

    settings = get_household_settings(household_id) or {}
    return HouseholdConfig(settings)


def _try_enhance(
    saved_recipe: Recipe, *, household_id: str, created_by: str, config: HouseholdConfig
) -> Recipe:  # pragma: no cover
    """Attempt AI enhancement on a saved recipe, returning original on failure."""
    from api.services.recipe_enhancer import EnhancementError, enhance_recipe as do_enhance

    try:
        enhanced_data = do_enhance(
            saved_recipe.model_dump(),
            language=config.language,
            equipment=config.equipment,
            target_servings=config.target_servings,
            people_count=config.people_count,
            dietary=config.dietary,
        )
        enhanced_create = build_recipe_create_from_enhanced(enhanced_data, saved_recipe)

        return recipe_storage.save_recipe(
            enhanced_create,
            recipe_id=saved_recipe.id,
            enhancement=EnhancementMetadata(enhanced=True, changes_made=enhanced_data.get("changes_made", [])),
            household_id=household_id,
            created_by=created_by,
        )
    except EnhancementError as e:
        logger.warning("Enhancement failed for recipe_id=%s: %s", saved_recipe.id, e)
        return saved_recipe
    except Exception:
        logger.exception("Unexpected error during enhancement for recipe_id=%s", saved_recipe.id)
        return saved_recipe


def _try_enhance_preview(
    recipe_create: RecipeCreate, *, config: HouseholdConfig | None = None
) -> dict | None:  # pragma: no cover
    """Attempt AI enhancement for preview mode, returning None on failure."""
    from api.services.dietary_prompt_builder import DietaryConfig
    from api.services.recipe_enhancer import EnhancementError, enhance_recipe as do_enhance

    language = config.language if config else DEFAULT_LANGUAGE
    equipment = config.equipment if config else []
    target_servings = config.target_servings if config else 4
    people_count = config.people_count if config else 2
    dietary = config.dietary if config else DietaryConfig()

    try:
        recipe_dict = recipe_create.model_dump()
        enhanced_data = do_enhance(
            recipe_dict,
            language=language,
            equipment=equipment,
            target_servings=target_servings,
            people_count=people_count,
            dietary=dietary,
        )
        enhanced_create = build_recipe_create_from_enhanced(enhanced_data, recipe_create)
        return {"recipe": enhanced_create, "changes_made": enhanced_data.get("changes_made", [])}
    except EnhancementError as e:
        logger.warning("Enhancement preview failed: %s", e)
        return None
    except Exception:
        logger.exception("Unexpected error during enhancement preview")
        return None


@router.post("/{recipe_id}/enhance", status_code=status.HTTP_200_OK)
async def enhance_recipe(user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str) -> Recipe:
    """Enhance a recipe using AI (Gemini).

    This endpoint improves recipes by:
    - Concretizing vague ingredients (e.g., "1 packet" -> "400 g")
    - Optimizing for available kitchen equipment
    - Adapting for dietary preferences (vegetarian alternatives)
    - Replacing HelloFresh spice blends with individual spices

    If the recipe is shared/legacy (not owned by user's household), a copy is created
    first and the copy is enhanced. The original shared recipe remains unchanged.
    """
    from datetime import UTC, datetime

    from api.services.recipe_enhancer import EnhancementConfigError, EnhancementError, enhance_recipe as do_enhance

    household_id = require_household(user)

    recipe = recipe_storage.get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    is_owned = recipe.household_id == household_id
    is_shared_or_legacy = recipe.household_id is None or recipe.visibility == "shared"

    if not is_owned and not is_shared_or_legacy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    target_recipe = recipe
    if not is_owned and is_shared_or_legacy:
        copied = recipe_storage.copy_recipe(recipe_id, to_household_id=household_id, copied_by=user.email)
        if copied is None:  # pragma: no cover
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to copy recipe before enhancement"
            )
        target_recipe = copied

    config = _get_household_config(household_id)

    try:
        enhanced_data = do_enhance(
            target_recipe.model_dump(),
            language=config.language,
            equipment=config.equipment,
            target_servings=config.target_servings,
            people_count=config.people_count,
            dietary=config.dietary,
        )
        enhanced_recipe = build_recipe_create_from_enhanced(enhanced_data, target_recipe)

        return recipe_storage.save_recipe(
            enhanced_recipe,
            recipe_id=target_recipe.id,
            enhancement=EnhancementMetadata(
                enhanced=True, enhanced_at=datetime.now(tz=UTC), changes_made=enhanced_data.get("changes_made") or []
            ),
            household_id=household_id,
            created_by=user.email,
        )

    except EnhancementConfigError as e:
        logger.warning("Enhancement unavailable for recipe_id=%s: %s", recipe_id, e)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e

    except EnhancementError as e:
        logger.exception("Failed to enhance recipe_id=%s", recipe_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Enhancement failed") from e

    except Exception as e:
        logger.exception("Unexpected error enhancing recipe_id=%s", recipe_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Enhancement failed due to an unexpected error"
        ) from e


@router.post("/{recipe_id}/enhancement/review", status_code=status.HTTP_200_OK)
async def review_enhancement(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str, request: EnhancementReviewRequest
) -> Recipe:
    """Review an AI-enhanced recipe - approve or reject the enhancement.

    - **approve**: Accept the enhancement, show enhanced version going forward
    - **reject**: Keep original, enhanced data preserved for potential future use

    Only works for enhanced recipes that belong to the user's household.
    """
    household_id = require_household(user)

    approve = request.action == EnhancementReviewAction.APPROVE
    result = recipe_storage.review_enhancement(recipe_id, approve=approve, household_id=household_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found, not enhanced, or not owned by your household",
        )

    return result
