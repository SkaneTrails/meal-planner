"""Tests for api/routers/admin.py."""

from collections.abc import Callable, Coroutine, Generator
from typing import Any
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.auth.models import AuthenticatedUser
from api.routers.admin import router
from api.storage.household_storage import Household, HouseholdMember

# Create a test app without auth for unit testing
app = FastAPI()
app.include_router(router)


def _create_mock_auth(
    role: str = "member", household_id: str | None = None
) -> Callable[[], Coroutine[Any, Any, AuthenticatedUser]]:
    """Create a mock auth function for testing different roles."""

    async def mock_auth() -> AuthenticatedUser:
        return AuthenticatedUser(
            uid="test_user", email="test@example.com", household_id=household_id or "test_household", role=role
        )

    return mock_auth


@pytest.fixture
def superuser_client() -> Generator[TestClient]:
    """Create test client with superuser auth."""
    from api.auth.firebase import require_auth

    app.dependency_overrides[require_auth] = _create_mock_auth(role="superuser")
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_client() -> Generator[TestClient]:
    """Create test client with admin auth."""
    from api.auth.firebase import require_auth

    app.dependency_overrides[require_auth] = _create_mock_auth(role="admin", household_id="test_household")
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def member_client() -> Generator[TestClient]:
    """Create test client with member auth."""
    from api.auth.firebase import require_auth

    app.dependency_overrides[require_auth] = _create_mock_auth(role="member", household_id="test_household")
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_household() -> Household:
    """Create a sample household for testing."""
    from datetime import UTC, datetime

    return Household(
        id="test_household", name="Test Family", created_at=datetime.now(UTC), created_by="creator@example.com"
    )


@pytest.fixture
def sample_membership() -> HouseholdMember:
    """Create a sample membership for testing."""
    return HouseholdMember(
        email="member@example.com", household_id="test_household", role="member", display_name="Test Member"
    )


class TestListHouseholds:
    """Tests for GET /admin/households endpoint."""

    def test_superuser_can_list(self, superuser_client: TestClient, sample_household: Household) -> None:
        """Superuser should be able to list all households."""
        with patch("api.routers.admin.household_storage.list_all_households", return_value=[sample_household]):
            response = superuser_client.get("/admin/households")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "test_household"
        assert data[0]["name"] == "Test Family"

    def test_admin_forbidden(self, admin_client: TestClient) -> None:
        """Admin should not be able to list all households."""
        response = admin_client.get("/admin/households")

        assert response.status_code == 403
        assert "Superuser" in response.json()["detail"]

    def test_member_forbidden(self, member_client: TestClient) -> None:
        """Member should not be able to list all households."""
        response = member_client.get("/admin/households")

        assert response.status_code == 403


class TestCreateHousehold:
    """Tests for POST /admin/households endpoint."""

    def test_superuser_can_create(self, superuser_client: TestClient, sample_household: Household) -> None:
        """Superuser should be able to create a household."""
        with (
            patch("api.routers.admin.household_storage.household_name_exists", return_value=False),
            patch("api.routers.admin.household_storage.create_household", return_value="new_id"),
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
        ):
            response = superuser_client.post("/admin/households", json={"name": "New Family"})

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Family"

    def test_admin_forbidden(self, admin_client: TestClient) -> None:
        """Admin should not be able to create households."""
        response = admin_client.post("/admin/households", json={"name": "New Family"})

        assert response.status_code == 403

    def test_invalid_name(self, superuser_client: TestClient) -> None:
        """Should reject empty name."""
        response = superuser_client.post("/admin/households", json={"name": ""})

        assert response.status_code == 422

    def test_invalid_characters_in_name(self, superuser_client: TestClient) -> None:
        """Should reject name with invalid characters."""
        response = superuser_client.post("/admin/households", json={"name": "Test<script>"})

        assert response.status_code == 422

    def test_duplicate_name(self, superuser_client: TestClient) -> None:
        """Should reject duplicate household name."""
        with patch("api.routers.admin.household_storage.household_name_exists", return_value=True):
            response = superuser_client.post("/admin/households", json={"name": "Existing Family"})

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]


