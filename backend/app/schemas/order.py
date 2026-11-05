import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import OrderStatus, OrderType

class OrderItemAddonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    addon_name: str
    price: float

class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = 1
    special_instructions: Optional[str] = None
    addon_ids: Optional[List[uuid.UUID]] = None

class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: Optional[uuid.UUID]
    product_name: str
    quantity: int
    unit_price: float
    total_price: float
    special_instructions: Optional[str] = None
    addons: List[OrderItemAddonResponse] = []

class OrderCreate(BaseModel):
    restaurant_id: uuid.UUID
    branch_id: uuid.UUID
    table_id: Optional[uuid.UUID] = None
    order_type: OrderType = OrderType.DINE_IN
    notes: Optional[str] = None
    items: List[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    restaurant_id: uuid.UUID
    branch_id: uuid.UUID
    table_id: Optional[uuid.UUID]
    order_number: str
    status: OrderStatus
    order_type: OrderType
    subtotal: float
    tax_amount: float
    service_charge: float
    total_amount: float
    notes: Optional[str]
    placed_at: datetime
    items: List[OrderItemResponse] = []

