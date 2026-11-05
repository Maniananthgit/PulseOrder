import uuid
from typing import TYPE_CHECKING, List
from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import TableStatus

if TYPE_CHECKING:
    from app.models.restaurant import Branch
    from app.models.order import Order


class Table(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "tables"

    branch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("branches.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    table_number: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    qr_code_token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    status: Mapped[TableStatus] = mapped_column(
        Enum(TableStatus, name="table_status_enum", native_enum=True),
        default=TableStatus.AVAILABLE,
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    branch: Mapped["Branch"] = relationship("Branch", back_populates="tables")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="table")