class TestRenameHousehold:
    """Tests for PATCH /admin/households/{household_id} endpoint."""

    def test_superuser_can_rename(self, superuser_client: TestClient, sample_household: Household) -> None:
        """Superuser should be able to rename any household."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.household_name_exists", return_value=False),
            patch("api.routers.admin.household_storage.update_household", return_value=True),
        ):
            response = superuser_client.patch("/admin/households/test_household", json={"name": "New Name"})

        assert response.status_code == 200
        assert response.json()["name"] == "New Name"

    def test_admin_can_rename_own(self, admin_client: TestClient, sample_household: Household) -> None:
        """Admin should be able to rename their own household."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.household_name_exists", return_value=False),
            patch("api.routers.admin.household_storage.update_household", return_value=True),
        ):
            response = admin_client.patch("/admin/households/test_household", json={"name": "New Name"})

        assert response.status_code == 200

    def test_admin_forbidden_other(self, admin_client: TestClient) -> None:
        """Admin should not be able to rename other households."""
        response = admin_client.patch("/admin/households/other_household", json={"name": "New Name"})

        assert response.status_code == 403

    def test_duplicate_name_rejected(self, superuser_client: TestClient, sample_household: Household) -> None:
        """Should reject rename to existing name."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.household_name_exists", return_value=True),
        ):
            response = superuser_client.patch("/admin/households/test_household", json={"name": "Existing Name"})

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    def test_not_found(self, superuser_client: TestClient) -> None:
        """Should return 404 for non-existent household."""
        with patch("api.routers.admin.household_storage.get_household", return_value=None):
            response = superuser_client.patch("/admin/households/nonexistent", json={"name": "New Name"})

        assert response.status_code == 404

    def test_invalid_name(self, superuser_client: TestClient, sample_household: Household) -> None:
        """Should reject invalid characters in new name."""
        response = superuser_client.patch("/admin/households/test_household", json={"name": "Name<script>"})

        assert response.status_code == 422


class TestGetHousehold:
    """Tests for GET /admin/households/{household_id} endpoint."""

    def test_superuser_can_get_any(self, superuser_client: TestClient, sample_household: Household) -> None:
        """Superuser should be able to get any household."""
        with patch("api.routers.admin.household_storage.get_household", return_value=sample_household):
            response = superuser_client.get("/admin/households/any_household")

        assert response.status_code == 200
        assert response.json()["name"] == "Test Family"

    def test_admin_can_get_own(self, admin_client: TestClient, sample_household: Household) -> None:
        """Admin should be able to get their own household."""
        with patch("api.routers.admin.household_storage.get_household", return_value=sample_household):
            response = admin_client.get("/admin/households/test_household")

        assert response.status_code == 200
        assert response.json()["name"] == "Test Family"

    def test_admin_forbidden_other(self, admin_client: TestClient) -> None:
        """Admin should not be able to get other households."""
        response = admin_client.get("/admin/households/other_household")

        assert response.status_code == 403

    def test_member_forbidden(self, member_client: TestClient) -> None:
        """Member should not be able to get household details."""
        response = member_client.get("/admin/households/test_household")

        assert response.status_code == 403

    def test_not_found(self, superuser_client: TestClient) -> None:
        """Should return 404 for non-existent household."""
        with patch("api.routers.admin.household_storage.get_household", return_value=None):
            response = superuser_client.get("/admin/households/nonexistent")

        assert response.status_code == 404


class TestListMembers:
    """Tests for GET /admin/households/{household_id}/members endpoint."""

    def test_superuser_can_list(
        self, superuser_client: TestClient, sample_household: Household, sample_membership: HouseholdMember
    ) -> None:
        """Superuser should be able to list members of any household."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.list_household_members", return_value=[sample_membership]),
        ):
            response = superuser_client.get("/admin/households/test_household/members")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["email"] == "member@example.com"

    def test_admin_can_list_own(
        self, admin_client: TestClient, sample_household: Household, sample_membership: HouseholdMember
    ) -> None:
        """Admin should be able to list members of their own household."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.list_household_members", return_value=[sample_membership]),
        ):
            response = admin_client.get("/admin/households/test_household/members")

        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_household_not_found(self, superuser_client: TestClient) -> None:
        """Should return 404 for non-existent household."""
        with patch("api.routers.admin.household_storage.get_household", return_value=None):
            response = superuser_client.get("/admin/households/nonexistent/members")

        assert response.status_code == 404


class TestAddMember:
    """Tests for POST /admin/households/{household_id}/members endpoint."""

    def test_superuser_can_add(self, superuser_client: TestClient, sample_household: Household) -> None:
        """Superuser should be able to add members."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.get_user_membership", return_value=None),
            patch("api.routers.admin.household_storage.add_member") as mock_add,
        ):
            response = superuser_client.post(
                "/admin/households/test_household/members",
                json={"email": "new@example.com", "role": "member", "display_name": "New User"},
            )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "new@example.com"
        assert data["role"] == "member"
        mock_add.assert_called_once()

    def test_admin_can_add_to_own(self, admin_client: TestClient, sample_household: Household) -> None:
        """Admin should be able to add members to their own household."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.get_user_membership", return_value=None),
            patch("api.routers.admin.household_storage.add_member"),
        ):
            response = admin_client.post(
                "/admin/households/test_household/members", json={"email": "new@example.com", "role": "member"}
            )

        assert response.status_code == 201

    def test_user_already_in_household(
        self, superuser_client: TestClient, sample_household: Household, sample_membership: HouseholdMember
    ) -> None:
        """Should reject adding user who is already in a household."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.get_user_membership", return_value=sample_membership),
        ):
            response = superuser_client.post(
                "/admin/households/test_household/members", json={"email": "member@example.com", "role": "member"}
            )

        assert response.status_code == 409
        assert "already a member" in response.json()["detail"]

    def test_invalid_role(self, superuser_client: TestClient, sample_household: Household) -> None:
        """Should reject invalid role."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.get_user_membership", return_value=None),
        ):
            response = superuser_client.post(
                "/admin/households/test_household/members", json={"email": "new@example.com", "role": "superuser"}
            )

        assert response.status_code == 400
        assert "Role must be" in response.json()["detail"]

    def test_household_not_found(self, superuser_client: TestClient) -> None:
        """Should return 404 for non-existent household."""
        with patch("api.routers.admin.household_storage.get_household", return_value=None):
            response = superuser_client.post(
                "/admin/households/nonexistent/members", json={"email": "new@example.com", "role": "member"}
            )

        assert response.status_code == 404


class TestRemoveMember:
    """Tests for DELETE /admin/households/{household_id}/members/{email} endpoint."""

    def test_superuser_can_remove(
        self, superuser_client: TestClient, sample_household: Household, sample_membership: HouseholdMember
    ) -> None:
        """Superuser should be able to remove members."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.get_user_membership", return_value=sample_membership),
            patch("api.routers.admin.household_storage.remove_member") as mock_remove,
        ):
            response = superuser_client.delete("/admin/households/test_household/members/member@example.com")

        assert response.status_code == 204
        mock_remove.assert_called_once_with("member@example.com")

    def test_admin_can_remove_from_own(
        self, admin_client: TestClient, sample_household: Household, sample_membership: HouseholdMember
    ) -> None:
        """Admin should be able to remove members from their own household."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.get_user_membership", return_value=sample_membership),
            patch("api.routers.admin.household_storage.remove_member"),
        ):
            response = admin_client.delete("/admin/households/test_household/members/member@example.com")

        assert response.status_code == 204

    def test_cannot_remove_self(self, superuser_client: TestClient, sample_household: Household) -> None:
        """Should not allow removing yourself."""
        self_membership = HouseholdMember(email="test@example.com", household_id="test_household", role="superuser")
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.get_user_membership", return_value=self_membership),
        ):
            response = superuser_client.delete("/admin/households/test_household/members/test@example.com")

        assert response.status_code == 400
        assert "Cannot remove yourself" in response.json()["detail"]

    def test_member_not_found(self, superuser_client: TestClient, sample_household: Household) -> None:
        """Should return 404 for non-existent member."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.get_user_membership", return_value=None),
        ):
            response = superuser_client.delete("/admin/households/test_household/members/nobody@example.com")

        assert response.status_code == 404

    def test_member_in_different_household(self, superuser_client: TestClient, sample_household: Household) -> None:
        """Should return 404 for member in different household."""
        other_membership = HouseholdMember(email="other@example.com", household_id="other_household", role="member")
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.get_user_membership", return_value=other_membership),
        ):
            response = superuser_client.delete("/admin/households/test_household/members/other@example.com")

        assert response.status_code == 404
        assert "not found in this household" in response.json()["detail"]

    def test_email_normalized_for_removal(
        self, superuser_client: TestClient, sample_household: Household, sample_membership: HouseholdMember
    ) -> None:
        """Email path param should be normalized to lowercase for storage lookup."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.get_user_membership", return_value=sample_membership),
            patch("api.routers.admin.household_storage.remove_member") as mock_remove,
        ):
            response = superuser_client.delete("/admin/households/test_household/members/Member@Example.COM")

        assert response.status_code == 204
        mock_remove.assert_called_once_with("member@example.com")

    def test_cannot_remove_self_mixed_case(self, superuser_client: TestClient, sample_household: Household) -> None:
        """Self-removal guard should work even with mixed-case email."""
        self_membership = HouseholdMember(email="test@example.com", household_id="test_household", role="superuser")
        with (
            patch("api.routers.admin.household_storage.get_household", return_value=sample_household),
            patch("api.routers.admin.household_storage.get_user_membership", return_value=self_membership),
        ):
            response = superuser_client.delete("/admin/households/test_household/members/Test@Example.COM")

        assert response.status_code == 400
        assert "Cannot remove yourself" in response.json()["detail"]

    def test_household_not_found(self, superuser_client: TestClient) -> None:
        """Should return 404 when household doesn't exist."""
        with patch("api.routers.admin.household_storage.get_household", return_value=None):
            response = superuser_client.delete("/admin/households/nonexistent/members/member@example.com")

        assert response.status_code == 404


