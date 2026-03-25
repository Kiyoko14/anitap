"""Pytest configuration: set required environment variables before any app import."""

from __future__ import annotations

import os

# Set required env vars before app modules are imported so that
# pydantic-settings can instantiate Settings without a real .env file.
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci")
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "000000000:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
