from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.db.models import UserRegister, BaseUserResponse
from app.db.database import get_db_session

router = APIRouter()

@router.post("/register", response_model=dict)
async def register_user(
    user_data: UserRegister,
    db: Annotated[AsyncSession, Depends(get_db_session)]
):
    """
    Register a new user as buyer, seller, or both.
    """
    from app.db.crud import get_user_by_email, get_user_by_mobile, create_user_account
    
    # Check if email already exists
    existing_email = await get_user_by_email(db, user_data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check if mobile number already exists
    existing_mobile = await get_user_by_mobile(db, user_data.mobile_number)
    if existing_mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number already registered",
        )

    # Create the user account with buyer/seller profiles
    user = await create_user_account(db, user_data)

    return {
        "message": f"User registered successfully as {user_data.user_type}",
        "user_id": str(user.user_id),
        "email": user.email,
        "user_type": user_data.user_type
    }