class TestGetCurrentUser:
    """Tests for GET /admin/me endpoint."""

    def test_returns_user_info(self, member_client: TestClient, sample_household: Household) -> None:
        """Should return current user info."""
        with patch("api.routers.admin.household_storage.get_household", return_value=sample_household):
            response = member_client.get("/admin/me")

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["role"] == "member"
        assert data["household_id"] == "test_household"
        assert data["household_name"] == "Test Family"

    def test_returns_info_without_household(self, superuser_client: TestClient) -> None:
        """Should return user info even without household name lookup."""
        with patch("api.routers.admin.household_storage.get_household", return_value=None):
            response = superuser_client.get("/admin/me")

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert "household_name" not in data


class TestGetHouseholdSettings:
    """Tests for GET /admin/households/{id}/settings endpoint."""

    def test_superuser_can_get_settings(self, superuser_client: TestClient) -> None:
        """Superuser can get settings for any household."""
        settings = {"household_size": 4, "language": "sv"}
        with patch("api.routers.admin.household_storage.get_household_settings", return_value=settings):
            response = superuser_client.get("/admin/households/any_household/settings")

        assert response.status_code == 200
        data = response.json()
        assert data["household_size"] == 4
        assert data["language"] == "sv"

    def test_member_can_get_own_settings(self, member_client: TestClient) -> None:
        """Member can get settings for their own household."""
        settings = {"household_size": 2}
        with patch("api.routers.admin.household_storage.get_household_settings", return_value=settings):
            response = member_client.get("/admin/households/test_household/settings")

        assert response.status_code == 200
        data = response.json()
        assert data["household_size"] == 2
        assert data["language"] == "sv"  # default

    def test_member_cannot_get_other_settings(self, member_client: TestClient) -> None:
        """Member cannot get settings for another household."""
        response = member_client.get("/admin/households/other_household/settings")

        assert response.status_code == 403

    def test_household_not_found(self, superuser_client: TestClient) -> None:
        """Should return 404 if household doesn't exist."""
        with patch("api.routers.admin.household_storage.get_household_settings", return_value=None):
            response = superuser_client.get("/admin/households/nonexistent/settings")

        assert response.status_code == 404

    def test_empty_settings(self, superuser_client: TestClient) -> None:
        """Should return defaults when no settings configured."""
        with patch("api.routers.admin.household_storage.get_household_settings", return_value={}):
            response = superuser_client.get("/admin/households/test/settings")

        assert response.status_code == 200
        data = response.json()
        assert data["household_size"] == 2
        assert data["default_servings"] == 2
        assert data["language"] == "sv"
        assert data["ai_features_enabled"] is True
        assert data["equipment"] == []


