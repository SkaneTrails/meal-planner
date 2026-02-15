"""Tests for recipe notes API and storage."""

from collections.abc import Generator
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.auth.models import AuthenticatedUser
from api.models.recipe_note import RecipeNote
from api.storage.recipe_notes_storage import _doc_to_note

# Mount notes router under /recipes to match the real app
app = FastAPI()

from api.routers.recipes import router as recipes_router  # noqa: E402

app.include_router(recipes_router)


def _mock_user(household_id: str | None = "hh1") -> AuthenticatedUser:
    return AuthenticatedUser(uid="u1", email="test@example.com", household_id=household_id, role="member")


@pytest.fixture
def client() -> Generator[TestClient]:
    """Create test client with mocked auth (user with household)."""
    from api.auth.firebase import require_auth

    app.dependency_overrides[require_auth] = lambda: _mock_user()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def client_no_household() -> Generator[TestClient]:
    """Create test client with user that has no household."""
    from api.auth.firebase import require_auth

    app.dependency_overrides[require_auth] = lambda: _mock_user(household_id=None)
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _make_note_doc(note_id: str = "note1", **overrides: object) -> MagicMock:
    """Create a mock Firestore document snapshot for a recipe note."""
    doc = MagicMock()
    doc.id = note_id
    data = {
        "recipe_id": "recipe1",
        "household_id": "hh1",
        "text": "Great with extra garlic",
        "created_by": "test@example.com",
        "created_at": datetime(2026, 2, 15, tzinfo=UTC),
    }
    data.update(overrides)
    doc.to_dict.return_value = data
    return doc


class TestDocToNote:
    """Tests for the _doc_to_note mapping function."""

    def test_maps_all_fields(self) -> None:
        """Should map all Firestore document fields to RecipeNote."""
        doc = _make_note_doc(note_id="n42", text="Add chili flakes")
        note = _doc_to_note(doc)

        assert note.id == "n42"
        assert note.recipe_id == "recipe1"
        assert note.household_id == "hh1"
        assert note.text == "Add chili flakes"
        assert note.created_by == "test@example.com"
        assert isinstance(note.created_at, datetime)


class TestListNotes:
    """Tests for GET /recipes/{recipe_id}/notes."""

    @patch("api.routers.recipe_notes.recipe_notes_storage.list_notes")
    def test_returns_notes(self, mock_list: MagicMock, client: TestClient) -> None:
        """Should return list of notes for a recipe."""
        mock_list.return_value = [
            RecipeNote(
                id="n1",
                recipe_id="r1",
                household_id="hh1",
                text="Tasty!",
                created_by="test@example.com",
                created_at=datetime(2026, 2, 15, tzinfo=UTC),
            )
        ]
        response = client.get("/recipes/r1/notes")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["text"] == "Tasty!"
        assert data[0]["recipe_id"] == "r1"
        mock_list.assert_called_once_with("r1", "hh1")

    @patch("api.routers.recipe_notes.recipe_notes_storage.list_notes")
    def test_returns_empty_list(self, mock_list: MagicMock, client: TestClient) -> None:
        """Should return empty list when no notes exist."""
        mock_list.return_value = []
        response = client.get("/recipes/r1/notes")

        assert response.status_code == 200
        assert response.json() == []

    def test_requires_household(self, client_no_household: TestClient) -> None:
        """Should return 403 if user has no household."""
        response = client_no_household.get("/recipes/r1/notes")
        assert response.status_code == 403


class TestCreateNote:
    """Tests for POST /recipes/{recipe_id}/notes."""

    @patch("api.routers.recipe_notes.recipe_notes_storage.create_note")
    def test_creates_note(self, mock_create: MagicMock, client: TestClient) -> None:
        """Should create a note and return 201."""
        mock_create.return_value = RecipeNote(
            id="n_new",
            recipe_id="r1",
            household_id="hh1",
            text="Try doubling the sauce",
            created_by="test@example.com",
            created_at=datetime(2026, 2, 15, tzinfo=UTC),
        )
        response = client.post("/recipes/r1/notes", json={"text": "Try doubling the sauce"})

        assert response.status_code == 201
        data = response.json()
        assert data["text"] == "Try doubling the sauce"
        assert data["id"] == "n_new"
        mock_create.assert_called_once_with(
            recipe_id="r1", household_id="hh1", text="Try doubling the sauce", created_by="test@example.com"
        )

    def test_rejects_empty_text(self, client: TestClient) -> None:
        """Should return 422 for empty note text."""
        response = client.post("/recipes/r1/notes", json={"text": ""})
        assert response.status_code == 422

    def test_requires_household(self, client_no_household: TestClient) -> None:
        """Should return 403 if user has no household."""
        response = client_no_household.post("/recipes/r1/notes", json={"text": "hello"})
        assert response.status_code == 403


