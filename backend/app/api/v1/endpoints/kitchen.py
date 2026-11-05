import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem
from app.schemas.order import OrderResponse
from app.services.order_service import update_order_status
from app.services.websocket_manager import ws_manager

router = APIRouter()

NEXT_STATUS = {
    OrderStatus.PLACED: OrderStatus.CONFIRMED,
    OrderStatus.CONFIRMED: OrderStatus.PREPARING,
    OrderStatus.PREPARING: OrderStatus.READY,
    OrderStatus.READY: OrderStatus.COMPLETED,
}

@router.get("/{branch_id}/tickets", response_model=List[OrderResponse], tags=["Kitchen"])
async def get_active_kitchen_tickets(
    branch_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    active_statuses = [
        OrderStatus.PLACED,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY
    ]
    stmt = (
        select(Order)
        .where(
            Order.branch_id == branch_id,
            Order.status.in_(active_statuses)
        )
        .options(
            selectinload(Order.items).selectinload(OrderItem.addons),
            selectinload(Order.status_history)
        )
        .order_by(Order.placed_at.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.post("/{branch_id}/tickets/{order_id}/advance", response_model=OrderResponse, tags=["Kitchen"])
async def advance_kitchen_ticket(
    branch_id: uuid.UUID,
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order).where(Order.id == order_id, Order.branch_id == branch_id)
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order ticket not found")

    next_st = NEXT_STATUS.get(order.status)
    if not next_st:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot advance order from '{order.status.value}'")

    updated = await update_order_status(
        db=db,
        order_id=order.id,
        new_status=next_st,
        notes="Advanced by Kitchen Display"
    )

    # Real-time WebSocket broadcast
    event = {
        "event": "ORDER_STATUS_CHANGED",
        "order_id": str(updated.id),
        "order_number": updated.order_number,
        "status": updated.status.value,
        "notes": "Advanced by Kitchen Display"
    }
    await ws_manager.broadcast(f"kitchen:{branch_id}", event)
    await ws_manager.broadcast(f"management:{updated.restaurant_id}", event)
    if updated.table_id:
        await ws_manager.broadcast(f"table:{updated.table_id}", event)

    return updated

