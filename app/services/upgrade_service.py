from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Upgrade, User, UserUpgrade

logger = logging.getLogger(__name__)


async def list_upgrades(db: AsyncSession) -> list[Upgrade]:
    result = await db.execute(select(Upgrade))
    return list(result.scalars().all())


def _upgrade_cost(upgrade: Upgrade, current_level: int) -> int:
    """Cost grows with level: base_cost * (2 ^ current_level)."""
    return int(upgrade.base_cost * (2**current_level))


async def purchase_upgrade(db: AsyncSession, user: User, upgrade_id: int) -> dict:
    """
    Purchase or level up an upgrade for the user.
    Deducts energy and increases the UserUpgrade level.
    """
    # Load upgrade definition
    result = await db.execute(select(Upgrade).where(Upgrade.id == upgrade_id))
    upgrade = result.scalar_one_or_none()
    if upgrade is None:
        raise ValueError(f"Upgrade {upgrade_id} not found")

    # Find or create user upgrade record
    uu_result = await db.execute(
        select(UserUpgrade).where(
            UserUpgrade.user_id == user.id,
            UserUpgrade.upgrade_id == upgrade_id,
        )
    )
    user_upgrade = uu_result.scalar_one_or_none()
    current_level = user_upgrade.level if user_upgrade else 0
    cost = _upgrade_cost(upgrade, current_level)

    # Flush any pending buffer before checking balance to get accurate energy
    from app.services.tap_service import flush_user_buffer

    await flush_user_buffer(db, user)
    await db.refresh(user)

    if user.energy < cost:
        raise ValueError(f"Not enough energy. Need {cost}, have {user.energy}")

    user.energy -= cost

    if user_upgrade is None:
        user_upgrade = UserUpgrade(user_id=user.id, upgrade_id=upgrade_id, level=1)
        db.add(user_upgrade)
        new_level = 1
    else:
        user_upgrade.level += 1
        new_level = user_upgrade.level

    await db.commit()
    await db.refresh(user)

    logger.info(
        "User %s purchased upgrade %s (level=%d, cost=%d)",
        user.id,
        upgrade.name,
        new_level,
        cost,
    )
    return {
        "upgrade_id": upgrade_id,
        "new_level": new_level,
        "energy_remaining": user.energy,
        "cost_paid": cost,
    }
