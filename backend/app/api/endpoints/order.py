from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from typing import List, Optional
import uuid
from decimal import Decimal
from datetime import date

from app.db.database import get_db_session
from app.db.models import (
    Order,
    OrderItem,
    BaseUser,
    Buyer,
    Seller,
    Product,
    Inventory,
    OrderCreate,
    OrderItemCreate,
    OrderResponse,
    OrderWithItemsResponse,
    OrderItemResponse,
)
from app.core.security import get_current_user

router = APIRouter()


@router.post(
    "/create", response_model=OrderResponse, status_code=status.HTTP_201_CREATED
)
async def create_order(
    order_data: OrderCreate,
    order_items: List[OrderItemCreate],
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Create a new order with order items.
    Now checks inventory availability and applies FIFO (First In, First Out) logic.
    """
    # Check if user is a buyer
    buyer_result = await db.execute(
        select(Buyer).where(Buyer.user_id == current_user.user_id)
    )
    buyer = buyer_result.scalar_one_or_none()

    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can create orders",
        )

    # Verify seller exists
    seller_result = await db.execute(
        select(Seller).where(Seller.user_id == order_data.seller_id)
    )
    seller = seller_result.scalar_one_or_none()

    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Seller not found"
        )

    total_price = Decimal("0.00")
    validated_items = []
    inventory_updates = []  # Track inventory changes

    # Validate each item and check inventory availability
    for item in order_items:
        # Check if product exists and belongs to the seller
        product_result = await db.execute(
            select(Product).where(
                Product.product_id == item.product_id,
                Product.seller_id == order_data.seller_id,
            )
        )
        product = product_result.scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found or doesn't belong to seller",
            )

        # Get available inventory batches (FIFO - oldest first, non-expired)
        today = date.today()
        inventory_result = await db.execute(
            select(Inventory)
            .where(
                and_(
                    Inventory.product_id == item.product_id,
                    Inventory.quantity > 0,
                    (Inventory.expiry_date.is_(None))
                    | (Inventory.expiry_date >= today),
                )
            )
            .order_by(Inventory.created_at.asc())  # FIFO
        )
        available_batches = inventory_result.scalars().all()

        # Check if enough quantity is available
        total_available = sum(batch.quantity for batch in available_batches)

        if total_available < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for {product.name}. "
                f"Requested: {item.quantity}, Available: {total_available}",
            )

        # Calculate price with best available discount (FIFO with best discount)
        remaining_quantity = item.quantity
        weighted_price = Decimal("0.00")

        for batch in available_batches:
            if remaining_quantity <= 0:
                break

            # Take from this batch
            take_quantity = min(remaining_quantity, batch.quantity)

            # Calculate price with discount
            batch_price = product.price * (1 - Decimal(str(batch.discount)) / 100)
            weighted_price += batch_price * take_quantity

            # Track inventory update
            inventory_updates.append({"batch": batch, "reduce_by": take_quantity})

            remaining_quantity -= take_quantity

        # Average price per unit for this item
        price_per_unit = weighted_price / item.quantity
        item_total = weighted_price
        total_price += item_total

        validated_items.append(
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price_per_unit": price_per_unit,
            }
        )

    # Create the order
    order = Order(
        buyer_id=current_user.user_id,
        seller_id=order_data.seller_id,
        total_price=total_price,
        order_status="Pending",
        estimated_delivery_date=order_data.estimated_delivery_date,
    )

    db.add(order)
    await db.flush()  # Get order_id

    # Create order items
    for item_data in validated_items:
        order_item = OrderItem(order_id=order.order_id, **item_data)
        db.add(order_item)

    # Update inventory quantities (reduce stock)
    for update in inventory_updates:
        batch = update["batch"]
        reduce_by = update["reduce_by"]
        batch.quantity -= reduce_by

    await db.commit()
    await db.refresh(order)

    return order


@router.put("/update/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: uuid.UUID,
    order_status: Optional[str] = None,
    estimated_delivery_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Update order details.
    Buyers can update their orders, sellers can update order status.
    """
    # Get the order
    order_result = await db.execute(select(Order).where(Order.order_id == order_id))
    order = order_result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    # Check permissions
    user_type = await get_user_type(db, current_user.user_id)

    # Check if user has permission to update this order
    if (
        order.buyer_id != current_user.user_id
        and order.seller_id != current_user.user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this order",
        )

    # Update fields based on user type and provided data
    update_data = {}

    if order_status:
        # Only sellers can update order status
        if order.seller_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only sellers can update order status",
            )

        valid_statuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"]
        if order_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid order status. Must be one of: {valid_statuses}",
            )

        update_data["order_status"] = order_status

    if estimated_delivery_date:
        # Both buyers and sellers can update delivery date
        update_data["estimated_delivery_date"] = estimated_delivery_date

    if update_data:
        await db.execute(
            update(Order).where(Order.order_id == order_id).values(**update_data)
        )
        await db.commit()
        await db.refresh(order)

    return order


