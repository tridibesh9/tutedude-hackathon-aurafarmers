import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.db.models import (
    BaseUser, Buyer, Seller, Product, Order, OrderItem, Rating,
    UserRegister, BaseUserCreate, BuyerCreate, SellerCreate
)
from app.core.password import get_password_hash

# --- Base User CRUD ---

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[BaseUser]:
    """Get user by email."""
    result = await db.execute(select(BaseUser).where(BaseUser.email == email))
    return result.scalar_one_or_none()

async def get_user_by_mobile(db: AsyncSession, mobile_number: str) -> Optional[BaseUser]:
    """Get user by mobile number."""
    result = await db.execute(select(BaseUser).where(BaseUser.mobile_number == mobile_number))
    return result.scalar_one_or_none()

async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[BaseUser]:
    """Get user by ID."""
    result = await db.execute(select(BaseUser).where(BaseUser.user_id == user_id))
    return result.scalar_one_or_none()

async def create_user_account(db: AsyncSession, user_data: UserRegister) -> BaseUser:
    """Create a new user account with buyer/seller profiles."""
    # Create base user
    hashed_password = get_password_hash(user_data.password)
    base_user = BaseUser(
        email=user_data.email,
        mobile_number=user_data.mobile_number,
        password_hash=hashed_password
    )
    db.add(base_user)
    await db.flush()  # Get the user_id without committing
    
    # Create buyer profile if needed
    if user_data.user_type in ["buyer", "both"]:
        buyer = Buyer(
            user_id=base_user.user_id,
            shipping_address=user_data.shipping_address,
            shipping_pincode=user_data.shipping_pincode
        )
        db.add(buyer)
    
    # Create seller profile if needed
    if user_data.user_type in ["seller", "both"]:
        seller = Seller(
            user_id=base_user.user_id,
            seller_address=user_data.seller_address,
            seller_pincode=user_data.seller_pincode
        )
        db.add(seller)
    
    await db.commit()
    await db.refresh(base_user)
    return base_user

async def get_user_type(db: AsyncSession, user_id: uuid.UUID) -> str:
    """Determine if user is buyer, seller, or both."""
    buyer_result = await db.execute(select(Buyer).where(Buyer.user_id == user_id))
    seller_result = await db.execute(select(Seller).where(Seller.user_id == user_id))
    
    has_buyer = buyer_result.scalar_one_or_none() is not None
    has_seller = seller_result.scalar_one_or_none() is not None
    
    if has_buyer and has_seller:
        return "both"
    elif has_buyer:
        return "buyer"
    elif has_seller:
        return "seller"
    else:
        return "none"

# --- Buyer CRUD ---

async def get_buyer_profile(db: AsyncSession, user_id: uuid.UUID) -> Optional[Buyer]:
    """Get buyer profile."""
    result = await db.execute(select(Buyer).where(Buyer.user_id == user_id))
    return result.scalar_one_or_none()

async def update_buyer_profile(db: AsyncSession, user_id: uuid.UUID, buyer_data: BuyerCreate) -> Optional[Buyer]:
    """Update buyer profile."""
    result = await db.execute(select(Buyer).where(Buyer.user_id == user_id))
    buyer = result.scalar_one_or_none()
    
    if not buyer:
        return None
    
    buyer.shipping_address = buyer_data.shipping_address
    buyer.shipping_pincode = buyer_data.shipping_pincode
    
    await db.commit()
    await db.refresh(buyer)
    return buyer

# --- Seller CRUD ---

async def get_seller_profile(db: AsyncSession, user_id: uuid.UUID) -> Optional[Seller]:
    """Get seller profile."""
    result = await db.execute(select(Seller).where(Seller.user_id == user_id))
    return result.scalar_one_or_none()

async def update_seller_profile(db: AsyncSession, user_id: uuid.UUID, seller_data: SellerCreate) -> Optional[Seller]:
    """Update seller profile."""
    result = await db.execute(select(Seller).where(Seller.user_id == user_id))
    seller = result.scalar_one_or_none()
    
    if not seller:
        return None
    
    seller.seller_address = seller_data.seller_address
    seller.seller_pincode = seller_data.seller_pincode
    
    await db.commit()
    await db.refresh(seller)
    return seller

# --- Product CRUD ---

async def get_products_by_seller(db: AsyncSession, seller_id: uuid.UUID) -> List[Product]:
    """Get all products by a seller."""
    result = await db.execute(select(Product).where(Product.seller_id == seller_id))
    return result.scalars().all()

async def get_products_by_category(db: AsyncSession, category: str, limit: int = 50) -> List[Product]:
    """Get products by category."""
    result = await db.execute(
        select(Product)
        .where(Product.category == category)
        .limit(limit)
    )
    return result.scalars().all()

async def get_product_by_id(db: AsyncSession, product_id: uuid.UUID) -> Optional[Product]:
    """Get product by ID."""
    result = await db.execute(select(Product).where(Product.product_id == product_id))
    return result.scalar_one_or_none()

# Legacy function names for backward compatibility
async def get_user_from_db(db: AsyncSession, username: str) -> Optional[BaseUser]:
    """Legacy function name - get user by email (changed from username)."""
    return await get_user_by_email(db, username)

async def create_user_in_db(db: AsyncSession, user: UserRegister) -> BaseUser:
    """Legacy function name - create user."""
    return await create_user_account(db, user)
