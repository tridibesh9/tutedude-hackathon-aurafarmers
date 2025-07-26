from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.core.security import create_access_token
from app.core.password import verify_password 
from app.core.config import settings
from app.db.models import Token, UserLogin, BaseUserInDB
from app.db.database import get_db_session

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_for_access_token(
    login_data: UserLogin,
    db: Annotated[AsyncSession, Depends(get_db_session)]
):
    from app.db.crud import get_user_by_email, get_user_type
    
    # Find user by email
    user = await get_user_by_email(db, login_data.email)
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Determine user type (buyer, seller, or both)
    user_type = await get_user_type(db, user.user_id)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.user_id)}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_type": user_type
    }


@router.get("/verify-token")
async def verify_token(
    current_user: Annotated[BaseUserInDB, Depends(get_current_user)]
):
    """
    Verify if the provided JWT token is valid and return user info.
    This endpoint is useful for frontend apps to check token validity on reload.
    """
    return {
        "valid": True,
        "user_id": str(current_user.user_id),
        "email": current_user.email,
        "mobile_number": current_user.mobile_number
    }