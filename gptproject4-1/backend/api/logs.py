from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import re
import geoip2.database

from backend import schemas
from backend.database import get_db
from backend.models import LogAnalysis, User
from backend.schemas import LogCreate, LogAnalysisOut
from backend.core.security import get_current_user, check_role
from backend.securitygpt import (
    analyze_log_with_gpt,
    parse_gpt_response,
    notify_telegram,
    ALERT_THRESHOLD
)
from backend.utils.log_utils import get_recent_logs
from backend.utils.ws_manager import notify_dashboard_update, notify_analytics_update, notify_threats_update

router = APIRouter(prefix="/logs", tags=["Logs"])


def extract_ip_from_text(text):
    match = re.search(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", text)
    return match.group(0) if match else "0.0.0.0"

def find_severity(text, keywords):
    text = text.lower()
    for level in keywords:
        if level in text:
            return level
    return None

def process_log(
    log_text: str,
    db: Session,
    user,
    background_tasks: BackgroundTasks,
    source: str = "agent"
):
    ip = extract_ip_from_text(log_text)

    # --- GPT анализ ---
    gpt_response = analyze_log_with_gpt(log_text)
    parsed = parse_gpt_response(gpt_response)

    # --- Геолокация ---
    country = city = None
    try:
        reader = geoip2.database.Reader("backend/data/GeoLite2-City.mmdb")
        response = reader.city(ip)
        country = response.country.name or "Unknown"
        city = response.city.name or "—"
        reader.close()
    except:
        country, city = "Unknown", "—"

    # --- Определение severity ---
    severity_windows = find_severity(log_text, ["success", "information", "failure", "warning", "error"])
    severity_syslog = find_severity(log_text, ["info", "notice", "warning", "debug", "critical", "emergency"])

    timestamp = datetime.utcnow()

    new_analysis = LogAnalysis(
        ip=ip,
        log_text=log_text,
        source=source,
        attack_type=parsed["attack_type"],
        mitre_id=parsed["mitre_id"],
        probability=parsed["probability"],
        recommendation=parsed["recommendation"],
        country=country,
        city=city,
        severity_windows=severity_windows,
        severity_syslog=severity_syslog,
        timestamp=timestamp,
        company_id=user.company_id
    )
    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)

    try:
        probability = parsed.get("probability")
        if probability is not None and probability >= ALERT_THRESHOLD:
            tg_msg = (
                f"🚨 Обнаружена угроза!\n"
                f"Вероятность: {probability}%\n"
                f"MITRE ID: {parsed.get('mitre_id', '-')}\n"
            )
            notify_telegram(tg_msg)
    except Exception as e:
        print("Ошибка при отправке уведомления в Telegram:", str(e))

    # Асинхронное оповещение дашборда через BackgroundTasks
    background_tasks.add_task(notify_dashboard_update, user.company_id)
    background_tasks.add_task(notify_threats_update, user.company_id)
    background_tasks.add_task(notify_analytics_update, user.company_id)

    return new_analysis


@router.post("", response_model=LogAnalysisOut)
def create_log(
    log: LogCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])
    return process_log(log.log_text, db, user, background_tasks, log.source)


@router.post("/from-agent")
async def logs_from_agent(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    logs = await request.json()
    if isinstance(logs, dict):
        logs = [logs]
    results = []
    for log in logs:
        company_id = log.get("company_id")
        if not company_id:
            continue
        system_user = db.query(User).filter_by(company_id=company_id).first()
        if not system_user:
            continue
        log_text = f"{log.get('level','')} {log.get('message','')} ip:{log.get('ip','')}"
        res = process_log(log_text, db, system_user, background_tasks, source="agent")
        results.append(res.id)
    return {"ok": True, "ids": results}


@router.get("/analyzed", response_model=List[LogAnalysisOut])
def get_analyzed_logs(
    skip: int = 0,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])
    return (
        db.query(LogAnalysis)
        .filter_by(company_id=user.company_id)
        .order_by(LogAnalysis.id.desc())
        .offset(skip)
        .all()
    )


@router.get("/analyzed/{log_id}", response_model=LogAnalysisOut)
def get_single_analyzed_log(
    log_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])
    log = (
        db.query(LogAnalysis)
        .filter_by(id=log_id, company_id=user.company_id)
        .first()
    )
    if not log:
        raise HTTPException(404, detail="Лог не найден")
    return log


@router.get("/recent", response_model=List[LogAnalysisOut])
def recent_logs(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    limit: int = 5
):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])
    return get_recent_logs(db, user.company_id, limit)