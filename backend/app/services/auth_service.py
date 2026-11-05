import uuid
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_password_hash, verify_password
from app.models.enums import UserRole
from app.models.restaurant import Branch, Restaurant
from app.models.restaurant_member import RestaurantMember
from app.models.settings import RestaurantSettings
from app.models.user import User
from app.schemas.user import UserCreate

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    stmt = select(User).where(User.email == email.lower())
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    existing = await get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email.lower(),
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        role=user_in.role,
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

async def create_restaurant_with_branch(
    db: AsyncSession,
    owner: User,
    name: str,
    slug: str,
    currency: str = "USD",
    logo_url: Optional[str] = None
) -> Tuple[Restaurant, Branch]:
    # Check if slug exists
    slug_check = await db.execute(select(Restaurant).where(Restaurant.slug == slug))
    if slug_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaurant slug is already in use"
        )

    restaurant = Restaurant(
        owner_id=owner.id,
        name=name,
        slug=slug,
        currency=currency,
        logo_url=logo_url,
        is_active=True
    )
    db.add(restaurant)
    await db.flush()

    # Create default primary branch
    branch = Branch(
        restaurant_id=restaurant.id,
        name="Main Branch",
        address="Primary Location",
        phone="555-0100",
        is_active=True
    )
    db.add(branch)

    # Initialize default settings
    settings = RestaurantSettings(
        restaurant_id=restaurant.id,
        tax_percentage=5.00,
        service_charge_percentage=0.00,
        opening_time="09:00",
        closing_time="23:00",
        is_ordering_enabled=True
    )
    db.add(settings)

    await db.commit()
    await db.refresh(restaurant)
    await db.refresh(branch)
    return restaurant, branch

