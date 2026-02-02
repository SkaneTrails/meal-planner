"""Pytest configuration and fixtures."""

import pytest

from api.models.recipe import Recipe


@pytest.fixture
def sample_recipe() -> Recipe:
    """Provide a sample recipe for tests."""
    return Recipe(
        id="test_carbonara_123",
        title="Spaghetti Carbonara",
        url="https://example.com/carbonara",
        ingredients=[
            "400g spaghetti",
            "200g guanciale or pancetta",
            "4 egg yolks",
            "100g pecorino romano",
            "Black pepper",
        ],
        instructions=[
            "Cook pasta in salted water until al dente",
            "Fry guanciale until crispy",
            "Mix egg yolks with pecorino",
            "Combine pasta with guanciale, remove from heat",
            "Add egg mixture and toss quickly",
            "Season with black pepper and serve",
        ],
        image_url="https://example.com/carbonara.jpg",
        servings=4,
        prep_time=10,
        cook_time=20,
    )


@pytest.fixture
def sample_ingredients() -> list[str]:
    """Provide sample ingredients for tests."""
    return ["2 cups flour", "1 cup sugar", "3 eggs", "1/2 cup butter", "1 tsp vanilla extract"]
