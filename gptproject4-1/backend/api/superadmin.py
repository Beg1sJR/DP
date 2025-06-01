from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.core.security import get_current_user, check_role
from backend.models import Company, User, LogAnalysis, Forecast

router = APIRouter(prefix="/superadmin", tags=["SuperAdmin"])


@router.get("/company-data/{company_id}")
def get_company_data(company_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    check_role(user, ["SUPER_ADMIN"])

    company = db.query(Company).filter_by(id=company_id).first()
    if not company:
        raise HTTPException(404, detail="Компания не найдена")

    user_count = db.query(User).filter_by(company_id=company_id).count()
    log_count = db.query(LogAnalysis).filter_by(company_id=company_id).count()
    analyzed_count = db.query(LogAnalysis).filter(
        LogAnalysis.company_id == company_id,
        LogAnalysis.probability > 0
    ).count()
    high_risk_count = db.query(LogAnalysis).filter(
        LogAnalysis.company_id == company_id,
        LogAnalysis.probability >= 70
    ).count()

    forecast = db.query(Forecast).filter_by(company_id=company_id).order_by(Forecast.created_at.desc()).first()

    top_3_attacks = (
        db.query(LogAnalysis.attack_type, db.func.count(LogAnalysis.id))
        .filter(LogAnalysis.company_id == company_id, LogAnalysis.attack_type != "Нет атаки")
        .group_by(LogAnalysis.attack_type)
        .order_by(db.func.count(LogAnalysis.id).desc())
        .limit(3)
        .all()
    )

    return {
        "companyName": company.name,
        "userCount": user_count,
        "logCount": log_count,
        "analyzedCount": analyzed_count,
        "highRiskCount": high_risk_count,
        "forecast": {
            "attack_type": forecast.attack_type,
            "confidence": forecast.confidence,
            "expected_time": forecast.expected_time,
            "target_ip": forecast.target_ip,
            "reasoning": forecast.reasoning,
        } if forecast else None,
        "top_3_attacks": top_3_attacks
    }