class TestUpdateHouseholdSettings:
    """Tests for PUT /admin/households/{id}/settings endpoint."""

    def test_superuser_can_update(self, superuser_client: TestClient) -> None:
        """Superuser can update settings for any household."""
        new_settings = {"household_size": 4, "language": "en"}
        with (
            patch("api.routers.admin.household_storage.update_household_settings", return_value=True),
            patch("api.routers.admin.household_storage.get_household_settings", return_value=new_settings),
        ):
            response = superuser_client.put("/admin/households/any/settings", json=new_settings)

        assert response.status_code == 200
        data = response.json()
        assert data["household_size"] == 4
        assert data["language"] == "en"

    def test_admin_can_update_own(self, admin_client: TestClient) -> None:
        """Admin can update settings for their own household."""
        new_settings = {"household_size": 3}
        with (
            patch("api.routers.admin.household_storage.update_household_settings", return_value=True),
            patch("api.routers.admin.household_storage.get_household_settings", return_value=new_settings),
        ):
            response = admin_client.put("/admin/households/test_household/settings", json=new_settings)

        assert response.status_code == 200

    def test_admin_cannot_update_other(self, admin_client: TestClient) -> None:
        """Admin cannot update settings for another household."""
        response = admin_client.put("/admin/households/other_household/settings", json={"foo": "bar"})

        assert response.status_code == 403

    def test_member_cannot_update(self, member_client: TestClient) -> None:
        """Member cannot update settings (requires admin)."""
        response = member_client.put("/admin/households/test_household/settings", json={"foo": "bar"})

        assert response.status_code == 403

    def test_household_not_found(self, superuser_client: TestClient) -> None:
        """Should return 404 if household doesn't exist."""
        with patch("api.routers.admin.household_storage.update_household_settings", return_value=False):
            response = superuser_client.put("/admin/households/nonexistent/settings", json={"foo": "bar"})

        assert response.status_code == 404


