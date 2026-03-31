"""
Agent health polling — checks real agent status from workspace dirs and processes.
Auto-discovers agents from OpenClaw workspace-* directories.
"""
from __future__ import annotations

import logging
import os
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

BASE_DIR = Path(os.environ.get("OPENCLAW_HOME", str(Path.home() / ".openclaw")))
ACTIVE_THRESHOLD_SEC = 300  # 5 minutes


def _gateway_is_running() -> bool:
    """Check if the main OpenClaw gateway is running."""
    try:
        result = subprocess.run(
            ["pgrep", "-f", "openclaw-gateway"],
            capture_output=True, text=True, timeout=2
        )
        return result.returncode == 0
    except Exception:
        return False


def _get_last_activity(workspace: Path) -> float | None:
    """Get the most recent file modification time in the workspace."""
    latest = 0.0
    try:
        check_paths = [
            *workspace.glob("*.md"),
            *workspace.glob("memory/*.md"),
        ]

        # Also check agent session dir
        agent_slug = workspace.name.replace("workspace-", "")
        session_dir = BASE_DIR / "agents" / agent_slug / "sessions"
        if session_dir.exists():
            check_paths.extend(session_dir.glob("*.jsonl"))

        for p in check_paths:
            try:
                mtime = p.stat().st_mtime
                if mtime > latest:
                    latest = mtime
            except Exception:
                continue
    except Exception:
        pass

    return latest if latest > 0 else None


def _read_identity(workspace: Path) -> dict:
    """Extract agent info from IDENTITY.md."""
    identity_path = workspace / "IDENTITY.md"
    info = {}
    if identity_path.exists():
        try:
            content = identity_path.read_text(errors="ignore")
            m = re.search(r"\*\*Name:\*\*\s*(.+)", content)
            if m:
                info["name"] = m.group(1).strip()
            m = re.search(r"\*\*Emoji:\*\*\s*(.+)", content)
            if m:
                info["emoji"] = m.group(1).strip()
            m = re.search(r"\*\*Role:\*\*\s*(.+)", content)
            if m:
                info["role"] = m.group(1).strip()
        except Exception:
            pass
    return info


# Cache gateway status per scan cycle
_gateway_up: bool = False


def get_agent_status(slug: str, workspace: Path) -> str:
    """Determine agent status: running, idle, offline."""
    global _gateway_up
    last_activity = _get_last_activity(workspace)
    now = time.time()

    if not _gateway_up:
        return "offline"

    if last_activity and (now - last_activity) < ACTIVE_THRESHOLD_SEC:
        return "running"

    if last_activity and (now - last_activity) < 3600:
        return "idle"

    return "idle"


def scan_agents_live() -> list[dict]:
    """Scan workspace-* dirs with LIVE health status."""
    global _gateway_up

    _gateway_up = _gateway_is_running()

    agents = []
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Add main orchestrator agent — uses the base workspace, not workspace-*
    main_ws = BASE_DIR / "workspace"
    if main_ws.is_dir():
        main_activity = _get_last_activity(main_ws)
        main_status = "running" if _gateway_up and main_activity and (time.time() - main_activity) < ACTIVE_THRESHOLD_SEC else ("idle" if _gateway_up else "offline")
        main_seen = datetime.fromtimestamp(main_activity, tz=timezone.utc).replace(tzinfo=None).isoformat() if main_activity else None

        # Try to read orchestrator identity
        main_identity = _read_identity(main_ws)

        agents.append({
            "id": "agent-orchestrator",
            "name": main_identity.get("name", "Orchestrator"),
            "slug": "orchestrator",
            "emoji": main_identity.get("emoji", "⚡"),
            "role": main_identity.get("role", "Main agent — Lab orchestrator"),
            "model": "anthropic/claude-sonnet-4-6",
            "status": main_status,
            "parent": None,
            "tier": 1,
            "workspace": str(main_ws),
            "capabilities": ["orchestration", "tools", "agents"],
            "health": {"last_seen": main_seen, "uptime_percent": None, "error_count_24h": 0, "warning_count_24h": 0},
            "metrics": {"tasks_completed_total": 0, "tasks_completed_24h": 0, "avg_response_time_ms": None, "tokens_used_24h": 0, "tokens_used_month": 0, "estimated_cost_month_usd": 0.0},
            "current_task": None,
        })

    # Scan all workspace-* directories for specialist agents
    workspace_dirs = sorted(BASE_DIR.glob("workspace-*"))

    for ws_dir in workspace_dirs:
        if not ws_dir.is_dir():
            continue

        slug = ws_dir.name.replace("workspace-", "")
        identity = _read_identity(ws_dir)

        name = identity.get("name", slug.capitalize())
        emoji = identity.get("emoji", "🤖")
        role = identity.get("role", "Agent")
        model = "anthropic/claude-sonnet-4-6"

        status = get_agent_status(slug, ws_dir)
        last_activity = _get_last_activity(ws_dir)
        last_seen_iso = (
            datetime.fromtimestamp(last_activity, tz=timezone.utc).replace(tzinfo=None).isoformat()
            if last_activity
            else None
        )

        agents.append({
            "id": f"agent-{slug}",
            "name": name,
            "slug": slug,
            "emoji": emoji,
            "role": role,
            "model": model,
            "status": status,
            "parent": "orchestrator",
            "tier": 2,
            "workspace": str(ws_dir),
            "capabilities": [],
            "health": {
                "last_seen": last_seen_iso,
                "uptime_percent": None,
                "error_count_24h": 0,
                "warning_count_24h": 0,
            },
            "metrics": {
                "tasks_completed_total": 0,
                "tasks_completed_24h": 0,
                "avg_response_time_ms": None,
                "tokens_used_24h": 0,
                "tokens_used_month": 0,
                "estimated_cost_month_usd": 0.0,
            },
            "current_task": None,
        })

    return agents
