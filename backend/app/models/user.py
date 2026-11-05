from typing import TYPE_CHECKING, List
from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.restaurant_member import RestaurantMember
    from app.models.restaurant import Restaurant


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum", native_enum=True),
        default=UserRole.CUSTOMER,
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    owned_restaurants: Mapped[List["Restaurant"]] = relationship(
        "Restaurant", back_populates="owner", cascade="all, delete-orphan"
    )
    restaurant_memberships: Mapped[List["RestaurantMember"]] = relationship(
        "RestaurantMember", back_populates="user", cascade="all, delete-orphan"
    )

