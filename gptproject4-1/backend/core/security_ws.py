import os

from fastapi import WebSocket, status, Depends
from fastapi.exceptions import WebSocketException
from jose import jwt, JWTError
from backend.models import User
from backend.database import get_db
from sqlalchemy.orm import Session

SECRET_KEY = "AP9Bn7yo4jgIpq8Auc_froG3D9Hq4jxKjdNZVsr3lRU"
print(SECRET_KEY)
ALGORITHM = "HS256"
print("WS AUTH FILE LOADED")
async def get_current_user_ws(
    websocket: WebSocket,
    db: Session = Depends(get_db)
):
    print("WS AUTH FILE LOADED2")

    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("username") or payload.get("sub")
        if username is None:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
    except JWTError as e:
        print("JWTError:", e)
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
    print("WS: payload =", payload)
    # Обязательно проверь пользователя в БД!
    user = db.query(User).filter_by(username=username).first()
    print("WS: username from payload =", username)
    print("WS: user from db =", user)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
    return user