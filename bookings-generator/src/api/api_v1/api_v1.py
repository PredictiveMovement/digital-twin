from fastapi import APIRouter
from api.api_v1.endpoints import bookings


api_router_v1 = APIRouter()
api_router_v1.include_router(bookings.router)
