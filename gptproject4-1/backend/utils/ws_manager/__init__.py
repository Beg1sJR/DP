import asyncio
from sqlalchemy.orm import Session

from backend.models import LogAnalysis
from backend.schemas import LogAnalysisOut
from backend.utils.dashboard_utils import get_dashboard_stats
from backend.utils.companies_utils import get_user_count_for_company
from backend.utils.log_utils import get_recent_logs
from backend.database import SessionLocal  # Импортируй фабрику сессий
import json

active_connections = {}

def add_connection(company_id, ws):
    print("DEBUG after add_connection:", active_connections)

    print(f"add_connection company_id={company_id}, ws_id={id(ws)}")
    if company_id not in active_connections:
        active_connections[company_id] = []
    active_connections[company_id].append(ws)

def remove_connection(company_id, ws):
    if company_id in active_connections:
        try:
            active_connections[company_id].remove(ws)
        except ValueError:
            pass

def fix_stats(stats):
    # attack_types: dict -> list of objects
    if "attack_types" in stats and isinstance(stats["attack_types"], dict):
        stats["attack_types"] = [
            {"name": name, "count": count}
            for name, count in stats["attack_types"].items()
        ]
    # top_mitre_ids: dict -> list of objects
    if "top_mitre_ids" in stats and isinstance(stats["top_mitre_ids"], dict):
        stats["top_mitre_ids"] = [
            {"mitre_id": name, "count": count}
            for name, count in stats["top_mitre_ids"].items()
        ]
    # top_3_attacks: list of strings -> list of objects
    if "top_3_attacks" in stats and isinstance(stats["top_3_attacks"], list):
        import ast
        def parse_tuple(s):
            try:
                # Безопасно парсим строку вида "('...', 13)"
                name, count = ast.literal_eval(s)
                return {"name": name, "count": count}
            except Exception:
                return None
        stats["top_3_attacks"] = [
            parse_tuple(item) for item in stats["top_3_attacks"]
        ]
        stats["top_3_attacks"] = [item for item in stats["top_3_attacks"] if item]

        # Если top_3_attacks нет или он пустой, формируем из attack_types
        if (("top_3_attacks" not in stats or not stats["top_3_attacks"])
                and "attack_types" in stats and isinstance(stats["attack_types"], list)):
            # Берём топ-3 по количеству
            sorted_types = sorted(stats["attack_types"], key=lambda x: x["count"], reverse=True)[:3]
            stats["top_3_attacks"] = sorted_types

    return stats

async def notify_dashboard_update(company_id: str):
    print("DEBUG: active_connections =", active_connections)

    db = SessionLocal()
    try:
        if company_id not in active_connections:
            return

        stats = get_dashboard_stats(db, company_id)
        user_count = get_user_count_for_company(db, company_id)
        recent_logs = get_recent_logs(db, company_id, limit=5)

        print("recent_logs types:", [type(log) for log in recent_logs])

        # for log in recent_logs:
        #     try:
        #         log_dict = LogAnalysisOut.from_orm(log).dict()
        #         # for k, v in log_dict.items():
        #             # print(f"{k}: {type(v)}")
        #     except Exception as e:
        #         print("Ошибка при сериализации лога:", e)

        if not isinstance(stats, dict):
            try:
                stats = dict(stats)
            except Exception:
                stats = {"value": str(stats)}

        if not isinstance(user_count, int):
            try:
                user_count = int(user_count[0])
            except Exception:
                try:
                    user_count = int(user_count)
                except Exception:
                    user_count = 0

        stats = fix_stats(stats)

        message = json.dumps({
            "type": "dashboard_update",
            "stats": stats,
            "userCount": user_count,
            "recentLogs": [LogAnalysisOut.from_orm(log).dict() for log in recent_logs],
        }, default=str)  # default=str для сериализации дат

        print("Отправляем обновление по WS для company_id - notify_dashboard_update:", company_id, "клиентов:",
              len(active_threats_connections.get(company_id, [])))

        for ws in active_connections[company_id][:]:
            try:
                await ws.send_text(message)
            except Exception as e:
                print("Ошибка при отправке ws:", e)
                remove_connection(company_id, ws)  # удаляем мёртвые соединения
    finally:
        db.close()


###########################################################################################################################

active_threats_connections = {}

def add_threats_connection(company_id, ws):
    print(f"add_threats_connection: {company_id=}, {id(ws)=}")
    if company_id not in active_threats_connections:
        active_threats_connections[company_id] = []
    active_threats_connections[company_id].append(ws)
    print(f"WS added: {company_id}, total: {len(active_threats_connections[company_id])}")

def remove_threats_connection(company_id, ws):
    if company_id in active_threats_connections:
        try:
            active_threats_connections[company_id].remove(ws)
            print(f"WS removed: {company_id}, total: {len(active_threats_connections[company_id])}")
        except ValueError:
            pass

