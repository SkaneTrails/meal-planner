"""Authentication models."""

from dataclasses import dataclass


@dataclass
class AuthenticatedUser:
    """Represents an authenticated user from Firebase."""

    uid: str
    email: str
    name: str | None = None
    picture: str | None = None
    household_id: str | None = None  # None = superuser without household
    role: str = "member"  # "superuser" | "admin" | "member"
