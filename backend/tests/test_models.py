import uuid
import pytest
from sqlalchemy import select
from app.models.enums import OrderStatus, OrderType, TableStatus, UserRole
from app.models.user import User
from app.models.restaurant import Restaurant, Branch
from app.models.table import Table
from app.models.menu import Category, Product, ProductAddon
from app.models.order import Order, OrderItem
from app.core.security import get_password_hash, verify_password
from app.database.session import AsyncSessionLocal

def test_password_hashing():
    raw = "SecurePassword123!"
    hashed = get_password_hash(raw)
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_model_definitions():
    user = User(
        email="owner@pulseorder.io",
        hashed_password="hash",
        full_name="Restaurant Owner",
        role=UserRole.RESTAURANT_OWNER,
        is_active=True,
    )
    assert user.role == UserRole.RESTAURANT_OWNER
    assert user.is_active is True

    restaurant_id = uuid.uuid4()
    restaurant = Restaurant(
        id=restaurant_id,
        owner_id=uuid.uuid4(),
        name="Pulse Bistro",
        slug="pulse-bistro",
        currency="USD",
        is_active=True,
    )
    assert restaurant.name == "Pulse Bistro"

    branch_id = uuid.uuid4()
    branch = Branch(
        id=branch_id,
        restaurant_id=restaurant_id,
        name="Downtown Branch",
        address="123 Main St",
        phone="555-0100",
        is_active=True,
    )
    assert branch.name == "Downtown Branch"

    table = Table(
        branch_id=branch_id,
        table_number="T-01",
        capacity=4,
        qr_code_token="secret_token_123",
        status=TableStatus.AVAILABLE,
        is_active=True,
    )
    assert table.status == TableStatus.AVAILABLE

    product = Product(
        restaurant_id=restaurant_id,
        category_id=uuid.uuid4(),
        name="Truffle Burger",
        base_price=15.99,
        is_veg=False,
        is_available=True,
    )
    assert product.base_price == 15.99

    order = Order(
        restaurant_id=restaurant_id,
        branch_id=branch_id,
        table_id=table.id,
        order_number="ORD-001",
        status=OrderStatus.PLACED,
        order_type=OrderType.DINE_IN,
        subtotal=15.99,
        tax_amount=1.60,
        service_charge=0.0,
        total_amount=17.59,
    )
    assert order.status == OrderStatus.PLACED
    assert order.total_amount == 17.59

@pytest.mark.asyncio
async def test_db_persistence():
    async with AsyncSessionLocal() as session:
        test_email = f"test_{uuid.uuid4().hex[:8]}@pulseorder.io"
        user = User(
            email=test_email,
            hashed_password=get_password_hash("Pass123!"),
            full_name="Database Test User",
            role=UserRole.CUSTOMER,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Retrieve user
        stmt = select(User).where(User.id == user.id)
        result = await session.execute(stmt)
        fetched_user = result.scalar_one_or_none()

        assert fetched_user is not None
        assert fetched_user.email == test_email
        assert fetched_user.is_active is True

        # Clean up
        await session.delete(fetched_user)
        await session.commit()