class TestTransferRecipe:
    """Tests for POST /admin/recipes/{recipe_id}/transfer."""

    def test_superuser_can_transfer(self, superuser_client: TestClient) -> None:
        """Superuser can transfer a recipe to another household."""
        from datetime import UTC, datetime

        from api.models.recipe import Recipe

        target_household = Household(
            id="target_household",
            name="Target Home",
            created_at=datetime(2024, 1, 1, tzinfo=UTC),
            created_by="test@example.com",
        )
        transferred_recipe = Recipe(
            id="recipe_123",
            title="Test Recipe",
            url="https://example.com/recipe",
            ingredients=[],
            instructions=[],
            household_id="target_household",
        )

        with (
            patch("api.routers.admin.household_storage.get_household", return_value=target_household),
            patch("api.routers.admin.recipe_storage.transfer_recipe_to_household", return_value=transferred_recipe),
        ):
            response = superuser_client.post(
                "/admin/recipes/recipe_123/transfer", json={"target_household_id": "target_household"}
            )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "recipe_123"
        assert data["household_id"] == "target_household"
        assert "Target Home" in data["message"]

    def test_superuser_can_transfer_enhanced(self, superuser_client: TestClient) -> None:
        """Superuser can transfer an enhanced recipe."""
        from datetime import UTC, datetime

        from api.models.recipe import Recipe

        target_household = Household(
            id="target_household",
            name="Target Home",
            created_at=datetime(2024, 1, 1, tzinfo=UTC),
            created_by="test@example.com",
        )
        transferred_recipe = Recipe(
            id="recipe_123",
            title="Enhanced Recipe",
            url="https://example.com/recipe",
            ingredients=[],
            instructions=[],
            household_id="target_household",
            enhanced=True,
        )

        with (
            patch("api.routers.admin.household_storage.get_household", return_value=target_household),
            patch(
                "api.routers.admin.recipe_storage.transfer_recipe_to_household", return_value=transferred_recipe
            ) as mock_transfer,
        ):
            response = superuser_client.post(
                "/admin/recipes/recipe_123/transfer", json={"target_household_id": "target_household"}
            )

        assert response.status_code == 200
        mock_transfer.assert_called_once_with("recipe_123", "target_household")

    def test_admin_cannot_transfer(self, admin_client: TestClient) -> None:
        """Admin cannot transfer recipes (superuser only)."""
        response = admin_client.post(
            "/admin/recipes/recipe_123/transfer", json={"target_household_id": "target_household"}
        )

        assert response.status_code == 403
        assert "Superuser" in response.json()["detail"]

    def test_member_cannot_transfer(self, member_client: TestClient) -> None:
        """Member cannot transfer recipes (superuser only)."""
        response = member_client.post(
            "/admin/recipes/recipe_123/transfer", json={"target_household_id": "target_household"}
        )

        assert response.status_code == 403

    def test_target_household_not_found(self, superuser_client: TestClient) -> None:
        """Should return 404 if target household doesn't exist."""
        with patch("api.routers.admin.household_storage.get_household", return_value=None):
            response = superuser_client.post(
                "/admin/recipes/recipe_123/transfer", json={"target_household_id": "nonexistent"}
            )

        assert response.status_code == 404
        assert "Target household not found" in response.json()["detail"]

    def test_recipe_not_found(self, superuser_client: TestClient) -> None:
        """Should return 404 if recipe doesn't exist."""
        from datetime import UTC, datetime

        target_household = Household(
            id="target_household",
            name="Target Home",
            created_at=datetime(2024, 1, 1, tzinfo=UTC),
            created_by="test@example.com",
        )

        with (
            patch("api.routers.admin.household_storage.get_household", return_value=target_household),
            patch("api.routers.admin.recipe_storage.transfer_recipe_to_household", return_value=None),
        ):
            response = superuser_client.post(
                "/admin/recipes/recipe_123/transfer", json={"target_household_id": "target_household"}
            )

        assert response.status_code == 404
        assert "Recipe not found" in response.json()["detail"]


