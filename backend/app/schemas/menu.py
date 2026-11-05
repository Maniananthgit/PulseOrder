import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class AddonBase(BaseModel):
    name: str
    price: float = 0.0
    is_available: bool = True

class AddonCreate(AddonBase):
    pass

class AddonResponse(AddonBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_price: float
    is_veg: bool = True
    is_available: bool = True
    image_url: Optional[str] = None
    sort_order: int = 0

class ProductCreate(ProductBase):
    category_id: uuid.UUID
    addons: Optional[List[AddonCreate]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    is_veg: Optional[bool] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None
    sort_order: Optional[int] = None

class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    restaurant_id: uuid.UUID
    category_id: uuid.UUID
    addons: List[AddonResponse] = []
    created_at: datetime

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    sort_order: int = 0

class CategoryCreate(CategoryBase):
    restaurant_id: uuid.UUID

class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    restaurant_id: uuid.UUID
    is_active: bool
    created_at: datetime

class CategoryWithProductsResponse(CategoryResponse):
    products: List[ProductResponse] = []
