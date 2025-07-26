from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import BaseUserResponse, BaseUserInDB, BuyerResponse, SellerResponse
from app.db.crud import get_buyer_profile, get_seller_profile, get_user_type
from app.core.security import get_current_user
from app.db.database import get_db_session

router = APIRouter()

@router.get("/user/profile", response_model=BaseUserResponse)
async def read_user_profile(
    current_user: Annotated[BaseUserInDB, Depends(get_current_user)]
):
    """Get basic user profile information."""
    return BaseUserResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        mobile_number=current_user.mobile_number,
        created_at=current_user.created_at
    )

@router.get("/user/type")
async def get_user_type_endpoint(
    current_user: Annotated[BaseUserInDB, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)]
):
    """Get user type (buyer, seller, both, or none)."""
    user_type = await get_user_type(db, current_user.user_id)
    return {"user_type": user_type}

@router.get("/buyer/profile", response_model=BuyerResponse)
async def read_buyer_profile(
    current_user: Annotated[BaseUserInDB, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)]
):
    """Get buyer profile information."""
    buyer = await get_buyer_profile(db, current_user.user_id)
    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buyer profile not found"
        )
    return buyer

@router.get("/seller/profile", response_model=SellerResponse)
async def read_seller_profile(
    current_user: Annotated[BaseUserInDB, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)]
):
    """Get seller profile information."""
    seller = await get_seller_profile(db, current_user.user_id)
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller profile not found"
        )
    return seller