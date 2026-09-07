from app.routers.auth import router as auth_router
from app.routers.destinations import router as destinations_router
from app.routers.trains import router as trains_router
from app.routers.bookings import router as bookings_router

__all__ = [
    "auth_router",
    "destinations_router",
    "trains_router",
    "bookings_router"
]
