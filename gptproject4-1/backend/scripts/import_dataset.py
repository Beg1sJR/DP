# backend/import_dataset.py
import pandas as pd
import sqlite3
import sys
import os

FILENAME = "../../datasets/Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv"
if len(sys.argv) > 1:
    FILENAME = sys.argv[1]

if not os.path.exists(FILENAME):
    print(f"❌ Файл {FILENAME} не найден")
    sys.exit(1)

print(f"📄 Загружаем файл: {FILENAME}")
df = pd.read_csv(FILENAME, low_memory=False)
df.columns = df.columns.str.strip()

# Умный подбор названий колонок
port_candidates = ['Destination Port', 'Dst Port', 'dst_port']
dur_candidates = ['Flow Duration', 'duration']
pkt_candidates = ['Total Fwd Packets', 'Tot Fwd Pkts', 'Fwd Pkts', 'fwd_packets', 'TotLen Fwd Pkts']
label_candidates = ['Label', 'label']

found = False
for port_col in port_candidates:
    for dur_col in dur_candidates:
        for pkt_col in pkt_candidates:
            for label_col in label_candidates:
                if all(c in df.columns for c in [port_col, dur_col, pkt_col, label_col]):
                    col_port, col_dur, col_pkt, col_label = port_col, dur_col, pkt_col, label_col
                    found = True
                    break
            if found: break
        if found: break
    if found: break

if not found:
    print("❌ Не удалось найти нужные колонки в датасете.")
    print("Найденные колонки:", df.columns.tolist())
    sys.exit(1)

df = df[[col_port, col_dur, col_pkt, col_label]].dropna()

df['log_text'] = df.apply(
    lambda row: f"Порт: {int(float(row[col_port]))}, Длительность: {int(float(row[col_dur]))}, Пакеты: {int(float(row[col_pkt]))}",
    axis=1
)

def map_label(label):
    label = str(label).lower()
    if 'dos' in label:
        return 'DDoS', 'T1499', 'Ограничить трафик, включить защиту от DoS'
    elif 'benign' in label or 'normal' in label:
        return 'Нет атаки', '', ''
    elif 'portscan' in label:
        return 'Port Scan', 'T1046', 'Ограничить сканирование'
    elif 'bruteforce' in label:
        return 'Brute Force', 'T1110', 'Ограничить попытки входа'
    else:
        return 'Неизвестно', '', ''

df[['attack_type', 'mitre_id', 'recommendation']] = df[col_label].apply(lambda x: pd.Series(map_label(x)))

# Сохраняем в SQLite
conn = sqlite3.connect("../../security_logs.db")
df[['log_text', 'attack_type', 'mitre_id', 'recommendation']].to_sql("logs", conn, if_exists="append", index=False)
conn.close()

print(f"✅ Успешно импортировано: {len(df)} логов в базу данных.")
