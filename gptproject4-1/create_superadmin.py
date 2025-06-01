from backend.database import SessionLocal
from backend.models import User, Company, UserRole
from backend.auth import pwd_context, create_access_token
import uuid

db = SessionLocal()
try:
    # ✅ Уникальный ID компании
    company_id = "GLOBAL"

    # Проверяем, есть ли такая компания
    company = db.query(Company).filter_by(id=company_id).first()
    if not company:
        company = Company(id=company_id, name="Global Company")
        db.add(company)
        db.commit()
        print(f"✅ Компания создана: {company.name}")

    # Проверяем, есть ли супер-админ
    existing_admin = db.query(User).filter_by(username="superadmin").first()
    if existing_admin:
        print("⚠️ superadmin уже существует. Пропускаем создание.")
    else:
        admin = User(
            username="superadmin",
            password_hash=pwd_context.hash("123123"),  # 🔐 Пароль можешь поменять
            role=UserRole.SUPER_ADMIN,
            company_id=company_id
        )
        db.add(admin)
        db.commit()
        print("✅ superadmin создан")

        # Генерируем токен
        token = create_access_token({
            "sub": admin.username,
            "role": admin.role,
            "company_id": admin.company_id
        })
        print("🎫 JWT токен супер-админа:", token)
finally:
    db.close()
