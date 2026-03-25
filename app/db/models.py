from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import BigInteger, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    telegram_id: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    energy: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    coins: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC), server_default=func.now()
    )
    last_active_time: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC), server_default=func.now()
    )
    referral_code: Mapped[str] = mapped_column(
        String(16), unique=True, nullable=False, default=lambda: uuid.uuid4().hex[:12].upper()
    )
    referred_by: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    total_energy_earned: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)

    # relationships
    user_upgrades: Mapped[list[UserUpgrade]] = relationship(
        "UserUpgrade", back_populates="user", lazy="selectin"
    )
    referrer: Mapped[User | None] = relationship(
        "User", remote_side="User.id", foreign_keys=[referred_by], lazy="noload"
    )


class Upgrade(Base):
    __tablename__ = "upgrades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    base_cost: Mapped[int] = mapped_column(BigInteger, nullable=False)
    multiplier_bonus: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    passive_bonus: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    user_upgrades: Mapped[list[UserUpgrade]] = relationship(
        "UserUpgrade", back_populates="upgrade", lazy="selectin"
    )


class UserUpgrade(Base):
    __tablename__ = "user_upgrades"
    __table_args__ = (UniqueConstraint("user_id", "upgrade_id", name="uq_user_upgrade"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    upgrade_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("upgrades.id", ondelete="CASCADE"), nullable=False
    )
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    user: Mapped[User] = relationship("User", back_populates="user_upgrades")
    upgrade: Mapped[Upgrade] = relationship("Upgrade", back_populates="user_upgrades")
