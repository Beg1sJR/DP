from sqlalchemy.orm import Session
from backend.models import LogAnalysis

def get_recent_logs(db: Session, company_id: str, limit: int = 5):
    return (
        db.query(LogAnalysis)
        .filter_by(company_id=company_id)
        .order_by(LogAnalysis.timestamp.desc())
        .limit(limit)
        .all()
    )