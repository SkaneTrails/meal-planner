"""Sample tests for the main module."""

from app.main import main


class TestMain:
    """Tests for main module."""

    def test_main_runs_without_error(self, capsys) -> None:
        """Test that main function executes successfully."""
        main()
        captured = capsys.readouterr()
        assert "Hello, World!" in captured.out
