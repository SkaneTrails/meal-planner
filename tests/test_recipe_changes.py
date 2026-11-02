"""Tests for recipe delta sync: tombstones, the changes query, and GET /recipes/changes."""

from collections.abc import Generator
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.models.recipe import Recipe
from api.routers.recipes import router
from api.storage.recipe_queries import get_recipe_changes
from api.storage.recipe_tombstones import add_tombstone, get_removed_recipe_ids, is_removal_for

app = FastAPI()
app.include_router(router)

SINCE = datetime(2026, 11, 1, tzinfo=UTC)


def _doc(doc_id: str, data: dict) -> MagicMock:
    doc = MagicMock()
    doc.id = doc_id
    doc.to_dict.return_value = data
    return doc


@pytest.fixture
def client(create_test_client) -> Generator[TestClient]:
    yield from create_test_client(app)


@pytest.fixture
def superuser_client(create_test_client) -> Generator[TestClient]:
    yield from create_test_client(app, household_id=None, role="superuser")


class TestTombstones:
    """Who is told that a recipe went away."""

    def test_add_tombstone_records_owner_sharing_and_time(self) -> None:
        writer, db = MagicMock(), MagicMock()

        add_tombstone(writer, db, "r1", household_id="hh1", was_shared=True, removed_at=SINCE)

        db.collection.assert_called_once_with("recipe_tombstones")
        assert writer.set.call_args[0][1] == {
            "recipe_id": "r1",
            "household_id": "hh1",
            "was_shared": True,
            "removed_at": SINCE,
        }

    @pytest.mark.parametrize(
        ("tombstone", "household_id", "expected"),
        [
            ({"household_id": "hh1", "was_shared": False}, "hh1", True),
            ({"household_id": "hh1", "was_shared": False}, "hh2", False),
            ({"household_id": "hh1", "was_shared": True}, "hh2", True),
            ({"household_id": "hh1", "was_shared": False}, None, True),
        ],
    )
    def test_removal_reaches_owner_everyone_for_shared_and_superusers(
        self,
        tombstone: dict,
        household_id: str | None,
        expected: bool,  # noqa: FBT001
    ) -> None:
        assert is_removal_for(tombstone, household_id) is expected

    def test_removed_ids_are_filtered_by_audience_and_unique(self) -> None:
        db = MagicMock()
        db.collection.return_value.where.return_value.stream.return_value = [
            _doc("t1", {"recipe_id": "own", "household_id": "hh1", "was_shared": False}),
            _doc("t2", {"recipe_id": "other", "household_id": "hh2", "was_shared": False}),
            _doc("t3", {"recipe_id": "unshared", "household_id": "hh2", "was_shared": True}),
            _doc("t4", {"recipe_id": "own", "household_id": "hh1", "was_shared": False}),
        ]

        assert get_removed_recipe_ids(db, SINCE, "hh1") == ["own", "unshared"]


class TestGetRecipeChanges:
    """The changes query behind GET /recipes/changes."""

    def test_full_snapshot_merges_own_and_shared_without_removals(self) -> None:
        db = MagicMock()
        own_query, shared_query = MagicMock(), MagicMock()
        db.collection.return_value.where.side_effect = [own_query, shared_query]
        own_query.stream.return_value = [_doc("a", {"title": "Own", "household_id": "hh1"})]
        shared_query.stream.return_value = [
            _doc("a", {"title": "Own", "household_id": "hh1", "visibility": "shared"}),
            _doc("b", {"title": "Shared", "household_id": "hh2", "visibility": "shared", "hidden": True}),
        ]

        with patch("api.storage.recipe_queries.get_firestore_client", return_value=db):
            recipes, removed = get_recipe_changes(None, "hh1")

        assert [r.id for r in recipes] == ["a", "b"]
        assert recipes[1].hidden is True
        assert removed == []

    def test_delta_filters_by_updated_at_and_drops_removals_that_are_changes(self) -> None:
        db = MagicMock()
        own_query = MagicMock()
        own_query.where.return_value.stream.return_value = [_doc("back", {"title": "Back", "household_id": "hh1"})]
        shared_query = MagicMock()
        shared_query.where.return_value.stream.return_value = []
        db.collection.return_value.where.side_effect = [own_query, shared_query]

        with (
            patch("api.storage.recipe_queries.get_firestore_client", return_value=db),
            patch("api.storage.recipe_queries.get_removed_recipe_ids", return_value=["gone", "back"]),
        ):
            recipes, removed = get_recipe_changes(SINCE, "hh1")

        assert own_query.where.call_args.kwargs["filter"].op_string == ">"
        assert [r.id for r in recipes] == ["back"]
        assert removed == ["gone"]

    def test_superuser_reads_the_whole_collection(self) -> None:
        db = MagicMock()
        db.collection.return_value.stream.return_value = [_doc("x", {"title": "Any"})]

        with patch("api.storage.recipe_queries.get_firestore_client", return_value=db):
            recipes, _ = get_recipe_changes(None, None)

        db.collection.return_value.where.assert_not_called()
        assert [r.id for r in recipes] == ["x"]


class TestRecipeChangesEndpoint:
    """GET /recipes/changes."""

    def test_returns_changes_with_overlapping_server_time_and_scope(self, client: TestClient) -> None:
        recipe = Recipe(id="r1", title="Soup", url="https://example.com")
        with patch("api.routers.recipes.get_recipe_changes_storage", return_value=([recipe], ["gone"])) as mock_changes:
            response = client.get("/recipes/changes", params={"since": "2026-11-01T10:00:00Z"})

        assert response.status_code == 200
        body = response.json()
        assert [r["id"] for r in body["recipes"]] == ["r1"]
        assert body["deleted_ids"] == ["gone"]
        assert body["scope"] == "member:test_household"
        assert body["server_time"].endswith("Z")
        assert datetime.fromisoformat(body["server_time"]) < datetime.now(UTC)
        since_arg, household_arg = mock_changes.call_args.args
        assert since_arg == datetime(2026, 11, 1, 10, tzinfo=UTC)
        assert household_arg == "test_household"

    def test_without_since_returns_everything(self, client: TestClient) -> None:
        with patch("api.routers.recipes.get_recipe_changes_storage", return_value=([], [])) as mock_changes:
            client.get("/recipes/changes")

        assert mock_changes.call_args.args == (None, "test_household")

    def test_superuser_scope_covers_all_households(self, superuser_client: TestClient) -> None:
        with patch("api.routers.recipes.get_recipe_changes_storage", return_value=([], [])) as mock_changes:
            body = superuser_client.get("/recipes/changes").json()

        assert mock_changes.call_args.args == (None, None)
        assert body["scope"] == "superuser:-"
