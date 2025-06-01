import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import re
from backend.database import get_db
from backend.models import LogAnalysis, Report
from backend.core.security import get_current_user, check_role

router = APIRouter(prefix="/export", tags=["Export"])



def extract_date_range_from_title(title: str) -> tuple[datetime, datetime]:
    match = re.search(r"\((\d{4}-\d{2}-\d{2}) — (\d{4}-\d{2}-\d{2})\)", title)
    if not match:
        raise ValueError("Невозможно извлечь дату из заголовка отчета")

    from_date = datetime.strptime(match.group(1), "%Y-%m-%d")
    to_date = datetime.strptime(match.group(2), "%Y-%m-%d")
    return from_date, to_date

@router.get("/csv")
def export_csv(
    id: str = Query(..., description="Report ID"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])

    logs = db.query(LogAnalysis).filter_by(company_id=user.company_id).all()
    if not logs:
        raise HTTPException(404, detail="Нет логов для экспорта")

    df = pd.DataFrame([{
        "Log ID": l.id,
        "IP": l.ip,
        "Attack": l.attack_type,
        "MITRE": l.mitre_id,
        "Probability": l.probability,
        "Recommendation": l.recommendation,
        "Country": l.country,
        "City": l.city,
        "Timestamp": l.timestamp,
        "Status": l.status,
        "Resolved By": l.resolved_by,
        "Resolved At": l.resolved_at
    } for l in logs])

    buffer = io.StringIO()
    df.to_csv(buffer, index=False, encoding="utf-8-sig")
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=report_{id}.csv"}
    )


@router.get("/excel")
def export_excel(
    id: str = Query(..., description="Report ID"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])

    logs = db.query(LogAnalysis).filter_by(company_id=user.company_id).all()
    if not logs:
        raise HTTPException(404, detail="Нет логов для экспорта")

    df = pd.DataFrame([{
        "Лог ID": l.id,
        "IP": l.ip,
        "Тип атаки": l.attack_type,
        "MITRE": l.mitre_id,
        "Вероятность": l.probability,
        "Рекомендация": l.recommendation,
        "Страна": l.country,
        "Город": l.city,
        "Время": l.timestamp,
        "Статус": l.status,
        "Устранено кем": l.resolved_by,
        "Когда устранено": l.resolved_at
    } for l in logs])

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Логи")
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=report_{id}.xlsx"}
    )


@router.get("/txt")
def export_txt(
    id: str = Query(..., description="Report ID"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])

    report = db.query(Report).filter_by(id=id, company_id=user.company_id).first()
    if not report:
        raise HTTPException(404, detail="Отчёт не найден")

    content = f"{report.title} ({report.created_at.strftime('%Y-%m-%d %H:%M')})\n\n"
    content += report.content
    content += "\n\n" + "=" * 50 + "\n\n"

    buffer = io.StringIO(content)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=report_{id}.txt"}
    )



@router.get("/raw/csv")
def export_raw_logs_csv(
    id: str = Query(..., description="Report ID"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])

    report = db.query(Report).filter_by(id=id, company_id=user.company_id).first()
    if not report:
        raise HTTPException(404, detail="Отчёт не найден")

    # ВАЖНО: использовать диапазон из заголовка отчёта!
    try:
        from_date, to_date = extract_date_range_from_title(report.title)
        # Если нужно включить последний день полностью:
        to_date = to_date + timedelta(days=1)
    except Exception as e:
        raise HTTPException(400, detail=str(e))

    logs = db.query(LogAnalysis).filter(
        LogAnalysis.company_id == user.company_id,
        LogAnalysis.timestamp >= from_date,
        LogAnalysis.timestamp < to_date
    ).all()

    df = pd.DataFrame([{
        "ID": log.id,
        "Источник": log.source,
        "Текст": log.log_text,
        "Время": log.timestamp,
    } for log in logs])

    buf = io.StringIO()
    df.to_csv(buf, index=False, encoding="utf-8-sig")
    buf.seek(0)

    print(f"FROM: {from_date}, TO: {to_date}, COMPANY: {user.company_id}")
    print(f"Найдено логов: {len(logs)}")

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=raw_logs_{id}.csv"}
    )
