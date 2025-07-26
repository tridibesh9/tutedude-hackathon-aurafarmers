from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from cassandra.cluster import Session
from app.core.security import get_current_user
from app.core.security import create_access_token
from app.core.password import verify_password 
from app.core.config import settings
from app.db.models import Token, UserInDB
from app.db.crud import get_user_from_db
from app.db.scylla import get_scylla_session

class LoginRequest(BaseModel):
    username: str
    password: str

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_for_access_token(
    login_data: LoginRequest,
    session: Annotated[Session, Depends(get_scylla_session)]
):
    user = get_user_from_db(session, login_data.username)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/verify-token")
async def verify_token(
    current_user: Annotated[UserInDB, Depends(get_current_user)]
):
    """
    Verify if the provided JWT token is valid and return user info.
    This endpoint is useful for frontend apps to check token validity on reload.
    """
    return {
        "valid": True,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name
    }