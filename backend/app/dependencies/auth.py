import uuid
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import decode_token
from app.database.session import get_db
from app.models.enums import UserRole
from app.models.restaurant import Restaurant
from app.models.restaurant_member import RestaurantMember
from app.models.user import User
from app.schemas.token import TokenPayload

security_bearer = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    try:
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing subject",
            )
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    
    return user


def require_roles(allowed_roles: List[UserRole]):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser:
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {[r.value for r in allowed_roles]}",
            )
        return current_user
    return role_checker


async def verify_restaurant_access(
    restaurant_id: uuid.UUID,
    user: User,
    db: AsyncSession
) -> bool:
    if user.is_superuser:
        return True
    
    # Check if user is the direct restaurant owner
    rest_stmt = select(Restaurant).where(
        Restaurant.id == restaurant_id,
        Restaurant.owner_id == user.id
    )
    rest_res = await db.execute(rest_stmt)
    if rest_res.scalar_one_or_none():
        return True
    
    # Check if user is an active member with staff role
    member_stmt = select(RestaurantMember).where(
        RestaurantMember.restaurant_id == restaurant_id,
        RestaurantMember.user_id == user.id,
        RestaurantMember.is_active == True
    )
    member_res = await db.execute(member_stmt)
    return member_res.scalar_one_or_none() is not None

