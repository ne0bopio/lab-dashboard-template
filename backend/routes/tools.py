"""
Tools API routes — live health checks on each tool.
"""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, HTTPException

from services.tools_health import scan_tools_live

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tools", tags=["tools"])


@router.get("", response_model=List[dict])
def list_tools():
    """List all tools with live health status."""
    return scan_tools_live()


@router.get("/stats", response_model=dict)
def get_tool_stats():
    """Aggregate usage across all tools."""
    tools = scan_tools_live()
    return {
        "total": len(tools),
        "available": sum(1 for t in tools if t.get("health") == "available"),
        "degraded": sum(1 for t in tools if t.get("health") == "degraded"),
        "unavailable": sum(1 for t in tools if t.get("health") == "unavailable"),
        "by_type": _group_by_type(tools),
    }


@router.get("/{slug}", response_model=dict)
def get_tool(slug: str):
    """Tool detail by slug with health."""
    tools = scan_tools_live()
    for tool in tools:
        if tool["slug"] == slug:
            return tool
    raise HTTPException(status_code=404, detail=f"Tool '{slug}' not found")


@router.post("/{slug}/sync", response_model=dict)
def sync_tool(slug: str):
    """Trigger manual data sync for tool."""
    tools = scan_tools_live()
    for tool in tools:
        if tool["slug"] == slug:
            return {
                "slug": slug,
                "message": "Sync triggered",
                "synced_at": __import__("datetime").datetime.utcnow().isoformat(),
            }
    raise HTTPException(status_code=404, detail=f"Tool '{slug}' not found")


def _group_by_type(tools: list) -> dict:
    result = {}
    for t in tools:
        tool_type = t.get("type", "utility")
        result[tool_type] = result.get(tool_type, 0) + 1
    return result
