from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    role: str
    restaurant_id: Optional[str] = None
    branch_id: Optional[str] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    restaurant_id: Optional[str] = None
    branch_id: Optional[str] = None
    type: Optional[str] = None

