import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class RestaurantBase(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    currency: str = "USD"

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None

class RestaurantResponse(RestaurantBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    is_active: bool
    created_at: datetime

class BranchBase(BaseModel):
    name: str
    address: str
    phone: str

class BranchCreate(BranchBase):
    restaurant_id: uuid.UUID

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class BranchResponse(BranchBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    restaurant_id: uuid.UUID
    is_active: bool
    created_at: datetime

