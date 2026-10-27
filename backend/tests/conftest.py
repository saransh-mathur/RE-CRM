import pytest
from app.core.database import init_db, engine, Base
from app.main import seed_initial_demo_data


@pytest.fixture(autouse=True)
async def setup_test_database():
    """Drops and recreates tables cleanly before each test to ensure test isolation."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    await seed_initial_demo_data()
    yield
