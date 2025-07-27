from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import models
from app.db.database import get_db_session
from app.db.models import (
    ProductRatingCreate,
    ProductRatingResponse,
    SellerRatingCreate,
    SellerRatingResponse,
)

router = APIRouter()


# Endpoint to add a product rating
@router.post(
    "/product",
    response_model=ProductRatingResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_product_rating(
    rating_in: ProductRatingCreate,
    buyer_id: str,
    db: Session = Depends(get_db_session),
):
    # Check if product exists
    product = (
        db.query(models.Product)
        .filter(models.Product.product_id == rating_in.product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Create ProductRating
    rating = models.ProductRating(
        product_id=rating_in.product_id,
        buyer_id=buyer_id,
        rating=rating_in.rating,
        review_text=rating_in.review_text,
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating


# Endpoint to add a seller rating
@router.post(
    "/seller", response_model=SellerRatingResponse, status_code=status.HTTP_201_CREATED
)
def add_seller_rating(
    rating_in: SellerRatingCreate,
    buyer_id: str,
    db: Session = Depends(get_db_session),
):
    # Check if seller exists
    seller = (
        db.query(models.Seller)
        .filter(models.Seller.user_id == rating_in.seller_id)
        .first()
    )
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    # Create SellerRating
    rating = models.SellerRating(
        seller_id=rating_in.seller_id,
        buyer_id=buyer_id,
        rating=rating_in.rating,
        review_text=rating_in.review_text,
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating
