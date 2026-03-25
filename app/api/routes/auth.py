from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, verify_telegram_init_data
from app.db.session import get_db
from app.services.user_service import create_user, get_user_by_telegram_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


class TelegramAuthRequest(BaseModel):
    init_data: str
    referral_code: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    is_new: bool


@router.post("/telegram", response_model=AuthResponse, summary="Authenticate with Telegram WebApp")
async def telegram_auth(
    payload: TelegramAuthRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """
    Verify Telegram WebApp initData and return a JWT access token.
    On first visit, a new user is created (optionally with a referral code).
    """
    tg_user = verify_telegram_init_data(payload.init_data)
    telegram_id = str(tg_user.get("id", ""))
    if not telegram_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Telegram user id"
        )

    user = await get_user_by_telegram_id(db, telegram_id)
    is_new = user is None

    if is_new:
        # Anti-abuse: validate referral code before creating user
        referral = payload.referral_code
        user = await create_user(db, telegram_id=telegram_id, referral_code_used=referral)
        logger.info("New user created: telegram_id=%s user_id=%s", telegram_id, user.id)
    else:
        logger.info("Existing user login: telegram_id=%s user_id=%s", telegram_id, user.id)

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user_id=user.id, is_new=is_new)
