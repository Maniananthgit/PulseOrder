import datetime
import uuid
from decimal import Decimal
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.enums import OrderStatus, OrderType
from app.models.menu import Product, ProductAddon
from app.models.order import Order, OrderItem, OrderItemAddon, OrderStatusHistory
from app.models.restaurant import Branch, Restaurant
from app.models.settings import RestaurantSettings
from app.models.table import Table
from app.schemas.order import OrderCreate, OrderStatusUpdate

VALID_STATUS_TRANSITIONS = {
    OrderStatus.PLACED: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    OrderStatus.CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    OrderStatus.PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
    OrderStatus.READY: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    OrderStatus.COMPLETED: [],
    OrderStatus.CANCELLED: [],
}

async def generate_order_number(db: AsyncSession, branch_id: uuid.UUID) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    date_prefix = now.strftime("%Y%m%d")
    random_code = uuid.uuid4().hex[:4].upper()
    return f"ORD-{date_prefix}-{random_code}"

async def create_new_order(db: AsyncSession, order_in: OrderCreate) -> Order:
    if not order_in.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must contain at least one item")

    # 1. Validate restaurant & branch
    branch_stmt = select(Branch).where(
        Branch.id == order_in.branch_id,
        Branch.restaurant_id == order_in.restaurant_id,
        Branch.is_active == True
    )
    branch_res = await db.execute(branch_stmt)
    branch = branch_res.scalar_one_or_none()
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found or inactive")

    # 2. Validate table if dine-in
    if order_in.table_id:
        table_stmt = select(Table).where(
            Table.id == order_in.table_id,
            Table.branch_id == order_in.branch_id,
            Table.is_active == True
        )
        table_res = await db.execute(table_stmt)
        if not table_res.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found for this branch")

    # 3. Fetch tax & service settings
    settings_stmt = select(RestaurantSettings).where(RestaurantSettings.restaurant_id == order_in.restaurant_id)
    settings_res = await db.execute(settings_stmt)
    rest_settings = settings_res.scalar_one_or_none()
    tax_pct = float(rest_settings.tax_percentage) if rest_settings else 5.0
    service_pct = float(rest_settings.service_charge_percentage) if rest_settings else 0.0

    # 4. Process line items and compute totals securely
    subtotal = 0.0
    order_items_to_create = []

    for item_in in order_in.items:
        if item_in.quantity < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item quantity must be at least 1")

        # Fetch product
        prod_stmt = select(Product).where(
            Product.id == item_in.product_id,
            Product.restaurant_id == order_in.restaurant_id
        ).options(selectinload(Product.addons))
        prod_res = await db.execute(prod_stmt)
        product = prod_res.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {item_in.product_id} not found")
        if not product.is_available:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product '{product.name}' is currently unavailable")

        unit_price = float(product.base_price)
        item_addons_to_create = []
        addons_total = 0.0

        if item_in.addon_ids:
            addon_map = {a.id: a for a in product.addons if a.is_available}
            for addon_id in item_in.addon_ids:
                if addon_id not in addon_map:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Add-on {addon_id} not valid or unavailable")
                addon = addon_map[addon_id]
                addon_price = float(addon.price)
                addons_total += addon_price
                item_addons_to_create.append(OrderItemAddon(
                    addon_name=addon.name,
                    price=addon_price
                ))

        item_unit_total = unit_price + addons_total
        item_total = item_unit_total * item_in.quantity
        subtotal += item_total

        order_item = OrderItem(
            product_id=product.id,
            product_name=product.name,
            quantity=item_in.quantity,
            unit_price=item_unit_total,
            total_price=item_total,
            special_instructions=item_in.special_instructions,
            addons=item_addons_to_create
        )
        order_items_to_create.append(order_item)

    # 5. Financial computations (Banker's rounding to 2 decimals)
    tax_amount = round(subtotal * (tax_pct / 100.0), 2)
    service_charge = round(subtotal * (service_pct / 100.0), 2)
    total_amount = round(subtotal + tax_amount + service_charge, 2)
    order_num = await generate_order_number(db, order_in.branch_id)

    order = Order(
        restaurant_id=order_in.restaurant_id,
        branch_id=order_in.branch_id,
        table_id=order_in.table_id,
        order_number=order_num,
        status=OrderStatus.PLACED,
        order_type=order_in.order_type,
        subtotal=subtotal,
        tax_amount=tax_amount,
        service_charge=service_charge,
        total_amount=total_amount,
        notes=order_in.notes,
        items=order_items_to_create,
        status_history=[
            OrderStatusHistory(
                from_status=None,
                to_status=OrderStatus.PLACED,
                notes="Order placed by customer"
            )
        ]
    )

    db.add(order)
    await db.commit()

    # Reload full order with items and addons
    reload_stmt = (
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.addons),
            selectinload(Order.status_history)
        )
    )
    result = await db.execute(reload_stmt)
    return result.scalar_one()

async def update_order_status(
    db: AsyncSession,
    order_id: uuid.UUID,
    new_status: OrderStatus,
    changed_by_user_id: Optional[uuid.UUID] = None,
    notes: Optional[str] = None
) -> Order:
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

    # Validate state transition
    allowed = VALID_STATUS_TRANSITIONS.get(order.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition order from '{order.status.value}' to '{new_status.value}'"
        )

    old_status = order.status
    order.status = new_status

    history = OrderStatusHistory(
        order_id=order.id,
        from_status=old_status,
        to_status=new_status,
        changed_by_user_id=changed_by_user_id,
        notes=notes
    )
    db.add(history)
    await db.commit()

    # Re-fetch with eager loaded relationships to avoid MissingGreenlet on expired attributes
    reload_stmt = (
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.addons),
            selectinload(Order.status_history)
        )
    )
    result = await db.execute(reload_stmt)
    return result.scalar_one()
