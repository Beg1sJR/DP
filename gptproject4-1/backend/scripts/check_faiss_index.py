import faiss
import numpy as np

# Проверяем наличие файлов
index_path = "logs_faiss.index"
ids_path = "log_ids.npy"

try:
    index = faiss.read_index(index_path)
    print(f"✅ FAISS индекс '{index_path}' успешно загружен.")
    print(f"   Размерность: {index.d} | Кол-во векторов: {index.ntotal}")
except Exception as e:
    print(f"❌ Ошибка при загрузке FAISS индекса: {e}")

try:
    ids = np.load(ids_path)
    print(f"✅ Массив ID '{ids_path}' успешно загружен.")
    print(f"   Кол-во ID: {len(ids)}")
except Exception as e:
    print(f"❌ Ошибка при загрузке массива ID: {e}")

# (Необязательно) Попробуем сделать поисковый запрос по случайному вектору
import numpy as np
if 'index' in locals() and index.ntotal > 0:
    dim = index.d
    # Генерируем случайный вектор той же размерности
    random_vector = np.random.rand(1, dim).astype('float32')
    distances, indices = index.search(random_vector, 5)
    print("🔍 Пример поиска (по случайному вектору):")
    print("   Индексы найденных:", indices)
    print("   Расстояния:", distances)