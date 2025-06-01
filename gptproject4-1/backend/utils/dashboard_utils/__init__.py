from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models import LogAnalysis

def get_dashboard_stats(db: Session, company_id: str):
    query = db.query(LogAnalysis).filter_by(company_id=company_id)

    attack_counts = (
        query.with_entities(LogAnalysis.attack_type, func.count().label("count"))
        .group_by(LogAnalysis.attack_type)
        .order_by(func.count().desc())
        .all()
    )

    mitre_counts = (
        query.with_entities(LogAnalysis.mitre_id, func.count().label("count"))
        .filter(LogAnalysis.mitre_id != None)
        .group_by(LogAnalysis.mitre_id)
        .all()
    )

    # Формируем attack_types и top_3_attacks как массивы объектов
    attack_types = [
        {"name": a, "count": b} for a, b in attack_counts
    ]
    top_3_attacks = attack_types[:3]

    # То же для mitre_ids
    top_mitre_ids = [
        {"mitre_id": a, "count": b} for a, b in mitre_counts
    ]

    return {
        "total_logs": query.count(),
        "total_analyzed": query.count(),
        "attacks_detected": query.filter(LogAnalysis.attack_type != "Нет атаки").count(),
        "high_risk_attacks": query.filter(LogAnalysis.probability >= 70).count(),
        "attack_types": attack_types,
        "top_mitre_ids": top_mitre_ids,
        "top_3_attacks": top_3_attacks,
    }