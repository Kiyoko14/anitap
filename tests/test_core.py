"""Tests for AniTap FastAPI backend.

These tests cover:
- Telegram HMAC verification (security.py)
- Game economy: tap_value calculation
- Referral logic edge cases
"""

from __future__ import annotations

import hashlib
import hmac
import json
import time
import urllib.parse
from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Telegram HMAC tests
# ---------------------------------------------------------------------------


def _build_init_data(bot_token: str, user: dict, auth_date: int | None = None) -> str:
    """Helper to build a valid Telegram initData string."""
    if auth_date is None:
        auth_date = int(time.time())

    params = {
        "user": json.dumps(user, separators=(",", ":")),
        "auth_date": str(auth_date),
        "query_id": "test_query",
    }

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    hash_value = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    params["hash"] = hash_value
    return urllib.parse.urlencode(params)


class TestTelegramVerification:
    def setup_method(self):
        self.bot_token = "123456:ABCDEFGHIJKLMNOP"
        self.user = {"id": 12345678, "first_name": "Test", "username": "testuser"}

    def test_valid_init_data(self):
        from app.core.security import verify_telegram_init_data

        with patch("app.core.security.settings") as mock_settings:
            mock_settings.TELEGRAM_BOT_TOKEN = self.bot_token
            init_data = _build_init_data(self.bot_token, self.user)
            result = verify_telegram_init_data(init_data)
            assert result["id"] == self.user["id"]
            assert result["username"] == self.user["username"]

    def test_invalid_hash_raises(self):
        from app.core.security import verify_telegram_init_data
        from fastapi import HTTPException

        with patch("app.core.security.settings") as mock_settings:
            mock_settings.TELEGRAM_BOT_TOKEN = self.bot_token
            init_data = _build_init_data(self.bot_token, self.user)
            # Tamper with the hash
            tampered = init_data.replace(init_data[-4:], "0000")
            with pytest.raises(HTTPException) as exc_info:
                verify_telegram_init_data(tampered)
            assert exc_info.value.status_code == 401

    def test_expired_auth_date_raises(self):
        from app.core.security import verify_telegram_init_data
        from fastapi import HTTPException

        with patch("app.core.security.settings") as mock_settings:
            mock_settings.TELEGRAM_BOT_TOKEN = self.bot_token
            old_timestamp = int(time.time()) - 700  # > 600 seconds ago
            init_data = _build_init_data(self.bot_token, self.user, auth_date=old_timestamp)
            with pytest.raises(HTTPException) as exc_info:
                verify_telegram_init_data(init_data)
            assert exc_info.value.status_code == 401

    def test_missing_hash_raises(self):
        from app.core.security import verify_telegram_init_data
        from fastapi import HTTPException

        with patch("app.core.security.settings") as mock_settings:
            mock_settings.TELEGRAM_BOT_TOKEN = self.bot_token
            with pytest.raises(HTTPException) as exc_info:
                verify_telegram_init_data("auth_date=1234567890&user=%7B%22id%22%3A1%7D")
            assert exc_info.value.status_code == 400


# ---------------------------------------------------------------------------
# JWT tests
# ---------------------------------------------------------------------------


class TestJWT:
    def test_create_and_decode_token(self):
        from app.core.security import create_access_token, decode_access_token

        with patch("app.core.security.settings") as mock_settings:
            mock_settings.SECRET_KEY = "test-secret"
            mock_settings.ALGORITHM = "HS256"
            mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 60

            token = create_access_token("user-uuid-123")
            user_id = decode_access_token(token)
            assert user_id == "user-uuid-123"

    def test_invalid_token_raises(self):
        from app.core.security import decode_access_token
        from fastapi import HTTPException

        with patch("app.core.security.settings") as mock_settings:
            mock_settings.SECRET_KEY = "test-secret"
            mock_settings.ALGORITHM = "HS256"
            with pytest.raises(HTTPException) as exc_info:
                decode_access_token("not.a.valid.token")
            assert exc_info.value.status_code == 401


# ---------------------------------------------------------------------------
# Tap value calculation tests
# ---------------------------------------------------------------------------


class TestTapValueCalculation:
    def _make_user_with_upgrades(self, upgrades_config: list[dict]) -> MagicMock:
        """Build a mock User with specified upgrade configs."""
        user = MagicMock()
        user_upgrades = []
        for cfg in upgrades_config:
            uu = MagicMock()
            uu.level = cfg["level"]
            uu.upgrade = MagicMock()
            uu.upgrade.multiplier_bonus = cfg["multiplier_bonus"]
            uu.upgrade.passive_bonus = cfg.get("passive_bonus", 0.0)
            user_upgrades.append(uu)
        user.user_upgrades = user_upgrades
        return user

    def test_no_upgrades_gives_base_tap(self):
        from app.services.tap_service import _compute_tap_value

        with patch("app.services.tap_service.settings") as mock_settings:
            mock_settings.BASE_TAP = 1
            user = self._make_user_with_upgrades([])
            assert _compute_tap_value(user) == 1

    def test_one_upgrade_level1(self):
        from app.services.tap_service import _compute_tap_value

        with patch("app.services.tap_service.settings") as mock_settings:
            mock_settings.BASE_TAP = 1
            # multiplier_bonus=1.0, level=1 → sum=1 → tap = 1*(1+1) = 2
            user = self._make_user_with_upgrades([{"level": 1, "multiplier_bonus": 1.0}])
            assert _compute_tap_value(user) == 2

    def test_multiple_upgrades(self):
        from app.services.tap_service import _compute_tap_value

        with patch("app.services.tap_service.settings") as mock_settings:
            mock_settings.BASE_TAP = 1
            # upgrade1: bonus=1.0, level=1 → 1.0
            # upgrade2: bonus=2.0, level=1 → 2.0
            # sum=3.0 → tap = 1*(1+3) = 4
            user = self._make_user_with_upgrades(
                [
                    {"level": 1, "multiplier_bonus": 1.0},
                    {"level": 1, "multiplier_bonus": 2.0},
                ]
            )
            assert _compute_tap_value(user) == 4

    def test_upgrade_higher_level(self):
        from app.services.tap_service import _compute_tap_value

        with patch("app.services.tap_service.settings") as mock_settings:
            mock_settings.BASE_TAP = 1
            # upgrade: bonus=1.0, level=3 → sum=3.0 → tap = 4
            user = self._make_user_with_upgrades([{"level": 3, "multiplier_bonus": 1.0}])
            assert _compute_tap_value(user) == 4


# ---------------------------------------------------------------------------
# Upgrade cost scaling tests
# ---------------------------------------------------------------------------


class TestUpgradeCost:
    def test_cost_doubles_with_level(self):
        from app.services.upgrade_service import _upgrade_cost

        upgrade = MagicMock()
        upgrade.base_cost = 500

        assert _upgrade_cost(upgrade, 0) == 500  # level 0 → cost = 500 * 2^0 = 500
        assert _upgrade_cost(upgrade, 1) == 1000  # level 1 → cost = 500 * 2^1 = 1000
        assert _upgrade_cost(upgrade, 2) == 2000  # level 2 → cost = 500 * 2^2 = 2000
