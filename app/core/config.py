from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    APP_NAME: str = "AniTap"
    DEBUG: bool = False

    # Database (Supabase / PostgreSQL)
    DATABASE_URL: str  # e.g. postgresql+asyncpg://user:pass@host/db

    # Redis (Upstash)
    REDIS_URL: str  # e.g. rediss://:token@host:port

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Telegram
    TELEGRAM_BOT_TOKEN: str

    # Game economy constants
    BASE_TAP: int = 1
    REFERRAL_BONUS_NEW_USER: int = 1000
    REFERRAL_BONUS_REFERRER: int = 500
    REFERRAL_PERCENT: float = 0.05
    MAX_TAPS_PER_SECOND: int = 10

    # Buffer flush interval in seconds
    FLUSH_INTERVAL: int = 5

    # Rate limiting (requests per minute per IP)
    RATE_LIMIT_PER_MINUTE: int = 300


settings = Settings()  # type: ignore[call-arg]
