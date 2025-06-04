import gdown
import openai
import faiss
import numpy as np
import sqlite3
import re

import requests
from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import LogAnalysis
import os
from dotenv import load_dotenv
from collections import Counter
import json

load_dotenv()

# Настройки и переменные
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
ALERT_THRESHOLD = 70  # процент вероятности

# Пути к файлам
INDEX_PATH = os.path.join(os.path.dirname(__file__), "logs_faiss.index")
IDS_PATH = os.path.join(os.path.dirname(__file__), "log_ids.npy")
DRIVE_FILE_ID = os.getenv("FAISS_INDEX_ID")  # ID файла на Google Drive (если используешь автоскачивание)

# INDEX_PATH = os.path.join(os.path.dirname(__file__), "logs_faiss.index")
FILE_ID = "1THFPYvsGfgxbSQvNc8SMYh0CtsWpBnBo"

if not os.path.exists(INDEX_PATH):
    print("Файл индекса не найден, скачиваем из Google Drive...")
    gdown.download(f"https://drive.google.com/uc?id={FILE_ID}", INDEX_PATH, quiet=False)
    # Проверим, что скачан бинарник, а не html:
    with open(INDEX_PATH, "rb") as f:
        head = f.read(100)
        print("First 100 bytes:", head)
# Проверяем наличие ID-файла
if not os.path.exists(IDS_PATH):
    print(f"❌ Не найден файл: {IDS_PATH}. Проверь, что log_ids.npy лежит рядом с logs_faiss.index!")
    raise FileNotFoundError(f"{IDS_PATH} not found")

# Инициализация клиентов
client = openai.OpenAI(api_key=OPENAI_API_KEY)
model = SentenceTransformer("all-MiniLM-L6-v2")

# Отладка: покажем первые байты индекса
with open(INDEX_PATH, "rb") as f:
    head = f.read(100)
    print("First 100 bytes of logs_faiss.index:", head)

# Загрузка FAISS индекса и ID
index = faiss.read_index(INDEX_PATH)
ids = np.load(IDS_PATH)

def get_similar_logs_pg(input_text: str, top_k: int = 3):
    query_vec = model.encode([input_text])
    D, I = index.search(query_vec, top_k)

    db: Session = SessionLocal()
    results = []

    for idx in I[0]:
        log_id = int(ids[idx])
        entry = db.query(LogAnalysis).filter_by(id=log_id).first()

        if entry:
            results.append({
                "log": entry.log_text,
                "type": entry.attack_type,
                "mitre": entry.mitre_id,
                "recommendation": entry.recommendation,
            })

    db.close()
    return results

def build_prompt(similar_logs, input_log):
    context = "\n\n".join([
        f"Пример:\nЛог: {e['log']}\nТип: {e['type']}\nMITRE: {e['mitre']}\nРекомендации: {e['recommendation']}"
        for e in similar_logs
    ])
    return f"""
Ты — SecurityGPT, эксперт по кибербезопасности.
Используй примеры и проанализируй новый лог.

{context}

Новый лог:
{input_log}

Дай ответ в формате:
Тип атаки: ...
MITRE: ...
Вероятность: ...%
Рекомендации: ...
"""

def analyze_log_with_gpt(input_log: str) -> str:
    try:
        similar_logs = get_similar_logs_pg(input_log)
        if similar_logs:
            context = "\n\n".join([
                f"Пример:\nЛог: {e['log']}\nТип: {e['type']}\nMITRE: {e['mitre']}\nРекомендации: {e['recommendation']}"
                for e in similar_logs
            ])
        else:
            context = "Нет похожих логов. Проанализируй лог без примеров."

        prompt = f"""
Ты — SecurityGPT, эксперт по кибербезопасности.
Используй примеры и проанализируй новый лог.

{context}

Новый лог:
{input_log}

Дай ответ в формате:
Тип атаки: ...
MITRE: ...
Вероятность: ...%
Рекомендации: ...
"""

        print("📤 Prompt в analyze_log_with_gpt:\n", prompt)

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=400
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print("⚠️ Ошибка при запросе к GPT:", str(e))
        # Возвращаем безопасный fallback-ответ
        return """Тип атаки: Подозрительная активность
MITRE: T1078
Вероятность: 55%
Рекомендации: Проверьте IP и заблокируйте источник при повторении."""

