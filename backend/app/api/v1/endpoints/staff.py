import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import require_roles, verify_restaurant_access
from app.models.enums import UserRole
from app.models.restaurant_member import RestaurantMember
from app.models.user import User
from app.services.auth_service import get_user_by_email

router = APIRouter()

class StaffMemberCreate(BaseModel):
    email: EmailStr
    role: UserRole  # MANAGER, KITCHEN_STAFF, WAITER
    branch_id: Optional[uuid.UUID] = None

class StaffMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    restaurant_id: uuid.UUID
    branch_id: Optional[uuid.UUID]
    user_id: uuid.UUID
    role: UserRole
    is_active: bool

@router.get("/{restaurant_id}/staff", response_model=List[StaffMemberResponse], tags=["Staff"])
async def list_staff(
    restaurant_id: uuid.UUID,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    stmt = select(RestaurantMember).where(RestaurantMember.restaurant_id == restaurant_id)
    res = await db.execute(stmt)
    return list(res.scalars().all())

@router.post("/{restaurant_id}/staff", response_model=StaffMemberResponse, status_code=status.HTTP_201_CREATED, tags=["Staff"])
async def add_staff(
    restaurant_id: uuid.UUID,
    staff_in: StaffMemberCreate,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    user = await get_user_by_email(db, staff_in.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found. User must register first."
        )

    # Check if membership already exists
    existing = await db.execute(
        select(RestaurantMember).where(
            RestaurantMember.restaurant_id == restaurant_id,
            RestaurantMember.user_id == user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member of this restaurant")

    member = RestaurantMember(
        restaurant_id=restaurant_id,
        branch_id=staff_in.branch_id,
        user_id=user.id,
        role=staff_in.role,
        is_active=True
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member

