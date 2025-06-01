import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend import schemas, auth
from backend.database import get_db
from backend.models import Company, User
from backend.schemas import CompanyCreate, CompanyOut
from backend.core.security import get_current_user, check_role
from backend.models import UserRole
from backend.utils.companies_utils import get_user_count_for_company

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("", response_model=List[CompanyOut])
def get_companies(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")

    companies = db.query(Company).all()
    results = []

    for company in companies:
        user_count = db.query(User).filter_by(company_id=company.id).count()
        results.append({
            "id": company.id,
            "name": company.name,
            "user_count": user_count
        })

    return results


@router.patch("/{company_id}", response_model=CompanyOut)
def update_company_name(
    company_id: str,
    data: CompanyCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    company = db.query(Company).filter_by(id=company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Компания не найдена")

    company.name = data.company_name
    db.commit()
    db.refresh(company)
    return company


@router.delete("/{company_id}", status_code=204)
def delete_company(
    company_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Только SUPER_ADMIN может удалять компании")

    company = db.query(Company).filter_by(id=company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Компания не найдена")

    db.delete(company)
    db.commit()
    return


@router.get("/user-count")
def get_user_count_for_company_endpoint(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    check_role(user, ["SUPER_ADMIN", "ADMIN", "ANALYST", "VIEWER"])  # или нужные тебе роли
    count = get_user_count_for_company(db, user.company_id)
    return {"count": count}

@router.post("/register-company", response_model=schemas.TokenResponse)
def register_company(
    data: schemas.CompanyCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Только SUPER_ADMIN может создавать компании")

    if db.query(Company).filter_by(name=data.company_name).first():
        raise HTTPException(400, detail="Такая компания уже существует")

    company = Company(id=str(uuid.uuid4()), name=data.company_name)
    db.add(company)
    db.commit()
    db.refresh(company)

    admin = User(
        username=data.admin_username,
        password_hash=auth.get_password_hash(data.admin_password),
        role=UserRole.ADMIN,
        company_id=company.id
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    token = auth.create_access_token({
        "sub": admin.username,
        "username": admin.username,
        "role": admin.role,
        "company_id": admin.company_id
    })

    return {"access_token": token, "token_type": "bearer"}
