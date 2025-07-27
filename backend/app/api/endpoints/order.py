from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from typing import List, Optional
import uuid
from decimal import Decimal
from datetime import date
from pydantic import Field

from app.db.database import get_db_session
from app.db.models import (
    Order,
    OrderItem,
    BaseUser,
    Buyer,
    Seller,
    Product,
    Inventory,
    GroupOrderParticipant,
    OrderCreate,
    OrderItemCreate,
    OrderResponse,
    OrderWithItemsResponse,
    OrderItemResponse,
    DiscountStructure,
    GroupOrderJoinRequest,
    GroupOrderParticipantResponse,
    GroupOrderSummary,
)
from app.core.security import get_current_user

router = APIRouter()


async def get_user_type(db: AsyncSession, user_id: uuid.UUID) -> str:
    """Helper function to determine user type"""
    buyer = await db.execute(select(Buyer).where(Buyer.user_id == user_id))
    seller = await db.execute(select(Seller).where(Seller.user_id == user_id))

    has_buyer = buyer.scalar_one_or_none() is not None
    has_seller = seller.scalar_one_or_none() is not None

    if has_buyer and has_seller:
        return "both"
    elif has_buyer:
        return "buyer"
    elif has_seller:
        return "seller"
    else:
        return "none"


@router.post(
    "/create", response_model=OrderResponse, status_code=status.HTTP_201_CREATED
)
async def create_order(
    order_data: OrderCreate,
    order_items: List[OrderItemCreate],
    purchase_type: str = "solo_singletime",  # New parameter for discount type
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

        # Calculate price with best available discount using new discount structure
        remaining_quantity = item.quantity
        weighted_price = Decimal("0.00")

        # Determine if this is a group purchase (let's say >10 items is considered group)
        is_group = item.quantity > 10
        purchase_type_param = (
            "subscription" if purchase_type == "subscription" else "solo_singletime"
        )

        for batch in available_batches:
            if remaining_quantity <= 0:
                break

            # Take from this batch
            take_quantity = min(remaining_quantity, batch.quantity)

            # Calculate price with new discount structure
            discount_struct = DiscountStructure.from_array(batch.discount)
            discounted_price = discount_struct.calculate_discounted_price(
                product.price, purchase_type_param, is_group
            )

            weighted_price += discounted_price * take_quantity

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
        group_buyer_ids=[str(current_user.user_id)]
        if order_data.order_type == "group"
        else None,
        order_type=order_data.order_type,
        total_price=total_price,
        order_status="Pending",
        estimated_delivery_date=order_data.estimated_delivery_date,
    )

    db.add(order)
    await db.flush()  # Get order_id

    # If it's a group order, create initial participant record for the primary buyer
    if order_data.order_type == "group":
        primary_participant = GroupOrderParticipant(
            order_id=order.order_id,
            buyer_id=current_user.user_id,
            quantity_share=sum(item["quantity"] for item in validated_items),
            price_share=total_price,
            status="confirmed",
        )
        db.add(primary_participant)

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


