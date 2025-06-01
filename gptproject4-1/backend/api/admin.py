from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from backend import schemas, models, auth
from backend.database import get_db
from backend.models import User, Company, UserRole, LogAnalysis
from backend.schemas import UserResponse
from backend.core.security import get_current_user, check_role
from backend.utils.ws_manager import notify_dashboard_update

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users-count")
def get_admin_stats(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),

):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    user_count = db.query(User).filter_by(company_id=user.company_id).count()
    log_count = db.query(LogAnalysis).filter_by(company_id=user.company_id).count()
    company = db.query(Company).filter_by(id=user.company_id).first()

    return {
        "userCount": user_count,
        "logCount": log_count,
        "companyName": company.name if company else "Без названия"
    }


@router.post("/create-user", response_model=schemas.UserResponse)
def create_user(
    data: schemas.UserCreateWithRole,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),

):
    check_role(user, ["ADMIN"])

    if db.query(models.User).filter_by(username=data.username).first():
        raise HTTPException(400, detail="Имя пользователя уже занято")

    new_user = User(
        username=data.username,
        password_hash=auth.get_password_hash(data.password),
        role=data.role,
        company_id=user.company_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    background_tasks.add_task(notify_dashboard_update, db, user.company_id)


    return new_user



@router.get("/users", response_model=List[UserResponse])
def get_users_by_company(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    return db.query(User).filter_by(company_id=user.company_id).all()


@router.get("/logs-count")
def get_logs_count(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    total_logs = db.query(LogAnalysis).filter_by(company_id=user.company_id).count()
    analyzed_logs = (
        db.query(LogAnalysis)
        .filter(LogAnalysis.company_id == user.company_id)
        .filter(LogAnalysis.attack_type != "Нет атаки")
        .count()
    )

    return {
        "total_logs": total_logs,
        "analyzed_logs": analyzed_logs
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    target = db.query(User).filter_by(id=user_id, company_id=user.company_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if target.role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Нельзя удалить администратора")

    db.delete(target)
    db.commit()
    return {"message": "Пользователь удалён"}
