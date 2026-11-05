import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token, RSAKeyManager
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.enums import UserRole
from app.models.restaurant import Restaurant
from app.models.restaurant_member import RestaurantMember
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.auth_service import authenticate_user, create_user

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    return await create_user(db, user_in)

@router.post("/login", response_model=Token, tags=["Authentication"])
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Check associated restaurant or branch
    restaurant_id: str | None = None
    branch_id: str | None = None

    if user.role == UserRole.RESTAURANT_OWNER:
        rest_res = await db.execute(select(Restaurant).where(Restaurant.owner_id == user.id))
        rest = rest_res.scalar_one_or_none()
        if rest:
            restaurant_id = str(rest.id)
    else:
        mem_res = await db.execute(
            select(RestaurantMember).where(
                RestaurantMember.user_id == user.id,
                RestaurantMember.is_active == True
            )
        )
        mem = mem_res.scalar_one_or_none()
        if mem:
            restaurant_id = str(mem.restaurant_id)
            branch_id = str(mem.branch_id) if mem.branch_id else None

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        restaurant_id=restaurant_id,
        branch_id=branch_id
    )
    refresh_token = create_refresh_token(subject=user.id)

    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token,
        role=user.role.value,
        restaurant_id=restaurant_id,
        branch_id=branch_id
    )

@router.post("/refresh", response_model=Token, tags=["Authentication"])
async def refresh_token(token_data: Dict[str, str], db: AsyncSession = Depends(get_db)):
    raw_token = token_data.get("refresh_token")
    if not raw_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing refresh token")
    
    try:
        payload = decode_token(raw_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token type")
        user_id_str = payload.get("sub")
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active or found")

    new_access_token = create_access_token(subject=user.id, role=user.role.value)
    return Token(
        access_token=new_access_token,
        token_type="bearer",
        refresh_token=raw_token,
        role=user.role.value
    )

@router.get("/me", response_model=UserResponse, tags=["Authentication"])
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/public-key", tags=["Security - RSA"])
async def get_rsa_public_key() -> Dict[str, str]:
    """
    Exposes the server's RSA-2048 Public Key in PEM format.
    Table Kiosks and client devices use this key to encrypt sensitive payloads
    (payment details, customer PII, table auth tokens) via RSA-OAEP SHA-256
    before transmitting over the wire.
    """
    pem = RSAKeyManager.get_public_pem()
    return {
        "algorithm": "RSA-OAEP-256",
        "key_size": "2048",
        "public_key": pem
    }

@router.post("/decrypt-test", tags=["Security - RSA"])
async def rsa_decrypt_test(payload: Dict[str, str]) -> Dict[str, str]:
    """
    Decrypts an incoming RSA-OAEP SHA-256 base64 encrypted payload using the server's private key.
    Useful for end-to-end verification of cryptographic channel between Kiosk and Backend.
    """
    ciphertext = payload.get("encrypted_payload")
    if not ciphertext:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing encrypted_payload")
    try:
        decrypted = RSAKeyManager.decrypt_payload(ciphertext)
        return {"status": "success", "decrypted_data": decrypted}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"RSA decryption failed: {str(e)}")


