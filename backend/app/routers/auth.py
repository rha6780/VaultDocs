import secrets
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.deps import get_session, get_current_user
from app.models.user import User
from app.services.auth import (
    create_access_token, create_refresh_token,
    decode_refresh_token, hash_token, verify_token_hash,
    get_google_auth_url, exchange_google_code, get_google_user_info,
)
from app.config import settings

router = APIRouter()

_oauth_states: set[str] = set()  # 간단한 state 검증 (production에선 Redis 사용)

DEV_USER = {'google_id': 'dev-user-001', 'email': 'dev@vaultdocs.local', 'name': 'Dev User'}


class RefreshRequest(BaseModel):
    refreshToken: str


class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    avatarUrl: str | None
    createdAt: str


class AuthResponse(BaseModel):
    user: UserOut
    tokens: TokenResponse


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        avatarUrl=user.avatar_url,
        createdAt=user.created_at.isoformat(),
    )


def _make_tokens(user: User) -> tuple[str, str]:
    return create_access_token(user.id), create_refresh_token(user.id)


async def _upsert_user(session: AsyncSession, google_id: str, email: str, name: str, avatar_url: str | None = None) -> User:
    result = await session.exec(select(User).where(User.google_id == google_id))
    user = result.first()
    if not user:
        result = await session.exec(select(User).where(User.email == email))
        user = result.first()

    if user:
        user.name = name
        if avatar_url:
            user.avatar_url = avatar_url
        user.updated_at = datetime.utcnow()
    else:
        user = User(google_id=google_id, email=email, name=name, avatar_url=avatar_url)

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


# ─── Google OAuth ─────────────────────────────────────────────────────────────

@router.get('/google')
async def google_login():
    state = secrets.token_urlsafe(16)
    _oauth_states.add(state)
    return RedirectResponse(get_google_auth_url(state))


@router.get('/google/callback')
async def google_callback(code: str, state: str, session: AsyncSession = Depends(get_session)):
    if state not in _oauth_states:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid state')
    _oauth_states.discard(state)

    try:
        token_data = await exchange_google_code(code)
        user_info = await get_google_user_info(token_data['access_token'])
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail='Google OAuth failed')

    user = await _upsert_user(
        session,
        google_id=user_info['sub'],
        email=user_info['email'],
        name=user_info.get('name', user_info['email']),
        avatar_url=user_info.get('picture'),
    )

    access_token, refresh_token = _make_tokens(user)
    user.refresh_token = hash_token(refresh_token)
    user.updated_at = datetime.utcnow()
    session.add(user)
    await session.commit()

    return RedirectResponse(
        f"{settings.frontend_url}/auth/callback?accessToken={access_token}&refreshToken={refresh_token}"
    )


# ─── Token refresh ────────────────────────────────────────────────────────────

@router.post('/refresh', response_model=TokenResponse)
async def refresh(body: RefreshRequest, session: AsyncSession = Depends(get_session)):
    payload = decode_refresh_token(body.refreshToken)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')

    result = await session.exec(select(User).where(User.id == payload['user_id']))
    user = result.first()
    if not user or not user.refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token revoked')

    if not verify_token_hash(body.refreshToken, user.refresh_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token mismatch')

    access_token, refresh_token = _make_tokens(user)
    user.refresh_token = hash_token(refresh_token)
    user.updated_at = datetime.utcnow()
    session.add(user)
    await session.commit()

    return TokenResponse(accessToken=access_token, refreshToken=refresh_token)


# ─── Me / Logout ──────────────────────────────────────────────────────────────

@router.get('/me', response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return _user_out(current_user)


@router.post('/logout')
async def logout(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    current_user.refresh_token = None
    current_user.updated_at = datetime.utcnow()
    session.add(current_user)
    await session.commit()
    return {'message': 'ok'}


# ─── Dev login ────────────────────────────────────────────────────────────────

@router.post('/dev-login', response_model=AuthResponse)
async def dev_login(session: AsyncSession = Depends(get_session)):
    if settings.node_env == 'production':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not available in production')

    user = await _upsert_user(session, **DEV_USER)
    access_token, refresh_token = _make_tokens(user)
    user.refresh_token = hash_token(refresh_token)
    user.updated_at = datetime.utcnow()
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return AuthResponse(
        user=_user_out(user),
        tokens=TokenResponse(accessToken=access_token, refreshToken=refresh_token),
    )
