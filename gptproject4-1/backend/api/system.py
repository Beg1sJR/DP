import psutil
from fastapi import APIRouter, Depends

from backend.core.security import check_role, get_current_user

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/metrics")
async def get_system_metrics(
        user=Depends(get_current_user)
):
    check_role(user, ["ADMIN", "ANALYST", "VIEWER"])

    # CPU
    cpu_percent = psutil.cpu_percent(interval=0.2)
    cpu_count_logical = psutil.cpu_count()
    cpu_count_physical = psutil.cpu_count(logical=False)
    cpu_freq = psutil.cpu_freq()

    # MEMORY
    virt_mem = psutil.virtual_memory()

    # DISK
    disk = psutil.disk_usage('/')

    # NETWORK
    net = psutil.net_io_counters()

    # TEMPERATURES (может не поддерживаться)
    try:
        temps = psutil.sensors_temperatures()
    except Exception:
        temps = {}

    return {
        "cpu": {
            "percent": cpu_percent,
            "count_logical": cpu_count_logical,
            "count_physical": cpu_count_physical,
            "freq": cpu_freq._asdict() if cpu_freq else None
        },
        "memory": {
            "total": virt_mem.total,
            "used": virt_mem.used,
            "available": virt_mem.available,
            "free": virt_mem.free,
            "percent": virt_mem.percent
        },
        "disk": {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percent": disk.percent
        },
        "net": {
            "bytes_sent": net.bytes_sent,
            "bytes_recv": net.bytes_recv
        },
        "temperatures": temps  # Словарь с температурой по датчикам, если есть поддержка
    }