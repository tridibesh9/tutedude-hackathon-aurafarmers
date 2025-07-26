from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List, Optional
import uuid

from app.db.database import get_db_session
from app.db.models import (
    Product, BaseUser, Seller, Inventory,
    ProductCreate, ProductUpdate, ProductResponse, ProductWithInventoryResponse,
    InventoryResponse
)
from app.core.security import get_current_user

router = APIRouter()

@router.post("/create", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Create a new product.
    Only sellers can create products.
    """
    # Check if user is a seller
    seller_result = await db.execute(select(Seller).where(Seller.user_id == current_user.user_id))
    seller = seller_result.scalar_one_or_none()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can create products"
        )
    
    # Create the product
    new_product = Product(
        seller_id=current_user.user_id,
        name=product_data.name,
        category=product_data.category,
        price=product_data.price
    )
    
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    return new_product

@router.put("/update/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    product_data: ProductUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Update product details.
    Only the seller who owns the product can update it.
    """
    # Get the product
    product_result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = product_result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if current user is the seller of this product
    if product.seller_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own products"
        )
    
    # Update fields that are provided
    update_data = {}
    if product_data.name is not None:
        update_data["name"] = product_data.name
    if product_data.category is not None:
        update_data["category"] = product_data.category
    if product_data.price is not None:
        update_data["price"] = product_data.price
    
    if update_data:
        await db.execute(
            update(Product)
            .where(Product.product_id == product_id)
            .values(**update_data)
        )
        await db.commit()
        await db.refresh(product)
    
    return product

@router.get("/{product_id}", response_model=ProductWithInventoryResponse)
async def get_product_details(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Get details of a particular product including inventory information.
    All authenticated users can view product details.
    """
    # Get the product
    product_result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = product_result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Get inventory information for this product
    inventory_result = await db.execute(
        select(Inventory).where(Inventory.product_id == product_id)
    )
    inventories = inventory_result.scalars().all()
    
    # Convert inventories to response format
    inventory_responses = [
        InventoryResponse(
            inventory_id=inv.inventory_id,
            product_id=inv.product_id,
            user_id=inv.user_id,
            quantity=inv.quantity,
            discount=inv.discount,
            expiry_date=inv.expiry_date,
            created_at=inv.created_at,
            updated_at=inv.updated_at
        )
        for inv in inventories
    ]
    
    return ProductWithInventoryResponse(
        product_id=product.product_id,
        seller_id=product.seller_id,
        name=product.name,
        category=product.category,
        price=product.price,
        rating=product.rating,
        created_at=product.created_at,
        inventories=inventory_responses
    )

@router.get("/", response_model=List[ProductWithInventoryResponse])
async def get_all_products(
    skip: int = Query(0, ge=0, description="Number of products to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of products to return"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    seller_only: bool = Query(False, description="Get only current user's products (seller only)"),
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Get all products with optional filters.
    If seller_only=True, returns only products for the current seller.
    Otherwise, returns all products (for buyers to browse).
    """
    # Base query
    query = select(Product)
    
    # If seller_only is True, check if user is a seller and filter by seller_id
    if seller_only:
        seller_result = await db.execute(select(Seller).where(Seller.user_id == current_user.user_id))
        seller = seller_result.scalar_one_or_none()
        
        if not seller:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only sellers can view their own products"
            )
        
        query = query.where(Product.seller_id == current_user.user_id)
    
    # Apply filters
    if category:
        query = query.where(Product.category.ilike(f"%{category}%"))
    
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    # Execute query
    products_result = await db.execute(query)
    products = products_result.scalars().all()
    
    # Get inventory information for each product
    products_with_inventory = []
    for product in products:
        inventory_result = await db.execute(
            select(Inventory).where(Inventory.product_id == product.product_id)
        )
        inventories = inventory_result.scalars().all()
        
        inventory_responses = [
            InventoryResponse(
                inventory_id=inv.inventory_id,
                product_id=inv.product_id,
                user_id=inv.user_id,
                quantity=inv.quantity,
                discount=inv.discount,
                expiry_date=inv.expiry_date,
                created_at=inv.created_at,
                updated_at=inv.updated_at
            )
            for inv in inventories
        ]
        
        products_with_inventory.append(
            ProductWithInventoryResponse(
                product_id=product.product_id,
                seller_id=product.seller_id,
                name=product.name,
                category=product.category,
                price=product.price,
                rating=product.rating,
                created_at=product.created_at,
                inventories=inventory_responses
            )
        )
    
    return products_with_inventory

@router.delete("/delete/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Delete a product.
    Only the seller who owns the product can delete it.
    """
    # Get the product
    product_result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = product_result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if current user is the seller of this product
    if product.seller_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own products"
        )
    
    # Delete the product
    await db.execute(delete(Product).where(Product.product_id == product_id))
    await db.commit()
    
    return None

@router.get("/category/{category}", response_model=List[ProductResponse])
async def get_products_by_category(
    category: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Get all products in a specific category.
    """
    query = select(Product).where(Product.category.ilike(f"%{category}%"))
    query = query.offset(skip).limit(limit)
    
    products_result = await db.execute(query)
    products = products_result.scalars().all()
    
    return products

@router.get("/seller/{seller_id}", response_model=List[ProductResponse])
async def get_products_by_seller(
    seller_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user)
):
    """
    Get all products by a specific seller.
    """
    # Verify seller exists
    seller_result = await db.execute(select(Seller).where(Seller.user_id == seller_id))
    seller = seller_result.scalar_one_or_none()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found"
        )
    
    query = select(Product).where(Product.seller_id == seller_id)
    query = query.offset(skip).limit(limit)
    
    products_result = await db.execute(query)
    products = products_result.scalars().all()
    
    return products
