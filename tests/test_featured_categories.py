"""Tests for featured recipe categories — service logic and API endpoint."""

from collections.abc import Generator
from datetime import datetime
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.models.featured import CategoryDefinition
from api.models.recipe import Recipe
from api.routers.featured import router
from api.services.featured_categories import (
    CATEGORIES_TO_SHOW,
    CATEGORY_DEFINITIONS,
    MIN_RECIPES_PER_CATEGORY,
    RECIPES_PER_CATEGORY,
    _is_eligible,
    _recipe_matches,
    _select_recipes,
    build_featured_categories,
    get_season,
    get_time_of_day,
)

app = FastAPI()
app.include_router(router)


@pytest.fixture
def client(create_test_client) -> Generator[TestClient]:
    """Create test client with mocked auth."""
    yield from create_test_client(app)


def _make_recipe(recipe_id: str, tags: list[str], **kwargs: str) -> Recipe:
    """Create a minimal recipe with the given tags."""
    return Recipe(
        id=recipe_id,
        title=kwargs.get("title", f"Recipe {recipe_id}"),
        url=f"https://example.com/{recipe_id}",
        ingredients=["ingredient"],
        instructions=["step 1"],
        tags=tags,
        household_id=kwargs.get("household_id", "test_household"),
    )


class TestGetSeason:
    """Tests for season derivation from month."""

    @pytest.mark.parametrize(("month", "expected"), [(12, "winter"), (1, "winter"), (2, "winter")])
    def test_winter_months(self, month: int, expected: str) -> None:
        assert get_season(month) == expected

    @pytest.mark.parametrize(("month", "expected"), [(3, "spring"), (4, "spring"), (5, "spring")])
    def test_spring_months(self, month: int, expected: str) -> None:
        assert get_season(month) == expected

    @pytest.mark.parametrize(("month", "expected"), [(6, "summer"), (7, "summer"), (8, "summer")])
    def test_summer_months(self, month: int, expected: str) -> None:
        assert get_season(month) == expected

    @pytest.mark.parametrize(("month", "expected"), [(9, "autumn"), (10, "autumn"), (11, "autumn")])
    def test_autumn_months(self, month: int, expected: str) -> None:
        assert get_season(month) == expected


class TestGetTimeOfDay:
    """Tests for time-of-day bucket derivation from hour."""

    @pytest.mark.parametrize("hour", [5, 8, 11])
    def test_morning_hours(self, hour: int) -> None:
        assert get_time_of_day(hour) == "morning"

    @pytest.mark.parametrize("hour", [12, 14, 16])
    def test_afternoon_hours(self, hour: int) -> None:
        assert get_time_of_day(hour) == "afternoon"

    @pytest.mark.parametrize("hour", [17, 21, 0, 4])
    def test_evening_hours(self, hour: int) -> None:
        assert get_time_of_day(hour) == "evening"


class TestIsEligible:
    """Tests for category eligibility checks."""

    def test_no_restrictions_always_eligible(self) -> None:
        defn = CategoryDefinition(key="any")
        assert _is_eligible(defn, season="winter", time_of_day="morning")

    def test_season_match(self) -> None:
        defn = CategoryDefinition(key="winter-only", seasons=["winter"])
        assert _is_eligible(defn, season="winter", time_of_day="morning")

    def test_season_mismatch(self) -> None:
        defn = CategoryDefinition(key="winter-only", seasons=["winter"])
        assert not _is_eligible(defn, season="summer", time_of_day="morning")

    def test_time_match(self) -> None:
        defn = CategoryDefinition(key="morning-only", times=["morning"])
        assert _is_eligible(defn, season="winter", time_of_day="morning")

    def test_time_mismatch(self) -> None:
        defn = CategoryDefinition(key="morning-only", times=["morning"])
        assert not _is_eligible(defn, season="winter", time_of_day="evening")

    def test_both_season_and_time_must_match(self) -> None:
        defn = CategoryDefinition(key="restricted", seasons=["summer"], times=["evening"])
        assert _is_eligible(defn, season="summer", time_of_day="evening")
        assert not _is_eligible(defn, season="summer", time_of_day="morning")
        assert not _is_eligible(defn, season="winter", time_of_day="evening")


