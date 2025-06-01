# auth.py

from jose import JWTError, jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

# 🔐 Константы
SECRET_KEY = os.getenv("JWT_KEY")
print("SECRET_KEY", SECRET_KEY)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# 🔐 OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# 🔐 Хеширование
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 🧑 Модель пользователя (в токене)
class User(BaseModel):
    username: str
    role: str
    company_id: str

class TokenPayload(BaseModel):
    sub: str
    role: str
    company_id: str
    exp: int





# ✅ Исправленная генерация токена — теперь принимает dict
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# 🔒 Проверка пароля
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# 🔐 Хеширование пароля
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# 🔍 Извлечение payload из токена
def get_token_payload(token: str = Depends(oauth2_scheme)) -> TokenPayload:
    print("🔐 Incoming token:", token)
    print("🔑 Using secret key:", SECRET_KEY)

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("✅ Decoded payload:", payload)
        return TokenPayload(**payload)
    except JWTError as e:
        print("❌ JWT decode error:", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