def parse_gpt_response(response_text: str) -> dict:
    # Значения по умолчанию
    attack_type = "Подозрительная активность"
    mitre = "—"
    recommendation = "Проверьте лог вручную. GPT не дал понятного ответа."
    probability = 50

    try:
        # Гибкие регулярки
        type_match = re.search(r"Тип атаки\s*:\s*(.+)", response_text, re.IGNORECASE)
        mitre_match = re.search(r"MITRE\s*:\s*(.+)", response_text, re.IGNORECASE)
        prob_match = re.search(r"Вероятность\s*:\s*(\d+)", response_text, re.IGNORECASE)
        rec_match = re.search(r"Рекомендации\s*:\s*((?:.|\n)+)", response_text, re.IGNORECASE)

        if type_match:
            attack_type = type_match.group(1).strip()

        if mitre_match:
            mitre = mitre_match.group(1).strip()

        if prob_match:
            probability = int(prob_match.group(1))

        if rec_match:
            recommendation = rec_match.group(1).strip()

    except Exception as e:
        print("⚠️ Ошибка при парсинге GPT-ответа:", str(e))

    return {
        "attack_type": attack_type,
        "mitre_id": mitre,
        "probability": probability,
        "recommendation": recommendation
    }

def forecast_attack_with_gpt(logs_text: str) -> dict | None:
    prompt = f"""
Ты — эксперт по кибербезопасности. Вот последние логи:

{logs_text}

На основе логов предскажи следующую возможную кибератаку. Ответь строго в JSON, без markdown:
{{
  "type": "название атаки",
  "confidence": 0-100,
  "expected_time": "время в ISO-формате",
  "target_ip": "предполагаемый IP",
  "reasoning": "пояснение"
}}
"""

    print("📤 Prompt в forecast_attack_with_gpt:\n", prompt)

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Ты — эксперт по кибербезопасности."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=500
        )

        content = response.choices[0].message.content.strip()
        print("📥 Ответ от GPT:\n", content)

        # Удаляем Markdown-обертку, если есть
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()

        result = json.loads(content)

        required_keys = ["type", "confidence", "expected_time", "target_ip", "reasoning"]
        if all(k in result for k in required_keys):
            return result
        else:
            print("⚠️ Неполный JSON от GPT:", result)
            return None

    except Exception as e:
        print("❌ Ошибка при запросе к GPT:", str(e))
        return None

def generate_report_summary(logs: list[LogAnalysis]) -> str:
    if not logs:
        return "Нет логов для анализа за выбранный период."

    log_texts = [log.log_text for log in logs[:20]]

    # Сбор аналитики
    attack_counter = Counter([l.attack_type for l in logs if l.attack_type and l.attack_type != "Нет атаки"])
    mitre_counter = Counter([l.mitre_id for l in logs if l.mitre_id])
    country_counter = Counter([l.country for l in logs if l.country])
    city_counter = Counter([l.city for l in logs if l.city])
    ip_counter = Counter([l.ip for l in logs if l.ip])
    high_risk_count = sum(1 for l in logs if l.probability >= 70)

    # Форматируем статистику
    stats = f"""
📊 Обнаружено логов: {len(logs)}
🚨 Атак с высоким риском: {high_risk_count}

🛡 ТОП атак:
{chr(10).join(f"- {k}: {v}" for k, v in attack_counter.most_common(5))}

🎯 ТОП MITRE:
{chr(10).join(f"- {k}: {v}" for k, v in mitre_counter.most_common(5))}

🌍 ТОП стран:
{chr(10).join(f"- {k}: {v}" for k, v in country_counter.most_common(3))}

🏙 ТОП городов:
{chr(10).join(f"- {k}: {v}" for k, v in city_counter.most_common(3))}

🔁 Повторяющиеся IP:
{chr(10).join(f"- {k}: {v} раз" for k, v in ip_counter.most_common(3))}
"""

    prompt = f"""
Ты — аналитик SOC. Вот список логов (до 20):

{chr(10).join(log_texts)}

📈 Вот агрегированная статистика:
{stats}

Сформируй управленческий отчёт:
- какие типы атак преобладают
- какие угрозы стоит приоритизировать
- что может свидетельствовать о массовых попытках взлома
- что порекомендуешь предпринять

Ответ представь как пояснительный доклад для руководства (можно с подзаголовками и списками).
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=800
    )

    return response.choices[0].message.content.strip()

def explain_log_with_gpt(log_text: str) -> str:
    prompt = f"""
Ты — эксперт по кибербезопасности. Проанализируй следующий лог:

{log_text}

Объясни, что может происходить, какие признаки возможной атаки ты видишь,
и какие действия стоит предпринять.

Ответ представь в 3-х частях:
1. Возможный тип атаки
2. Обоснование
3. Рекомендации
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=500
    )

    return response.choices[0].message.content.strip()

def notify_telegram(message):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("⚠️ Telegram: переменные окружения не заданы.")
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message
    }

    try:
        response = requests.post(url, data=payload)
        if response.status_code != 200:
            print("❌ Telegram уведомление не отправлено:", response.text)
        else:
            print("✅ Уведомление Telegram отправлено.")
    except Exception as e:
        print("❌ Ошибка при отправке в Telegram:", str(e))