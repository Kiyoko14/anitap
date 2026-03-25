from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.redis import get_redis

logger = logging.getLogger(__name__)

LEADERBOARD_KEY = "leaderboard"
LEADERBOARD_DEFAULT_LIMIT = 50


async def get_leaderboard(db: AsyncSession, limit: int = LEADERBOARD_DEFAULT_LIMIT) -> list[dict]:
    """
    Return top `limit` users from the Redis sorted set.
    Falls back to DB query if Redis is unavailable.
    """
    redis = get_redis()

    try:
        entries = await redis.zrevrange(LEADERBOARD_KEY, 0, limit - 1, withscores=True)
    except Exception:
        logger.warning("Redis unavailable, falling back to DB leaderboard")
        entries = None

    if entries:
        user_ids = [uid for uid, _ in entries]
        scores = {uid: int(score) for uid, score in entries}

        result = await db.execute(select(User).where(User.id.in_(user_ids)))
        users_map = {u.id: u for u in result.scalars().all()}

        board = []
        for rank, (uid, _score) in enumerate(entries, start=1):
            user = users_map.get(uid)
            board.append(
                {
                    "rank": rank,
                    "user_id": uid,
                    "telegram_id": user.telegram_id if user else "unknown",
                    "total_energy_earned": scores[uid],
                }
            )
        return board

    # Fallback: query DB directly
    result = await db.execute(select(User).order_by(User.total_energy_earned.desc()).limit(limit))
    users = result.scalars().all()
    return [
        {
            "rank": idx + 1,
            "user_id": u.id,
            "telegram_id": u.telegram_id,
            "total_energy_earned": u.total_energy_earned,
        }
        for idx, u in enumerate(users)
    ]


async def seed_leaderboard_from_db(db: AsyncSession) -> None:
    """Seed the Redis leaderboard from the DB on startup."""
    redis = get_redis()
    result = await db.execute(select(User).where(User.total_energy_earned > 0))
    users = result.scalars().all()
    if not users:
        return
    pipe = redis.pipeline()
    for u in users:
        pipe.zadd(LEADERBOARD_KEY, {u.id: u.total_energy_earned}, nx=True)
    await pipe.execute()
    logger.info("Leaderboard seeded with %d users", len(users))
