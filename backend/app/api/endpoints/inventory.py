from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from typing import List, Optional
from datetime import date
from decimal import Decimal

from app.db.database import get_db_session
from app.db.models import (
    Inventory, Product, BaseUser, Seller,
    InventoryCreate, InventoryUpdate, InventoryResponse
)
from app.core.security import get_current_user

router = APIRouter()

# Surplus Endpoints for Seller
@router.post("/mark-surplus/{inventory_id}")
async def mark_inventory_surplus(
    inventory_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Mark an inventory batch as surplus (if near expiry).
    """
    # Check if user is a seller
    seller_result = await db.execute(select(Seller).where(Seller.user_id == current_user.user_id))
    seller = seller_result.scalar_one_or_none()
    if not seller:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only sellers can manage inventory")
    # Get inventory batch
    inventory_result = await db.execute(select(Inventory).where(and_(Inventory.inventory_id == inventory_id, Inventory.user_id == current_user.user_id)))
    inventory = inventory_result.scalar_one_or_none()
    if not inventory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory batch not found")
    inventory.is_surplus = True
    await db.commit()
    await db.refresh(inventory)
    return inventory

@router.post("/update-surplus-discount/{inventory_id}")
async def update_surplus_discount(
    inventory_id: str,
    discount: float,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Update discount for surplus inventory batch.
    """
    seller_result = await db.execute(select(Seller).where(Seller.user_id == current_user.user_id))
    seller = seller_result.scalar_one_or_none()
    if not seller:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only sellers can manage inventory")
    inventory_result = await db.execute(select(Inventory).where(and_(Inventory.inventory_id == inventory_id, Inventory.user_id == current_user.user_id, Inventory.is_surplus == True)))
    inventory = inventory_result.scalar_one_or_none()
    if not inventory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Surplus inventory batch not found")
    inventory.discount = discount
    await db.commit()
    await db.refresh(inventory)
    return inventory

@router.get("/my-surplus-items", response_model=List[InventoryResponse])
async def list_my_surplus_items(
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    List all surplus inventory batches for the current seller.
    """
    seller_result = await db.execute(select(Seller).where(Seller.user_id == current_user.user_id))
    seller = seller_result.scalar_one_or_none()
    if not seller:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only sellers can view inventory")
    query = select(Inventory).where(and_(Inventory.user_id == current_user.user_id, Inventory.is_surplus == True))
    result = await db.execute(query)
    surplus_batches = result.scalars().all()
    return surplus_batches

@router.post("/add", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
async def add_inventory_batch(
    inventory_data: InventoryCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Add a new inventory batch for an existing product.
    Seller can add multiple batches of the same product with different expiry/discount.
    """
    # Check if user is a seller
    seller_result = await db.execute(select(Seller).where(Seller.user_id == current_user.user_id))
    seller = seller_result.scalar_one_or_none()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can manage inventory"
        )
    
    # Verify product exists and belongs to the seller
    product_result = await db.execute(
        select(Product).where(
            and_(
                Product.product_id == inventory_data.product_id,
                Product.seller_id == current_user.user_id
            )
        )
    )
    product = product_result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or you don't own this product"
        )
    
    # Create new inventory batch
    inventory = Inventory(
        product_id=inventory_data.product_id,
        user_id=current_user.user_id,
        quantity=inventory_data.quantity,
        discount=inventory_data.discount,
        expiry_date=inventory_data.expiry_date
    )
    
    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)
    
    return inventory