class TestGetItemsAtHome:
    """Tests for GET /admin/households/{household_id}/items-at-home endpoint."""

    def test_member_can_get_items(self, member_client: TestClient) -> None:
        """Household member should be able to get items at home."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value={"id": "test_household"}),
            patch("api.routers.admin.household_storage.get_items_at_home", return_value=["salt", "pepper", "oil"]),
        ):
            response = member_client.get("/admin/households/test_household/items-at-home")

        assert response.status_code == 200
        data = response.json()
        assert data["items_at_home"] == ["salt", "pepper", "oil"]

    def test_superuser_can_get_items(self, superuser_client: TestClient) -> None:
        """Superuser should be able to get items at home for any household."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value={"id": "other_household"}),
            patch("api.routers.admin.household_storage.get_items_at_home", return_value=["garlic"]),
        ):
            response = superuser_client.get("/admin/households/other_household/items-at-home")

        assert response.status_code == 200
        data = response.json()
        assert data["items_at_home"] == ["garlic"]

    def test_member_cannot_get_other_household(self, member_client: TestClient) -> None:
        """Member cannot get items for a different household."""
        response = member_client.get("/admin/households/other_household/items-at-home")
        assert response.status_code == 403

    def test_household_not_found(self, member_client: TestClient) -> None:
        """Should return 404 when household doesn't exist."""
        with patch("api.routers.admin.household_storage.get_household", return_value=None):
            response = member_client.get("/admin/households/test_household/items-at-home")

        assert response.status_code == 404


class TestAddItemAtHome:
    """Tests for POST /admin/households/{household_id}/items-at-home endpoint."""

    def test_member_can_add_item(self, member_client: TestClient) -> None:
        """Household member should be able to add an item."""
        with patch("api.routers.admin.household_storage.add_item_at_home", return_value=["oil", "salt"]) as mock_add:
            response = member_client.post("/admin/households/test_household/items-at-home", json={"item": "Salt"})

        assert response.status_code == 200
        mock_add.assert_called_once_with("test_household", "Salt")
        data = response.json()
        assert data["items_at_home"] == ["oil", "salt"]

    def test_superuser_can_add_item(self, superuser_client: TestClient) -> None:
        """Superuser should be able to add an item to any household."""
        with patch("api.routers.admin.household_storage.add_item_at_home", return_value=["pepper"]):
            response = superuser_client.post("/admin/households/other_household/items-at-home", json={"item": "pepper"})

        assert response.status_code == 200

    def test_member_cannot_add_to_other_household(self, member_client: TestClient) -> None:
        """Member cannot add item to a different household."""
        response = member_client.post("/admin/households/other_household/items-at-home", json={"item": "salt"})
        assert response.status_code == 403

    def test_empty_item_rejected(self, member_client: TestClient) -> None:
        """Empty item should be rejected by validation."""
        response = member_client.post("/admin/households/test_household/items-at-home", json={"item": ""})
        assert response.status_code == 422  # Pydantic validation error

    def test_household_not_found(self, member_client: TestClient) -> None:
        """Should return 404 when storage raises ValueError with 'not found'."""
        with patch(
            "api.routers.admin.household_storage.add_item_at_home", side_effect=ValueError("Household not found")
        ):
            response = member_client.post("/admin/households/test_household/items-at-home", json={"item": "salt"})

        assert response.status_code == 404

    def test_duplicate_item_returns_400(self, member_client: TestClient) -> None:
        """Should return 400 for non-not-found ValueError (e.g., duplicate)."""
        with patch(
            "api.routers.admin.household_storage.add_item_at_home", side_effect=ValueError("Item already exists")
        ):
            response = member_client.post("/admin/households/test_household/items-at-home", json={"item": "salt"})

        assert response.status_code == 400


