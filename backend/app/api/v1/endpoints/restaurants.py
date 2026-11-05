import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_user, require_roles, verify_restaurant_access
from app.models.enums import UserRole
from app.models.restaurant import Branch, Restaurant
from app.models.settings import RestaurantSettings
from app.models.user import User
from app.schemas.restaurant import (
    BranchCreate,
    BranchResponse,
    RestaurantCreate,
    RestaurantResponse,
    RestaurantUpdate,
)
from app.services.auth_service import create_restaurant_with_branch

router = APIRouter()

@router.post("/", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED, tags=["Restaurants"])
async def create_restaurant(
    rest_in: RestaurantCreate,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN, UserRole.RESTAURANT_OWNER])),
    db: AsyncSession = Depends(get_db)
):
    restaurant, _ = await create_restaurant_with_branch(
        db=db,
        owner=current_user,
        name=rest_in.name,
        slug=rest_in.slug,
        currency=rest_in.currency,
        logo_url=rest_in.logo_url
    )
    return restaurant

@router.get("/", response_model=List[RestaurantResponse], tags=["Restaurants"])
async def list_restaurants(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_superuser or current_user.role == UserRole.PLATFORM_ADMIN:
        stmt = select(Restaurant)
    else:
        stmt = select(Restaurant).where(Restaurant.owner_id == current_user.id)
    
    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.get("/{restaurant_id}", response_model=RestaurantResponse, tags=["Restaurants"])
async def get_restaurant(
    restaurant_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this restaurant")
    
    result = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    rest = result.scalar_one_or_none()
    if not rest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return rest

@router.put("/{restaurant_id}", response_model=RestaurantResponse, tags=["Restaurants"])
async def update_restaurant(
    restaurant_id: uuid.UUID,
    rest_in: RestaurantUpdate,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN, UserRole.RESTAURANT_OWNER])),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    res = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    restaurant = res.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    
    if rest_in.name is not None:
        restaurant.name = rest_in.name
    if rest_in.logo_url is not None:
        restaurant.logo_url = rest_in.logo_url
    if rest_in.currency is not None:
        restaurant.currency = rest_in.currency
    if rest_in.is_active is not None:
        restaurant.is_active = rest_in.is_active

    await db.commit()
    await db.refresh(restaurant)
    return restaurant

@router.get("/{restaurant_id}/branches", response_model=List[BranchResponse], tags=["Restaurants"])
async def list_branches(
    restaurant_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    res = await db.execute(select(Branch).where(Branch.restaurant_id == restaurant_id))
    return list(res.scalars().all())

@router.post("/{restaurant_id}/branches", response_model=BranchResponse, status_code=status.HTTP_201_CREATED, tags=["Restaurants"])
async def create_branch(
    restaurant_id: uuid.UUID,
    branch_in: BranchCreate,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    branch = Branch(
        restaurant_id=restaurant_id,
        name=branch_in.name,
        address=branch_in.address,
        phone=branch_in.phone,
        is_active=True
    )
    db.add(branch)
    await db.commit()
    await db.refresh(branch)
    return branch

