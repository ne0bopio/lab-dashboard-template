"""
Tools health checking — verifies each tool is available and functional.
Scans TOOLS_DIR (default: ~/.openclaw/tools) for Python tool scripts.
"""
from __future__ import annotations

import logging
import os
import re
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)

TOOLS_DIR = Path(os.environ.get("TOOLS_DIR", str(Path.home() / ".openclaw" / "tools")))

# Override these with your own tools — these are examples
KNOWN_TOOLS = {
    "calendar_tool": {"name": "Calendar", "emoji": "📅", "type": "scheduling", "description": "Calendar management and scheduling"},
    "credential_manager": {"name": "Credential Manager", "emoji": "🔐", "type": "security", "description": "Manage secrets and credentials"},
    "email_tool": {"name": "Email", "emoji": "📧", "type": "communication", "description": "Email send/receive"},
    "file_manager_tool": {"name": "File Manager", "emoji": "📁", "type": "utility", "description": "File system operations"},
}

# Special health checks per tool — customize for your setup
HEALTH_CHECKS = {
    "credential_manager": lambda: Path(os.environ.get("CREDENTIALS_FILE", str(Path.home() / ".openclaw" / ".env"))).exists(),
}


def _ping_host(host: str, port: int = None, timeout: int = 2) -> bool:
    """Check if a host is reachable."""
    try:
        if port:
            result = subprocess.run(
                ["bash", "-c", f"echo >/dev/tcp/{host}/{port}"],
                capture_output=True, timeout=timeout
            )
            return result.returncode == 0
        else:
            result = subprocess.run(
                ["ping", "-c", "1", "-W", str(timeout), host],
                capture_output=True, timeout=timeout + 1
            )
            return result.returncode == 0
    except Exception:
        return False


def _check_env_key(key: str) -> bool:
    """Check if an env key exists in the .env file."""
    env_file = Path(os.environ.get("CREDENTIALS_FILE", str(Path.home() / ".openclaw" / ".env")))
    if not env_file.exists():
        return False
    try:
        content = env_file.read_text()
        return key in content
    except Exception:
        return False


def get_tool_health(slug: str) -> str:
    """Get health status for a tool: available, degraded, unavailable."""
    tool_path = TOOLS_DIR / f"{slug}.py"

    if not tool_path.exists():
        return "unavailable"

    # Run special health check if available
    check = HEALTH_CHECKS.get(slug)
    if check:
        try:
            if not check():
                return "degraded"
        except Exception:
            return "degraded"

    return "available"


def scan_tools_live() -> list[dict]:
    """Scan tools with live health status."""
    tools = []

    if not TOOLS_DIR.exists():
        return tools

    for py_file in sorted(TOOLS_DIR.glob("*.py")):
        slug = py_file.stem
        meta = KNOWN_TOOLS.get(slug, {})

        name = meta.get("name", slug.replace("_", " ").title())
        emoji = meta.get("emoji", "🔧")
        tool_type = meta.get("type", "utility")
        description = meta.get("description", f"Tool: {name}")

        # Read docstring
        try:
            content = py_file.read_text(errors="ignore")[:500]
            m = re.search(r'"""(.+?)"""', content, re.DOTALL)
            if m:
                doc = m.group(1).strip().split("\n")[0]
                if doc:
                    description = doc
        except Exception:
            pass

        health = get_tool_health(slug)

        tools.append({
            "id": f"tool-{slug}",
            "name": name,
            "slug": slug,
            "emoji": emoji,
            "description": description,
            "type": tool_type,
            "status": "active" if health == "available" else "degraded" if health == "degraded" else "inactive",
            "health": health,
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