class TestRemoveItemAtHome:
    """Tests for DELETE /admin/households/{household_id}/items-at-home/{item} endpoint."""

    def test_member_can_remove_item(self, member_client: TestClient) -> None:
        """Household member should be able to remove an item."""
        with patch("api.routers.admin.household_storage.remove_item_at_home", return_value=["oil"]) as mock_remove:
            response = member_client.delete("/admin/households/test_household/items-at-home/salt")

        assert response.status_code == 200
        mock_remove.assert_called_once_with("test_household", "salt")
        data = response.json()
        assert data["items_at_home"] == ["oil"]

    def test_superuser_can_remove_item(self, superuser_client: TestClient) -> None:
        """Superuser should be able to remove an item from any household."""
        with patch("api.routers.admin.household_storage.remove_item_at_home", return_value=[]):
            response = superuser_client.delete("/admin/households/other_household/items-at-home/pepper")

        assert response.status_code == 200

    def test_member_cannot_remove_from_other_household(self, member_client: TestClient) -> None:
        """Member cannot remove item from a different household."""
        response = member_client.delete("/admin/households/other_household/items-at-home/salt")
        assert response.status_code == 403

    def test_url_encoded_item(self, member_client: TestClient) -> None:
        """Should handle URL-encoded item names."""
        with patch("api.routers.admin.household_storage.remove_item_at_home", return_value=[]):
            response = member_client.delete("/admin/households/test_household/items-at-home/olive%20oil")

        assert response.status_code == 200

    def test_household_not_found(self, member_client: TestClient) -> None:
        """Should return 404 when storage raises ValueError with 'not found'."""
        with patch(
            "api.routers.admin.household_storage.remove_item_at_home", side_effect=ValueError("Household not found")
        ):
            response = member_client.delete("/admin/households/test_household/items-at-home/salt")

        assert response.status_code == 404

    def test_validation_error_returns_400(self, member_client: TestClient) -> None:
        """Should return 400 for non-not-found ValueError."""
        with patch(
            "api.routers.admin.household_storage.remove_item_at_home", side_effect=ValueError("Item not in list")
        ):
            response = member_client.delete("/admin/households/test_household/items-at-home/salt")

        assert response.status_code == 400


class TestGetFavoriteRecipes:
    """Tests for GET /admin/households/{household_id}/favorites endpoint."""

    def test_member_can_get_favorites(self, member_client: TestClient) -> None:
        """Household member should be able to get favorite recipes."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value={"id": "test_household"}),
            patch("api.routers.admin.household_storage.get_favorite_recipes", return_value=["recipe-1", "recipe-2"]),
        ):
            response = member_client.get("/admin/households/test_household/favorites")

        assert response.status_code == 200
        data = response.json()
        assert data["favorite_recipes"] == ["recipe-1", "recipe-2"]

    def test_superuser_can_get_favorites(self, superuser_client: TestClient) -> None:
        """Superuser should be able to get favorites for any household."""
        with (
            patch("api.routers.admin.household_storage.get_household", return_value={"id": "other_household"}),
            patch("api.routers.admin.household_storage.get_favorite_recipes", return_value=[]),
        ):
            response = superuser_client.get("/admin/households/other_household/favorites")

        assert response.status_code == 200
        data = response.json()
        assert data["favorite_recipes"] == []

    def test_member_cannot_get_other_household(self, member_client: TestClient) -> None:
        """Member cannot get favorites for a different household."""
        response = member_client.get("/admin/households/other_household/favorites")
        assert response.status_code == 403

    def test_household_not_found(self, member_client: TestClient) -> None:
        """Should return 404 when household doesn't exist."""
        with patch("api.routers.admin.household_storage.get_household", return_value=None):
            response = member_client.get("/admin/households/test_household/favorites")

        assert response.status_code == 404


