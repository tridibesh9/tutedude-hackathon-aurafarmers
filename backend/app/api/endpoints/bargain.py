from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_, desc
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import json
import uuid

from app.db.database import get_db_session
from app.db.models import (
    BargainRoom,
    BargainBid,
    BargainMessage,
    BaseUser,
    Buyer,
    Seller,
    Product,
    BargainRoomCreate,
    BargainBidCreate,
    BargainMessageCreate,
    BargainRoomResponse,
    BargainBidResponse,
    BargainMessageResponse,
    BargainRoomWithDetailsResponse,
    PublicBargainResponse,
)
from app.core.security import get_current_user

router = APIRouter()


# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][user_id] = websocket

    def disconnect(self, room_id: str, user_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].pop(user_id, None)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def send_to_room(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for user_id, websocket in self.active_connections[room_id].items():
                try:
                    await websocket.send_text(json.dumps(message))
                except:
                    pass  # Connection closed


manager = ConnectionManager()

# === PUBLIC BARGAINING ENDPOINTS ===


@router.post(
    "/public/create",
    response_model=BargainRoomResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_public_bargain(
    bargain_data: BargainRoomCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Create a public bargaining room. Buyers place bids visible to all sellers in the area.
    """
    # Check if user is a buyer
    buyer_result = await db.execute(
        select(Buyer).where(Buyer.user_id == current_user.user_id)
    )
    buyer = buyer_result.scalar_one_or_none()

    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can create public bargains",
        )

    # Verify product exists
    product_result = await db.execute(
        select(Product).where(Product.product_id == bargain_data.product_id)
    )
    product = product_result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    # Set expiry time
    expires_at = datetime.timezone.utc() + timedelta(
        hours=bargain_data.expires_in_hours
    )

    # Create bargain room
    bargain_room = BargainRoom(
        product_id=bargain_data.product_id,
        buyer_id=current_user.user_id,
        seller_id=None,  # Public bargaining
        room_type="public",
        initial_quantity=bargain_data.quantity,
        initial_bid_price=bargain_data.initial_bid_price,
        current_bid_price=bargain_data.initial_bid_price,
        location_pincode=bargain_data.location_pincode,
        expires_at=expires_at,
    )

    db.add(bargain_room)
    await db.commit()
    await db.refresh(bargain_room)

    return bargain_room


@router.get("/public/available", response_model=List[PublicBargainResponse])
async def get_available_public_bargains(
    location_pincode: Optional[str] = Query(None, description="Filter by location"),
    category: Optional[str] = Query(None, description="Filter by product category"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Get available public bargains for sellers to respond to.
    """
    # Check if user is a seller
    seller_result = await db.execute(
        select(Seller).where(Seller.user_id == current_user.user_id)
    )
    seller = seller_result.scalar_one_or_none()

    if not seller:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can view public bargains",
        )

    # Build query
    query = (
        select(BargainRoom)
        .join(Product)
        .where(
            and_(
                BargainRoom.room_type == "public",
                BargainRoom.status == "active",
                BargainRoom.expires_at > datetime.utcnow(),
            )
        )
    )

    # Add filters
    if location_pincode:
        query = query.where(BargainRoom.location_pincode == location_pincode)

    if category:
        query = query.where(Product.category.ilike(f"%{category}%"))

    # Add pagination and ordering
    query = query.order_by(desc(BargainRoom.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    bargain_rooms = result.scalars().all()

    # Format response with product details
    public_bargains = []
    for room in bargain_rooms:
        # Get product details
        product_result = await db.execute(
            select(Product).where(Product.product_id == room.product_id)
        )
        product = product_result.scalar_one()

        # Count seller responses
        seller_responses = await db.execute(
            select(BargainBid).where(
                and_(
                    BargainBid.room_id == room.room_id, BargainBid.user_type == "seller"
                )
            )
        )
        total_responses = len(seller_responses.scalars().all())

        public_bargains.append(
            PublicBargainResponse(
                room_id=room.room_id,
                product_id=room.product_id,
                product_name=product.name,
                product_category=product.category,
                original_price=product.price,
                buyer_id=room.buyer_id,
                buyer_location=room.location_pincode,
                quantity=room.initial_quantity,
                current_bid_price=room.current_bid_price,
                expires_at=room.expires_at,
                created_at=room.created_at,
                total_seller_responses=total_responses,
            )
        )

    return public_bargains


@router.post(
    "/public/{room_id}/respond",
    response_model=BargainBidResponse,
    status_code=status.HTTP_201_CREATED,
)
async def respond_to_public_bargain(
    room_id: str,
    bid_data: BargainBidCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Seller responds to a public bargain with their offer.
    """
    # Check if user is a seller
    seller_result = await db.execute(
        select(Seller).where(Seller.user_id == current_user.user_id)
    )
    seller = seller_result.scalar_one_or_none()

    if not seller:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can respond to public bargains",
        )

    # Get bargain room
    room_result = await db.execute(
        select(BargainRoom).where(
            and_(
                BargainRoom.room_id == room_id,
                BargainRoom.room_type == "public",
                BargainRoom.status == "active",
            )
        )
    )
    room = room_result.scalar_one_or_none()

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public bargain not found or no longer active",
        )

    # Check if bargain hasn't expired
    if room.expires_at and room.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="This bargain has expired"
        )

    # Create seller bid
    bid = BargainBid(
        room_id=room_id,
        user_id=current_user.user_id,
        user_type="seller",
        bid_price=bid_data.bid_price,
        quantity=bid_data.quantity,
        message=bid_data.message,
        is_counter_offer=False,
    )

    db.add(bid)
    await db.commit()
    await db.refresh(bid)

    # Send real-time update to room
    await manager.send_to_room(
        room_id,
        {
            "type": "new_bid",
            "bid": {
                "bid_id": str(bid.bid_id),
                "user_type": "seller",
                "bid_price": float(bid.bid_price),
                "quantity": bid.quantity,
                "message": bid.message,
                "created_at": bid.created_at.isoformat(),
            },
        },
    )

    return bid


# === PRIVATE BARGAINING ENDPOINTS ===


@router.post(
    "/private/create",
    response_model=BargainRoomResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_private_bargain(
    bargain_data: BargainRoomCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Create a private bargaining room between specific buyer and seller.
    """
    # Check if user is a buyer
    buyer_result = await db.execute(
        select(Buyer).where(Buyer.user_id == current_user.user_id)
    )
    buyer = buyer_result.scalar_one_or_none()

    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can initiate private bargains",
        )

    if not bargain_data.seller_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seller ID is required for private bargaining",
        )

    # Verify seller exists
    seller_result = await db.execute(
        select(Seller).where(Seller.user_id == bargain_data.seller_id)
    )
    seller = seller_result.scalar_one_or_none()

    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Seller not found"
        )

    # Verify product exists and belongs to seller
    product_result = await db.execute(
        select(Product).where(
            and_(
                Product.product_id == bargain_data.product_id,
                Product.seller_id == bargain_data.seller_id,
            )
        )
    )
    product = product_result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or doesn't belong to seller",
        )

    # Create private bargain room
    bargain_room = BargainRoom(
        product_id=bargain_data.product_id,
        buyer_id=current_user.user_id,
        seller_id=bargain_data.seller_id,
        room_type="private",
        initial_quantity=bargain_data.quantity,
        initial_bid_price=bargain_data.initial_bid_price,
        current_bid_price=bargain_data.initial_bid_price,
        location_pincode=bargain_data.location_pincode,
    )

    db.add(bargain_room)
    await db.commit()
    await db.refresh(bargain_room)

    return bargain_room


@router.post(
    "/{room_id}/bid",
    response_model=BargainBidResponse,
    status_code=status.HTTP_201_CREATED,
)
async def place_bid_in_room(
    room_id: str,
    bid_data: BargainBidCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Place a bid in a bargaining room (both public and private).
    """
    # Get bargain room
    room_result = await db.execute(
        select(BargainRoom).where(
            and_(BargainRoom.room_id == room_id, BargainRoom.status == "active")
        )
    )
    room = room_result.scalar_one_or_none()

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bargain room not found or no longer active",
        )

    # Check if user is participant
    user_type = None
    if room.buyer_id == current_user.user_id:
        user_type = "buyer"
    elif room.seller_id == current_user.user_id or room.room_type == "public":
        # For public rooms, any seller can participate
        seller_result = await db.execute(
            select(Seller).where(Seller.user_id == current_user.user_id)
        )
        if seller_result.scalar_one_or_none():
            user_type = "seller"

    if not user_type:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to bid in this room",
        )

    # Create bid
    bid = BargainBid(
        room_id=room_id,
        user_id=current_user.user_id,
        user_type=user_type,
        bid_price=bid_data.bid_price,
        quantity=bid_data.quantity,
        message=bid_data.message,
        is_counter_offer=bid_data.is_counter_offer,
    )

    # Update room's current bid price
    room.current_bid_price = bid_data.bid_price

    db.add(bid)
    await db.commit()
    await db.refresh(bid)

    # Send real-time update
    await manager.send_to_room(
        room_id,
        {
            "type": "new_bid",
            "bid": {
                "bid_id": str(bid.bid_id),
                "user_type": user_type,
                "bid_price": float(bid.bid_price),
                "quantity": bid.quantity,
                "message": bid.message,
                "is_counter_offer": bid.is_counter_offer,
                "created_at": bid.created_at.isoformat(),
            },
        },
    )

    return bid


@router.post("/{room_id}/accept", response_model=dict)
async def accept_bargain(
    room_id: str,
    bid_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Accept a specific bid and close the bargaining room.
    """
    # Get bargain room
    room_result = await db.execute(
        select(BargainRoom).where(
            and_(BargainRoom.room_id == room_id, BargainRoom.status == "active")
        )
    )
    room = room_result.scalar_one_or_none()

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bargain room not found"
        )

    # Check if user can accept (buyer for public, either party for private)
    can_accept = False
    if room.room_type == "public" and room.buyer_id == current_user.user_id:
        can_accept = True
    elif room.room_type == "private" and current_user.user_id in [
        room.buyer_id,
        room.seller_id,
    ]:
        can_accept = True

    if not can_accept:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot accept bids in this room",
        )

    # Get the specific bid
    bid_result = await db.execute(
        select(BargainBid).where(
            and_(BargainBid.bid_id == bid_id, BargainBid.room_id == room_id)
        )
    )
    bid = bid_result.scalar_one_or_none()

    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bid not found"
        )

    # Close the room
    room.status = "accepted"
    await db.commit()

    # Send real-time update
    await manager.send_to_room(
        room_id,
        {
            "type": "bargain_accepted",
            "accepted_bid_id": str(bid.bid_id),
            "final_price": float(bid.bid_price),
            "quantity": bid.quantity,
        },
    )

    return {
        "message": "Bargain accepted successfully",
        "room_id": room_id,
        "accepted_bid_id": str(bid.bid_id),
        "final_price": float(bid.bid_price),
        "quantity": bid.quantity,
    }


