import uuid
from typing import TYPE_CHECKING, List
from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.restaurant_member import RestaurantMember
    from app.models.table import Table
    from app.models.menu import Category, Product
    from app.models.order import Order
    from app.models.settings import RestaurantSettings


class Restaurant(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "restaurants"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="owned_restaurants")
    branches: Mapped[List["Branch"]] = relationship("Branch", back_populates="restaurant", cascade="all, delete-orphan")
    members: Mapped[List["RestaurantMember"]] = relationship("RestaurantMember", back_populates="restaurant", cascade="all, delete-orphan")
    categories: Mapped[List["Category"]] = relationship("Category", back_populates="restaurant", cascade="all, delete-orphan")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="restaurant", cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="restaurant", cascade="all, delete-orphan")
    settings: Mapped["RestaurantSettings | None"] = relationship("RestaurantSettings", back_populates="restaurant", uselist=False, cascade="all, delete-orphan")


class Branch(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "branches"

    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="branches")
    tables: Mapped[List["Table"]] = relationship("Table", back_populates="branch", cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="branch", cascade="all, delete-orphan")
    members: Mapped[List["RestaurantMember"]] = relationship("RestaurantMember", back_populates="branch")

