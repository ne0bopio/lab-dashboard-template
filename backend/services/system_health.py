"""
System health — CPU, memory, disk, uptime from /proc.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)


def get_uptime() -> float:
    """Get system uptime in seconds from /proc/uptime."""
    try:
        content = Path("/proc/uptime").read_text()
        return float(content.split()[0])
    except Exception:
        return 0.0


def get_uptime_formatted() -> str:
    """Get human-readable uptime."""
    secs = get_uptime()
    days = int(secs // 86400)
    hours = int((secs % 86400) // 3600)
    mins = int((secs % 3600) // 60)
    if days > 0:
        return f"{days}d {hours}h {mins}m"
    elif hours > 0:
        return f"{hours}h {mins}m"
    else:
        return f"{mins}m"


def get_cpu_percent() -> float:
    """Get approximate CPU usage from /proc/stat."""
    try:
        with open("/proc/stat") as f:
            line = f.readline()
        parts = line.split()
        # user, nice, system, idle, iowait, irq, softirq, steal
        user = int(parts[1])
        nice = int(parts[2])
        system = int(parts[3])
        idle = int(parts[4])
        iowait = int(parts[5]) if len(parts) > 5 else 0

        total = user + nice + system + idle + iowait
        active = user + nice + system

        if total == 0:
            return 0.0
        return round((active / total) * 100, 1)
    except Exception:
        return 0.0


def get_memory_percent() -> float:
    """Get memory usage from /proc/meminfo."""
    try:
        meminfo = {}
        with open("/proc/meminfo") as f:
            for line in f:
                parts = line.split(":")
                if len(parts) == 2:
                    key = parts[0].strip()
                    val = int(parts[1].strip().split()[0])  # kB
                    meminfo[key] = val

        total = meminfo.get("MemTotal", 1)
        available = meminfo.get("MemAvailable", 0)
        used = total - available
        return round((used / total) * 100, 1)
    except Exception:
        return 0.0


def get_disk_percent(path: str = "/") -> float:
    """Get disk usage for a given path."""
    try:
        stat = os.statvfs(path)
        total = stat.f_blocks * stat.f_frsize
        free = stat.f_bfree * stat.f_frsize
        used = total - free
        if total == 0:
            return 0.0
        return round((used / total) * 100, 1)
    except Exception:
        return 0.0


def get_system_metrics() -> dict:
    """Get full system health snapshot."""
    return {
        "uptime_seconds": get_uptime(),
        "uptime_formatted": get_uptime_formatted(),
        "cpu_percent": get_cpu_percent(),
        "memory_percent": get_memory_percent(),
        "disk_percent": get_disk_percent("/"),
    }
