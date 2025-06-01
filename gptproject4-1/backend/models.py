from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum as PyEnum
from .database import Base
import uuid

# 🎭 Роли
class UserRole(str, PyEnum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"

# 🏢 Компания
class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)

    users = relationship("User", back_populates="company", cascade="all, delete")
    logs = relationship("LogAnalysis", backref="company", cascade="all, delete")
    forecasts = relationship("Forecast", back_populates="company", cascade="all, delete")
    reports = relationship("Report", back_populates="company", cascade="all, delete")

# 👤 Пользователь
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.VIEWER, nullable=False)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)

    company = relationship("Company", back_populates="users")

# 📥 Лог


# 🔮 Прогноз
class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    attack_type = Column(String)
    confidence = Column(Float)
    expected_time = Column(String)
    target_ip = Column(String)
    reasoning = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    company_id = Column(String, ForeignKey("companies.id"))

    company = relationship("Company", back_populates="forecasts")

# 📝 Отчёт
class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"))
    title = Column(String)
    content = Column(Text)
    insights = Column(Text)
    mitre_ids = Column(String)  # через запятую
    stats = Column(Text)        # JSON-строка
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="reports")

# В Company:
Company.reports = relationship("Report", back_populates="company", cascade="all, delete-orphan")


class LogAnalysis(Base):
    __tablename__ = "log_analysis"

    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String)
    log_text = Column(Text)
    source = Column(String)
    attack_type = Column(String)
    mitre_id = Column(String)
    probability = Column(Float)
    recommendation = Column(Text)
    country = Column(String)
    city = Column(String)
    severity_windows = Column(String)
    severity_syslog = Column(String)
    timestamp = Column(DateTime)  # точное время события
    company_id = Column(String, ForeignKey("companies.id"))
    created_at = Column(DateTime, default=func.now())
    status = Column(String, default="Активна", nullable=False)  # или "Заблокирована"
    resolved_by = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    def as_dict(self):
        d = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        print("as_dict result types:", {k: type(v) for k, v in d.items()})
        return d


class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ip_address = Column(String)
    country = Column(String)
    city = Column(String)  # ← добавили город
    timestamp = Column(DateTime, default=datetime.utcnow)
    success = Column(Boolean, default=True)  # добавлено поле

    user = relationship("User", back_populates="login_entries")


User.login_entries = relationship("LoginHistory", back_populates="user")