class TestRecipeMatches:
    """Tests for recipe-to-category tag matching."""

    def test_no_tag_requirements_matches_anything(self) -> None:
        defn = CategoryDefinition(key="all")
        recipe = _make_recipe("r1", ["soup"])
        assert _recipe_matches(recipe, defn)

    def test_required_tags_all_present(self) -> None:
        defn = CategoryDefinition(key="x", required_tags=["pasta", "italian"])
        recipe = _make_recipe("r1", ["pasta", "italian", "quick"])
        assert _recipe_matches(recipe, defn)

    def test_required_tags_missing_one(self) -> None:
        defn = CategoryDefinition(key="x", required_tags=["pasta", "italian"])
        recipe = _make_recipe("r1", ["pasta", "quick"])
        assert not _recipe_matches(recipe, defn)

    def test_any_tags_one_present(self) -> None:
        defn = CategoryDefinition(key="x", any_tags=["soup", "stew"])
        recipe = _make_recipe("r1", ["stew", "winter"])
        assert _recipe_matches(recipe, defn)

    def test_any_tags_none_present(self) -> None:
        defn = CategoryDefinition(key="x", any_tags=["soup", "stew"])
        recipe = _make_recipe("r1", ["pasta", "quick"])
        assert not _recipe_matches(recipe, defn)

    def test_required_and_any_combined(self) -> None:
        defn = CategoryDefinition(key="x", required_tags=["breakfast"], any_tags=["quick", "easy"])
        recipe_ok = _make_recipe("r1", ["breakfast", "quick", "eggs"])
        recipe_no_any = _make_recipe("r2", ["breakfast", "slow"])
        recipe_no_req = _make_recipe("r3", ["quick", "lunch"])
        assert _recipe_matches(recipe_ok, defn)
        assert not _recipe_matches(recipe_no_any, defn)
        assert not _recipe_matches(recipe_no_req, defn)

    def test_empty_recipe_tags_no_match_when_tags_required(self) -> None:
        defn = CategoryDefinition(key="x", required_tags=["pasta"])
        recipe = _make_recipe("r1", [])
        assert not _recipe_matches(recipe, defn)


class TestSelectRecipes:
    """Tests for recipe selection with sampling."""

    def test_returns_matching_recipes(self) -> None:
        defn = CategoryDefinition(key="soups", any_tags=["soup"])
        recipes = [
            _make_recipe("r1", ["soup", "winter"]),
            _make_recipe("r2", ["pasta"]),
            _make_recipe("r3", ["soup", "tomato"]),
        ]
        result = _select_recipes(recipes, defn)
        assert len(result) == 2
        assert all(r.id in {"r1", "r3"} for r in result)

    def test_caps_at_recipes_per_category(self) -> None:
        defn = CategoryDefinition(key="all", any_tags=["tagged"])
        recipes = [_make_recipe(f"r{i}", ["tagged"]) for i in range(20)]
        result = _select_recipes(recipes, defn)
        assert len(result) == RECIPES_PER_CATEGORY

    def test_returns_empty_when_no_matches(self) -> None:
        defn = CategoryDefinition(key="x", required_tags=["nonexistent"])
        recipes = [_make_recipe("r1", ["soup"])]
        result = _select_recipes(recipes, defn)
        assert result == []


