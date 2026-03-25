from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user_id
from app.db.session import get_db
from app.schemas.user import UserDetailOut, UserUpgradeOut
from app.services.user_service import get_user_by_id, sync_user_energy

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/user", tags=["user"])


@router.get("", response_model=UserDetailOut, summary="Get current user")
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserDetailOut:
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    upgrades = [
        UserUpgradeOut(upgrade_id=uu.upgrade_id, level=uu.level) for uu in user.user_upgrades
    ]
    return UserDetailOut.model_validate({**user.__dict__, "upgrades": upgrades})


@router.get("/sync", response_model=UserDetailOut, summary="Sync offline passive income")
async def sync_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserDetailOut:
    """
    Calculates offline passive income since last_active_time and applies it.
    Also flushes any pending tap buffer. Updates last_active_time.
    """
    user = await sync_user_energy(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    upgrades = [
        UserUpgradeOut(upgrade_id=uu.upgrade_id, level=uu.level) for uu in user.user_upgrades
    ]
    return UserDetailOut.model_validate({**user.__dict__, "upgrades": upgrades})
