from sqlalchemy.orm import Session
from backend.models import User

def get_user_count_for_company(db: Session, company_id: str) -> int:
    return db.query(User).filter_by(company_id=company_id).count()