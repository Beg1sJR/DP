import os
import requests
from fastapi import FastAPI, Request
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


INDEX_PATH = "backend/logs_faiss.index"
DRIVE_FILE_ID = os.getenv("FAISS_INDEX_ID")

def download_index_from_gdrive(file_id, dest_path):
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    response = requests.get(url)
    if response.status_code == 200:
        with open(dest_path, "wb") as f:
            f.write(response.content)
        print("Индекс успешно скачан с Google Drive!")
    else:
        print("Ошибка скачивания индекса с Google Drive:", response.status_code)

if not os.path.exists(INDEX_PATH):
    print("Файл индекса не найден, скачиваем...")
    download_index_from_gdrive(DRIVE_FILE_ID, INDEX_PATH)
else:
    print("Файл индекса уже есть локально.")

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.openapi = lambda: custom_openapi(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dp-delta-one.vercel.app"],
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

