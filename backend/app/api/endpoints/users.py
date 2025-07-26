from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from cassandra.cluster import Session

from app.db.models import UserProfileResponse, UserProfileUpdate, UserInDB
from app.db.crud import update_user_in_db
from app.core.security import get_current_user # This will now work if get_scylla_session is correctly used
from app.db.scylla import get_scylla_session


router = APIRouter()

@router.get("/user/profile", response_model=UserProfileResponse)
async def read_user_profile(
    current_user: Annotated[UserInDB, Depends(get_current_user)]
):
    # get_current_user already fetches the complete UserInDB object
    return UserProfileResponse(
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        avatar=current_user.avatar,
        metadata=current_user.metadata,
        date_created=current_user.date_created,
        chatted_bot_names=current_user.chatted_bot_names
    )

@router.put("/user/profile", response_model=UserProfileResponse)
async def update_user_profile_endpoint(
    profile_update: UserProfileUpdate,
    current_user: Annotated[UserInDB, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_scylla_session)]
):
    updated_user = update_user_in_db(session, current_user.username, profile_update)
    if not updated_user: # Should not happen if current_user exists
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found during update")

    return UserProfileResponse(
        username=updated_user.username,
        email=updated_user.email,
        full_name=updated_user.full_name,
        avatar=updated_user.avatar,
        metadata=updated_user.metadata,
        date_created=updated_user.date_created,
        chatted_bot_names=updated_user.chatted_bot_names
    )