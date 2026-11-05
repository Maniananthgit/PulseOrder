import uuid
from typing import Dict, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem

router = APIRouter()

class ProductSalesStat(BaseModel):
    product_name: str
    total_quantity: int
    total_sales: float

class DashboardSummaryResponse(BaseModel):
    total_sales: float
    total_orders: int
    completed_orders: int
    preparing_orders: int
    pending_orders: int
    cancelled_orders: int
    top_selling_products: List[ProductSalesStat]

@router.get("/{restaurant_id}/summary", response_model=DashboardSummaryResponse, tags=["Reports"])
async def get_dashboard_summary(
    restaurant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    # Orders count and status breakdown
    stmt = select(Order.status, func.count(Order.id), func.sum(Order.total_amount)).where(
        Order.restaurant_id == restaurant_id
    ).group_by(Order.status)
    res = await db.execute(stmt)
    rows = res.all()

    total_sales = 0.0
    total_orders = 0
    completed = 0
    preparing = 0
    pending = 0
    cancelled = 0

    for status_val, count, amount in rows:
        total_orders += count
        if status_val == OrderStatus.COMPLETED:
            completed += count
            if amount:
                total_sales += float(amount)
        elif status_val == OrderStatus.PREPARING:
            preparing += count
        elif status_val in [OrderStatus.PLACED, OrderStatus.CONFIRMED]:
            pending += count
        elif status_val == OrderStatus.CANCELLED:
            cancelled += count

    # Top selling products
    prod_stmt = (
        select(
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label("qty"),
            func.sum(OrderItem.total_price).label("sales")
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.restaurant_id == restaurant_id, Order.status == OrderStatus.COMPLETED)
        .group_by(OrderItem.product_name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    )
    prod_res = await db.execute(prod_stmt)
    top_products = [
        ProductSalesStat(
            product_name=row[0],
            total_quantity=int(row[1] or 0),
            total_sales=float(row[2] or 0.0)
        )
        for row in prod_res.all()
    ]

    return DashboardSummaryResponse(
        total_sales=round(total_sales, 2),
        total_orders=total_orders,
        completed_orders=completed,
        preparing_orders=preparing,
        pending_orders=pending,
        cancelled_orders=cancelled,
        top_selling_products=top_products
    )