class TestDeleteNote:
    """Tests for DELETE /recipes/{recipe_id}/notes/{note_id}."""

    @patch("api.routers.recipe_notes.recipe_notes_storage.delete_note")
    def test_deletes_note(self, mock_delete: MagicMock, client: TestClient) -> None:
        """Should delete a note and return 204."""
        mock_delete.return_value = True
        response = client.delete("/recipes/r1/notes/n1")

        assert response.status_code == 204
        mock_delete.assert_called_once_with("n1", "hh1", "r1")

    @patch("api.routers.recipe_notes.recipe_notes_storage.delete_note")
    def test_returns_404_when_not_found(self, mock_delete: MagicMock, client: TestClient) -> None:
        """Should return 404 if note doesn't exist or wrong household."""
        mock_delete.return_value = False
        response = client.delete("/recipes/r1/notes/nonexistent")

        assert response.status_code == 404

    def test_requires_household(self, client_no_household: TestClient) -> None:
        """Should return 403 if user has no household."""
        response = client_no_household.delete("/recipes/r1/notes/n1")
        assert response.status_code == 403


class TestStorageListNotes:
    """Tests for recipe_notes_storage.list_notes."""

    @patch("api.storage.recipe_notes_storage._get_collection")
    def test_queries_by_recipe_and_household(self, mock_coll: MagicMock) -> None:
        """Should filter by recipe_id and household_id."""
        from api.storage.recipe_notes_storage import list_notes

        doc = _make_note_doc()
        mock_query = MagicMock()
        mock_coll.return_value.where.return_value = mock_query
        mock_query.where.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.stream.return_value = [doc]

        result = list_notes("recipe1", "hh1")

        assert len(result) == 1
        assert result[0].text == "Great with extra garlic"


class TestStorageCreateNote:
    """Tests for recipe_notes_storage.create_note."""

    @patch("api.storage.recipe_notes_storage._get_collection")
    def test_creates_document(self, mock_coll: MagicMock) -> None:
        """Should add a document to Firestore and return RecipeNote."""
        from api.storage.recipe_notes_storage import create_note

        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "auto_id_123"
        mock_coll.return_value.add.return_value = (None, mock_doc_ref)

        note = create_note("r1", "hh1", "Needs more salt", "user@example.com")

        assert note.id == "auto_id_123"
        assert note.recipe_id == "r1"
        assert note.household_id == "hh1"
        assert note.text == "Needs more salt"
        assert note.created_by == "user@example.com"
        mock_coll.return_value.add.assert_called_once()


class TestStorageDeleteNote:
    """Tests for recipe_notes_storage.delete_note."""

    @patch("api.storage.recipe_notes_storage._get_collection")
    def test_deletes_matching_note(self, mock_coll: MagicMock) -> None:
        """Should delete note when household matches."""
        from api.storage.recipe_notes_storage import delete_note

        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"household_id": "hh1", "recipe_id": "r1"}
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_coll.return_value.document.return_value = mock_doc_ref

        assert delete_note("n1", "hh1", "r1") is True
        mock_doc_ref.delete.assert_called_once()

    @patch("api.storage.recipe_notes_storage._get_collection")
    def test_returns_false_when_not_found(self, mock_coll: MagicMock) -> None:
        """Should return False when note doesn't exist."""
        from api.storage.recipe_notes_storage import delete_note

        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_coll.return_value.document.return_value = mock_doc_ref

        assert delete_note("n1", "hh1", "r1") is False

    @patch("api.storage.recipe_notes_storage._get_collection")
    def test_returns_false_for_wrong_household(self, mock_coll: MagicMock) -> None:
        """Should return False when household doesn't match."""
        from api.storage.recipe_notes_storage import delete_note

        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"household_id": "other_hh", "recipe_id": "r1"}
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_coll.return_value.document.return_value = mock_doc_ref

        assert delete_note("n1", "hh1", "r1") is False
        mock_doc_ref.delete.assert_not_called()

    @patch("api.storage.recipe_notes_storage._get_collection")
    def test_returns_false_for_wrong_recipe(self, mock_coll: MagicMock) -> None:
        """Should return False when recipe_id doesn't match."""
        from api.storage.recipe_notes_storage import delete_note

        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"household_id": "hh1", "recipe_id": "other_recipe"}
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_coll.return_value.document.return_value = mock_doc_ref

        assert delete_note("n1", "hh1", "r1") is False
        mock_doc_ref.delete.assert_not_called()