@router.get("/{order_id}", response_model=OrderWithItemsResponse)
async def get_order_details(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Get details about a particular order including order items.
    """
    # Get the order with items
    order_result = await db.execute(select(Order).where(Order.order_id == order_id))
    order = order_result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    # Check permissions - user must be either the buyer or seller
    if (
        order.buyer_id != current_user.user_id
        and order.seller_id != current_user.user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this order",
        )

    # Get order items
    order_items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order_id)
    )
    order_items = order_items_result.scalars().all()

    # Convert to response format
    order_items_response = [
        OrderItemResponse(
            order_item_id=item.order_item_id,
            order_id=item.order_id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_per_unit=item.price_per_unit,
        )
        for item in order_items
    ]

    return OrderWithItemsResponse(
        order_id=order.order_id,
        buyer_id=order.buyer_id,
        seller_id=order.seller_id,
        total_price=order.total_price,
        order_status=order.order_status,
        estimated_delivery_date=order.estimated_delivery_date,
        order_date=order.order_date,
        order_items=order_items_response,
    )


@router.get("/", response_model=List[OrderWithItemsResponse])
async def get_all_orders(
    skip: int = 0,
    limit: int = 10,
    order_status: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Get all orders for the current user.
    Buyers see their purchase orders, sellers see orders for their products.
    """
    # Determine user type and get appropriate orders
    user_type = await get_user_type(db, current_user.user_id)

    if user_type == "buyer":
        # Get orders where user is the buyer
        query = select(Order).where(Order.buyer_id == current_user.user_id)
    elif user_type == "seller":
        # Get orders where user is the seller
        query = select(Order).where(Order.seller_id == current_user.user_id)
    elif user_type == "both":
        # Get orders where user is either buyer or seller
        query = select(Order).where(
            (Order.buyer_id == current_user.user_id)
            | (Order.seller_id == current_user.user_id)
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be a buyer or seller to view orders",
        )

    # Add status filter if provided
    if order_status:
        query = query.where(Order.order_status == order_status)

    # Add pagination
    query = query.offset(skip).limit(limit)

    # Execute query
    orders_result = await db.execute(query)
    orders = orders_result.scalars().all()

    # Get order items for each order
    orders_with_items = []
    for order in orders:
        order_items_result = await db.execute(
            select(OrderItem).where(OrderItem.order_id == order.order_id)
        )
        order_items = order_items_result.scalars().all()

        order_items_response = [
            OrderItemResponse(
                order_item_id=item.order_item_id,
                order_id=item.order_id,
                product_id=item.product_id,
                quantity=item.quantity,
                price_per_unit=item.price_per_unit,
            )
            for item in order_items
        ]

        orders_with_items.append(
            OrderWithItemsResponse(
                order_id=order.order_id,
                buyer_id=order.buyer_id,
                seller_id=order.seller_id,
                total_price=order.total_price,
                order_status=order.order_status,
                estimated_delivery_date=order.estimated_delivery_date,
                order_date=order.order_date,
                order_items=order_items_response,
            )
        )

    return orders_with_items


# Helper function to get user type
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
