from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    environment: str
    database: str = "connected"

class GenericResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class PaginatedResponse(BaseModel, Generic[T]):
    total: int
    items: List[T]
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

