"""
Agent and tool discovery — scans OpenClaw workspace directories
to auto-detect agents and tools.
"""
from __future__ import annotations

import logging
import os
import re
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

BASE_DIR = Path(os.environ.get("OPENCLAW_HOME", str(Path.home() / ".openclaw")))


def scan_agents() -> list[dict]:
    """
    Scan workspace-* directories and build agent info from IDENTITY.md files.
    Auto-discovers any agents in the OpenClaw workspace.
    """
    agents = []
    workspace_dirs = sorted(BASE_DIR.glob("workspace-*"))

    for ws_dir in workspace_dirs:
        if not ws_dir.is_dir():
            continue
        slug = ws_dir.name.replace("workspace-", "")

        # Read IDENTITY.md for agent info
        name = slug.capitalize()
        emoji = "🤖"
        role = "Agent"
        model = "anthropic/claude-sonnet-4-6"

        identity_path = ws_dir / "IDENTITY.md"
        if identity_path.exists():
            try:
                content = identity_path.read_text(errors="ignore")
                m = re.search(r"\*\*Name:\*\*\s*(.+)", content)
                if m:
                    name = m.group(1).strip()
                m = re.search(r"\*\*Emoji:\*\*\s*(.+)", content)
                if m:
                    emoji = m.group(1).strip()
                m = re.search(r"\*\*Role:\*\*\s*(.+)", content)
                if m:
                    role = m.group(1).strip()
                m = re.search(r"model[:\s]+([^\s\n]+)", content, re.IGNORECASE)
                if m:
                    model = m.group(1).strip()
            except Exception:
                pass

        # Check if agent process is running
        status = "offline"
        try:
            import subprocess
            result = subprocess.run(
                ["pgrep", "-f", "openclaw-gateway"],
                capture_output=True, text=True, timeout=2
            )
            if result.returncode == 0:
                status = "idle"
        except Exception:
            pass

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
                "last_seen": None,
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


def scan_tools() -> list[dict]:
    """
    Scan tools directory for Python tool scripts.
    Auto-discovers tools from ~/.openclaw/tools/*.py
    """
    tools_dir = BASE_DIR / "tools"
    tools = []

    if not tools_dir.exists():
        return tools

    for py_file in sorted(tools_dir.glob("*.py")):
        slug = py_file.stem
        name = slug.replace("_", " ").title()
        description = f"Tool: {name}"

        # Read first docstring for description
        try:
            content = py_file.read_text(errors="ignore")[:500]
            m = re.search(r'"""(.+?)"""', content, re.DOTALL)
            if m:
                doc = m.group(1).strip().split("\n")[0]
                if doc:
                    description = doc
        except Exception:
            pass

        tools.append({
            "id": f"tool-{slug}",
            "name": name,
            "slug": slug,
            "emoji": "🔧",
            "description": description,
            "type": "utility",
            "status": "active",
            "version": "1.0.0",
            "owner_agent": "orchestrator",
            "created_at": None,
            "data_path": str(py_file),
            "usage": {
                "calls_total": 0,
                "calls_24h": 0,
                "calls_7d": 0,
                "last_called_at": None,
                "errors_24h": 0,
                "avg_latency_ms": None,
            },
            "config": {},
        })

    return tools
