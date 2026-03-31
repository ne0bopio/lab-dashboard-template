"""
Dashboard API routes — full lab snapshot with live data.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from db import get_session
from models import Idea, IdeaStage, PipelineEvent, Room, SystemEvent
from routes.rooms import compute_room_metrics
from services.agent_health import scan_agents_live
from services.system_health import get_system_metrics
from services.tools_health import scan_tools_live

logger = logging.getLogger(__name__)
router = APIRouter(tags=["dashboard"])

LAB_START = datetime(2026, 3, 1, 0, 0, 0)


@router.get("/dashboard", response_model=dict)
def get_dashboard(session: Session = Depends(get_session)):
    """Single fat endpoint — returns full lab snapshot with live data."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # ── Ideas ──────────────────────────────────────────────────
    ideas = session.exec(select(Idea)).all()
    by_stage = {s.value: 0 for s in IdeaStage}
    for idea in ideas:
        stage = idea.stage if idea.stage in [s.value for s in IdeaStage] else "raw"
        by_stage[stage] = by_stage.get(stage, 0) + 1

    # ── Agents (live) ──────────────────────────────────────────
    agents = scan_agents_live()
    agent_active = sum(1 for a in agents if a.get("status") in ("online", "running"))
    agent_error = sum(1 for a in agents if a.get("status") == "error")
    agent_idle = sum(1 for a in agents if a.get("status") == "idle")

    # ── Tools (live) ───────────────────────────────────────────
    tools = scan_tools_live()
    tools_available = sum(1 for t in tools if t.get("health") == "available")
    tools_degraded = sum(1 for t in tools if t.get("health") == "degraded")

    # ── Rooms ──────────────────────────────────────────────────
    rooms = session.exec(select(Room)).all()
    rooms_data = []
    for r in rooms:
        d = r.model_dump()
        d["metrics"] = compute_room_metrics(r, session)
        for field in ["created_at"]:
            val = d.get(field)
            if hasattr(val, "isoformat"):
                d[field] = val.isoformat()
        rooms_data.append(d)

    # ── Recent Events (pipeline + system) ──────────────────────
    pipeline_events = session.exec(
        select(PipelineEvent)
        .order_by(PipelineEvent.timestamp.desc())
        .limit(10)
    ).all()

    system_events = session.exec(
        select(SystemEvent)
        .order_by(SystemEvent.timestamp.desc())
        .limit(10)
    ).all()

    all_events = []
    for e in pipeline_events:
        d = e.model_dump()
        d["category"] = "pipeline"
        all_events.append(d)
    for e in system_events:
        d = e.model_dump()
        d["category"] = "system"
        all_events.append(d)
    all_events.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)

    # ── System Metrics ─────────────────────────────────────────
    system = get_system_metrics()

    return {
        "lab": {
            "name": "Lab Dashboard",
            "status": "operational",
            "uptime_since": LAB_START.isoformat(),
        },
        "system": system,
        "agents": {
            "total": len(agents),
            "active": agent_active,
            "idle": agent_idle,
            "error": agent_error,
            "offline": len(agents) - agent_active - agent_idle - agent_error,
            "list": agents,
        },
        "tools": {
            "total": len(tools),
            "available": tools_available,
            "degraded": tools_degraded,
            "list": tools,
        },
        "rooms": {
            "total": len(rooms),
            "list": rooms_data,
        },
        "ideas": {
            "total": len(ideas),
            "pipeline": by_stage,
        },
        "recent_events": all_events[:10],
        "generated_at": now.isoformat(),
    }


@router.get("/dashboard/health", response_model=dict)
def get_health(session: Session = Depends(get_session)):
    """Lab-wide health summary."""
    agents = scan_agents_live()
    tools = scan_tools_live()
    ideas = session.exec(select(Idea)).all()
    system = get_system_metrics()

    agent_errors = [a for a in agents if a.get("status") == "error"]
    tool_degraded = [t for t in tools if t.get("health") != "available"]
    overall = "healthy" if not agent_errors and not tool_degraded else "degraded"

    return {
        "status": overall,
        "system": system,
        "agents_total": len(agents),
        "agents_online": sum(1 for a in agents if a["status"] in ("online", "idle")),
        "agents_error": len(agent_errors),
        "tools_total": len(tools),
        "tools_available": sum(1 for t in tools if t.get("health") == "available"),
        "tools_degraded": len(tool_degraded),
        "ideas_total": len(ideas),
        "checked_at": datetime.utcnow().isoformat(),
    }
