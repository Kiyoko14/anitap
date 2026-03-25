"""Initial schema: users, upgrades, user_upgrades.

Revision ID: 0001_initial
Revises:
Create Date: 2026-03-25
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("telegram_id", sa.String(), nullable=False),
        sa.Column("energy", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("coins", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "last_active_time",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("referral_code", sa.String(16), nullable=False),
        sa.Column("referred_by", UUID(as_uuid=False), nullable=True),
        sa.Column("total_energy_earned", sa.BigInteger(), nullable=False, server_default="0"),
        sa.UniqueConstraint("telegram_id", name="uq_users_telegram_id"),
        sa.UniqueConstraint("referral_code", name="uq_users_referral_code"),
        sa.ForeignKeyConstraint(
            ["referred_by"],
            ["users.id"],
            name="fk_users_referred_by",
            ondelete="SET NULL",
        ),
    )
    op.create_index("ix_users_telegram_id", "users", ["telegram_id"])

    op.create_table(
        "upgrades",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("base_cost", sa.BigInteger(), nullable=False),
        sa.Column("multiplier_bonus", sa.Float(), nullable=False, server_default="0"),
        sa.Column("passive_bonus", sa.Float(), nullable=False, server_default="0"),
        sa.UniqueConstraint("name", name="uq_upgrades_name"),
    )

    op.create_table(
        "user_upgrades",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column("user_id", UUID(as_uuid=False), nullable=False),
        sa.Column("upgrade_id", sa.Integer(), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_user_upgrades_user",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["upgrade_id"],
            ["upgrades.id"],
            name="fk_user_upgrades_upgrade",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("user_id", "upgrade_id", name="uq_user_upgrade"),
    )
    op.create_index("ix_user_upgrades_user_id", "user_upgrades", ["user_id"])

    # Seed default upgrades
    op.bulk_insert(
        sa.table(
            "upgrades",
            sa.column("name", sa.String),
            sa.column("base_cost", sa.BigInteger),
            sa.column("multiplier_bonus", sa.Float),
            sa.column("passive_bonus", sa.Float),
        ),
        [
            {
                "name": "Tap Boost I",
                "base_cost": 500,
                "multiplier_bonus": 1.0,
                "passive_bonus": 0.0,
            },
            {
                "name": "Tap Boost II",
                "base_cost": 2000,
                "multiplier_bonus": 2.0,
                "passive_bonus": 0.0,
            },
            {
                "name": "Tap Boost III",
                "base_cost": 8000,
                "multiplier_bonus": 4.0,
                "passive_bonus": 0.0,
            },
            {
                "name": "Passive Farm I",
                "base_cost": 1000,
                "multiplier_bonus": 0.0,
                "passive_bonus": 1.0,
            },
            {
                "name": "Passive Farm II",
                "base_cost": 4000,
                "multiplier_bonus": 0.0,
                "passive_bonus": 3.0,
            },
            {
                "name": "Passive Farm III",
                "base_cost": 16000,
                "multiplier_bonus": 0.0,
                "passive_bonus": 8.0,
            },
        ],
    )


def downgrade() -> None:
    op.drop_table("user_upgrades")
    op.drop_table("upgrades")
    op.drop_table("users")
