from datetime import datetime, timedelta
from typing import Optional
import bcrypt
import httpx
from jose import jwt, JWTError
from app.config import settings

GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'


# ─── JWT ─────────────────────────────────────────────────────────────────────

def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_expire_minutes)
    return jwt.encode(
        {'user_id': user_id, 'exp': expire, 'type': 'access'},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.jwt_refresh_expire_days)
    return jwt.encode(
        {'user_id': user_id, 'exp': expire, 'type': 'refresh'},
        settings.jwt_refresh_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        if payload.get('type') != 'access':
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.jwt_refresh_secret, algorithms=[settings.jwt_algorithm])
        if payload.get('type') != 'refresh':
            return None
        return payload
    except JWTError:
        return None


def hash_token(token: str) -> str:
    return bcrypt.hashpw(token.encode(), bcrypt.gensalt()).decode()


def verify_token_hash(token: str, hashed: str) -> bool:
    return bcrypt.checkpw(token.encode(), hashed.encode())


# ─── Google OAuth ─────────────────────────────────────────────────────────────

def get_google_auth_url(state: str) -> str:
    params = {
        'client_id': settings.google_client_id,
        'redirect_uri': settings.google_callback_url,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': state,
        'access_type': 'offline',
    }
    query = '&'.join(f'{k}={v}' for k, v in params.items())
    return f"{GOOGLE_AUTH_URL}?{query}"


async def exchange_google_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(GOOGLE_TOKEN_URL, data={
            'code': code,
            'client_id': settings.google_client_id,
            'client_secret': settings.google_client_secret,
            'redirect_uri': settings.google_callback_url,
            'grant_type': 'authorization_code',
        })
        resp.raise_for_status()
        return resp.json()


async def get_google_user_info(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={'Authorization': f'Bearer {access_token}'},
        )
        resp.raise_for_status()
        return resp.json()
