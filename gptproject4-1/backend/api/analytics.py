import re
from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract, func, cast, Date
import geoip2.database
from datetime import datetime, timedelta
from backend.database import get_db
from backend.models import LogAnalysis, User
from backend.core.security import get_current_user, check_role

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/severity")
def get_severity_analytics(user = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])

    logs = db.query(LogAnalysis).filter_by(company_id=user.company_id).all()

    windows_counter = Counter()
    syslog_counter = Counter()

    for log in logs:
        if log.severity_windows:
            windows_counter[log.severity_windows] += 1
        if log.severity_syslog:
            syslog_counter[log.severity_syslog] += 1

    return {
        "windows": windows_counter,
        "syslog": syslog_counter
    }


@router.get("/hourly-activity")
def get_hourly_activity(user = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])

    hourly_counts = db.query(
        extract('hour', LogAnalysis.timestamp).label("hour"),
        func.count().label("count")
    ).filter(
        LogAnalysis.company_id == user.company_id
    ).group_by("hour").order_by("hour").all()

    result = [0] * 24
    for hour, count in hourly_counts:
        result[int(hour)] = count

    return {"hourly_activity": result}


@router.get("/summary")
def get_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])

    logs = db.query(LogAnalysis).filter_by(company_id=user.company_id).all()

    types = Counter([log.attack_type for log in logs])
    risks = {"low": 0, "medium": 0, "high": 0}
    mitre = Counter([log.mitre_id for log in logs if log.mitre_id])

    for log in logs:
        p = log.probability
        if p < 30:
            risks["low"] += 1
        elif p < 70:
            risks["medium"] += 1
        else:
            risks["high"] += 1

    top_mitre = dict(mitre.most_common(5))

    return {
        "attack_types": dict(types),
        "risk_levels": risks,
        "top_mitre": top_mitre
    }


@router.get("/geolocation")
def get_geo_stats(
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])

    logs = db.query(LogAnalysis).filter_by(company_id=user.company_id).all()
    ip_regex = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")

    result = []

    city_reader = geoip2.database.Reader("backend/data/GeoLite2-City.mmdb")
    asn_reader = geoip2.database.Reader("backend/data/GeoLite2-ASN.mmdb")

    for log in logs:
        text = f"{log.ip or ''} {log.log_text or ''}"
        ips = set(ip_regex.findall(text))
        for ip in ips:
            try:
                city_info = city_reader.city(ip)
                asn_info = asn_reader.asn(ip)

                country = city_info.country.name or "Unknown"
                city = city_info.city.name or "—"
                lat = city_info.location.latitude
                lon = city_info.location.longitude
                asn = asn_info.autonomous_system_number
                org = asn_info.autonomous_system_organization

            except:
                country, city, lat, lon = "Unknown", "—", None, None
                asn, org = None, None

            result.append({
                "ip": ip,
                "country": country,
                "city": city,
                "lat": lat,
                "lon": lon,
                "asn": asn,
                "organization": org
            })

    city_reader.close()
    asn_reader.close()

    return {"geodata": result}
