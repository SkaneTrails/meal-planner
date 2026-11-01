"""Tests for sync status storage and the GET /sync/status endpoint."""

from collections.abc import Generator
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.routers.sync import router
from api.storage.sync_status import GLOBAL_DOC_ID, get_status, touch_household, touch_recipes

app = FastAPI()
app.include_router(router)


def _snapshot(doc_id: str, data: dict | None) -> MagicMock:
    snap = MagicMock()
    snap.id = doc_id
    snap.exists = data is not None
    snap.to_dict.return_value = data
    return snap


class TestTouch:
    """Version bumps written by storage write paths."""

    def test_touch_household_sets_new_versions(self, mock_sync_status_client: MagicMock) -> None:
        """Each touched kind gets a fresh opaque version, merged into the household doc."""
        touch_household("hh1", "grocery", "meal_plan")

        db = mock_sync_status_client.return_value
        db.collection.return_value.document.assert_called_once_with("hh1")
        written, kwargs = db.collection.return_value.document.return_value.set.call_args
        assert set(written[0]) == {"grocery", "meal_plan"}
        assert all(isinstance(v, str) and len(v) == 32 for v in written[0].values())
        assert kwargs == {"merge": True}

    def test_touch_household_versions_change_every_call(self, mock_sync_status_client: MagicMock) -> None:
        """Two writes must never produce the same version."""
        touch_household("hh1", "grocery")
        touch_household("hh1", "grocery")

        doc = mock_sync_status_client.return_value.collection.return_value.document.return_value
        first, second = (c.args[0]["grocery"] for c in doc.set.call_args_list)
        assert first != second

    def test_touch_household_rejects_unknown_kind(self) -> None:
        """A typo in a kind must fail loudly, not silently never sync."""
        with pytest.raises(ValueError, match="Unknown household sync kind"):
            touch_household("hh1", "groceries")  # type: ignore[arg-type]

    def test_touch_household_uses_given_client(self, mock_sync_status_client: MagicMock) -> None:
        """Scripts pass their own Firestore client."""
        own_db = MagicMock()
        touch_household("hh1", "settings", db=own_db)

        own_db.collection.return_value.document.return_value.set.assert_called_once()
        mock_sync_status_client.assert_not_called()

    def test_touch_recipes_writes_global_doc(self, mock_sync_status_client: MagicMock) -> None:
        """Recipe changes are global because shared recipes reach every household."""
        touch_recipes()

        db = mock_sync_status_client.return_value
        db.collection.return_value.document.assert_called_once_with(GLOBAL_DOC_ID)
        written = db.collection.return_value.document.return_value.set.call_args.args[0]
        assert list(written) == ["recipes"]

    def test_failed_marker_write_does_not_fail_the_data_write(
        self, mock_sync_status_client: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """The data is already written; raising would make clients repeat a non-idempotent write."""
        doc = mock_sync_status_client.return_value.collection.return_value.document.return_value
        doc.set.side_effect = RuntimeError("firestore down")

        touch_recipes()
        touch_household("hh1", "grocery")

        assert "Failed to bump sync version" in caplog.text


class TestGetStatus:
    """Reading the versions for a household."""

    def test_combines_global_and_household_versions(self, mock_sync_status_client: MagicMock) -> None:
        db = mock_sync_status_client.return_value
        db.get_all.return_value = [
            _snapshot(GLOBAL_DOC_ID, {"recipes": "r1"}),
            _snapshot("hh1", {"grocery": "g1", "meal_plan": "m1"}),
        ]

        assert get_status("hh1") == {"recipes": "r1", "grocery": "g1", "meal_plan": "m1", "settings": None}

    def test_missing_docs_read_as_none(self, mock_sync_status_client: MagicMock) -> None:
        db = mock_sync_status_client.return_value
        db.get_all.return_value = [_snapshot(GLOBAL_DOC_ID, None), _snapshot("hh1", None)]

        assert get_status("hh1") == {"recipes": None, "grocery": None, "meal_plan": None, "settings": None}

    def test_without_household_reads_only_global(self, mock_sync_status_client: MagicMock) -> None:
        db = mock_sync_status_client.return_value
        db.get_all.return_value = [_snapshot(GLOBAL_DOC_ID, {"recipes": "r1"})]

        assert get_status(None) == {"recipes": "r1", "grocery": None, "meal_plan": None, "settings": None}
        assert len(db.get_all.call_args.args[0]) == 1


class TestWritePathsBumpVersions:
    """Storage writes announce themselves; rejected writes do not."""

    @staticmethod
    def _recipe_db(data: dict | None) -> MagicMock:
        db = MagicMock()
        db.collection.return_value.document.return_value.get.return_value = _snapshot("r1", data)
        return db

    @staticmethod
    def _sync_writes(mock_sync_status_client: MagicMock) -> list[dict]:
        doc = mock_sync_status_client.return_value.collection.return_value.document.return_value
        return [c.args[0] for c in doc.set.call_args_list]

    def test_recipe_update_bumps_recipes(self, mock_sync_status_client: MagicMock) -> None:
        from api.models.recipe import RecipeUpdate
        from api.storage import recipe_storage

        db = self._recipe_db({"title": "Soup", "household_id": "hh1"})
        with patch("api.storage.recipe_storage.get_firestore_client", return_value=db):
            recipe_storage.update_recipe("r1", RecipeUpdate(rating=5), household_id="hh1")

        assert [list(w) for w in self._sync_writes(mock_sync_status_client)] == [["recipes"]]

    def test_rejected_recipe_delete_does_not_bump(self, mock_sync_status_client: MagicMock) -> None:
        from api.storage import recipe_storage

        db = self._recipe_db({"title": "Soup", "household_id": "other"})
        with patch("api.storage.recipe_storage.get_firestore_client", return_value=db):
            assert recipe_storage.delete_recipe("r1", household_id="hh1") is False

        assert self._sync_writes(mock_sync_status_client) == []

    def test_recipe_delete_bumps_recipes(self, mock_sync_status_client: MagicMock) -> None:
        from api.storage import recipe_storage

        db = self._recipe_db({"title": "Soup", "household_id": "hh1"})
        with patch("api.storage.recipe_storage.get_firestore_client", return_value=db):
            assert recipe_storage.delete_recipe("r1", household_id="hh1") is True

        assert [list(w) for w in self._sync_writes(mock_sync_status_client)] == [["recipes"]]

    def test_household_settings_update_bumps_settings(self, mock_sync_status_client: MagicMock) -> None:
        from api.storage import household_storage

        db = MagicMock()
        db.collection.return_value.document.return_value.get.return_value = _snapshot("hh1", {"name": "Home"})
        with patch("api.storage.household_storage._get_db", return_value=db):
            assert household_storage.update_household_settings("hh1", {"language": "sv"}) is True

        mock_sync_status_client.return_value.collection.return_value.document.assert_called_with("hh1")
        assert [list(w) for w in self._sync_writes(mock_sync_status_client)] == [["settings"]]

    def test_missing_household_settings_update_does_not_bump(self, mock_sync_status_client: MagicMock) -> None:
        from api.storage import household_storage

        db = MagicMock()
        db.collection.return_value.document.return_value.get.return_value = _snapshot("hh1", None)
        with patch("api.storage.household_storage._get_db", return_value=db):
            assert household_storage.update_household_settings("hh1", {"language": "sv"}) is False

        assert self._sync_writes(mock_sync_status_client) == []


class TestSyncStatusEndpoint:
    """GET /sync/status."""

    @pytest.fixture
    def client(self, create_test_client) -> Generator[TestClient]:
        yield from create_test_client(app)

    @pytest.fixture
    def superuser_client(self, create_test_client) -> Generator[TestClient]:
        yield from create_test_client(app, household_id=None, role="superuser")

    def test_returns_versions_and_scope(self, client: TestClient) -> None:
        versions = {"recipes": "r1", "grocery": "g1", "meal_plan": None, "settings": "s1"}
        with patch("api.routers.sync.get_status", return_value=versions) as mock_get:
            response = client.get("/sync/status")

        assert response.status_code == 200
        assert response.json() == {"scope": "member:test_household", **versions}
        mock_get.assert_called_once_with("test_household")

    def test_scope_for_user_without_household(self, superuser_client: TestClient) -> None:
        versions = {"recipes": "r1", "grocery": None, "meal_plan": None, "settings": None}
        with patch("api.routers.sync.get_status", return_value=versions):
            response = superuser_client.get("/sync/status")

        assert response.json()["scope"] == "superuser:-"
