"""Tests for recipe model."""

import pytest
from pydantic import ValidationError

from api.models.recipe import (
    MAX_INGREDIENT_LENGTH,
    MAX_INGREDIENTS,
    MAX_INSTRUCTION_LENGTH,
    MAX_INSTRUCTIONS,
    MAX_TAGS,
    DietLabel,
    MealLabel,
    Recipe,
    RecipeCreate,
    RecipeUpdate,
)


class TestRecipe:
    """Tests for Recipe model."""

    def test_recipe_creation(self, sample_recipe) -> None:
        """Test that a recipe can be created with all fields."""
        assert sample_recipe.title == "Spaghetti Carbonara"
        assert sample_recipe.url == "https://example.com/carbonara"
        assert len(sample_recipe.ingredients) == 5
        assert len(sample_recipe.instructions) == 6
        assert sample_recipe.servings == 4

    def test_recipe_total_time_calculated(self) -> None:
        """Test total time calculation from prep and cook time."""
        recipe = Recipe(id="test1", title="Test Recipe", url="https://example.com/test", prep_time=15, cook_time=30)
        assert recipe.total_time_calculated == 45

    def test_recipe_total_time_explicit(self) -> None:
        """Test that explicit total_time takes precedence."""
        recipe = Recipe(
            id="test2",
            title="Test Recipe",
            url="https://example.com/test",
            prep_time=15,
            cook_time=30,
            total_time=60,  # Explicitly set different from sum
        )
        assert recipe.total_time_calculated == 60

    def test_recipe_total_time_partial(self) -> None:
        """Test total time when only one time is provided."""
        recipe = Recipe(id="test3", title="Test Recipe", url="https://example.com/test", prep_time=15)
        assert recipe.total_time_calculated == 15

    def test_recipe_default_lists(self) -> None:
        """Test that lists default to empty."""
        recipe = Recipe(id="test4", title="Minimal", url="https://example.com")
        assert recipe.ingredients == []
        assert recipe.instructions == []
        assert recipe.tags == []

    def test_recipe_with_diet_label(self) -> None:
        """Test recipe creation with diet label."""
        recipe = Recipe(id="test5", title="Veggie Pasta", url="https://example.com/veggie", diet_label=DietLabel.VEGGIE)
        assert recipe.diet_label == DietLabel.VEGGIE
        assert recipe.diet_label.value == "veggie"

    def test_recipe_with_meal_label(self) -> None:
        """Test recipe creation with meal label."""
        recipe = Recipe(
            id="test6", title="Chocolate Cake", url="https://example.com/cake", meal_label=MealLabel.DESSERT
        )
        assert recipe.meal_label == MealLabel.DESSERT
        assert recipe.meal_label.value == "dessert"

    def test_recipe_with_all_labels(self) -> None:
        """Test recipe creation with both diet and meal labels."""
        recipe = Recipe(
            id="test7",
            title="Fish Starter",
            url="https://example.com/fish-starter",
            diet_label=DietLabel.FISH,
            meal_label=MealLabel.STARTER,
        )
        assert recipe.diet_label == DietLabel.FISH
        assert recipe.meal_label == MealLabel.STARTER

    def test_recipe_labels_default_none(self) -> None:
        """Test that labels default to None."""
        recipe = Recipe(id="test8", title="Simple Recipe", url="https://example.com")
        assert recipe.diet_label is None
        assert recipe.meal_label is None


class TestRecipeUpdateRating:
    """Tests for RecipeUpdate rating validation."""

    def test_rating_none_clears(self) -> None:
        """Setting rating to None should clear it."""
        update = RecipeUpdate(rating=None)
        assert update.rating is None

    def test_rating_valid_values(self) -> None:
        """Valid ratings 1-5 should be accepted."""
        for value in (1, 2, 3, 4, 5):
            update = RecipeUpdate(rating=value)
            assert update.rating == value

    def test_rating_zero_rejected(self) -> None:
        """Rating of 0 should be rejected."""
        with pytest.raises(ValidationError, match="Rating must be between 1 and 5"):
            RecipeUpdate(rating=0)

    def test_rating_six_rejected(self) -> None:
        """Rating of 6 should be rejected."""
        with pytest.raises(ValidationError, match="Rating must be between 1 and 5"):
            RecipeUpdate(rating=6)

    def test_rating_negative_rejected(self) -> None:
        """Negative ratings should be rejected."""
        with pytest.raises(ValidationError, match="Rating must be between 1 and 5"):
            RecipeUpdate(rating=-1)


