# app/api/v1/api.py (Corrected)
from fastapi import APIRouter
from app.api.endpoints import login, users, bots, register, chat_ai, bot_management

api_router_v1 = APIRouter()

api_router_v1.include_router(login.router, tags=["Authentication"])
api_router_v1.include_router(register.router, tags=["Registration"])
api_router_v1.include_router(users.router, tags=["User Profile"])


