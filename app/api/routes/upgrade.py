from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user_id
from app.db.session import get_db
from app.schemas.upgrade import PurchaseUpgradeRequest, PurchaseUpgradeResponse, UpgradeOut
from app.services.upgrade_service import list_upgrades, purchase_upgrade
from app.services.user_service import get_user_by_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upgrade", tags=["upgrade"])


@router.get("/list", response_model=list[UpgradeOut], summary="List available upgrades")
async def upgrades_list(db: AsyncSession = Depends(get_db)) -> list[UpgradeOut]:
    upgrades = await list_upgrades(db)
    return [UpgradeOut.model_validate(u) for u in upgrades]


@router.post("", response_model=PurchaseUpgradeResponse, summary="Purchase or level up an upgrade")
async def buy_upgrade(
    payload: PurchaseUpgradeRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> PurchaseUpgradeResponse:
    """
    Deducts energy and increases the user's upgrade level.
    Cost doubles with each level purchased.
    """
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    try:
        result = await purchase_upgrade(db, user, upgrade_id=payload.upgrade_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return PurchaseUpgradeResponse(**result)