class TestRecipeHiddenAndFavorited:
    """Tests for hidden and favorited fields."""

    def test_hidden_defaults_false(self) -> None:
        """Hidden should default to False."""
        recipe = Recipe(id="test", title="Recipe", url="https://example.com")
        assert recipe.hidden is False

    def test_favorited_defaults_false(self) -> None:
        """Favorited should default to False."""
        recipe = Recipe(id="test", title="Recipe", url="https://example.com")
        assert recipe.favorited is False

    def test_hidden_can_be_set_true(self) -> None:
        """Hidden can be set to True."""
        recipe = Recipe(id="test", title="Recipe", url="https://example.com", hidden=True)
        assert recipe.hidden is True

    def test_favorited_can_be_set_true(self) -> None:
        """Favorited can be set to True."""
        recipe = Recipe(id="test", title="Recipe", url="https://example.com", favorited=True)
        assert recipe.favorited is True

    def test_update_hidden(self) -> None:
        """RecipeUpdate should allow setting hidden."""
        update = RecipeUpdate(hidden=True)
        assert update.hidden is True

    def test_update_favorited(self) -> None:
        """RecipeUpdate should allow setting favorited."""
        update = RecipeUpdate(favorited=True)
        assert update.favorited is True

    def test_update_hidden_defaults_none(self) -> None:
        """RecipeUpdate hidden should default to None (no change)."""
        update = RecipeUpdate()
        assert update.hidden is None

    def test_update_favorited_defaults_none(self) -> None:
        """RecipeUpdate favorited should default to None (no change)."""
        update = RecipeUpdate()
        assert update.favorited is None


class TestRecipeInputValidation:
    """Tests for input sanitization and length limits."""

    def test_ingredient_length_truncated(self) -> None:
        """Ingredients exceeding max length should be truncated."""
        long_ingredient = "x" * (MAX_INGREDIENT_LENGTH + 100)
        recipe = RecipeCreate(title="Test", url="https://example.com", ingredients=[long_ingredient])
        assert len(recipe.ingredients[0]) == MAX_INGREDIENT_LENGTH

    def test_instruction_length_truncated(self) -> None:
        """Instructions exceeding max length should be truncated."""
        long_instruction = "y" * (MAX_INSTRUCTION_LENGTH + 100)
        recipe = RecipeCreate(title="Test", url="https://example.com", instructions=[long_instruction])
        assert len(recipe.instructions[0]) == MAX_INSTRUCTION_LENGTH

    def test_too_many_ingredients_rejected(self) -> None:
        """More than MAX_INGREDIENTS should be rejected."""
        ingredients = [f"item {i}" for i in range(MAX_INGREDIENTS + 1)]
        with pytest.raises(ValidationError):
            RecipeCreate(title="Test", url="https://example.com", ingredients=ingredients)

    def test_too_many_instructions_rejected(self) -> None:
        """More than MAX_INSTRUCTIONS should be rejected."""
        instructions = [f"step {i}" for i in range(MAX_INSTRUCTIONS + 1)]
        with pytest.raises(ValidationError):
            RecipeCreate(title="Test", url="https://example.com", instructions=instructions)

    def test_too_many_tags_rejected(self) -> None:
        """More than MAX_TAGS should be rejected."""
        tags = [f"tag{i}" for i in range(MAX_TAGS + 1)]
        with pytest.raises(ValidationError):
            RecipeCreate(title="Test", url="https://example.com", tags=tags)

    def test_control_characters_stripped(self) -> None:
        """Control characters should be removed from ingredients and instructions."""
        recipe = RecipeCreate(
            title="Test",
            url="https://example.com",
            ingredients=["2 dl gr\x00ädde", "1 \x07egg"],
            instructions=["Cook \x0bwell"],
        )
        assert recipe.ingredients[0] == "2 dl grädde"
        assert recipe.ingredients[1] == "1 egg"
        assert recipe.instructions[0] == "Cook well"

    def test_tabs_and_newlines_preserved(self) -> None:
        """Tabs and newlines are legitimate whitespace and should be preserved."""
        recipe = RecipeCreate(
            title="Test", url="https://example.com", ingredients=["2 dl grädde"], instructions=["Step 1\n\tSubstep A"]
        )
        assert "\n" in recipe.instructions[0]
        assert "\t" in recipe.instructions[0]

    def test_normal_recipe_passes(self) -> None:
        """A normal recipe should pass all validators without modification."""
        recipe = RecipeCreate(
            title="Pasta Carbonara",
            url="https://example.com/recipe",
            ingredients=["200g spaghetti", "100g pancetta", "2 ägg", "½ dl parmesan"],
            instructions=["Koka pastan al dente", "Stek pancettan krispig"],
            tags=["pasta", "italian"],
        )
        assert len(recipe.ingredients) == 4
        assert len(recipe.instructions) == 2
        assert recipe.ingredients[0] == "200g spaghetti"


