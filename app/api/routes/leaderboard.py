from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.leaderboard_service import get_leaderboard

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", summary="Get leaderboard (top users by total energy earned)")
async def leaderboard(
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """
    Returns top users sorted by total_energy_earned (leaderboard score).
    Data is served from Redis sorted set for performance; falls back to DB.
    This endpoint is public (no JWT required).
    """
    return await get_leaderboard(db, limit=limit)