class TestBuildFeaturedCategories:
    """Tests for the main orchestrator."""

    def _winter_evening(self) -> datetime:
        return datetime(2026, 1, 15, 19, 30)  # noqa: DTZ001

    def _summer_morning(self) -> datetime:
        return datetime(2026, 7, 10, 8, 0)  # noqa: DTZ001

    def test_returns_correct_season_and_time(self) -> None:
        result = build_featured_categories([], now=self._winter_evening())
        assert result.season == "winter"
        assert result.time_of_day == "evening"

    def test_empty_library_returns_no_categories(self) -> None:
        result = build_featured_categories([], now=self._winter_evening())
        assert result.categories == []

    def test_returns_up_to_three_categories(self) -> None:
        recipes = (
            [_make_recipe(f"s{i}", ["comfort-food", "hearty", "winter"]) for i in range(5)]
            + [_make_recipe(f"p{i}", ["soup", "winter"]) for i in range(5)]
            + [_make_recipe(f"o{i}", ["one-pot", "weeknight"]) for i in range(5)]
            + [_make_recipe(f"pa{i}", ["pasta", "weeknight"]) for i in range(5)]
        )
        result = build_featured_categories(recipes, now=self._winter_evening())
        assert len(result.categories) <= CATEGORIES_TO_SHOW

    def test_skips_categories_below_minimum_recipes(self) -> None:
        recipes = [_make_recipe("r1", ["soup", "winter"])]
        result = build_featured_categories(recipes, now=self._winter_evening())
        assert result.categories == []

    def test_includes_categories_at_minimum_threshold(self) -> None:
        recipes = [_make_recipe(f"r{i}", ["soup", "winter"]) for i in range(MIN_RECIPES_PER_CATEGORY)]
        result = build_featured_categories(recipes, now=self._winter_evening())
        soup_cats = [c for c in result.categories if c.key == "hearty-soups"]
        assert len(soup_cats) == 1
        assert len(soup_cats[0].recipes) == MIN_RECIPES_PER_CATEGORY

    def test_each_category_has_max_8_recipes(self) -> None:
        recipes = [_make_recipe(f"r{i}", ["soup", "winter"]) for i in range(20)]
        result = build_featured_categories(recipes, now=self._winter_evening())
        for cat in result.categories:
            assert len(cat.recipes) <= RECIPES_PER_CATEGORY

    def test_summer_morning_picks_summer_categories(self) -> None:
        recipes = (
            [_make_recipe(f"s{i}", ["salad", "summer", "light"]) for i in range(5)]
            + [_make_recipe(f"g{i}", ["grilled", "bbq", "summer"]) for i in range(5)]
            + [_make_recipe(f"b{i}", ["breakfast", "quick", "eggs"]) for i in range(5)]
        )
        result = build_featured_categories(recipes, now=self._summer_morning())
        category_keys = {c.key for c in result.categories}
        winter_keys = {"cozy-winter", "hearty-soups", "comfort-classics"}
        assert not category_keys & winter_keys

    def test_category_keys_are_valid_strings(self) -> None:
        recipes = [_make_recipe(f"r{i}", ["soup", "winter", "comfort-food"]) for i in range(5)]
        result = build_featured_categories(recipes, now=self._winter_evening())
        for cat in result.categories:
            assert isinstance(cat.key, str)
            assert len(cat.key) > 0


class TestCategoryDefinitionsIntegrity:
    """Validate the built-in category definitions config."""

    def test_all_definitions_have_unique_keys(self) -> None:
        keys = [d.key for d in CATEGORY_DEFINITIONS]
        assert len(keys) == len(set(keys))

    def test_all_definitions_have_at_least_one_tag_rule(self) -> None:
        for defn in CATEGORY_DEFINITIONS:
            assert defn.required_tags or defn.any_tags, f"{defn.key} has no tag rules"

    def test_valid_seasons_in_definitions(self) -> None:
        valid_seasons = {"winter", "spring", "summer", "autumn"}
        for defn in CATEGORY_DEFINITIONS:
            for s in defn.seasons:
                assert s in valid_seasons, f"{defn.key} has invalid season '{s}'"

    def test_valid_times_in_definitions(self) -> None:
        valid_times = {"morning", "afternoon", "evening"}
        for defn in CATEGORY_DEFINITIONS:
            for t in defn.times:
                assert t in valid_times, f"{defn.key} has invalid time '{t}'"


class TestFeaturedEndpoint:
    """Integration tests for GET /recipes/featured."""

    def test_returns_200(self, client: TestClient) -> None:
        with patch("api.routers.featured.get_all_recipes", return_value=[]):
            response = client.get("/recipes/featured")
        assert response.status_code == 200

    def test_returns_featured_structure(self, client: TestClient) -> None:
        recipes = [_make_recipe(f"s{i}", ["soup", "winter", "comfort-food"]) for i in range(5)] + [
            _make_recipe(f"t{i}", ["stew", "hearty", "winter"]) for i in range(5)
        ]
        with (
            patch("api.routers.featured.get_all_recipes", return_value=recipes),
            patch("api.services.featured_categories.datetime") as mock_dt,
        ):
            mock_dt.now.return_value = datetime(2026, 1, 15, 19, 0)  # noqa: DTZ001
            mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)  # noqa: DTZ001
            response = client.get("/recipes/featured")

        data = response.json()
        assert "categories" in data
        assert "season" in data
        assert "time_of_day" in data
        for cat in data["categories"]:
            assert "key" in cat
            assert "recipes" in cat

    def test_passes_household_id_for_regular_user(self, client: TestClient) -> None:
        with patch("api.routers.featured.get_all_recipes", return_value=[]) as mock_get:
            client.get("/recipes/featured")
        mock_get.assert_called_once_with(household_id="test_household")

    def test_passes_none_household_for_superuser(self, create_test_client) -> None:
        gen = create_test_client(app, role="superuser", household_id="hh1")
        su_client = next(gen)
        with patch("api.routers.featured.get_all_recipes", return_value=[]) as mock_get:
            su_client.get("/recipes/featured")
        mock_get.assert_called_once_with(household_id=None)
