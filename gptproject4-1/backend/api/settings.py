from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.core.security import get_current_user
from backend.models import LoginHistory, User
from typing import List

from backend.schemas import LoginEntry

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/login-history", response_model=List[LoginEntry])
def get_login_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    entries = (
        db.query(LoginHistory)
        .filter_by(user_id=user.id)
        .order_by(LoginHistory.timestamp.desc())
        .limit(50)
        .all()
    )
    # print(f"login-history response for user {user.id}: {[e.__dict__ for e in entries]}")
    return entries

@router.get("/login-history/last5", response_model=List[LoginEntry])
def get_last_5_logins(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    entries = (
        db.query(LoginHistory)
        .filter_by(user_id=user.id)
        .order_by(LoginHistory.timestamp.desc())
        .limit(5)
        .all()
    )
    # print([LoginEntry.from_orm(e).dict() for e in entries])
    # print(f"login-history/last5 response for user {user.id}: {[e.__dict__ for e in entries]}")
    return entries