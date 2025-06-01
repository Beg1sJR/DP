from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import LogAnalysis
from backend.core.security import get_current_user, check_role
from backend.securitygpt import explain_log_with_gpt

router = APIRouter(prefix="/explain", tags=["Explain"])


@router.get("/{log_id}")
def explain_log(
    log_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])

    log = db.query(LogAnalysis).filter_by(id=log_id, company_id=user.company_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Лог не найден или нет доступа")

    explanation = explain_log_with_gpt(log.log_text)
    return {
        "log_id": log.id,
        "log_text": log.log_text,
        "explanation": explanation
    }