class TestAddFavoriteRecipe:
    """Tests for POST /admin/households/{household_id}/favorites endpoint."""

    def test_member_can_add_favorite(self, member_client: TestClient) -> None:
        """Household member should be able to add a favorite."""
        with patch(
            "api.routers.admin.household_storage.add_favorite_recipe", return_value=["recipe-1", "recipe-2"]
        ) as mock_add:
            response = member_client.post("/admin/households/test_household/favorites", json={"recipe_id": "recipe-2"})

        assert response.status_code == 200
        mock_add.assert_called_once_with("test_household", "recipe-2")
        data = response.json()
        assert data["favorite_recipes"] == ["recipe-1", "recipe-2"]

    def test_superuser_can_add_favorite(self, superuser_client: TestClient) -> None:
        """Superuser should be able to add a favorite to any household."""
        with patch("api.routers.admin.household_storage.add_favorite_recipe", return_value=["recipe-1"]):
            response = superuser_client.post(
                "/admin/households/other_household/favorites", json={"recipe_id": "recipe-1"}
            )

        assert response.status_code == 200

    def test_member_cannot_add_to_other_household(self, member_client: TestClient) -> None:
        """Member cannot add favorite to a different household."""
        response = member_client.post("/admin/households/other_household/favorites", json={"recipe_id": "recipe-1"})
        assert response.status_code == 403

    def test_empty_recipe_id_rejected(self, member_client: TestClient) -> None:
        """Empty recipe_id should be rejected by validation."""
        response = member_client.post("/admin/households/test_household/favorites", json={"recipe_id": ""})
        assert response.status_code == 422

    def test_whitespace_only_recipe_id_rejected(self, member_client: TestClient) -> None:
        """Whitespace-only recipe_id should be rejected by validation."""
        response = member_client.post("/admin/households/test_household/favorites", json={"recipe_id": "   "})
        assert response.status_code == 422

    def test_household_not_found(self, member_client: TestClient) -> None:
        """Should return 404 when household doesn't exist."""
        with patch(
            "api.routers.admin.household_storage.add_favorite_recipe", side_effect=ValueError("Household not found")
        ):
            response = member_client.post("/admin/households/test_household/favorites", json={"recipe_id": "recipe-1"})

        assert response.status_code == 404

    def test_duplicate_recipe_returns_400(self, member_client: TestClient) -> None:
        """Should return 400 for non-not-found ValueError (e.g., duplicate)."""
        with patch(
            "api.routers.admin.household_storage.add_favorite_recipe",
            side_effect=ValueError("Recipe already in favorites"),
        ):
            response = member_client.post("/admin/households/test_household/favorites", json={"recipe_id": "recipe-1"})

        assert response.status_code == 400


class TestRemoveFavoriteRecipe:
    """Tests for DELETE /admin/households/{household_id}/favorites/{recipe_id} endpoint."""

    def test_member_can_remove_favorite(self, member_client: TestClient) -> None:
        """Household member should be able to remove a favorite."""
        with patch(
            "api.routers.admin.household_storage.remove_favorite_recipe", return_value=["recipe-1"]
        ) as mock_remove:
            response = member_client.delete("/admin/households/test_household/favorites/recipe-2")

        assert response.status_code == 200
        mock_remove.assert_called_once_with("test_household", "recipe-2")
        data = response.json()
        assert data["favorite_recipes"] == ["recipe-1"]

    def test_superuser_can_remove_favorite(self, superuser_client: TestClient) -> None:
        """Superuser should be able to remove a favorite from any household."""
        with patch("api.routers.admin.household_storage.remove_favorite_recipe", return_value=[]):
            response = superuser_client.delete("/admin/households/other_household/favorites/recipe-1")

        assert response.status_code == 200

    def test_member_cannot_remove_from_other_household(self, member_client: TestClient) -> None:
        """Member cannot remove favorite from a different household."""
        response = member_client.delete("/admin/households/other_household/favorites/recipe-1")
        assert response.status_code == 403

    def test_household_not_found(self, member_client: TestClient) -> None:
        """Should return 404 when household doesn't exist."""
        with patch(
            "api.routers.admin.household_storage.remove_favorite_recipe", side_effect=ValueError("Household not found")
        ):
            response = member_client.delete("/admin/households/test_household/favorites/recipe-1")

        assert response.status_code == 404

    def test_validation_error_returns_400(self, member_client: TestClient) -> None:
        """Should return 400 for non-not-found ValueError."""
        with patch(
            "api.routers.admin.household_storage.remove_favorite_recipe",
            side_effect=ValueError("Recipe not in favorites"),
        ):
            response = member_client.delete("/admin/households/test_household/favorites/recipe-1")

        assert response.status_code == 400
