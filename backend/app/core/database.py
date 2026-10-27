from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Engine configuration: supports both async SQLite (local/testing) and asyncpg PostgreSQL (production)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    # Async SQLite specific config
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Creates database tables asynchronously for startup/development."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
