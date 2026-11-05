import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.dependencies.auth import get_current_user, require_roles, verify_restaurant_access
from app.models.enums import OrderStatus, UserRole
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.order_service import create_new_order, update_order_status
from app.services.websocket_manager import ws_manager

router = APIRouter()

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Orders"])
async def place_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db)
):
    order = await create_new_order(db, order_in)
    
    # Broadcast to Kitchen and Management WebSockets
    event = {
        "event": "NEW_ORDER",
        "order_id": str(order.id),
        "order_number": order.order_number,
        "branch_id": str(order.branch_id),
        "table_id": str(order.table_id) if order.table_id else None,
        "status": order.status.value,
        "total_amount": float(order.total_amount),
        "items_count": len(order.items),
    }
    await ws_manager.broadcast(f"kitchen:{order.branch_id}", event)
    await ws_manager.broadcast(f"management:{order.restaurant_id}", event)
    if order.table_id:
        await ws_manager.broadcast(f"table:{order.table_id}", event)

    return order

@router.get("/", response_model=List[OrderResponse], tags=["Orders"])
async def list_orders(
    restaurant_id: uuid.UUID = Query(...),
    branch_id: Optional[uuid.UUID] = Query(None),
    status: Optional[OrderStatus] = Query(None),
    table_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Order)
        .where(Order.restaurant_id == restaurant_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.addons),
            selectinload(Order.status_history)
        )
        .order_by(Order.created_at.desc())
    )
    if branch_id:
        stmt = stmt.where(Order.branch_id == branch_id)
    if status:
        stmt = stmt.where(Order.status == status)
    if table_id:
        stmt = stmt.where(Order.table_id == table_id)

    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.get("/{order_id}", response_model=OrderResponse, tags=["Orders"])
async def get_order_details(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.addons),
            selectinload(Order.status_history)
        )
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order

@router.patch("/{order_id}/status", response_model=OrderResponse, tags=["Orders"])
async def change_order_status(
    order_id: uuid.UUID,
    update_in: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    order = await update_order_status(
        db=db,
        order_id=order_id,
        new_status=update_in.status,
        notes=update_in.notes
    )

    # Real-time WebSocket broadcast
    event = {
        "event": "ORDER_STATUS_CHANGED",
        "order_id": str(order.id),
        "order_number": order.order_number,
        "status": order.status.value,
        "notes": update_in.notes
    }
    await ws_manager.broadcast(f"kitchen:{order.branch_id}", event)
    await ws_manager.broadcast(f"management:{order.restaurant_id}", event)
    if order.table_id:
        await ws_manager.broadcast(f"table:{order.table_id}", event)

    return order

