from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql://postgres:NEBHQVEvrEfUXoCWxcrnLTlxDnUCpZqz@dp-production-f7cf.up.railway.app:5432/railway"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# backend/database.py

from sqlalchemy.orm import Session

# ... (engine, SessionLocal, Base уже есть выше)

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
