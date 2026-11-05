import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.database.session import engine

@pytest_asyncio.fixture(scope="function")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture(scope="function", autouse=True)
async def cleanup_database():
    yield
    # Ensure connections in pool are cleanly closed before the test event loop closes
    await engine.dispose()
