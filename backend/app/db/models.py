import uuid
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Boolean,
    Integer,
    Text,
    Numeric,
    Date,
    ForeignKey,
    Float,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base

# SQLAlchemy Models (Database Tables)


class BaseUser(Base):
    __tablename__ = "base_users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    mobile_number = Column(String(20), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    buyer_profile = relationship("Buyer", back_populates="base_user", uselist=False)
    seller_profile = relationship("Seller", back_populates="base_user", uselist=False)
    inventories = relationship("Inventory", back_populates="user")


class Buyer(Base):
    __tablename__ = "buyers"

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("base_users.user_id"), primary_key=True
    )
    shipping_address = Column(Text, nullable=True)
    shipping_pincode = Column(String(10), nullable=True)

    # Relationships
    base_user = relationship("BaseUser", back_populates="buyer_profile")
    orders = relationship("Order", back_populates="buyer")
    product_ratings = relationship("ProductRating", back_populates="buyer")
    seller_ratings = relationship("SellerRating", back_populates="buyer")
    bargain_rooms = relationship("BargainRoom", foreign_keys="BargainRoom.buyer_id")


class Seller(Base):
    __tablename__ = "sellers"

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("base_users.user_id"), primary_key=True
    )
    seller_address = Column(Text, nullable=True)
    seller_pincode = Column(String(10), nullable=True)
    seller_rating = Column(Float, default=0.0)

    # Relationships
    base_user = relationship("BaseUser", back_populates="seller_profile")
    products = relationship("Product", back_populates="seller")
    orders = relationship("Order", back_populates="seller")
    seller_ratings = relationship("SellerRating", back_populates="seller")
    bargain_rooms = relationship("BargainRoom", foreign_keys="BargainRoom.seller_id")


class Product(Base):
    __tablename__ = "products"

    product_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id = Column(
        UUID(as_uuid=True), ForeignKey("sellers.user_id"), nullable=False
    )
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    rating = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    seller = relationship("Seller", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    product_ratings = relationship("ProductRating", back_populates="product")
    inventories = relationship("Inventory", back_populates="product")
    bargain_rooms = relationship("BargainRoom", back_populates="product")


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("buyers.user_id"), nullable=False)
    seller_id = Column(
        UUID(as_uuid=True), ForeignKey("sellers.user_id"), nullable=False
    )
    total_price = Column(Numeric(10, 2), nullable=False)
    order_status = Column(
        String(50), default="Pending"
    )  # Pending, Shipped, Delivered, Cancelled
    estimated_delivery_date = Column(Date, nullable=True)
    order_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    buyer = relationship("Buyer", back_populates="orders")
    seller = relationship("Seller", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    order_item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.order_id"), nullable=False)
    product_id = Column(
        UUID(as_uuid=True), ForeignKey("products.product_id"), nullable=False
    )
    quantity = Column(Integer, nullable=False)
    price_per_unit = Column(Numeric(10, 2), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")


class ProductRating(Base):
    __tablename__ = "product_ratings"

    rating_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(
        UUID(as_uuid=True), ForeignKey("products.product_id"), nullable=False
    )
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("buyers.user_id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 scale
    review_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", back_populates="product_ratings")
    buyer = relationship("Buyer", back_populates="product_ratings")


class SellerRating(Base):
    __tablename__ = "seller_ratings"

    rating_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id = Column(
        UUID(as_uuid=True), ForeignKey("sellers.user_id"), nullable=False
    )
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("buyers.user_id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    review_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    seller = relationship("Seller", back_populates="seller_ratings")
    buyer = relationship("Buyer", back_populates="seller_ratings")


class Inventory(Base):
    __tablename__ = "inventories"
    inventory_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(
        UUID(as_uuid=True), ForeignKey("products.product_id"), nullable=False
    )
    quantity = Column(Integer, nullable=False, default=0)
    discount = Column(Float, default=0.0)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("base_users.user_id"), nullable=False
    )
    expiry_date = Column(
        Date, nullable=True
    )  # Optional expiry date for the inventory item
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="inventories")
    user = relationship("BaseUser", back_populates="inventories")


class BargainRoom(Base):
    __tablename__ = "bargain_rooms"

    room_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(
        UUID(as_uuid=True), ForeignKey("products.product_id"), nullable=False
    )
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("buyers.user_id"), nullable=False)
    seller_id = Column(
        UUID(as_uuid=True), ForeignKey("sellers.user_id"), nullable=True
    )  # Null for public bids
    room_type = Column(String(20), nullable=False)  # "public" or "private"
    status = Column(String(20), default="active")  # active, closed, accepted, rejected
    initial_quantity = Column(Integer, nullable=False)
    initial_bid_price = Column(Numeric(10, 2), nullable=False)
    current_bid_price = Column(Numeric(10, 2), nullable=False)
    location_pincode = Column(String(10), nullable=False)  # For location-based matching
    expires_at = Column(
        DateTime(timezone=True), nullable=True
    )  # Auto-expire public bids
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    product = relationship("Product")
    buyer = relationship("Buyer", foreign_keys=[buyer_id])
    seller = relationship("Seller", foreign_keys=[seller_id])
    bids = relationship("BargainBid", back_populates="room")
    messages = relationship("BargainMessage", back_populates="room")


class BargainBid(Base):
    __tablename__ = "bargain_bids"

    bid_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(
        UUID(as_uuid=True), ForeignKey("bargain_rooms.room_id"), nullable=False
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("base_users.user_id"), nullable=False
    )
    user_type = Column(String(10), nullable=False)  # "buyer" or "seller"
    bid_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    message = Column(Text, nullable=True)  # Optional message with bid
    is_counter_offer = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    room = relationship("BargainRoom", back_populates="bids")
    user = relationship("BaseUser")


class BargainMessage(Base):
    __tablename__ = "bargain_messages"

    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(
        UUID(as_uuid=True), ForeignKey("bargain_rooms.room_id"), nullable=False
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("base_users.user_id"), nullable=False
    )
    message_type = Column(
        String(20), default="text"
    )  # text, offer, acceptance, rejection
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    room = relationship("BargainRoom", back_populates="messages")
    user = relationship("BaseUser")


# Pydantic Models (API Request/Response)


# Base User Models
class BaseUserCreate(BaseModel):
    email: EmailStr
    mobile_number: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=6)


