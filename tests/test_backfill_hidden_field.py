"""Tests for the hidden-field backfill."""

from unittest.mock import MagicMock, patch

import pytest

from scripts.backfill_hidden_field import backfill


def test_missing_document_data_stops_without_writing() -> None:
    doc = MagicMock()
    doc.id = "missing"
    doc.to_dict.return_value = None
    db = MagicMock()
    db.collection.return_value.stream.return_value = [doc]

    with (
        patch("scripts.backfill_hidden_field.get_firestore_client", return_value=db),
        pytest.raises(ValueError, match="Missing document data: missing"),
    ):
        backfill()

    doc.reference.update.assert_not_called()