@router.post("/calculate-pricing")
async def calculate_order_pricing(
    order_items: List[OrderItemCreate],
    seller_id: uuid.UUID,
    purchase_type: str = "solo_singletime",
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Calculate order pricing without creating the order.
    Shows breakdown of discounts and total cost.
    """
    # Check if user is a buyer
    buyer_result = await db.execute(
        select(Buyer).where(Buyer.user_id == current_user.user_id)
    )
    buyer = buyer_result.scalar_one_or_none()

    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can calculate order pricing",
        )

    # Verify seller exists
    seller_result = await db.execute(select(Seller).where(Seller.user_id == seller_id))
    seller = seller_result.scalar_one_or_none()

    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Seller not found"
        )

    total_original_price = Decimal("0.00")
    total_discounted_price = Decimal("0.00")
    item_breakdowns = []

    # Calculate pricing for each item
    for item in order_items:
        # Check if product exists and belongs to the seller
        product_result = await db.execute(
            select(Product).where(
                Product.product_id == item.product_id, Product.seller_id == seller_id
            )
        )
        product = product_result.scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found or doesn't belong to seller",
            )

        # Get available inventory batches (FIFO)
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
            .order_by(Inventory.created_at.asc())
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

        # Calculate pricing
        remaining_quantity = item.quantity
        item_original_price = product.price * item.quantity
        item_discounted_price = Decimal("0.00")
        batch_details = []

        is_group = item.quantity > 10
        purchase_type_param = (
            "subscription" if purchase_type == "subscription" else "solo_singletime"
        )

        for batch in available_batches:
            if remaining_quantity <= 0:
                break

            take_quantity = min(remaining_quantity, batch.quantity)
            discount_struct = DiscountStructure.from_array(batch.discount)

            discounted_price = discount_struct.calculate_discounted_price(
                product.price, purchase_type_param, is_group
            )

            batch_cost = discounted_price * take_quantity
            item_discounted_price += batch_cost

            batch_details.append(
                {
                    "inventory_id": str(batch.inventory_id),
                    "quantity_from_batch": take_quantity,
                    "original_price_per_unit": float(product.price),
                    "discounted_price_per_unit": float(discounted_price),
                    "discount_applied": discount_struct.get_applicable_discount(
                        purchase_type_param, is_group
                    ),
                    "batch_total": float(batch_cost),
                    "expiry_date": batch.expiry_date.isoformat()
                    if batch.expiry_date
                    else None,
                }
            )

            remaining_quantity -= take_quantity

        item_savings = item_original_price - item_discounted_price

        item_breakdowns.append(
            {
                "product_id": str(item.product_id),
                "product_name": product.name,
                "quantity": item.quantity,
                "original_total": float(item_original_price),
                "discounted_total": float(item_discounted_price),
                "savings": float(item_savings),
                "savings_percentage": float((item_savings / item_original_price) * 100)
                if item_original_price > 0
                else 0,
                "batch_details": batch_details,
            }
        )

        total_original_price += item_original_price
        total_discounted_price += item_discounted_price

    total_savings = total_original_price - total_discounted_price

    return {
        "seller_id": str(seller_id),
        "purchase_type": purchase_type,
        "summary": {
            "total_original_price": float(total_original_price),
            "total_discounted_price": float(total_discounted_price),
            "total_savings": float(total_savings),
            "overall_savings_percentage": float(
                (total_savings / total_original_price) * 100
            )
            if total_original_price > 0
            else 0,
        },
        "item_breakdowns": item_breakdowns,
    }


@router.post("/group/join", response_model=GroupOrderParticipantResponse)
async def join_group_order(
    join_request: GroupOrderJoinRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Join an existing group order.
    """
    # Check if user is a buyer
    buyer_result = await db.execute(
        select(Buyer).where(Buyer.user_id == current_user.user_id)
    )
    buyer = buyer_result.scalar_one_or_none()

    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can join group orders",
        )

    # Get the order
    order_result = await db.execute(
        select(Order).where(Order.order_id == join_request.order_id)
    )
    order = order_result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    if order.order_type != "group":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="This is not a group order"
        )

    if order.order_status != "Pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot join order that is no longer pending",
        )

    # Check if user is already a participant
    existing_participant = await db.execute(
        select(GroupOrderParticipant).where(
            and_(
                GroupOrderParticipant.order_id == join_request.order_id,
                GroupOrderParticipant.buyer_id == current_user.user_id,
            )
        )
    )

    if existing_participant.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already part of this group order",
        )

    # Calculate price share for the requested quantity
    order_items = await db.execute(
        select(OrderItem).where(OrderItem.order_id == join_request.order_id)
    )
    order_items = order_items.scalars().all()

    total_order_quantity = sum(item.quantity for item in order_items)
    price_per_unit = order.total_price / total_order_quantity
    participant_price = price_per_unit * join_request.quantity_requested

    # Create participant record
    participant = GroupOrderParticipant(
        order_id=join_request.order_id,
        buyer_id=current_user.user_id,
        quantity_share=join_request.quantity_requested,
        price_share=participant_price,
        status="pending",
    )

    db.add(participant)

    # Update order's group_buyer_ids
    current_buyer_ids = order.group_buyer_ids or []
    if str(current_user.user_id) not in current_buyer_ids:
        current_buyer_ids.append(str(current_user.user_id))
        order.group_buyer_ids = current_buyer_ids

    await db.commit()
    await db.refresh(participant)

    return participant


