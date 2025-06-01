from typing import Dict, Optional, List
from enum import Enum
from datetime import datetime
from pydantic import BaseModel

# 🎭 Роли
class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"


# 👤 Запросы
class UserCreate(BaseModel):
    username: str
    password: str


class UserCreateWithRole(UserCreate):
    role: UserRole


# 📦 Компания
class CompanyCreate(BaseModel):
    company_name: str
    admin_username: str
    admin_password: str


class CompanyOut(BaseModel):
    id: str
    name: str
    user_count: int

    class Config:
        orm_mode = True


# 🔐 Токен
class TokenResponse(BaseModel):
    access_token: str
    token_type: str

# 🔐 Данные токена (для проверки в JWT)
class TokenData(BaseModel):
    username: Optional[str] = None


# 👤 Пользователь
class UserResponse(BaseModel):
    id: int
    username: str
    role: UserRole
    company_id: str

    class Config:
        from_attributes = True


# 🧾 Логи
class LogCreate(BaseModel):
    log_text: str
    source: str

class ReportOut(BaseModel):
    id: str
    title: str
    content: str
    insights: str
    mitre_ids: str
    stats: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReportCreateRequest(BaseModel):
    from_date: datetime
    to_date: datetime




# 📊 Статистика
class AttackTypeOut(BaseModel):
    name: str
    count: int

class MitreIdOut(BaseModel):
    mitre_id: str
    count: int

class StatsResponse(BaseModel):
    total_logs: int
    total_analyzed: int
    attacks_detected: int
    high_risk_attacks: int
    attack_types: List[AttackTypeOut]
    top_mitre_ids: List[MitreIdOut]
    top_3_attacks: List[AttackTypeOut]

class ForecastResponse(BaseModel):
    id: int
    attack_type: str
    confidence: float
    expected_time: str
    target_ip: str
    reasoning: str

    class Config:
        from_attributes = True




from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LogAnalysisOut(BaseModel):
    id: int
    ip: Optional[str]
    log_text: Optional[str]
    source: Optional[str]
    attack_type: Optional[str]
    mitre_id: Optional[str]
    probability: Optional[float]
    recommendation: Optional[str]
    country: Optional[str]
    city: Optional[str]
    severity_windows: Optional[str]
    severity_syslog: Optional[str]
    timestamp: Optional[datetime]
    company_id: Optional[str]
    created_at: Optional[datetime]
    status: Optional[str]
    resolved_by: Optional[str]
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True  # для pydantic v2
        # orm_mode = True        # для pydantic v1


class LoginEntry(BaseModel):
    ip_address: str
    country: Optional[str] = None
    city: Optional[str] = None
    timestamp: datetime
    success: bool

    class Config:
        orm_mode = True