class TestIngredientCoercion:
    """Tests for before-mode ingredient coercion (dict → string)."""

    def test_dict_ingredients_coerced_to_strings(self) -> None:
        """Gemini-style structured dicts should be flattened to strings."""
        recipe = RecipeCreate(
            title="Test",
            url="https://example.com",
            ingredients=[  # ty: ignore[invalid-argument-type]
                {"item": "Fennel", "quantity": "1.75", "unit": "lbs"},
                {"item": "Olive oil", "quantity": "2", "unit": "tbsp"},
            ],
        )
        assert recipe.ingredients == ["1.75 lbs Fennel", "2 tbsp Olive oil"]

    def test_dict_ingredient_with_name_key(self) -> None:
        """Dicts using 'name' instead of 'item' should also be handled."""
        recipe = RecipeCreate(
            title="Test",
            url="https://example.com",
            ingredients=[{"name": "Salt", "quantity": "1", "unit": "tsp"}],  # ty: ignore[invalid-argument-type]
        )
        assert recipe.ingredients == ["1 tsp Salt"]

    def test_dict_ingredient_missing_quantity(self) -> None:
        """Dicts without quantity should still produce a valid string."""
        recipe = RecipeCreate(
            title="Test",
            url="https://example.com",
            ingredients=[{"item": "Salt", "unit": "", "quantity": ""}],  # ty: ignore[invalid-argument-type]
        )
        assert recipe.ingredients == ["Salt"]

    def test_mixed_string_and_dict_ingredients(self) -> None:
        """A mix of strings and dicts should all be coerced to strings."""
        recipe = RecipeCreate(
            title="Test",
            url="https://example.com",
            ingredients=["200g spaghetti", {"item": "Pancetta", "quantity": "100", "unit": "g"}, "2 eggs"],  # ty: ignore[invalid-argument-type]
        )
        assert recipe.ingredients == ["200g spaghetti", "100 g Pancetta", "2 eggs"]

    def test_numeric_ingredient_coerced(self) -> None:
        """Non-string, non-dict items (e.g. int) should be str-coerced."""
        recipe = RecipeCreate(title="Test", url="https://example.com", ingredients=[42])  # ty: ignore[invalid-argument-type]
        assert recipe.ingredients == ["42"]

    def test_string_ingredients_pass_through(self) -> None:
        """Plain string ingredients should pass through unchanged."""
        recipe = RecipeCreate(title="Test", url="https://example.com", ingredients=["1 cup flour", "2 eggs"])
        assert recipe.ingredients == ["1 cup flour", "2 eggs"]

    def test_recipe_model_also_coerces(self) -> None:
        """The Recipe model (used by _doc_to_recipe) should also coerce dicts."""
        recipe = Recipe(
            id="test",
            title="Test",
            url="https://example.com",
            ingredients=[{"item": "Fennel", "quantity": "1", "unit": "lb"}],  # ty: ignore[invalid-argument-type]
        )
        assert recipe.ingredients == ["1 lb Fennel"]