@router.get("/group/available", response_model=List[GroupOrderSummary])
async def get_available_group_orders(
    seller_id: Optional[uuid.UUID] = None,
    product_category: Optional[str] = None,
    max_distance_km: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Get available group orders that buyers can join.
    """
    # Check if user is a buyer
    buyer_result = await db.execute(
        select(Buyer).where(Buyer.user_id == current_user.user_id)
    )
    buyer = buyer_result.scalar_one_or_none()

    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can view available group orders",
        )

    # Build query for group orders that are still accepting participants
    query = select(Order).where(
        and_(Order.order_type == "group", Order.order_status == "Pending")
    )

    if seller_id:
        query = query.where(Order.seller_id == seller_id)

    # Add pagination
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    orders = result.scalars().all()

    group_summaries = []

    for order in orders:
        # Get participants count
        participants_count = await db.execute(
            select(GroupOrderParticipant).where(
                GroupOrderParticipant.order_id == order.order_id
            )
        )
        participants = participants_count.scalars().all()

        total_quantity = (
            sum(p.quantity_share for p in participants) if participants else 0
        )

        group_summaries.append(
            GroupOrderSummary(
                order_id=order.order_id,
                primary_buyer_id=order.buyer_id,
                seller_id=order.seller_id,
                total_participants=len(participants),
                total_quantity=int(total_quantity),  # Ensure it's an integer
                total_price=order.total_price,
                order_status=order.order_status,
                order_type=order.order_type,
                participants=[],  # Don't include full participant details in list view
                estimated_delivery_date=order.estimated_delivery_date,
                order_date=order.order_date,
            )
        )

    return group_summaries


@router.get("/group/{order_id}", response_model=GroupOrderSummary)
async def get_group_order_details(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Get detailed information about a group order including all participants.
    """
    # Get the order
    order_result = await db.execute(select(Order).where(Order.order_id == order_id))
    order = order_result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    if order.order_type != "group":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="This is not a group order"
        )

    # Check if user has permission to view this order
    user_type = await get_user_type(db, current_user.user_id)

    # Allow if user is the seller, primary buyer, or a participant
    is_participant = False
    if order.group_buyer_ids:
        is_participant = str(current_user.user_id) in order.group_buyer_ids

    if not (
        order.buyer_id == current_user.user_id
        or order.seller_id == current_user.user_id
        or is_participant
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this order",
        )

    # Get all participants
    participants_result = await db.execute(
        select(GroupOrderParticipant, Buyer, BaseUser)
        .join(Buyer, GroupOrderParticipant.buyer_id == Buyer.user_id)
        .join(BaseUser, Buyer.user_id == BaseUser.user_id)
        .where(GroupOrderParticipant.order_id == order_id)
    )

    participants_data = participants_result.all()

    participants = []
    total_participants = len(participants_data)
    total_quantity = 0

    for participant_orm, buyer_orm, user_orm in participants_data:
        total_quantity += participant_orm.quantity_share

        participant_response = GroupOrderParticipantResponse(
            participant_id=participant_orm.participant_id,
            order_id=participant_orm.order_id,
            buyer_id=participant_orm.buyer_id,
            quantity_share=participant_orm.quantity_share,
            price_share=participant_orm.price_share,
            status=participant_orm.status,
            joined_at=participant_orm.joined_at,
            buyer_info={
                "email": user_orm.email,
                "mobile_number": user_orm.mobile_number,
                "shipping_address": buyer_orm.shipping_address,
                "shipping_pincode": buyer_orm.shipping_pincode,
            },
        )
        participants.append(participant_response)

    return GroupOrderSummary(
        order_id=order.order_id,
        primary_buyer_id=order.buyer_id,
        seller_id=order.seller_id,
        total_participants=total_participants,
        total_quantity=total_quantity,
        total_price=order.total_price,
        order_status=order.order_status,
        order_type=order.order_type,
        participants=participants,
        estimated_delivery_date=order.estimated_delivery_date,
        order_date=order.order_date,
    )


