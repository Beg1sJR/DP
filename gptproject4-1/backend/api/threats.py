from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db
from backend.models import LogAnalysis
from backend.core.security import get_current_user, check_role
from backend.schemas import LogAnalysisOut

router = APIRouter(prefix="/threats", tags=["Threats"])


@router.patch("/{log_id}/resolve")
def resolve_threat(
    log_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])

    threat = db.query(LogAnalysis).filter_by(id=log_id, company_id=user.company_id).first()
    if not threat:
        raise HTTPException(404, detail="Угроза не найдена")

    if threat.status == "Заблокирована":
        return {"message": "Угроза уже заблокирована"}

    threat.status = "Заблокирована"
    threat.resolved_by = user.username
    threat.resolved_at = datetime.utcnow()
    db.commit()

    return {"message": "Угроза успешно заблокирована"}


@router.get("/{log_id}", response_model=LogAnalysisOut)
def get_threat_by_id(
    log_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])

    threat = db.query(LogAnalysis).filter_by(id=log_id, company_id=user.company_id).first()
    if not threat:
        raise HTTPException(404, detail="Угроза не найдена или нет доступа")

    return threat
