"""Sync status endpoint: what changed, in one small request."""

from typing import Annotated

from fastapi import APIRouter, Depends

from api.auth.firebase import require_auth
from api.auth.models import AuthenticatedUser
from api.models.sync_status import SyncStatusResponse
from api.storage.sync_status import get_status

router = APIRouter(prefix="/sync", tags=["sync"])


@router.get("/status")
async def get_sync_status(user: Annotated[AuthenticatedUser, Depends(require_auth)]) -> SyncStatusResponse:
    """Return the current version of each data kind the caller can see.

    Clients poll this and refetch only the kinds whose version changed since their last sync.
    """
    return SyncStatusResponse(scope=f"{user.role}:{user.household_id or '-'}", **get_status(user.household_id))