@router.put("/group/participant/{participant_id}/status")
async def update_participant_status(
    participant_id: uuid.UUID,
    new_status: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Update the status of a group order participant.
    """
    # Get participant
    participant_result = await db.execute(
        select(GroupOrderParticipant).where(
            GroupOrderParticipant.participant_id == participant_id
        )
    )
    participant = participant_result.scalar_one_or_none()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found"
        )

    # Get order to check permissions
    order_result = await db.execute(
        select(Order).where(Order.order_id == participant.order_id)
    )
    order = order_result.scalar_one_or_none()

    # Check permissions - only the participant themselves or the primary buyer can update status
    if not (
        participant.buyer_id == current_user.user_id
        or order.buyer_id == current_user.user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this participant's status",
        )

    participant.status = new_status
    await db.commit()

    return {"message": f"Participant status updated to {new_status}"}


@router.get("/{order_id}", response_model=OrderWithItemsResponse)
async def get_order_details(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Get detailed order information including items and group participants (if applicable).
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

    # Check if user has permission to view this order
    is_participant = False
    if order.group_buyer_ids:
        is_participant = str(current_user.user_id) in order.group_buyer_ids

    if not (
        order.buyer_id == current_user.user_id
        or order.seller_id == current_user.user_id
        or is_participant
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

    # Get group buyers info if it's a group order
    group_buyers_info = None
    if order.order_type == "group":
        participants_result = await db.execute(
            select(GroupOrderParticipant, Buyer, BaseUser)
            .join(Buyer, GroupOrderParticipant.buyer_id == Buyer.user_id)
            .join(BaseUser, Buyer.user_id == BaseUser.user_id)
            .where(GroupOrderParticipant.order_id == order_id)
        )

        participants_data = participants_result.all()
        group_buyers_info = []

        for participant_orm, buyer_orm, user_orm in participants_data:
            group_buyers_info.append(
                {
                    "buyer_id": str(participant_orm.buyer_id),
                    "email": user_orm.email,
                    "mobile_number": user_orm.mobile_number,
                    "quantity_share": participant_orm.quantity_share,
                    "price_share": float(participant_orm.price_share),
                    "status": participant_orm.status,
                    "joined_at": participant_orm.joined_at.isoformat(),
                    "shipping_address": buyer_orm.shipping_address,
                    "shipping_pincode": buyer_orm.shipping_pincode,
                }
            )

    # Convert group_buyer_ids to UUID list if they exist
    group_buyer_uuids = None
    if order.group_buyer_ids:
        try:
            group_buyer_uuids = [
                uuid.UUID(buyer_id) for buyer_id in order.group_buyer_ids
            ]
        except ValueError:
            group_buyer_uuids = None

    return OrderWithItemsResponse(
        order_id=order.order_id,
        buyer_id=order.buyer_id,
        seller_id=order.seller_id,
        group_buyer_ids=group_buyer_uuids,
        order_type=order.order_type,
        total_price=order.total_price,
        order_status=order.order_status,
        estimated_delivery_date=order.estimated_delivery_date,
        order_date=order.order_date,
        order_items=order_items_response,
        group_buyers_info=group_buyers_info,
    )


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

        # Get group buyers info if it's a group order
        group_buyers_info = None
        group_buyer_uuids = None
        
        if order.order_type == "group":
            # Get group participants for group orders
            participants_result = await db.execute(
                select(GroupOrderParticipant, Buyer, BaseUser)
                .join(Buyer, GroupOrderParticipant.buyer_id == Buyer.user_id)
                .join(BaseUser, Buyer.user_id == BaseUser.user_id)
                .where(GroupOrderParticipant.order_id == order.order_id)
            )

            participants_data = participants_result.all()
            group_buyers_info = []

            for participant_orm, buyer_orm, user_orm in participants_data:
                group_buyers_info.append(
                    {
                        "buyer_id": str(participant_orm.buyer_id),
                        "email": user_orm.email,
                        "mobile_number": user_orm.mobile_number,
                        "quantity_share": participant_orm.quantity_share,
                        "price_share": float(participant_orm.price_share),
                        "status": participant_orm.status,
                        "joined_at": participant_orm.joined_at.isoformat(),
                        "shipping_address": buyer_orm.shipping_address,
                        "shipping_pincode": buyer_orm.shipping_pincode,
                    }
                )

            # Convert group_buyer_ids to UUID list if they exist
            if order.group_buyer_ids:
                try:
                    group_buyer_uuids = [
                        uuid.UUID(buyer_id) for buyer_id in order.group_buyer_ids
                    ]
                except ValueError:
                    group_buyer_uuids = None

        orders_with_items.append(
            OrderWithItemsResponse(
                order_id=order.order_id,
                buyer_id=order.buyer_id,
                seller_id=order.seller_id,
                group_buyer_ids=group_buyer_uuids,  # Add this field
                order_type=order.order_type,  # Add this required field
                total_price=order.total_price,
                order_status=order.order_status,
                estimated_delivery_date=order.estimated_delivery_date,
                order_date=order.order_date,
                order_items=order_items_response,
                group_buyers_info=group_buyers_info,  # Add this field
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
