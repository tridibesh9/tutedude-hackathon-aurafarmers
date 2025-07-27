import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.db.models import (
    BaseUser,
    Buyer,
    Seller,
    Product,
    Order,
    OrderItem,
    ProductRating,
    SellerRating,
    Inventory,
    UserRegister,
    BaseUserCreate,
    BuyerCreate,
    SellerCreate,
)
from app.core.password import get_password_hash

# --- Base User CRUD ---


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[BaseUser]:
    """Get user by email."""
    result = await db.execute(select(BaseUser).where(BaseUser.email == email))
    return result.scalar_one_or_none()


async def get_user_by_mobile(
    db: AsyncSession, mobile_number: str
) -> Optional[BaseUser]:
    """Get user by mobile number."""
    result = await db.execute(
        select(BaseUser).where(BaseUser.mobile_number == mobile_number)
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[BaseUser]:
    """Get user by ID."""
    result = await db.execute(select(BaseUser).where(BaseUser.user_id == user_id))
    return result.scalar_one_or_none()


async def create_user_account(db: AsyncSession, user_data: UserRegister) -> BaseUser:
    """Create a new user account with buyer/seller profiles based on user_type."""

    # Create base user
    hashed_password = get_password_hash(user_data.password)
    base_user = BaseUser(
        email=user_data.email,
        mobile_number=user_data.mobile_number,
        password_hash=hashed_password,
    )

    db.add(base_user)
    await db.flush()  # Flush to get the user_id

    # Create buyer profile if needed
    if user_data.user_type in ["buyer", "both"]:
        buyer = Buyer(
            user_id=base_user.user_id,
            shipping_address=user_data.shipping_address,
            shipping_pincode=user_data.shipping_pincode,
        )
        db.add(buyer)

    # Create seller profile if needed
    if user_data.user_type in ["seller", "both"]:
        seller = Seller(
            user_id=base_user.user_id,
            seller_address=user_data.seller_address,
            seller_pincode=user_data.seller_pincode,
        )
        db.add(seller)

    await db.commit()
    await db.refresh(base_user)
    return base_user


async def get_user_type(db: AsyncSession, user_id: uuid.UUID) -> str:
    """Determine if user is buyer, seller, or both."""
    buyer_result = await db.execute(select(Buyer).where(Buyer.user_id == user_id))
    seller_result = await db.execute(select(Seller).where(Seller.user_id == user_id))

    is_buyer = buyer_result.scalar_one_or_none() is not None
    is_seller = seller_result.scalar_one_or_none() is not None

    if is_buyer and is_seller:
        return "both"
    elif is_buyer:
        return "buyer"
    elif is_seller:
        return "seller"
    else:
        return "none"


async def get_buyer_profile(db: AsyncSession, user_id: uuid.UUID) -> Optional[Buyer]:
    """Get buyer profile by user ID."""
    result = await db.execute(select(Buyer).where(Buyer.user_id == user_id))
    return result.scalar_one_or_none()


async def get_seller_profile(db: AsyncSession, user_id: uuid.UUID) -> Optional[Seller]:
    """Get seller profile by user ID."""
    result = await db.execute(select(Seller).where(Seller.user_id == user_id))
    return result.scalar_one_or_none()


# --- Product CRUD ---


async def create_product(
    db: AsyncSession, product_data: dict, seller_id: uuid.UUID
) -> Product:
    """Create a new product."""
    product = Product(seller_id=seller_id, **product_data)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def get_products_by_seller(
    db: AsyncSession, seller_id: uuid.UUID
) -> List[Product]:
    """Get all products by a seller."""
    result = await db.execute(select(Product).where(Product.seller_id == seller_id))
    return result.scalars().all()


# --- Order CRUD ---


async def create_order(
    db: AsyncSession, order_data: dict, buyer_id: uuid.UUID
) -> Order:
    """Create a new order."""
    order = Order(buyer_id=buyer_id, **order_data)
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


# --- Rating CRUD ---


async def create_product_rating(
    db: AsyncSession, rating_data: dict, buyer_id: uuid.UUID
) -> ProductRating:
    """Create a product rating."""
    rating = ProductRating(buyer_id=buyer_id, **rating_data)
    db.add(rating)
    await db.commit()
    await db.refresh(rating)
    return rating


async def create_seller_rating(
    db: AsyncSession, rating_data: dict, buyer_id: uuid.UUID
) -> SellerRating:
    """Create a seller rating."""
    rating = SellerRating(buyer_id=buyer_id, **rating_data)
    db.add(rating)
    await db.commit()
    await db.refresh(rating)
    return rating


# --- Inventory CRUD ---


async def create_inventory(
    db: AsyncSession, inventory_data: dict, user_id: uuid.UUID
) -> Inventory:
    """Create inventory for a product."""
    inventory = Inventory(user_id=user_id, **inventory_data)
    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)
    return inventory


# Surplus Inventory CRUD
async def mark_inventory_surplus(db: AsyncSession, inventory_id: str, seller_id: str):
    result = await db.execute(
        select(Inventory).where(
            Inventory.inventory_id == inventory_id, Inventory.user_id == seller_id
        )
    )
    inventory = result.scalar_one_or_none()
    if not inventory:
        raise Exception("Inventory batch not found or not owned by seller")
    # inventory.is_surplus = True
    await db.commit()
    await db.refresh(inventory)
    return inventory


async def update_surplus_discount(
    db: AsyncSession, inventory_id: str, seller_id: str, discount: float
):
    result = await db.execute(
        select(Inventory).where(
            Inventory.inventory_id == inventory_id,
            Inventory.user_id == seller_id,
            # Inventory.is_surplus,
        )
    )
    inventory = result.scalar_one_or_none()
    if not inventory:
        raise Exception("Surplus inventory batch not found or not owned by seller")
    inventory.discount = discount
    await db.commit()
    await db.refresh(inventory)
    return inventory


async def get_my_surplus_items(db: AsyncSession, seller_id: str):
    result = await db.execute(
        # select(Inventory).where(Inventory.user_id == seller_id, Inventory.is_surplus)
    )
    return result.scalars().all()


async def get_surplus_items(db: AsyncSession):
    # result = await db.execute(select(Inventory).where(Inventory.is_surplus))
    result = []
    return result.scalars().all()


async def buy_surplus_item(db: AsyncSession, inventory_id: str, buyer_id: str):
    result = await db.execute(
        select(Inventory).where(
            # Inventory.inventory_id == inventory_id, Inventory.is_surplus
        )
    )
    inventory = result.scalar_one_or_none()
    if not inventory or inventory.quantity <= 0:
        raise Exception("Surplus item not available")
    # For demo: reduce quantity by 1 and return
    inventory.quantity -= 1
    await db.commit()
    await db.refresh(inventory)
    return inventory


async def get_inventory_by_product(
    db: AsyncSession, product_id: uuid.UUID
) -> Optional[Inventory]:
    """Get inventory for a specific product."""
    result = await db.execute(
        select(Inventory).where(Inventory.product_id == product_id)
    )
    return result.scalar_one_or_none()
