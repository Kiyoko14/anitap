from __future__ import annotations

from pydantic import BaseModel


class TapRequest(BaseModel):
    taps: int = 1


class TapResponse(BaseModel):
    energy_gained: int
    total_energy_earned: int
    energy: int
