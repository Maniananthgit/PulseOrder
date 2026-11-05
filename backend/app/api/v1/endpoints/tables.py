import hashlib
import hmac
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.database.session import get_db
from app.dependencies.auth import get_current_user, require_roles, verify_restaurant_access
from app.models.enums import TableStatus, UserRole
from app.models.restaurant import Branch, Restaurant
from app.models.settings import RestaurantSettings
from app.models.table import Table
from app.models.user import User
from app.schemas.table import TableCreate, TableResponse, TableUpdate

router = APIRouter()

def generate_table_qr_token(branch_id: uuid.UUID, table_number: str) -> str:
    message = f"{branch_id}:{table_number}:{uuid.uuid4().hex[:8]}"
    signature = hmac.new(
        settings.TABLE_TOKEN_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return f"{message}.{signature[:16]}"

class TableVerificationResponse(BaseModel):
    valid: bool
    table_id: uuid.UUID
    table_number: str
    branch_id: uuid.UUID
    branch_name: str
    restaurant_id: uuid.UUID
    restaurant_name: str
    currency: str
    tax_percentage: float
    service_charge_percentage: float

@router.post("/{restaurant_id}/branches/{branch_id}/tables", response_model=TableResponse, status_code=status.HTTP_201_CREATED, tags=["Tables"])
async def create_table(
    restaurant_id: uuid.UUID,
    branch_id: uuid.UUID,
    table_in: TableCreate,
    current_user: User = Depends(require_roles([UserRole.PLATFORM_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    token = generate_table_qr_token(branch_id, table_in.table_number)
    table = Table(
        branch_id=branch_id,
        table_number=table_in.table_number,
        capacity=table_in.capacity,
        qr_code_token=token,
        status=table_in.status,
        is_active=True
    )
    db.add(table)
    await db.commit()
    await db.refresh(table)
    return table

@router.get("/{restaurant_id}/branches/{branch_id}/tables", response_model=List[TableResponse], tags=["Tables"])
async def list_tables(
    restaurant_id: uuid.UUID,
    branch_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    has_access = await verify_restaurant_access(restaurant_id, current_user, db)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    stmt = select(Table).where(Table.branch_id == branch_id, Table.is_active == True).order_by(Table.table_number.asc())
    res = await db.execute(stmt)
    return list(res.scalars().all())

@router.get("/verify/{qr_token}", response_model=TableVerificationResponse, tags=["Tables"])
async def verify_table_token(
    qr_token: str,
    db: AsyncSession = Depends(get_db)
):
    # Lookup table by qr_code_token
    stmt = select(Table).where(Table.qr_code_token == qr_token, Table.is_active == True)
    res = await db.execute(stmt)
    table = res.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired table QR code")
    
    branch_res = await db.execute(select(Branch).where(Branch.id == table.branch_id))
    branch = branch_res.scalar_one()

    rest_res = await db.execute(select(Restaurant).where(Restaurant.id == branch.restaurant_id))
    restaurant = rest_res.scalar_one()

    settings_res = await db.execute(select(RestaurantSettings).where(RestaurantSettings.restaurant_id == restaurant.id))
    rest_settings = settings_res.scalar_one_or_none()

    tax = float(rest_settings.tax_percentage) if rest_settings else 5.0
    service = float(rest_settings.service_charge_percentage) if rest_settings else 0.0

    return TableVerificationResponse(
        valid=True,
        table_id=table.id,
        table_number=table.table_number,
        branch_id=branch.id,
        branch_name=branch.name,
        restaurant_id=restaurant.id,
        restaurant_name=restaurant.name,
        currency=restaurant.currency,
        tax_percentage=tax,
        service_charge_percentage=service
    )

