import uuid
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.restaurant import Restaurant


class RestaurantSettings(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "restaurant_settings"

    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False
    )
    tax_percentage: Mapped[float] = mapped_column(Numeric(5, 2), default=5.00, nullable=False)
    service_charge_percentage: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    opening_time: Mapped[str] = mapped_column(String(10), default="09:00", nullable=False)
    closing_time: Mapped[str] = mapped_column(String(10), default="23:00", nullable=False)
    is_ordering_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="settings")

