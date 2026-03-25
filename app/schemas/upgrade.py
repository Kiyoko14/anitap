from __future__ import annotations

from pydantic import BaseModel


class UpgradeOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    base_cost: int
    multiplier_bonus: float
    passive_bonus: float


class PurchaseUpgradeRequest(BaseModel):
    upgrade_id: int


class PurchaseUpgradeResponse(BaseModel):
    upgrade_id: int
    new_level: int
    energy_remaining: int
    cost_paid: int
