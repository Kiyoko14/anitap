# AniTap — Production-Ready FastAPI Backend

> **Telegram Mini App game backend** built with Python 3.11, FastAPI, async SQLAlchemy, Pydantic v2, PostgreSQL (Supabase), Redis (Upstash), and JWT authentication.

---

## Table of Contents

- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Running with Docker](#running-with-docker)
- [Database Migrations](#database-migrations)
- [API Reference](#api-reference)
- [Game Economy](#game-economy)
- [Deployment (Supabase + Upstash)](#deployment)

---

## Architecture

```
Telegram Mini App (frontend)
        │  HTTPS / WebSocket
        ▼
  FastAPI (uvicorn)
   ├── JWT auth middleware
   ├── Rate-limit middleware (IP + per-user)
   ├── Logging middleware
   │
   ├── POST /auth/telegram  ← Telegram HMAC verification
   ├── GET  /user           ← current user data
   ├── POST /tap            ← energy accumulator (Redis buffer)
   ├── POST /upgrade        ← purchase upgrade
   ├── GET  /user/sync      ← offline passive income
   └── GET  /leaderboard    ← Redis sorted set
          │
          ├── PostgreSQL (SQLAlchemy async)
          │     users, upgrades, user_upgrades
          │
          └── Redis (Upstash)
                tap:{uid}            rate limit (1s TTL)
                energy_buffer:{uid}  tap accumulator
                leaderboard          sorted set (score = total_energy_earned)
```

### Buffer Flush

Energy is **never written to the database on every tap**. Instead:

1. Each tap increments `energy_buffer:{user_id}` in Redis.
2. A background asyncio task flushes all buffers to the DB every **5 seconds**.
3. On shutdown, a final flush is performed.
4. `POST /upgrade` and `GET /user/sync` trigger a per-user flush before touching the DB.

---

## Project Structure

```
anitap/
├── app/
│   ├── main.py                  # FastAPI app factory, middleware, lifespan
│   ├── api/routes/
│   │   ├── auth.py              # POST /auth/telegram
│   │   ├── user.py              # GET /user, GET /user/sync
│   │   ├── tap.py               # POST /tap
│   │   ├── upgrade.py           # GET /upgrade/list, POST /upgrade
│   │   └── leaderboard.py       # GET /leaderboard
│   ├── core/
│   │   ├── config.py            # Pydantic-settings config loader
│   │   └── security.py          # JWT helpers + Telegram HMAC verification
│   ├── db/
│   │   ├── base.py              # SQLAlchemy DeclarativeBase
│   │   ├── models.py            # User, Upgrade, UserUpgrade ORM models
│   │   ├── session.py           # Async engine + session factory
│   │   └── redis.py             # Redis client singleton
│   ├── schemas/
│   │   ├── user.py              # UserOut, UserDetailOut Pydantic schemas
│   │   ├── tap.py               # TapRequest/Response
│   │   └── upgrade.py           # UpgradeOut, PurchaseUpgradeRequest/Response
│   └── services/
│       ├── tap_service.py       # apply_tap, flush_all_buffers
│       ├── user_service.py      # CRUD, sync_user_energy (passive income)
│       ├── upgrade_service.py   # purchase_upgrade, cost scaling
│       └── leaderboard_service.py
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/0001_initial.py
├── tests/
│   └── test_core.py
├── .env.example
├── alembic.ini
├── Dockerfile
├── entrypoint.sh
└── requirements.txt
```

---

## Prerequisites

- Python 3.11+
- PostgreSQL (or a Supabase project)
- Redis (or an Upstash Redis database)

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/Kiyoko14/anitap.git
cd anitap

# 2. Create & activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your values (see below)

# 5. Run database migrations
alembic upgrade head

# 6. Start the server
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000/docs** (only visible when `DEBUG=true`) to explore the API.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string — `postgresql+asyncpg://user:pass@host/db` |
| `REDIS_URL` | Redis connection string — `rediss://:token@host:port` |
| `SECRET_KEY` | JWT signing key (generate: `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from @BotFather |
| `BASE_TAP` | Energy earned per tap (default `1`) |
| `REFERRAL_BONUS_NEW_USER` | Energy bonus for new referred user (default `1000`) |
| `REFERRAL_BONUS_REFERRER` | Energy bonus for referrer on successful referral (default `500`) |
| `REFERRAL_PERCENT` | Ongoing referral share of earned energy (default `0.05` = 5%) |
| `MAX_TAPS_PER_SECOND` | Per-user tap rate limit (default `10`) |
| `FLUSH_INTERVAL` | Seconds between Redis→DB buffer flushes (default `5`) |
| `DEBUG` | Enable debug logs and Swagger UI (default `false`) |

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database** and copy the connection string.
3. Replace the `[YOUR-PASSWORD]` placeholder and set `DATABASE_URL`.

### Upstash Redis Setup

1. Create a new Redis database at [upstash.com](https://upstash.com).
2. Copy the **REST URL** and convert it to a `rediss://` connection string.
3. Set `REDIS_URL=rediss://:YOUR_TOKEN@YOUR_HOST:6380`.

---

## Running with Docker

```bash
# Build the image
docker build -t anitap .

# Run (pass env vars or mount a .env file)
docker run -p 8000:8000 --env-file .env anitap
```

The default `CMD` starts uvicorn directly. For production, use `entrypoint.sh` to run migrations first:

```dockerfile
CMD ["sh", "entrypoint.sh"]
```

---

## Database Migrations

```bash
# Apply all migrations
alembic upgrade head

# Generate a new migration after model changes
alembic revision --autogenerate -m "describe change"

# Downgrade one step
alembic downgrade -1
```

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/telegram` | — | Verify Telegram initData, return JWT |
| `GET` | `/user` | JWT | Current user data |
| `GET` | `/user/sync` | JWT | Apply offline passive income |
| `POST` | `/tap` | JWT | Register taps, accumulate energy |
| `GET` | `/upgrade/list` | — | List all available upgrades |
| `POST` | `/upgrade` | JWT | Purchase / level up an upgrade |
| `GET` | `/leaderboard` | — | Top users by total energy earned |
| `GET` | `/health` | — | Health check |

---

## Game Economy

### Tap Value

```
tap_value = BASE_TAP × (1 + Σ(upgrade.multiplier_bonus × level))
```

### Passive Income (sync)

```
passive_rate = Σ(upgrade.passive_bonus × level)
offline_energy = offline_seconds × passive_rate
```

### Referral System

- New user using a referral code: **+1 000 energy**
- Referrer: **+500 energy** on successful signup
- Ongoing: referrer earns **5%** of referred user's tap and passive income
- Anti-abuse: one referral per account, no self-referral

### Leaderboard Score

`score = total_energy_earned` (not current balance — never decreases on upgrades)

---

## Deployment

For a production deployment to a VPS or PaaS:

1. Set all environment variables in your hosting platform's secrets manager.
2. Use `entrypoint.sh` so migrations run before the server starts.
3. Put a reverse proxy (nginx / Caddy) in front of uvicorn.
4. Enable `DEBUG=false` to disable Swagger UI.
5. Use at least 2 uvicorn workers, but note the in-process buffer-flush task — consider a separate Celery/ARQ worker for the flush job in multi-worker deployments.
