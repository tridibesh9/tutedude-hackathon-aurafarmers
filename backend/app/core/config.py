from typing import List, Optional
from pydantic_settings import BaseSettings
import cloudinary
import cloudinary.uploader

class Settings(BaseSettings):
    SECRET_KEY: str = "your_very_secret_key_here_please_change"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Google API Settings for LangChain
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash"
    EMBEDDING_MODEL: str = "models/gemini-embedding-exp-03-07"

    # ScyllaDB Settings
    SCYLLA_HOSTS: List[str] = ["127.0.0.1"]  # Default fallback
    SCYLLA_PORT: int = 9042
    SCYLLA_KEYSPACE: str = "chat_app"
    SCYLLA_USER: Optional[str] = None
    SCYLLA_PASSWORD: Optional[str] = None
    # SCYLLA_LOCAL_DC: Optional[str] = "datacenter1" # Set your local data center

    # Cloudinary settings
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    class Config:
        env_file = ".env" # Uncomment to load from .env file
        env_file_encoding = 'utf-8'

settings = Settings()

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)