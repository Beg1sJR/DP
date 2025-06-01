from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import datetime

from backend.database import get_db
from backend.models import Report, LogAnalysis, User
from backend.schemas import ReportOut, ReportCreateRequest
from backend.core.security import get_current_user, check_role
from backend.securitygpt import generate_report_summary

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("", response_model=list[ReportOut])
def list_reports(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return (
        db.query(Report)
        .filter_by(company_id=user.company_id)
        .order_by(Report.created_at.desc())
        .all()
    )

@router.get("/{report_id}", response_model=ReportOut)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    report = db.query(Report).filter_by(id=report_id, company_id=user.company_id).first()
    if not report:
        raise HTTPException(404, detail="Отчёт не найден")
    return report

@router.delete("/{report_id}")
def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])
    report = db.query(Report).filter_by(id=report_id, company_id=user.company_id).first()
    if not report:
        raise HTTPException(404, detail="Отчёт не найден")
    db.delete(report)
    db.commit()
    return {"detail": "Удалено"}



@router.post("/generate", response_model=ReportOut)
def generate_report(
    body: ReportCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])

    logs = db.query(LogAnalysis).filter(
        LogAnalysis.company_id == user.company_id,
        LogAnalysis.timestamp >= body.from_date,
        LogAnalysis.timestamp <= body.to_date
    ).all()

    if not logs:
        raise HTTPException(404, detail="Логи не найдены за указанный период")

    summary = generate_report_summary(logs[:20])

    mitres = set(l.mitre_id for l in logs if l.mitre_id)
    mitre_ids = ",".join(mitres)

    report = Report(
        id=str(uuid4()),
        company_id=user.company_id,
        title=f"Аналитический отчёт ({body.from_date.date()} — {body.to_date.date()})",
        content=summary,
        insights="Автоматически сгенерировано на основе логов",
        mitre_ids=mitre_ids,
        stats=f"Total logs: {len(logs)}"
    )

    db.add(report)
    db.commit()
    db.refresh(report)
    return report
