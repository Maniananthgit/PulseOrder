from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    health,
    kitchen,
    menu,
    orders,
    reports,
    restaurants,
    staff,
    tables,
    websocket,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(restaurants.router, prefix="/restaurants")
api_router.include_router(staff.router, prefix="/restaurants")
api_router.include_router(menu.router, prefix="/restaurants")
api_router.include_router(tables.router, prefix="/restaurants")
api_router.include_router(tables.router, prefix="/tables")
api_router.include_router(orders.router, prefix="/orders")
api_router.include_router(kitchen.router, prefix="/kitchen")
api_router.include_router(reports.router, prefix="/reports")
api_router.include_router(websocket.router)
