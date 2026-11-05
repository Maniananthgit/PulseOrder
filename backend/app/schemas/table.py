import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import TableStatus

class TableBase(BaseModel):
    table_number: str
    capacity: int = 4
    status: TableStatus = TableStatus.AVAILABLE

class TableCreate(TableBase):
    branch_id: uuid.UUID

class TableUpdate(BaseModel):
    table_number: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[TableStatus] = None
    is_active: Optional[bool] = None

class TableResponse(TableBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    branch_id: uuid.UUID
    qr_code_token: str
    is_active: bool
    created_at: datetime

