import io
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import LogAnalysis
from backend.core.security import get_current_user, check_role

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/csv")
def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST"])

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Файл должен быть CSV")

    content = file.file.read()
    df = pd.read_csv(io.BytesIO(content))
    df.columns = df.columns.str.strip()

    possible_columns = [
        ('Destination Port', 'Flow Duration', 'Total Fwd Packets', 'Label'),
        ('Dst Port', 'Flow Duration', 'Fwd Pkts', 'Label'),
        ('dst_port', 'duration', 'fwd_packets', 'label')
    ]

    for cols in possible_columns:
        if all(c in df.columns for c in cols):
            col_port, col_dur, col_pkt, col_label = cols
            break
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Нужные колонки не найдены. Обнаружены: {df.columns.tolist()}"
        )

    df = df[[col_port, col_dur, col_pkt, col_label]].dropna()

    for _, row in df.iterrows():
        log_text = f"Порт: {int(row[col_port])}, Длительность: {int(row[col_dur])}, Пакеты: {int(row[col_pkt])}"
        log = LogAnalysis(
            ip="0.0.0.0",  # неизвестен
            log_text=log_text,
            attack_type=row[col_label],
            mitre_id=None,
            probability=0.0,
            recommendation=None,
            country=None,
            city=None,
            severity_windows=None,
            severity_syslog=None,
            timestamp=datetime.utcnow(),
            company_id=user.company_id,
            status="Активна"
        )
        db.add(log)

    db.commit()
    return {"message": f"Загружено логов: {len(df)}"}
