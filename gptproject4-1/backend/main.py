from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import custom_openapi
from backend.database import engine
from backend.models import Base

# 📦 Импортируем роутеры
from backend.api import (
    auth,
    logs,
    forecast,
    reports,
    analytics,
    companies,
    admin,
    explain,
    export,
    upload,
    threats,
    dashboard,
    settings,
    superadmin,
    ws,
    system
)


Base.metadata.create_all(bind=engine)

app = FastAPI()
app.openapi = lambda: custom_openapi(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔌 Подключение роутеров
app.include_router(auth.router)
app.include_router(logs.router)
app.include_router(forecast.router)
app.include_router(reports.router)
app.include_router(analytics.router)
app.include_router(companies.router)
app.include_router(admin.router)
app.include_router(explain.router)
app.include_router(export.router)
app.include_router(upload.router)
app.include_router(threats.router)
app.include_router(dashboard.router)
app.include_router(settings.router)
app.include_router(superadmin.router)

app.include_router(ws.router)
app.include_router(system.router)


print("WS ROUTER REGISTERED")


@app.get("/")
def root():
    return {"msg": "SecurityGPT API работает 🔐"}

# 🔧 Тестовый WebSocket эндпоинт для быстрой диагностики (можно удалить)
@app.websocket("/ws/test")
async def test_ws(websocket):
    print("TEST WS CALLED")
    await websocket.accept()
    await websocket.send_text("WS OK")
    await websocket.close()