async def notify_threats_update(company_id: str):
    db = SessionLocal()
    try:
        # Отправляем обновлённый список угроз (анализированных логов)
        logs = (
            db.query(LogAnalysis)
            .filter_by(company_id=company_id)
            .order_by(LogAnalysis.id.desc())
            .limit(50)  # лимит можно поменять
            .all()
        )
        logs_out = [LogAnalysisOut.from_orm(l).dict() for l in logs]
        message = {
            "type": "threats_update",
            "threats": logs_out,
        }
        print("Отправляем обновление по WS для company_id - notify_threats_update:", company_id, "клиентов:",
              len(active_threats_connections.get(company_id, [])))
        for ws in active_threats_connections.get(company_id, [])[:]:
            try:
                await ws.send_text(json.dumps(message, default=str))
            except Exception as e:
                print("WS send error:", e)
                remove_threats_connection(company_id, ws)  # удаляем мёртвые соединения
    finally:
        db.close()

###########################################################################################################################

active_analytics_connections = {}

def add_analytics_connection(company_id, ws):
    if company_id not in active_analytics_connections:
        active_analytics_connections[company_id] = []
    active_analytics_connections[company_id].append(ws)
    print(f'add_analytics_connection company_id={company_id}, ws_id={id(ws)}')

def remove_analytics_connection(company_id, ws):
    if company_id in active_analytics_connections:
        try:
            active_analytics_connections[company_id].remove(ws)
        except ValueError:
            pass
        print(f'remove_analytics_connection company_id={company_id}, ws_id={id(ws)}')
        if not active_analytics_connections[company_id]:
            del active_analytics_connections[company_id]

import json
from backend.database import SessionLocal

###################################################

async def notify_analytics_update(company_id: str):
    db = SessionLocal()
    try:
        from collections import Counter
        from sqlalchemy import extract, func
        import re
        import geoip2.database
        from backend.models import LogAnalysis

        hourly_counts = db.query(
            extract('hour', LogAnalysis.timestamp).label("hour"),
            func.count().label("count")
        ).filter(
            LogAnalysis.company_id == company_id
        ).group_by("hour").order_by("hour").all()
        activity = [0] * 24
        for hour, count in hourly_counts:
            activity[int(hour)] = count

        logs = db.query(LogAnalysis).filter_by(company_id=company_id).all()
        ip_regex = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
        geodata = []
        try:
            city_reader = geoip2.database.Reader("backend/data/GeoLite2-City.mmdb")
            asn_reader = geoip2.database.Reader("backend/data/GeoLite2-ASN.mmdb")
        except Exception as e:
            print("GeoIP DB open error:", e)
            city_reader = None
            asn_reader = None

        for log in logs:
            text = f"{log.ip or ''} {log.log_text or ''}"
            ips = set(ip_regex.findall(text))
            for ip in ips:
                try:
                    if city_reader and asn_reader:
                        city_info = city_reader.city(ip)
                        asn_info = asn_reader.asn(ip)
                        country = city_info.country.name or "Unknown"
                        city = city_info.city.name or "—"
                        lat = city_info.location.latitude
                        lon = city_info.location.longitude
                        asn = asn_info.autonomous_system_number
                        org = asn_info.autonomous_system_organization
                    else:
                        country, city, lat, lon, asn, org = "Unknown", "—", None, None, None, None
                except Exception:
                    country, city, lat, lon, asn, org = "Unknown", "—", None, None, None, None

                geodata.append({
                    "ip": ip,
                    "country": country,
                    "city": city,
                    "lat": lat,
                    "lon": lon,
                    "asn": asn,
                    "organization": org
                })

        if city_reader: city_reader.close()
        if asn_reader: asn_reader.close()

        # --- /analytics/severity ---
        windows_counter = Counter()
        syslog_counter = Counter()
        for log in logs:
            if log.severity_windows:
                windows_counter[log.severity_windows] += 1
            if log.severity_syslog:
                syslog_counter[log.severity_syslog] += 1
        severity = {
            "windows": dict(windows_counter),
            "syslog": dict(syslog_counter)
        }

        # --- /analytics/summary ---
        types = Counter([log.attack_type for log in logs])
        risks = {"low": 0, "medium": 0, "high": 0}
        mitre = Counter([log.mitre_id for log in logs if log.mitre_id])
        for log in logs:
            p = log.probability
            if p < 0.3:
                risks["low"] += 1
            elif p < 0.7:
                risks["medium"] += 1
            else:
                risks["high"] += 1
        top_mitre = dict(mitre.most_common(5))
        attack_types = dict(types)
        risk_levels = risks

        # --- Формируем сообщение ---
        message = {
            "type": "analytics_update",
            "activity": activity,
            "geo": geodata,
            "severity": severity,
            "attack_types": attack_types,
            "risk_levels": risk_levels,
            "mitre_data": top_mitre
        }

        print("Отправляем обновление по WS для company_id - notify_analytics_update:", company_id, "клиентов:",
              len(active_analytics_connections.get(company_id, [])))

        for ws in active_analytics_connections.get(company_id, [])[:]:
            try:
                await ws.send_text(json.dumps(message, default=str))
            except Exception as e:
                print("WS send error (analytics):", e)
                remove_analytics_connection(company_id, ws)
    finally:
        db.close()