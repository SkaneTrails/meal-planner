"""Tests for api/models/meal_plan.py."""

from datetime import date

from api.models.meal_plan import MealPlan, MealType, PlannedMeal


class TestMealType:
    """Tests for MealType enum."""

    def test_meal_types_exist(self) -> None:
        """Should have all expected meal types."""
        assert MealType.BREAKFAST.value == "breakfast"
        assert MealType.LUNCH.value == "lunch"
        assert MealType.DINNER.value == "dinner"
        assert MealType.SNACK.value == "snack"


class TestPlannedMeal:
    """Tests for PlannedMeal model."""

    def test_create_with_recipe(self) -> None:
        """Should create meal with recipe ID."""
        meal = PlannedMeal(date=date(2025, 1, 15), meal_type=MealType.DINNER, recipe_id="recipe123")
        assert meal.date == date(2025, 1, 15)
        assert meal.meal_type == MealType.DINNER
        assert meal.recipe_id == "recipe123"
        assert meal.recipe_title is None

    def test_create_with_custom_title(self) -> None:
        """Should create meal with custom title (no recipe)."""
        meal = PlannedMeal(date=date(2025, 1, 15), meal_type=MealType.LUNCH, recipe_title="Eating out")
        assert meal.recipe_id is None
        assert meal.recipe_title == "Eating out"


class TestMealPlan:
    """Tests for MealPlan model."""

    def test_empty_meal_plan(self) -> None:
        """Should create empty meal plan."""
        plan = MealPlan(household_id="household1")
        assert plan.household_id == "household1"
        assert plan.meals == {}
        assert plan.notes == {}

    def test_meal_plan_with_meals(self) -> None:
        """Should store meals in correct format."""
        plan = MealPlan(
            household_id="household1", meals={"2025-01-15_breakfast": "recipe1", "2025-01-15_dinner": "custom:Pizza"}
        )
        assert plan.meals["2025-01-15_breakfast"] == "recipe1"
        assert plan.meals["2025-01-15_dinner"] == "custom:Pizza"

    def test_get_meals_for_day(self) -> None:
        """Should return all meals for a specific day."""
        plan = MealPlan(
            household_id="household1",
            meals={
                "2025-01-15_breakfast": "recipe1",
                "2025-01-15_lunch": "recipe2",
                "2025-01-15_dinner": "custom:Takeout",
                "2025-01-16_lunch": "recipe3",
            },
        )
        meals = plan.get_meals_for_day(date(2025, 1, 15))
        assert len(meals) == 3

        # Check that we got the right meals
        meal_types = {m.meal_type for m in meals}
        assert MealType.BREAKFAST in meal_types
        assert MealType.LUNCH in meal_types
        assert MealType.DINNER in meal_types

    def test_get_meals_for_day_handles_custom(self) -> None:
        """Should correctly parse custom meals."""
        plan = MealPlan(household_id="household1", meals={"2025-01-15_dinner": "custom:Homemade Pizza"})
        meals = plan.get_meals_for_day(date(2025, 1, 15))
        assert len(meals) == 1
        assert meals[0].recipe_id is None
        assert meals[0].recipe_title == "Homemade Pizza"

    def test_get_meals_for_day_empty(self) -> None:
        """Should return empty list for day with no meals."""
        plan = MealPlan(household_id="household1", meals={"2025-01-15_lunch": "recipe1"})
        meals = plan.get_meals_for_day(date(2025, 1, 16))
        assert meals == []

    def test_get_meals_by_type(self) -> None:
        """Should return all meals of a specific type."""
        plan = MealPlan(
            household_id="household1",
            meals={"2025-01-15_dinner": "recipe1", "2025-01-16_dinner": "recipe2", "2025-01-15_lunch": "recipe3"},
        )
        dinners = plan.get_meals_by_type(MealType.DINNER)
        assert len(dinners) == 2
        assert all(m.meal_type == MealType.DINNER for m in dinners)

    def test_get_meals_by_type_empty(self) -> None:
        """Should return empty list for type with no meals."""
        plan = MealPlan(household_id="household1", meals={"2025-01-15_lunch": "recipe1"})
        dinners = plan.get_meals_by_type(MealType.DINNER)
        assert dinners == []

    def test_notes_storage(self) -> None:
        """Should store notes by date."""
        plan = MealPlan(household_id="household1", notes={"2025-01-15": "Work from home", "2025-01-16": "Office day"})
        assert plan.notes["2025-01-15"] == "Work from home"
        assert plan.notes["2025-01-16"] == "Office day"
