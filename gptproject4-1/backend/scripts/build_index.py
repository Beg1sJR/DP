# backend/build_index.py
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import sqlite3
import os

model = SentenceTransformer("all-MiniLM-L6-v2")

print("📥 Загружаем логи из базы...")
conn = sqlite3.connect("../../security_logs.db")
cursor = conn.cursor()
cursor.execute("SELECT rowid, log_text FROM logs")
rows = cursor.fetchall()
conn.close()

texts = [r[1] for r in rows]
ids = [r[0] for r in rows]

print(f"🧠 Генерируем эмбеддинги для {len(texts)} логов...")
embeddings = model.encode(texts, convert_to_numpy=True, batch_size=32, show_progress_bar=True)

dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(embeddings)

faiss.write_index(index, "logs_faiss.index")
np.save("log_ids.npy", np.array(ids))
print("✅ FAISS индекс и ID сохранены!")
