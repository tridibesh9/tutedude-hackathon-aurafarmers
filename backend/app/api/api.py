# app/api/v1/api.py (Corrected)
from fastapi import APIRouter
from app.api.endpoints import login, users, register, order, product, inventory

api_router_v1 = APIRouter()

api_router_v1.include_router(login.router, tags=["Authentication"])
api_router_v1.include_router(register.router, tags=["Registration"])
api_router_v1.include_router(users.router, tags=["User Profile"])
api_router_v1.include_router(order.router, prefix="/order", tags=["Orders"])
api_router_v1.include_router(product.router, prefix="/product", tags=["Products"])
api_router_v1.include_router(inventory.router, prefix="/inventory", tags=["Inventory Management"])


