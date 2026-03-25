from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import User
from app.db.redis import get_redis

logger = logging.getLogger(__name__)


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_telegram_id(db: AsyncSession, telegram_id: str) -> User | None:
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    telegram_id: str,
    referral_code_used: str | None = None,
) -> User:
    # Resolve referrer
    referrer: User | None = None
    if referral_code_used:
        referrer_result = await db.execute(
            select(User).where(User.referral_code == referral_code_used)
        )
        referrer = referrer_result.scalar_one_or_none()

    # Prevent self-referral (telegram_id check is enough at creation time)
    new_user = User(
        id=str(uuid.uuid4()),
        telegram_id=str(telegram_id),
        energy=settings.REFERRAL_BONUS_NEW_USER if referrer else 0,
        referred_by=referrer.id if referrer else None,
    )
    db.add(new_user)

    if referrer:
        referrer.energy += settings.REFERRAL_BONUS_REFERRER
        logger.info("Referral applied: new_user=%s referred_by=%s", new_user.id, referrer.id)

    await db.commit()
    await db.refresh(new_user)
    return new_user


async def sync_user_energy(db: AsyncSession, user_id: str) -> User | None:
    """
    Flush any buffered energy from Redis, then apply passive income for
    offline time. Updates last_active_time.
    """
    from app.services.tap_service import flush_user_buffer  # avoid circular

    user = await get_user_by_id(db, user_id)
    if user is None:
        return None

    # Flush pending tap buffer first
    await flush_user_buffer(db, user)

    # Compute passive income
    passive_rate = sum(uu.upgrade.passive_bonus * uu.level for uu in user.user_upgrades)
    now = datetime.now(UTC)
    last = user.last_active_time
    if last.tzinfo is None:
        last = last.replace(tzinfo=UTC)
    offline_seconds = max(0.0, (now - last).total_seconds())
    passive_earned = int(offline_seconds * passive_rate)

    if passive_earned > 0:
        user.energy += passive_earned
        user.total_energy_earned += passive_earned

        # Referral bonus on passive income
        if user.referred_by:
            bonus = int(passive_earned * settings.REFERRAL_PERCENT)
            if bonus > 0:
                referrer = await get_user_by_id(db, user.referred_by)
                if referrer:
                    referrer.energy += bonus
                    referrer.total_energy_earned += bonus
                    # Update referrer leaderboard score
                    redis = get_redis()
                    await redis.zincrby("leaderboard", bonus, referrer.id)

        # Update leaderboard
        redis = get_redis()
        await redis.zincrby("leaderboard", passive_earned, user.id)

    user.last_active_time = now
    await db.commit()
    await db.refresh(user)
    return user
