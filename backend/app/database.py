from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import SQLModel
from app.config import settings

_engine = None
_session_factory = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.debug,
            pool_pre_ping=True,
        )
    return _engine


def get_session_factory():
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


# 기존 코드 호환을 위한 프록시 — 실제 엔진은 lifespan 시점에 생성됨
class _EngineProxy:
    def __getattr__(self, name):
        return getattr(get_engine(), name)

engine = _EngineProxy()
AsyncSessionLocal = None  # deps.py에서 get_session_factory() 직접 호출


async def init_db() -> None:
    eng = get_engine()
    async with eng.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