@router.get("/raw/xlsx")
def export_raw_logs_xlsx(
    id: str = Query(..., description="Report ID"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])

    report = db.query(Report).filter_by(id=id, company_id=user.company_id).first()
    if not report:
        raise HTTPException(404, detail="Отчёт не найден")

    # Используем диапазон дат из заголовка отчета
    try:
        from_date, to_date = extract_date_range_from_title(report.title)
        to_date = to_date + timedelta(days=1)  # чтобы включить последний день полностью
    except Exception as e:
        raise HTTPException(400, detail=str(e))

    logs = db.query(LogAnalysis).filter(
        LogAnalysis.company_id == user.company_id,
        LogAnalysis.timestamp >= from_date,
        LogAnalysis.timestamp < to_date
    ).all()

    df = pd.DataFrame([{
        "ID": log.id,
        "Источник": log.source,
        "Текст": log.log_text,
        "Время": log.timestamp,
    } for log in logs])

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Raw Logs")

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=raw_logs_{id}.xlsx"}
    )


@router.get("/analyzed/csv")
def export_analyzed_logs_csv(
    id: str = Query(..., description="Report ID"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])

    report = db.query(Report).filter_by(id=id, company_id=user.company_id).first()
    if not report:
        raise HTTPException(404, detail="Отчёт не найден")

    try:
        from_date, to_date = extract_date_range_from_title(report.title)
        to_date = to_date + timedelta(days=1)
    except Exception as e:
        raise HTTPException(400, detail=str(e))

    logs = db.query(LogAnalysis).filter(
        LogAnalysis.company_id == user.company_id,
        LogAnalysis.timestamp >= from_date,
        LogAnalysis.timestamp < to_date
    ).all()

    df = pd.DataFrame([{
        "ID": l.id,
        "IP": l.ip,
        "Тип атаки": l.attack_type,
        "MITRE": l.mitre_id,
        "Вероятность": l.probability,
        "Рекомендация": l.recommendation,
        "Страна": l.country,
        "Город": l.city,
        "Время": l.timestamp,
        "Статус": l.status,
        "Устранено кем": l.resolved_by,
        "Когда устранено": l.resolved_at
    } for l in logs])

    buf = io.StringIO()
    df.to_csv(buf, index=False, encoding="utf-8-sig")
    buf.seek(0)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=analyzed_logs_{id}.csv"}
    )


@router.get("/analyzed/xlsx")
def export_analyzed_logs_xlsx(
    id: str = Query(..., description="Report ID"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])

    report = db.query(Report).filter_by(id=id, company_id=user.company_id).first()
    if not report:
        raise HTTPException(404, detail="Отчёт не найден")

    try:
        from_date, to_date = extract_date_range_from_title(report.title)
        to_date = to_date + timedelta(days=1)
    except Exception as e:
        raise HTTPException(400, detail=str(e))

    logs = db.query(LogAnalysis).filter(
        LogAnalysis.company_id == user.company_id,
        LogAnalysis.timestamp >= from_date,
        LogAnalysis.timestamp < to_date
    ).all()

    df = pd.DataFrame([{
        "ID": l.id,
        "IP": l.ip,
        "Тип атаки": l.attack_type,
        "MITRE": l.mitre_id,
        "Вероятность": l.probability,
        "Рекомендация": l.recommendation,
        "Страна": l.country,
        "Город": l.city,
        "Время": l.timestamp,
        "Статус": l.status,
        "Устранено кем": l.resolved_by,
        "Когда устранено": l.resolved_at
    } for l in logs])

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Analyzed Logs")

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=analyzed_logs_{id}.xlsx"}
    )