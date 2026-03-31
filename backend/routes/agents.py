"""
Agents API routes — live health status from workspace-* directories.
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from db import get_session
from services.agent_health import scan_agents_live
from services.metrics import get_agent_metrics

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("", response_model=List[dict])
def list_agents():
    """List all agents with live health status."""
    return scan_agents_live()


@router.get("/hierarchy", response_model=dict)
def get_hierarchy():
    """Return full agent tree: Orchestrator → specialists → sub-agents."""
    agents = scan_agents_live()

    orchestrator = {
        "id": "agent-orchestrator",
        "name": "Orchestrator",
        "slug": "orchestrator",
        "emoji": "⚡",
        "role": "Main agent — Lab orchestrator",
        "tier": 1,
        "parent": None,
        "children": []
    }

    tier2 = {a["slug"]: {**a, "children": []} for a in agents if a.get("parent") == "orchestrator"}
    tier3 = [a for a in agents if a.get("parent") != "orchestrator"]

    for agent in tier3:
        parent_slug = agent.get("parent")
        if parent_slug in tier2:
            tier2[parent_slug]["children"].append(agent)

    orchestrator["children"] = list(tier2.values())
    return orchestrator


@router.get("/{slug}", response_model=dict)
def get_agent(slug: str):
    """Get agent detail by slug."""
    agents = scan_agents_live()
    for agent in agents:
        if agent["slug"] == slug:
            return agent
    raise HTTPException(status_code=404, detail=f"Agent '{slug}' not found")


@router.get("/{slug}/metrics", response_model=dict)
def get_agent_metrics_endpoint(
    slug: str,
    period: str = Query("7d", regex="^(24h|7d|30d)$"),
    session: Session = Depends(get_session),
):
    """Get time-series metrics for an agent."""
    return get_agent_metrics(session, slug, period)


@router.post("/{slug}/ping", response_model=dict)
def ping_agent(slug: str):
    """Force health check on agent."""
    agents = scan_agents_live()
    for agent in agents:
        if agent["slug"] == slug:
            return {
                "slug": slug,
                "status": agent["status"],
                "health": agent["health"],
                "pinged_at": __import__("datetime").datetime.utcnow().isoformat(),
            }
    raise HTTPException(status_code=404, detail=f"Agent '{slug}' not found")
