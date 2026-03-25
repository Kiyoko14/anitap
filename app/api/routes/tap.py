from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user_id
from app.db.session import get_db
from app.schemas.tap import TapRequest, TapResponse
from app.services.tap_service import apply_tap
from app.services.user_service import get_user_by_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tap", tags=["tap"])


@router.post("", response_model=TapResponse, summary="Register tap(s)")
async def tap(
    payload: TapRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> TapResponse:
    """
    Register one or more taps.
    - Rate limited: max 10 taps/second per user (Redis).
    - Energy is accumulated in Redis buffer, flushed to DB periodically.
    - Referrer earns REFERRAL_PERCENT of tap value.
    """
    if payload.taps < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="taps must be >= 1"
        )
    if payload.taps > 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="taps must be <= 10"
        )

    user = await get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    result = await apply_tap(db, user, taps=payload.taps)
    return TapResponse(**result)