@router.put("/update/{inventory_id}", response_model=InventoryResponse)
async def update_inventory_batch(
    inventory_id: str,
    inventory_update: InventoryUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Update a specific inventory batch (quantity, discount, expiry).
    """
    # Check if user is a seller
    seller_result = await db.execute(select(Seller).where(Seller.user_id == current_user.user_id))
    seller = seller_result.scalar_one_or_none()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can manage inventory"
        )
    
    # Get inventory batch
    inventory_result = await db.execute(
        select(Inventory).where(
            and_(
                Inventory.inventory_id == inventory_id,
                Inventory.user_id == current_user.user_id
            )
        )
    )
    inventory = inventory_result.scalar_one_or_none()
    
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory batch not found"
        )
    
    # Update fields if provided
    update_data = inventory_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inventory, field, value)
    
    await db.commit()
    await db.refresh(inventory)
    
    return inventory

@router.get("/product/{product_id}", response_model=List[InventoryResponse])
async def get_product_inventory(
    product_id: str,
    show_expired: bool = Query(False, description="Include expired batches"),
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Get all inventory batches for a specific product.
    Shows available quantities, expiry dates, and discounts.
    """
    # Build query
    query = select(Inventory).where(Inventory.product_id == product_id)
    
    # Filter expired batches if requested
    if not show_expired:
        today = date.today()
        query = query.where(
            (Inventory.expiry_date.is_(None)) | (Inventory.expiry_date >= today)
        )
    
    result = await db.execute(query)
    inventory_batches = result.scalars().all()
    
    return inventory_batches

@router.get("/my-inventory", response_model=List[InventoryResponse])
async def get_my_inventory(
    product_name: Optional[str] = Query(None, description="Filter by product name"),
    show_expired: bool = Query(False, description="Include expired batches"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Get all inventory batches for the current seller.
    """
    # Check if user is a seller
    seller_result = await db.execute(select(Seller).where(Seller.user_id == current_user.user_id))
    seller = seller_result.scalar_one_or_none()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can view inventory"
        )
    
    # Build query with joins
    query = select(Inventory).join(Product).where(Inventory.user_id == current_user.user_id)
    
    # Filter by product name if provided
    if product_name:
        query = query.where(Product.name.ilike(f"%{product_name}%"))
    
    # Filter expired batches if requested
    if not show_expired:
        today = date.today()
        query = query.where(
            (Inventory.expiry_date.is_(None)) | (Inventory.expiry_date >= today)
        )
    
    # Add pagination
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    inventory_batches = result.scalars().all()
    
    return inventory_batches

@router.delete("/delete/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_batch(
    inventory_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Delete a specific inventory batch.
    """
    # Check if user is a seller
    seller_result = await db.execute(select(Seller).where(Seller.user_id == current_user.user_id))
    seller = seller_result.scalar_one_or_none()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can manage inventory"
        )
    
    # Get inventory batch
    inventory_result = await db.execute(
        select(Inventory).where(
            and_(
                Inventory.inventory_id == inventory_id,
                Inventory.user_id == current_user.user_id
            )
        )
    )
    inventory = inventory_result.scalar_one_or_none()
    
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory batch not found"
        )
    
    await db.execute(delete(Inventory).where(Inventory.inventory_id == inventory_id))
    await db.commit()
    
    return {"message": "Inventory batch deleted successfully"}

@router.get("/available/{product_id}")
async def get_available_quantity(
    product_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get total available quantity for a product (sum of all non-expired batches).
    """
    today = date.today()
    
    # Get all non-expired inventory batches
    result = await db.execute(
        select(Inventory).where(
            and_(
                Inventory.product_id == product_id,
                Inventory.quantity > 0,
                (Inventory.expiry_date.is_(None)) | (Inventory.expiry_date >= today)
            )
        )
    )
    inventory_batches = result.scalars().all()
    
    total_quantity = sum(batch.quantity for batch in inventory_batches)
    active_batches = len(inventory_batches)
    
    return {
        "product_id": product_id,
        "total_available_quantity": total_quantity,
        "active_batches": active_batches,
        "batches": [
            {
                "inventory_id": str(batch.inventory_id),
                "quantity": batch.quantity,
                "discount": batch.discount,
                "expiry_date": batch.expiry_date.isoformat() if batch.expiry_date else None
            }
            for batch in inventory_batches
        ]
    }