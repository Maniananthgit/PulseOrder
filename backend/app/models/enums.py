from enum import Enum

class UserRole(str, Enum):
    PLATFORM_ADMIN = "PLATFORM_ADMIN"
    RESTAURANT_OWNER = "RESTAURANT_OWNER"
    MANAGER = "MANAGER"
    KITCHEN_STAFF = "KITCHEN_STAFF"
    WAITER = "WAITER"
    CUSTOMER = "CUSTOMER"

class OrderStatus(str, Enum):
    PLACED = "PLACED"
    CONFIRMED = "CONFIRMED"
    PREPARING = "PREPARING"
    READY = "READY"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class TableStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    RESERVED = "RESERVED"
    MAINTENANCE = "MAINTENANCE"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    REFUNDED = "REFUNDED"

class OrderType(str, Enum):
    DINE_IN = "DINE_IN"
    TAKEAWAY = "TAKEAWAY"

