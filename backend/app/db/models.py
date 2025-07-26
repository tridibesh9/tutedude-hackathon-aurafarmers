import uuid
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, Numeric, Date, ForeignKey, Float
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

class Buyer(Base):
    __tablename__ = "buyers"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("base_users.user_id"), primary_key=True)
    shipping_address = Column(Text, nullable=True)
    shipping_pincode = Column(String(10), nullable=True)
    
    # Relationships
    base_user = relationship("BaseUser", back_populates="buyer_profile")
    orders = relationship("Order", back_populates="buyer")
    ratings = relationship("Rating", back_populates="buyer")

class Seller(Base):
    __tablename__ = "sellers"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("base_users.user_id"), primary_key=True)
    seller_address = Column(Text, nullable=True)
    seller_pincode = Column(String(10), nullable=True)
    seller_rating = Column(Float, default=0.0)
    
    # Relationships
    base_user = relationship("BaseUser", back_populates="seller_profile")
    products = relationship("Product", back_populates="seller")
    orders = relationship("Order", back_populates="seller")

class Product(Base):
    __tablename__ = "products"
    
    product_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.user_id"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Float, default=0.0)
    stock = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    seller = relationship("Seller", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    ratings = relationship("Rating", back_populates="product")

class Order(Base):
    __tablename__ = "orders"
    
    order_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("buyers.user_id"), nullable=False)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.user_id"), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    order_status = Column(String(50), default="Pending")  # Pending, Shipped, Delivered, Cancelled
    estimated_delivery_date = Column(Date, nullable=True)
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    buyer = relationship("Buyer", back_populates="orders")
    seller = relationship("Seller", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order")
    ratings = relationship("Rating", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    order_item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.order_id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_per_unit = Column(Numeric(10, 2), nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")

class Rating(Base):
    __tablename__ = "ratings"
    
    rating_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.order_id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id"), nullable=False)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("buyers.user_id"), nullable=False)
    product_rating = Column(Integer, nullable=False)  # 1-5 scale
    seller_rating = Column(Integer, nullable=False)   # 1-5 scale
    review_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="ratings")
    product = relationship("Product", back_populates="ratings")
    buyer = relationship("Buyer", back_populates="ratings")

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
    discount: float = Field(default=0.0, ge=0, le=100)
    stock: int = Field(default=0, ge=0)

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = Field(None, gt=0)
    discount: Optional[float] = Field(None, ge=0, le=100)
    stock: Optional[int] = Field(None, ge=0)

class ProductResponse(BaseModel):
    product_id: uuid.UUID
    seller_id: uuid.UUID
    name: str
    category: str
    price: Decimal
    discount: float
    stock: int
    rating: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# Order Models
class OrderCreate(BaseModel):
    seller_id: uuid.UUID
    estimated_delivery_date: Optional[date] = None

class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(..., gt=0)

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

# Rating Models
class RatingCreate(BaseModel):
    product_rating: int = Field(..., ge=1, le=5)
    seller_rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None

class RatingResponse(BaseModel):
    rating_id: uuid.UUID
    order_id: uuid.UUID
    product_id: uuid.UUID
    buyer_id: uuid.UUID
    product_rating: int
    seller_rating: int
    review_text: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Authentication Models
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str  # "buyer", "seller", or "both"

class TokenData(BaseModel):
    email: Optional[str] = None

# Combined User Registration
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



