from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from cassandra.cluster import Session
import uuid # Good for user IDs if you change the schema later

# Make sure you have passlib installed: pip install "passlib[bcrypt]"
from passlib.context import CryptContext

from app.db.models import UserInDB
from app.db.crud import get_user_from_db
from app.db.scylla import get_scylla_session

# --- Place this security context object somewhere central, like core/security.py ---
# 1. Create a password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)
# ----------------------------------------------------------------------------------

# Add a request model for JSON input
from pydantic import BaseModel

class UserRegisterRequest(BaseModel):
    username: str
    password: str
    email: str
    full_name: str

router = APIRouter()

@router.post("/register")
async def register_user(
    user_data: UserRegisterRequest,
    session: Annotated[Session, Depends(get_scylla_session)]
):
    """
    Register a new user.
    """
    # Check if the user already exists
    existing_user = get_user_from_db(session, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    # 3. Securely hash the password
    hashed_password = hash_password(user_data.password)
    
    # We don't need to create a Pydantic model here, we can insert directly
    # Note: Scylla/Cassandra set collections expect a Python `set` or `list`
    # Note: `metadata` was missing from your INSERT statement. I've removed it for simplicity.
    #       If you need it, add it to the Form and the INSERT query.
    
    # 4. Prepare and execute the query
    cql_query = """
    INSERT INTO users (username, email, full_name, hashed_password, date_created, chatted_bot_names)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    session.execute(
        cql_query,
        (user_data.username, user_data.email, user_data.full_name, hashed_password, datetime.now(), set()) # Use datetime.now()
    )

    return {"message": f"User '{user_data.username}' registered successfully"}