class BaseUserResponse(BaseModel):
    user_id: uuid.UUID
    email: EmailStr
    mobile_number: str
    created_at: datetime
    buyer_id: Optional[uuid.UUID] = None
    seller_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True


class BaseUserInDB(BaseUserResponse):
    password_hash: str


# Buyer Models
class BuyerCreate(BaseModel):
    shipping_address: Optional[str] = None
    shipping_pincode: Optional[str] = None


class BuyerUpdate(BaseModel):
    shipping_address: Optional[str] = None
    shipping_pincode: Optional[str] = None


class BuyerResponse(BaseModel):
    user_id: uuid.UUID
    shipping_address: Optional[str]
    shipping_pincode: Optional[str]

    class Config:
        from_attributes = True


# Seller Models
class SellerCreate(BaseModel):
    seller_address: Optional[str] = None
    seller_pincode: Optional[str] = None


class SellerUpdate(BaseModel):
    seller_address: Optional[str] = None
    seller_pincode: Optional[str] = None


class SellerResponse(BaseModel):
    user_id: uuid.UUID
    seller_address: Optional[str]
    seller_pincode: Optional[str]
    seller_rating: float

    class Config:
        from_attributes = True


# Product Models
class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    price: Decimal = Field(..., gt=0)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = Field(None, gt=0)


class ProductResponse(BaseModel):
    product_id: uuid.UUID
    seller_id: uuid.UUID
    name: str
    category: str
    price: Decimal
    rating: float
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Add Inventory Models
class InventoryCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(..., ge=0)
    discount: float = Field(default=0.0, ge=0, le=100)
    expiry_date: Optional[date] = None


class InventoryUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)
    discount: Optional[float] = Field(None, ge=0, le=100)
    expiry_date: Optional[date] = None


class InventoryResponse(BaseModel):
    inventory_id: uuid.UUID
    product_id: uuid.UUID
    user_id: uuid.UUID
    quantity: int
    discount: float
    expiry_date: Optional[date]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Fix Rating Models to match your separate tables
class ProductRatingCreate(BaseModel):
    product_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None


class ProductRatingResponse(BaseModel):
    rating_id: uuid.UUID
    product_id: uuid.UUID
    buyer_id: uuid.UUID
    rating: int
    review_text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SellerRatingCreate(BaseModel):
    seller_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None


class SellerRatingResponse(BaseModel):
    rating_id: uuid.UUID
    seller_id: uuid.UUID
    buyer_id: uuid.UUID
    rating: int
    review_text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Update Order Models
