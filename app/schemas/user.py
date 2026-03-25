from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    telegram_id: str
    energy: int
    coins: int
    level: int
    created_at: datetime
    last_active_time: datetime
    referral_code: str
    referred_by: str | None
    total_energy_earned: int


class UserUpgradeOut(BaseModel):
    model_config = {"from_attributes": True}

    upgrade_id: int
    level: int


class UserDetailOut(UserOut):
    upgrades: list[UserUpgradeOut] = Field(default_factory=list)
