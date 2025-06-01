from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend import models, schemas, auth
from backend.models import UserRole, User, Company
from backend.database import get_db
from backend.core.security import get_current_user, check_role
import uuid
from backend.models import LoginHistory
from fastapi import Request
import geoip2.database

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=schemas.TokenResponse)
def login(user_data: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter_by(username=user_data.username).first()
    ip = request.client.host
    country = "—"
    city = "—"
    try:
        with geoip2.database.Reader("backend/data/GeoLite2-City.mmdb") as reader:
            response = reader.city(ip)
            country = response.country.name or "—"
            city = response.city.name or "—"
    except Exception as e:
        print(f"GeoIP lookup failed for {ip}: {e}")

    if not db_user or not auth.verify_password(user_data.password, db_user.password_hash):
        db.add(models.LoginHistory(
            user_id=db_user.id if db_user else None,
            ip_address=ip,
            country=country,
            city=city,
            success=False
        ))
        db.commit()
        raise HTTPException(401, detail="Неверный логин или пароль")

    token = auth.create_access_token({
        "sub": db_user.username,
        "username": db_user.username,
        "role": db_user.role,
        "company_id": db_user.company_id
    })
    db.add(models.LoginHistory(
        user_id=db_user.id,
        ip_address=ip,
        country=country,
        city=city,
        success=True
    ))
    db.commit()
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def get_me(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    company = db.query(Company).filter_by(id=user.company_id).first()
    return {
        "username": user.username,
        "role": user.role,
        "company_id": user.company_id,
        "company_name": company.name if company else "—"
    }