class OrderCreate(BaseModel):
    seller_id: uuid.UUID
    estimated_delivery_date: Optional[date] = None


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    price_per_unit: Decimal = Field(..., gt=0)


class OrderItemResponse(BaseModel):
    order_item_id: uuid.UUID
    order_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    price_per_unit: Decimal

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    order_id: uuid.UUID
    buyer_id: uuid.UUID
    seller_id: uuid.UUID
    total_price: Decimal
    order_status: str
    estimated_delivery_date: Optional[date]
    order_date: datetime

    class Config:
        from_attributes = True


class OrderWithItemsResponse(BaseModel):
    order_id: uuid.UUID
    buyer_id: uuid.UUID
    seller_id: uuid.UUID
    total_price: Decimal
    order_status: str
    estimated_delivery_date: Optional[date]
    order_date: datetime
    order_items: List[OrderItemResponse]

    class Config:
        from_attributes = True


# Combined response models for better API responses
class ProductWithInventoryResponse(BaseModel):
    product_id: uuid.UUID
    seller_id: uuid.UUID
    name: str
    category: str
    price: Decimal
    rating: float
    created_at: datetime
    inventory: Optional[InventoryResponse] = None

    class Config:
        from_attributes = True


# Keep existing authentication models as they are correct
# UserLogin, Token, TokenData, UserRegister, BaseUserCreate, etc.


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str  # "buyer", "seller", or "both"


class TokenData(BaseModel):
    email: Optional[str] = None


class UserRegister(BaseModel):
    email: EmailStr
    mobile_number: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=6)
    user_type: str = Field(..., pattern="^(buyer|seller|both)$")
    # Buyer fields (optional)
    shipping_address: Optional[str] = None
    shipping_pincode: Optional[str] = None
    # Seller fields (optional)
    seller_address: Optional[str] = None
    seller_pincode: Optional[str] = None


class BaseUserCreate(BaseModel):
    email: EmailStr
    mobile_number: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=6)


# Bargaining Pydantic Models
class BargainRoomCreate(BaseModel):
    product_id: uuid.UUID
    seller_id: Optional[uuid.UUID] = None  # None for public bargaining
    room_type: str = Field(..., pattern="^(public|private)$")
    quantity: int = Field(..., gt=0)
    initial_bid_price: Decimal = Field(..., gt=0)
    location_pincode: str = Field(..., min_length=5, max_length=10)
    expires_in_hours: Optional[int] = Field(24, ge=1, le=168)  # 1 hour to 1 week


class BargainBidCreate(BaseModel):
    bid_price: Decimal = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    message: Optional[str] = Field(None, max_length=500)
    is_counter_offer: bool = False


class BargainMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    message_type: str = Field(
        default="text", pattern="^(text|offer|acceptance|rejection)$"
    )


class BargainRoomResponse(BaseModel):
    room_id: uuid.UUID
    product_id: uuid.UUID
    buyer_id: uuid.UUID
    seller_id: Optional[uuid.UUID]
    room_type: str
    status: str
    initial_quantity: int
    initial_bid_price: Decimal
    current_bid_price: Decimal
    location_pincode: str
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class BargainBidResponse(BaseModel):
    bid_id: uuid.UUID
    room_id: uuid.UUID
    user_id: uuid.UUID
    user_type: str
    bid_price: Decimal
    quantity: int
    message: Optional[str]
    is_counter_offer: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BargainMessageResponse(BaseModel):
    message_id: uuid.UUID
    room_id: uuid.UUID
    user_id: uuid.UUID
    message_type: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class BargainRoomWithDetailsResponse(BaseModel):
    room_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_category: str
    product_price: Decimal
    buyer_id: uuid.UUID
    seller_id: Optional[uuid.UUID]
    room_type: str
    status: str
    initial_quantity: int
    initial_bid_price: Decimal
    current_bid_price: Decimal
    location_pincode: str
    expires_at: Optional[datetime]
    created_at: datetime
    recent_bids: List[BargainBidResponse]
    recent_messages: List[BargainMessageResponse]

    class Config:
        from_attributes = True


class PublicBargainResponse(BaseModel):
    room_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_category: str
    original_price: Decimal
    buyer_id: uuid.UUID
    buyer_location: str
    quantity: int
    current_bid_price: Decimal
    expires_at: Optional[datetime]
    created_at: datetime
    total_seller_responses: int

    class Config:
        from_attributes = True
