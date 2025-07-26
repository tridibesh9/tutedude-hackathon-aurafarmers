import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.scylla import connect_to_scylla, close_scylla_connection
from app.api.api import api_router_v1


# Import LLM dependencies
# from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

from app.db.crud import get_user_from_db, create_user_in_scylla, get_bots_from_db, create_bot_in_scylla
from app.db.models import UserCreate, BotCreate
from app.db.scylla import scylla_session_global # Direct access for seeding

app = FastAPI(
    title="Chatbot Backend API with ScyllaDB (Modularized)",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if hasattr(settings, 'API_V1_STR') else "/api/v1/openapi.json"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://personaforge.space",
        "http://personaforge.space",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,  # Enable credentials for specific origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

API_V1_PREFIX = "/api/v1"

app.include_router(api_router_v1, prefix=API_V1_PREFIX)


