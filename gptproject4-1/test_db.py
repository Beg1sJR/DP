from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:postgres@localhost/cyber_ai_db"

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    print("✅ PostgreSQL подключён успешно!")
except Exception as e:
    print("❌ Ошибка подключения к PostgreSQL:", e)
