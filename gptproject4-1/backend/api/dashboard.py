from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.schemas import StatsResponse
from backend.core.security import get_current_user, check_role
from backend.utils.dashboard_utils import get_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])
    stats = get_dashboard_stats(db, user.company_id)
    return stats