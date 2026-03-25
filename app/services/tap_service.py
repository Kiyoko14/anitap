from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import User
from app.db.redis import get_redis

logger = logging.getLogger(__name__)

TAP_RATE_LIMIT_TTL = 1  # seconds


def _compute_tap_value(user: User) -> int:
    """
    tap_value = BASE_TAP * (1 + sum(multiplier_bonus * level for each user_upgrade))
    """
    multiplier_sum = sum(uu.upgrade.multiplier_bonus * uu.level for uu in user.user_upgrades)
    return max(1, int(settings.BASE_TAP * (1 + multiplier_sum)))


async def apply_tap(db: AsyncSession, user: User, taps: int = 1) -> dict:
    """
    Rate-limit, compute tap value, buffer energy in Redis.
    Returns dict with energy_gained and refreshed totals from buffer.
    """
    redis = get_redis()
    rate_key = f"tap:{user.id}"

    # --- Rate limiting: sliding window using Redis INCR + TTL ---
    pipe = redis.pipeline()
    pipe.incr(rate_key)
    pipe.expire(rate_key, TAP_RATE_LIMIT_TTL, nx=True)
    results = await pipe.execute()
    current_count = results[0]

    if current_count > settings.MAX_TAPS_PER_SECOND * taps:
        # Instead of hard-reject, cap to remaining allowed taps
        allowed = max(0, settings.MAX_TAPS_PER_SECOND - (current_count - taps))
        taps = min(taps, allowed)
        if taps <= 0:
            return {
                "energy_gained": 0,
                "total_energy_earned": user.total_energy_earned,
                "energy": user.energy,
            }

    tap_value = _compute_tap_value(user) * taps
    buffer_key = f"energy_buffer:{user.id}"

    # Accumulate in Redis
    await redis.incrbyfloat(buffer_key, tap_value)

    # Update leaderboard by earned increment (not current balance)
    await redis.zincrby("leaderboard", tap_value, user.id)

    # Apply referral bonus if applicable
    if user.referred_by:
        bonus = int(tap_value * settings.REFERRAL_PERCENT)
        if bonus > 0:
            referrer_buffer_key = f"energy_buffer:{user.referred_by}"
            await redis.incrbyfloat(referrer_buffer_key, bonus)
            await redis.zincrby("leaderboard", bonus, user.referred_by)

    # Return optimistic totals (DB not updated yet)
    buffered = float(await redis.get(buffer_key) or 0)
    estimated_total = user.total_energy_earned + int(buffered)

    return {
        "energy_gained": tap_value,
        "total_energy_earned": estimated_total,
        "energy": user.energy + int(buffered),
    }


async def flush_user_buffer(db: AsyncSession, user: User) -> int:
    """
    Move accumulated energy from Redis buffer into DB for a single user.
    Returns the amount flushed.
    Returns 0 if nothing to flush.
    """
    redis = get_redis()
    buffer_key = f"energy_buffer:{user.id}"

    raw = await redis.getdel(buffer_key)
    if not raw:
        return 0

    amount = int(float(raw))
    if amount <= 0:
        return 0

    user.energy += amount
    user.total_energy_earned += amount
    await db.commit()
    logger.debug("Flushed %d energy for user %s", amount, user.id)
    return amount


async def flush_all_buffers(db: AsyncSession) -> int:
    """
    Scan all energy_buffer:* keys and flush them to DB.
    Called by the background task.
    Returns total energy flushed across all users.
    """
    from sqlalchemy import select

    from app.db.models import User

    redis = get_redis()
    total_flushed = 0

    async for key in redis.scan_iter("energy_buffer:*"):
        raw = await redis.getdel(key)
        if not raw:
            continue
        amount = int(float(raw))
        if amount <= 0:
            continue
        user_id = key.split(":", 1)[1]
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            continue
        user.energy += amount
        user.total_energy_earned += amount
        total_flushed += amount

    if total_flushed:
        await db.commit()
        logger.info("Periodic flush: %d energy committed to DB", total_flushed)

    return total_flushed
