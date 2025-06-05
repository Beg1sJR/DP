from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import LogAnalysis, Forecast
from backend.schemas import ForecastResponse
from backend.core.security import get_current_user, check_role
from backend.securitygpt import forecast_attack_with_gpt, notify_telegram

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("/next-attack")
def forecast_next_attack(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])

    logs = (
        db.query(LogAnalysis)
        .filter_by(company_id=user.company_id)
        .order_by(LogAnalysis.id.desc())
        .limit(20)
        .all()
    )

    if not logs:
        raise HTTPException(404, detail="Недостаточно логов")

    forecast = forecast_attack_with_gpt("\n".join([l.log_text for l in logs]))

    db_forecast = Forecast(
        attack_type=forecast["type"],
        confidence=forecast["confidence"],
        expected_time=forecast["expected_time"],
        target_ip=forecast["target_ip"],
        reasoning=forecast["reasoning"],
        company_id=user.company_id
    )
    db.add(db_forecast)
    db.commit()

    if not forecast:
        raise HTTPException(500, detail="GPT не вернул прогноз")

    if forecast["confidence"] >= 80:
        notify_telegram(f"🔮 Атака: {forecast['type']} (уверенность: {forecast['confidence']}%)")

    return forecast


@router.get("/last", response_model=ForecastResponse)
def get_last_forecast(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])

    forecast = (
        db.query(Forecast)
        .filter_by(company_id=user.company_id)
        .order_by(Forecast.created_at.desc())
        .first()
    )


    return forecast


# backend/api/forecast.py

@router.get("/all")
def get_all_forecasts(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])

    forecasts = (
        db.query(Forecast)
        .filter_by(company_id=user.company_id)
        .order_by(Forecast.created_at.desc())
        .all()
    )
    return forecasts
