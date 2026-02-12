"""Tests for household storage operations."""

from collections.abc import Generator
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest

from api.storage.household_storage import (
    HOUSEHOLD_MEMBERS_COLLECTION,
    HOUSEHOLDS_COLLECTION,
    SUPERUSERS_COLLECTION,
    Household,
    HouseholdMember,
    add_favorite_recipe,
    add_item_at_home,
    add_member,
    add_superuser,
    create_household,
    delete_household,
    get_favorite_recipes,
    get_household,
    get_household_settings,
    get_items_at_home,
    get_user_membership,
    household_name_exists,
    is_superuser,
    list_all_households,
    list_household_members,
    remove_favorite_recipe,
    remove_item_at_home,
    remove_member,
    remove_superuser,
    update_household,
    update_household_settings,
)


@pytest.fixture
def mock_db() -> Generator[MagicMock]:
    """Create a mock Firestore client."""
    with patch("api.storage.household_storage._get_db") as mock_get_db:
        mock_client = MagicMock()
        mock_get_db.return_value = mock_client
        yield mock_client


class TestIsSuperuser:
    """Tests for is_superuser function."""

    def test_returns_true_when_superuser_exists(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        assert is_superuser("admin@example.com") is True

        mock_db.collection.assert_called_with(SUPERUSERS_COLLECTION)
        mock_db.collection.return_value.document.assert_called_with("admin@example.com")

    def test_returns_false_when_superuser_not_exists(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        assert is_superuser("user@example.com") is False


class TestGetUserMembership:
    """Tests for get_user_membership function."""

    def test_returns_none_when_not_member(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        result = get_user_membership("unknown@example.com")

        assert result is None

    def test_returns_membership_when_exists(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "household_id": "household-123",
            "role": "admin",
            "display_name": "Test User",
            "joined_at": datetime(2026, 1, 1, tzinfo=UTC),
            "invited_by": "owner@example.com",
        }
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        result = get_user_membership("user@example.com")

        assert result is not None
        assert result.email == "user@example.com"
        assert result.household_id == "household-123"
        assert result.role == "admin"
        assert result.display_name == "Test User"
        assert result.invited_by == "owner@example.com"


class TestGetHousehold:
    """Tests for get_household function."""

    def test_returns_none_when_not_found(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        result = get_household("nonexistent-id")

        assert result is None

    def test_returns_household_when_exists(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "name": "The Smiths",
            "created_at": datetime(2026, 1, 1, tzinfo=UTC),
            "created_by": "owner@example.com",
        }
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        result = get_household("household-123")

        assert result is not None
        assert result.id == "household-123"
        assert result.name == "The Smiths"
        assert result.created_by == "owner@example.com"


class TestCreateHousehold:
    """Tests for create_household function."""

    def test_creates_household_and_returns_id(self, mock_db) -> None:
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "new-household-id"
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = create_household("The Smiths", "owner@example.com")

        assert result == "new-household-id"
        mock_db.collection.assert_called_with(HOUSEHOLDS_COLLECTION)
        mock_doc_ref.set.assert_called_once()

        call_args = mock_doc_ref.set.call_args[0][0]
        assert call_args["name"] == "The Smiths"
        assert call_args["created_by"] == "owner@example.com"
        assert "created_at" in call_args


class TestAddMember:
    """Tests for add_member function."""

    def test_adds_member_with_email_as_doc_id(self, mock_db) -> None:
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        add_member(
            household_id="household-123",
            email="user@example.com",
            role="member",
            display_name="Test User",
            invited_by="owner@example.com",
        )

        mock_db.collection.assert_called_with(HOUSEHOLD_MEMBERS_COLLECTION)
        mock_db.collection.return_value.document.assert_called_with("user@example.com")
        mock_doc_ref.set.assert_called_once()

        call_args = mock_doc_ref.set.call_args[0][0]
        assert call_args["household_id"] == "household-123"
        assert call_args["role"] == "member"
        assert call_args["display_name"] == "Test User"
        assert call_args["invited_by"] == "owner@example.com"


class TestRemoveMember:
    """Tests for remove_member function."""

    def test_returns_false_when_not_exists(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = remove_member("unknown@example.com")

        assert result is False
        mock_doc_ref.delete.assert_not_called()

    def test_deletes_and_returns_true_when_exists(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = remove_member("user@example.com")

        assert result is True
        mock_doc_ref.delete.assert_called_once()


class TestListHouseholdMembers:
    """Tests for list_household_members function."""

    def test_returns_empty_list_when_no_members(self, mock_db) -> None:
        mock_query = MagicMock()
        mock_query.stream.return_value = []
        mock_db.collection.return_value.where.return_value = mock_query

        result = list_household_members("household-123")

        assert result == []

    def test_returns_list_of_members(self, mock_db) -> None:
        mock_doc1 = MagicMock()
        mock_doc1.id = "user1@example.com"
        mock_doc1.to_dict.return_value = {"role": "admin", "display_name": "User 1"}

        mock_doc2 = MagicMock()
        mock_doc2.id = "user2@example.com"
        mock_doc2.to_dict.return_value = {"role": "member", "display_name": "User 2"}

        mock_query = MagicMock()
        mock_query.stream.return_value = [mock_doc1, mock_doc2]
        mock_db.collection.return_value.where.return_value = mock_query

        result = list_household_members("household-123")

        assert len(result) == 2
        assert result[0].email == "user1@example.com"
        assert result[0].role == "admin"
        assert result[1].email == "user2@example.com"
        assert result[1].role == "member"


class TestListAllHouseholds:
    """Tests for list_all_households function."""

    def test_returns_all_households(self, mock_db) -> None:
        mock_doc1 = MagicMock()
        mock_doc1.id = "household-1"
        mock_doc1.to_dict.return_value = {
            "name": "Household 1",
            "created_at": datetime(2026, 1, 1, tzinfo=UTC),
            "created_by": "owner1@example.com",
        }

        mock_doc2 = MagicMock()
        mock_doc2.id = "household-2"
        mock_doc2.to_dict.return_value = {
            "name": "Household 2",
            "created_at": datetime(2026, 2, 1, tzinfo=UTC),
            "created_by": "owner2@example.com",
        }

        mock_db.collection.return_value.stream.return_value = [mock_doc1, mock_doc2]

        result = list_all_households()

        assert len(result) == 2
        assert result[0].id == "household-1"
        assert result[0].name == "Household 1"
        assert result[1].id == "household-2"
        assert result[1].name == "Household 2"


class TestUpdateHousehold:
    """Tests for update_household function."""

    def test_returns_false_when_not_exists(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = update_household("nonexistent", "New Name")

        assert result is False
        mock_doc_ref.update.assert_not_called()

    def test_updates_and_returns_true_when_exists(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = update_household("household-123", "New Name")

        assert result is True
        mock_doc_ref.update.assert_called_once_with({"name": "New Name"})


class TestDataclasses:
    """Tests for dataclass models."""

    def test_household_dataclass(self) -> None:
        household = Household(
            id="test-id",
            name="Test Household",
            created_at=datetime(2026, 1, 1, tzinfo=UTC),
            created_by="owner@example.com",
        )
        assert household.id == "test-id"
        assert household.name == "Test Household"

    def test_household_member_dataclass(self) -> None:
        member = HouseholdMember(email="user@example.com", household_id="household-123", role="member")
        assert member.email == "user@example.com"
        assert member.household_id == "household-123"
        assert member.role == "member"
        assert member.display_name is None
        assert member.joined_at is None
        assert member.invited_by is None


class TestEmailNormalization:
    """Tests that all storage functions normalize emails to lowercase."""

    def test_is_superuser_normalizes_email(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        is_superuser("Admin@Example.COM")

        mock_db.collection.return_value.document.assert_called_with("admin@example.com")

    def test_add_superuser_normalizes_email(self, mock_db) -> None:
        add_superuser("Admin@Example.COM")

        mock_db.collection.return_value.document.assert_called_with("admin@example.com")

    def test_remove_superuser_normalizes_email(self, mock_db) -> None:
        remove_superuser("Admin@Example.COM")

        mock_db.collection.return_value.document.assert_called_with("admin@example.com")

    def test_get_user_membership_normalizes_email(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        get_user_membership("User@Example.COM")

        mock_db.collection.return_value.document.assert_called_with("user@example.com")

    def test_add_member_normalizes_email(self, mock_db) -> None:
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        add_member(household_id="h1", email="User@Example.COM")

        mock_db.collection.return_value.document.assert_called_with("user@example.com")

    def test_remove_member_normalizes_email(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        remove_member("User@Example.COM")

        mock_db.collection.return_value.document.assert_called_with("user@example.com")


class TestHouseholdNameExists:
    """Tests for household_name_exists function."""

    def test_returns_true_when_name_taken(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.id = "household-1"
        mock_doc.to_dict.return_value = {
            "name": "Smith Family",
            "created_at": datetime.now(UTC),
            "created_by": "a@b.com",
        }
        mock_db.collection.return_value.stream.return_value = [mock_doc]

        assert household_name_exists("smith family") is True

    def test_returns_false_when_name_not_taken(self, mock_db) -> None:
        mock_db.collection.return_value.stream.return_value = []

        assert household_name_exists("New Name") is False

    def test_allows_same_household_to_keep_name(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.id = "household-1"
        mock_doc.to_dict.return_value = {
            "name": "Smith Family",
            "created_at": datetime.now(UTC),
            "created_by": "a@b.com",
        }
        mock_db.collection.return_value.stream.return_value = [mock_doc]

        assert household_name_exists("smith family", exclude_id="household-1") is False


class TestDeleteHousehold:
    """Tests for delete_household function."""

    def test_deletes_existing_household(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = delete_household("household-1")

        assert result is True
        mock_doc_ref.delete.assert_called_once()

    def test_returns_false_for_nonexistent_household(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = delete_household("nonexistent")

        assert result is False
        mock_doc_ref.delete.assert_not_called()


class TestGetHouseholdSettings:
    """Tests for get_household_settings function."""

    def test_returns_none_for_nonexistent_household(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        result = get_household_settings("nonexistent")

        assert result is None

    def test_returns_empty_dict_when_no_settings(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = False

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value.get.return_value = mock_settings_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = get_household_settings("household-1")

        assert result == {}

    def test_returns_settings_when_exists(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = True
        mock_settings_doc.to_dict.return_value = {"language": "sv", "theme": "dark"}

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value.get.return_value = mock_settings_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = get_household_settings("household-1")

        assert result == {"language": "sv", "theme": "dark"}


class TestUpdateHouseholdSettings:
    """Tests for update_household_settings function."""

    def test_returns_false_for_nonexistent_household(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        result = update_household_settings("nonexistent", {"language": "sv"})

        assert result is False

    def test_updates_settings_with_merge(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_ref = MagicMock()

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = update_household_settings("household-1", {"language": "sv"})

        assert result is True
        mock_settings_ref.set.assert_called_once_with({"language": "sv"}, merge=True)


class TestAddItemAtHome:
    """Tests for add_item_at_home function."""

    def test_raises_error_for_nonexistent_household(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        with pytest.raises(ValueError, match="Household not found"):
            add_item_at_home("nonexistent", "salt")

    def test_raises_error_for_empty_item(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True
        mock_db.collection.return_value.document.return_value.get.return_value = mock_household_doc

        with pytest.raises(ValueError, match="Item cannot be empty"):
            add_item_at_home("household-1", "   ")

    def test_adds_item_to_empty_list(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = False  # No settings yet

        mock_settings_ref = MagicMock()
        # Support both transaction-based and direct gets
        mock_settings_ref.get.return_value = mock_settings_doc

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Mock transaction
        mock_transaction = MagicMock()
        mock_db.transaction.return_value = mock_transaction

        result = add_item_at_home("household-1", "Salt")

        assert result == ["salt"]
        # With transactions, we call transaction.set() instead of settings_ref.set()
        mock_transaction.set.assert_called_once_with(mock_settings_ref, {"items_at_home": ["salt"]}, merge=True)

    def test_adds_item_to_existing_list(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = True
        mock_settings_doc.to_dict.return_value = {"items_at_home": ["oil", "pepper"]}

        mock_settings_ref = MagicMock()
        mock_settings_ref.get.return_value = mock_settings_doc

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = add_item_at_home("household-1", "Salt")

        # Should be sorted alphabetically
        assert result == ["oil", "pepper", "salt"]

    def test_does_not_add_duplicate(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = True
        mock_settings_doc.to_dict.return_value = {"items_at_home": ["pepper", "salt"]}

        mock_settings_ref = MagicMock()
        mock_settings_ref.get.return_value = mock_settings_doc

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = add_item_at_home("household-1", "SALT")  # Different case

        # Should not add duplicate (normalized to lowercase)
        assert result == ["pepper", "salt"]

    def test_normalizes_item_to_lowercase(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = False

        mock_settings_ref = MagicMock()
        mock_settings_ref.get.return_value = mock_settings_doc

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = add_item_at_home("household-1", "  Olive Oil  ")

        assert result == ["olive oil"]


class TestRemoveItemAtHome:
    """Tests for remove_item_at_home function."""

    def test_raises_error_for_nonexistent_household(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        with pytest.raises(ValueError, match="Household not found"):
            remove_item_at_home("nonexistent", "salt")

    def test_removes_item_from_list(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = True
        mock_settings_doc.to_dict.return_value = {"items_at_home": ["oil", "pepper", "salt"]}

        mock_settings_ref = MagicMock()
        mock_settings_ref.get.return_value = mock_settings_doc

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = remove_item_at_home("household-1", "pepper")

        assert result == ["oil", "salt"]

    def test_removes_item_case_insensitive(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = True
        mock_settings_doc.to_dict.return_value = {"items_at_home": ["salt"]}

        mock_settings_ref = MagicMock()
        mock_settings_ref.get.return_value = mock_settings_doc

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = remove_item_at_home("household-1", "SALT")

        assert result == []

    def test_no_error_when_item_not_present(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = True
        mock_settings_doc.to_dict.return_value = {"items_at_home": ["oil"]}

        mock_settings_ref = MagicMock()
        mock_settings_ref.get.return_value = mock_settings_doc

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = remove_item_at_home("household-1", "salt")

        assert result == ["oil"]


class TestGetItemsAtHome:
    """Tests for get_items_at_home function."""

    def test_returns_empty_list_for_nonexistent_household(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        result = get_items_at_home("nonexistent")

        assert result == []

    def test_returns_empty_list_when_no_settings(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = False

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value.get.return_value = mock_settings_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = get_items_at_home("household-1")

        assert result == []

    def test_returns_items_list(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = True
        mock_settings_doc.to_dict.return_value = {"items_at_home": ["salt", "pepper", "oil"]}

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value.get.return_value = mock_settings_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = get_items_at_home("household-1")

        assert result == ["salt", "pepper", "oil"]


class TestGetFavoriteRecipes:
    """Tests for get_favorite_recipes function."""

    def test_returns_empty_list_for_nonexistent_household(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        result = get_favorite_recipes("nonexistent")

        assert result == []

    def test_returns_empty_list_when_no_settings(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = False

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value.get.return_value = mock_settings_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = get_favorite_recipes("household-1")

        assert result == []

    def test_returns_favorites_list(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = True
        mock_settings_doc.to_dict.return_value = {"favorite_recipes": ["recipe-1", "recipe-2"]}

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value.get.return_value = mock_settings_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = get_favorite_recipes("household-1")

        assert result == ["recipe-1", "recipe-2"]


class TestAddFavoriteRecipe:
    """Tests for add_favorite_recipe function."""

    def test_raises_error_for_nonexistent_household(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        with pytest.raises(ValueError, match="Household not found"):
            add_favorite_recipe("nonexistent", "recipe-1")

    def test_raises_error_for_empty_recipe_id(self, mock_db) -> None:
        with pytest.raises(ValueError, match="Recipe ID cannot be empty"):
            add_favorite_recipe("household-1", "   ")

    def test_adds_recipe_to_empty_list(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = False

        mock_settings_ref = MagicMock()
        mock_settings_ref.get.return_value = mock_settings_doc

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        mock_transaction = MagicMock()
        mock_db.transaction.return_value = mock_transaction

        result = add_favorite_recipe("household-1", "recipe-1")

        assert result == ["recipe-1"]
        mock_transaction.set.assert_called_once_with(mock_settings_ref, {"favorite_recipes": ["recipe-1"]}, merge=True)

    def test_adds_recipe_to_existing_list(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = True
        mock_settings_doc.to_dict.return_value = {"favorite_recipes": ["recipe-1"]}

        mock_settings_ref = MagicMock()
        mock_settings_ref.get.return_value = mock_settings_doc

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = add_favorite_recipe("household-1", "recipe-2")

        assert result == ["recipe-1", "recipe-2"]

    def test_does_not_add_duplicate(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = True
        mock_settings_doc.to_dict.return_value = {"favorite_recipes": ["recipe-1", "recipe-2"]}

        mock_settings_ref = MagicMock()
        mock_settings_ref.get.return_value = mock_settings_doc

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = add_favorite_recipe("household-1", "recipe-1")

        assert result == ["recipe-1", "recipe-2"]


class TestRemoveFavoriteRecipe:
    """Tests for remove_favorite_recipe function."""

    def test_raises_error_for_nonexistent_household(self, mock_db) -> None:
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        with pytest.raises(ValueError, match="Household not found"):
            remove_favorite_recipe("nonexistent", "recipe-1")

    def test_removes_recipe_from_list(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = True
        mock_settings_doc.to_dict.return_value = {"favorite_recipes": ["recipe-1", "recipe-2", "recipe-3"]}

        mock_settings_ref = MagicMock()
        mock_settings_ref.get.return_value = mock_settings_doc

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = remove_favorite_recipe("household-1", "recipe-2")

        assert result == ["recipe-1", "recipe-3"]

    def test_no_error_when_recipe_not_present(self, mock_db) -> None:
        mock_household_doc = MagicMock()
        mock_household_doc.exists = True

        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = True
        mock_settings_doc.to_dict.return_value = {"favorite_recipes": ["recipe-1"]}

        mock_settings_ref = MagicMock()
        mock_settings_ref.get.return_value = mock_settings_doc

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_household_doc
        mock_doc_ref.collection.return_value.document.return_value = mock_settings_ref
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        result = remove_favorite_recipe("household-1", "recipe-99")

        assert result == ["recipe-1"]
