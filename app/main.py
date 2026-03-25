from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, leaderboard, tap, upgrade, user
from app.core.config import settings
from app.db.redis import close_redis
from app.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


# ---------------------------------------------------------------------------
# Background buffer-flush task
# ---------------------------------------------------------------------------


async def _flush_task() -> None:
    """Periodically flush Redis energy buffers to the database."""
    from app.services.tap_service import flush_all_buffers

    while True:
        await asyncio.sleep(settings.FLUSH_INTERVAL)
        try:
            async with AsyncSessionLocal() as db:
                flushed = await flush_all_buffers(db)
                if flushed:
                    logger.debug("Background flush: %d energy written", flushed)
        except Exception:
            logger.exception("Error during background buffer flush")


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    logger.info("Starting %s", settings.APP_NAME)

    # Seed leaderboard from DB (best-effort)
    try:
        from app.services.leaderboard_service import seed_leaderboard_from_db

        async with AsyncSessionLocal() as db:
            await seed_leaderboard_from_db(db)
    except Exception:
        logger.warning("Could not seed leaderboard on startup (Redis/DB not ready?)")

    task = asyncio.create_task(_flush_task())

    yield

    # Shutdown – flush remaining buffers
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

    try:
        from app.services.tap_service import flush_all_buffers

        async with AsyncSessionLocal() as db:
            flushed = await flush_all_buffers(db)
            logger.info("Shutdown flush: %d energy written", flushed)
    except Exception:
        logger.exception("Error during shutdown flush")

    await close_redis()
    logger.info("%s stopped", settings.APP_NAME)


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------


app = FastAPI(
    title=settings.APP_NAME,
    description="Production-ready FastAPI backend for the AniTap Telegram Mini App game.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Rate-limiting middleware (IP-based, per minute)
# ---------------------------------------------------------------------------

_ip_request_counts: dict[str, tuple[int, float]] = {}


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    count, window_start = _ip_request_counts.get(client_ip, (0, now))

    if now - window_start >= 60:
        count = 0
        window_start = now

    count += 1
    _ip_request_counts[client_ip] = (count, window_start)

    if count > settings.RATE_LIMIT_PER_MINUTE:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Try again later."},
        )

    return await call_next(request)


# ---------------------------------------------------------------------------
# Logging middleware
# ---------------------------------------------------------------------------


@app.middleware("http")
async def logging_middleware(request: Request, call_next) -> Response:
    start = time.perf_counter()
    response: Response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s %d %.1fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(tap.router)
app.include_router(upgrade.router)
app.include_router(leaderboard.router)


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "app": settings.APP_NAME}
