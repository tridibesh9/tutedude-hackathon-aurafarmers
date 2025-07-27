import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import create_tables, close_db_connection
from app.api.api import api_router_v1

# Import LLM dependencies
# from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("--- Starting FastAPI Server with PostgreSQL Integration ---")
    await create_tables()
    print("Database tables created successfully")
    yield
    # Shutdown
    print("--- Shutting down FastAPI Server ---")
    await close_db_connection()
    print("Database connection closed")

app = FastAPI(
    title="Saathi E-commerce Backend API",
    description="E-commerce platform backend with PostgreSQL",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if hasattr(settings, 'API_V1_STR') else "/api/v1/openapi.json",
    lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,  # Enable credentials for specific origins
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1_PREFIX = "/api/v1"

app.include_router(api_router_v1, prefix=API_V1_PREFIX)


