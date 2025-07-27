from fastapi import APIRouter, Depends, HTTPException
from backend.app.db import crud, models, database
from typing import List

router = APIRouter()


# Endpoint: List all surplus items (for buyers)
@router.get("/surplus-items", response_model=List[models.Inventory])
def list_surplus_items():
    db = database.get_db()
    return crud.get_surplus_items(db)


# Endpoint: Buy a surplus item
@router.post("/buy-surplus/{item_id}")
def buy_surplus_item(item_id: int, buyer_id: int):
    db = database.get_db()
    try:
        return crud.buy_surplus_item(db, item_id, buyer_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
