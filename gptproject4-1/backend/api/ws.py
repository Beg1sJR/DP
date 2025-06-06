import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.core.security_ws import get_current_user_ws
from backend.utils.ws_manager import (
    add_connection, remove_connection,
    add_analytics_connection, remove_analytics_connection,
    add_threats_connection, remove_threats_connection
)
import json

router = APIRouter(prefix="/ws", tags=["WebSocket"])

@router.websocket("/dashboard")
async def dashboard_ws(websocket: WebSocket):
    print("WS ENDPOINT CALLED")
    user = await get_current_user_ws(websocket)
    company_id = user.company_id
    await websocket.accept()
    add_connection(company_id, websocket)

    try:
        while True:
            # Отправляем ping-сообщение клиенту
            await websocket.send_text(json.dumps({"type": "ping"}))
            await asyncio.sleep(20)  # Пинг каждые 20 секунд
    except WebSocketDisconnect:
        remove_connection(company_id, websocket)
    except Exception as e:
        print("WS error (dashboard):", e)
        remove_connection(company_id, websocket)

@router.websocket("/threats")
async def ws_threats(websocket: WebSocket):
    user = await get_current_user_ws(websocket)
    print("ws_threats called, company_id:", user.company_id, "user:", user)

    await websocket.accept()
    company_id = user.company_id
    add_threats_connection(company_id, websocket)
    try:
        while True:
            await websocket.send_text(json.dumps({"type": "ping"}))
            await asyncio.sleep(20)  # Пинг каждые 20 секунд
    except WebSocketDisconnect:
        remove_threats_connection(company_id, websocket)
    except Exception as e:
        print("WS error (threats):", e)
        remove_threats_connection(company_id, websocket)

@router.websocket("/analytics")
async def analytics_ws(websocket: WebSocket):
    user = await get_current_user_ws(websocket)
    print("analytics_ws called, company_id:", user.company_id, "user:", user)
    await websocket.accept()
    company_id = user.company_id
    add_analytics_connection(company_id, websocket)
    try:
        while True:
            await websocket.send_text(json.dumps({"type": "ping"}))
            await asyncio.sleep(20)  # Пинг каждые 20 секунд
    except WebSocketDisconnect:
        remove_analytics_connection(company_id, websocket)
    except Exception as e:
        print("WS error (analytics):", e)
        remove_analytics_connection(company_id, websocket)