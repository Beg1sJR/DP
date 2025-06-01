import asyncio

from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.core.security_ws import get_current_user_ws
from backend.utils.ws_manager import add_connection, remove_connection, add_analytics_connection, \
    remove_analytics_connection

from backend.utils.ws_manager import  add_threats_connection, remove_threats_connection

router = APIRouter(prefix="/ws", tags=["WebSocket"])

@router.websocket("/dashboard")
async def dashboard_ws(
    websocket: WebSocket,
    db: Session = Depends(get_db),
    user = Depends(get_current_user_ws)
):
    print("WS ENDPOINT CALLED")
    company_id = user.company_id
    await websocket.accept()
    add_connection(company_id, websocket)

    try:
        while True:
            await asyncio.sleep(60)  # Просто держим соединение открытым
    except WebSocketDisconnect:
        remove_connection(company_id, websocket)

@router.websocket("/threats")
async def ws_threats(
    websocket: WebSocket,
    db: Session = Depends(get_db),
    user = Depends(get_current_user_ws)
):
    print("ws_threats called, company_id:", user.company_id, "user:", user)

    await websocket.accept()
    company_id = user.company_id
    add_threats_connection(company_id, websocket)
    try:
        while True:
            await asyncio.sleep(60)  # Просто держим соединение открытым
    except WebSocketDisconnect:
        remove_threats_connection(company_id, websocket)
    except Exception as e:
        print("WS error:", e)
        remove_threats_connection(company_id, websocket)

@router.websocket("/analytics")
async def analytics_ws(
    websocket: WebSocket,
    db: Session = Depends(get_db),
    user = Depends(get_current_user_ws)
):
    print("analytics_ws called, company_id:", user.company_id, "user:", user)
    await websocket.accept()
    company_id = user.company_id
    add_analytics_connection(company_id, websocket)
    try:
        while True:
            await asyncio.sleep(60)
    except WebSocketDisconnect:
        remove_analytics_connection(company_id, websocket)
    except Exception as e:
        print("WS error (analytics):", e)
        remove_analytics_connection(company_id, websocket)