@router.get("/{room_id}", response_model=BargainRoomWithDetailsResponse)
async def get_bargain_room_details(
    room_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Get detailed information about a bargaining room.
    """
    # Get bargain room with product details
    room_result = await db.execute(
        select(BargainRoom).join(Product).where(BargainRoom.room_id == room_id)
    )
    room = room_result.scalar_one_or_none()

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bargain room not found"
        )

    # Check access permissions
    has_access = False
    if room.buyer_id == current_user.user_id or room.seller_id == current_user.user_id:
        has_access = True
    elif room.room_type == "public":
        # Public rooms are viewable by all sellers
        seller_result = await db.execute(
            select(Seller).where(Seller.user_id == current_user.user_id)
        )
        if seller_result.scalar_one_or_none():
            has_access = True

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this bargain room",
        )

    # Get product details
    product_result = await db.execute(
        select(Product).where(Product.product_id == room.product_id)
    )
    product = product_result.scalar_one()

    # Get recent bids
    bids_result = await db.execute(
        select(BargainBid)
        .where(BargainBid.room_id == room_id)
        .order_by(desc(BargainBid.created_at))
        .limit(10)
    )
    recent_bids = bids_result.scalars().all()

    # Get recent messages
    messages_result = await db.execute(
        select(BargainMessage)
        .where(BargainMessage.room_id == room_id)
        .order_by(desc(BargainMessage.created_at))
        .limit(10)
    )
    recent_messages = messages_result.scalars().all()

    return BargainRoomWithDetailsResponse(
        room_id=room.room_id,
        product_id=room.product_id,
        product_name=product.name,
        product_category=product.category,
        product_price=product.price,
        buyer_id=room.buyer_id,
        seller_id=room.seller_id,
        room_type=room.room_type,
        status=room.status,
        initial_quantity=room.initial_quantity,
        initial_bid_price=room.initial_bid_price,
        current_bid_price=room.current_bid_price,
        location_pincode=room.location_pincode,
        expires_at=room.expires_at,
        created_at=room.created_at,
        recent_bids=[BargainBidResponse.model_validate(bid) for bid in recent_bids],
        recent_messages=[
            BargainMessageResponse.model_validate(msg) for msg in recent_messages
        ],
    )


@router.get("/my-bargains", response_model=List[BargainRoomResponse])
async def get_my_bargains(
    room_type: Optional[str] = Query(None, pattern="^(public|private)$"),
    status: Optional[str] = Query(None, pattern="^(active|closed|accepted|rejected)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: BaseUser = Depends(get_current_user),
):
    """
    Get all bargaining rooms where the current user is involved.
    """
    # Build query for rooms where user is buyer or seller
    query = select(BargainRoom).where(
        or_(
            BargainRoom.buyer_id == current_user.user_id,
            BargainRoom.seller_id == current_user.user_id,
        )
    )

    # Add filters
    if room_type:
        query = query.where(BargainRoom.room_type == room_type)

    if status:
        query = query.where(BargainRoom.status == status)

    # Add pagination and ordering
    query = query.order_by(desc(BargainRoom.updated_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    bargain_rooms = result.scalars().all()

    return bargain_rooms


# === WEBSOCKET AUTHENTICATION ===


async def get_user_from_websocket_token(
    websocket: WebSocket, db: AsyncSession
) -> Optional[BaseUser]:
    """
    Extract and validate JWT token from WebSocket connection.
    Token can be sent via:
    1. Query parameter: ws://localhost:8000/bargain/{room_id}/ws?token=jwt_token
    2. First message after connection: {"type": "auth", "token": "jwt_token"}
    """
    from app.core.security import decode_access_token
    from sqlalchemy import select

    # Try to get token from query parameters first
    token = websocket.query_params.get("token")

    if not token:
        # If no token in query params, wait for auth message
        try:
            await websocket.accept()
            data = await websocket.receive_text()
            auth_message = json.loads(data)

            if auth_message.get("type") == "auth":
                token = auth_message.get("token")
            else:
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "error",
                            "message": 'Authentication required. Send: {"type": "auth", "token": "your_jwt_token"}',
                        }
                    )
                )
                await websocket.close()
                return None
        except Exception:
            await websocket.close()
            return None
    else:
        await websocket.accept()

    if not token:
        await websocket.send_text(
            json.dumps({"type": "error", "message": "No authentication token provided"})
        )
        await websocket.close()
        return None

    # Decode and validate token
    try:
        payload = decode_access_token(token)
        email = payload.get("sub")

        if not email:
            await websocket.send_text(
                json.dumps({"type": "error", "message": "Invalid token"})
            )
            await websocket.close()
            return None

        # Get user from database
        result = await db.execute(select(BaseUser).where(BaseUser.email == email))
        user = result.scalar_one_or_none()

        if not user:
            await websocket.send_text(
                json.dumps({"type": "error", "message": "User not found"})
            )
            await websocket.close()
            return None

        # Send authentication success
        await websocket.send_text(
            json.dumps(
                {
                    "type": "auth_success",
                    "message": "Successfully authenticated",
                    "user_id": str(user.user_id),
                }
            )
        )

        return user

    except Exception as e:
        await websocket.send_text(
            json.dumps({"type": "error", "message": f"Authentication failed: {str(e)}"})
        )
        await websocket.close()
        return None


async def verify_room_access(user: BaseUser, room_id: str, db: AsyncSession) -> bool:
    """
    Verify if user has access to the bargaining room.
    """
    # Get bargain room
    room_result = await db.execute(
        select(BargainRoom).where(BargainRoom.room_id == room_id)
    )
    room = room_result.scalar_one_or_none()

    if not room:
        return False

    # Check access permissions
    if room.buyer_id == user.user_id or room.seller_id == user.user_id:
        return True
    elif room.room_type == "public":
        # Public rooms are accessible by all sellers
        seller_result = await db.execute(
            select(Seller).where(Seller.user_id == user.user_id)
        )
        return seller_result.scalar_one_or_none() is not None

    return False


# === WEBSOCKET ENDPOINT FOR REAL-TIME UPDATES ===


@router.websocket("/{room_id}/ws")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for real-time bargaining updates.

    What this endpoint does:
    1. **Real-time Bidding**: Users see new bids instantly without refreshing
    2. **Live Chat**: Send and receive messages during bargaining
    3. **Status Updates**: Get notified when bargains are accepted/rejected
    4. **Connection Management**: Handles multiple users in the same room
    5. **Authentication**: Secure access with JWT tokens

    Connection Methods:
    - Via query param: ws://localhost:8000/bargain/{room_id}/ws?token=your_jwt_token
    - Via first message: Connect first, then send {"type": "auth", "token": "your_jwt_token"}

    Message Types Received:
    - {"type": "auth", "token": "jwt_token"} - Authenticate connection
    - {"type": "ping"} - Keep connection alive
    - {"type": "typing", "is_typing": true} - Show typing indicators

    Message Types Sent:
    - {"type": "auth_success"} - Authentication successful
    - {"type": "new_bid", "bid": {...}} - New bid placed
    - {"type": "new_message", "message": {...}} - New chat message
    - {"type": "bargain_accepted", "accepted_bid_id": "..."} - Deal closed
    - {"type": "user_joined", "user_id": "..."} - User joined room
    - {"type": "user_left", "user_id": "..."} - User left room
    - {"type": "typing", "user_id": "...", "is_typing": true} - Typing indicator
    - {"type": "error", "message": "..."} - Error occurred
    """
    db = None
    user = None

    try:
        # Get database session
        async for session in get_db_session():
            db = session
            break

        # Authenticate user
        user = await get_user_from_websocket_token(websocket, db)
        if not user:
            return  # Connection already closed in auth function

        # Verify room access
        has_access = await verify_room_access(user, room_id, db)
        if not has_access:
            await websocket.send_text(
                json.dumps(
                    {
                        "type": "error",
                        "message": "You don't have access to this bargaining room",
                    }
                )
            )
            await websocket.close()
            return

        # Connect user to room
        user_id = str(user.user_id)
        await manager.connect(websocket, room_id, user_id)

        # Notify other users that someone joined
        await manager.send_to_room(
            room_id,
            {
                "type": "user_joined",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

        # Send room information to newly connected user
        room_result = await db.execute(
            select(BargainRoom).where(BargainRoom.room_id == room_id)
        )
        room = room_result.scalar_one()

        await websocket.send_text(
            json.dumps(
                {
                    "type": "room_info",
                    "room": {
                        "room_id": room_id,
                        "room_type": room.room_type,
                        "status": room.status,
                        "current_bid_price": float(room.current_bid_price),
                        "quantity": room.initial_quantity,
                    },
                }
            )
        )

        # Listen for messages
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            message_type = message_data.get("type")

            if message_type == "ping":
                # Respond to ping to keep connection alive
                await websocket.send_text(
                    json.dumps(
                        {"type": "pong", "timestamp": datetime.utcnow().isoformat()}
                    )
                )

            elif message_type == "typing":
                # Broadcast typing indicator to other users
                await manager.send_to_room(
                    room_id,
                    {
                        "type": "typing",
                        "user_id": user_id,
                        "is_typing": message_data.get("is_typing", False),
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                )

            elif message_type == "chat_message":
                # Handle chat messages during bargaining
                content = message_data.get("content", "").strip()
                if content:
                    # Save message to database
                    chat_message = BargainMessage(
                        room_id=room_id,
                        user_id=user.user_id,
                        message_type="text",
                        content=content,
                    )
                    db.add(chat_message)
                    await db.commit()
                    await db.refresh(chat_message)

                    # Broadcast to all users in room
                    await manager.send_to_room(
                        room_id,
                        {
                            "type": "new_message",
                            "message": {
                                "message_id": str(chat_message.message_id),
                                "user_id": user_id,
                                "content": content,
                                "created_at": chat_message.created_at.isoformat(),
                            },
                        },
                    )

            elif message_type == "get_recent_activity":
                # Send recent bids and messages to user
                bids_result = await db.execute(
                    select(BargainBid)
                    .where(BargainBid.room_id == room_id)
                    .order_by(desc(BargainBid.created_at))
                    .limit(10)
                )
                recent_bids = bids_result.scalars().all()

                messages_result = await db.execute(
                    select(BargainMessage)
                    .where(BargainMessage.room_id == room_id)
                    .order_by(desc(BargainMessage.created_at))
                    .limit(20)
                )
                recent_messages = messages_result.scalars().all()

                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "recent_activity",
                            "bids": [
                                {
                                    "bid_id": str(bid.bid_id),
                                    "user_type": bid.user_type,
                                    "bid_price": float(bid.bid_price),
                                    "quantity": bid.quantity,
                                    "message": bid.message,
                                    "created_at": bid.created_at.isoformat(),
                                }
                                for bid in recent_bids
                            ],
                            "messages": [
                                {
                                    "message_id": str(msg.message_id),
                                    "user_id": str(msg.user_id),
                                    "content": msg.content,
                                    "created_at": msg.created_at.isoformat(),
                                }
                                for msg in recent_messages
                            ],
                        }
                    )
                )

            else:
                # Unknown message type
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "error",
                            "message": f"Unknown message type: {message_type}",
                        }
                    )
                )

    except WebSocketDisconnect:
        pass  # Normal disconnect
    except Exception as e:
        # Log error and close connection
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_text(
                json.dumps({"type": "error", "message": "Internal server error"})
            )
        except:
            pass
    finally:
        # Clean up connection
        if user:
            user_id = str(user.user_id)
            manager.disconnect(room_id, user_id)

            # Notify other users that someone left
            try:
                await manager.send_to_room(
                    room_id,
                    {
                        "type": "user_left",
                        "user_id": user_id,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                )
            except:
                pass  # Room might be empty now

        if db:
            await db.close()
