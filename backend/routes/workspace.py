"""
Workspace File Browser API
GET  /api/v1/workspace/tree  — recursive directory tree
GET  /api/v1/workspace/file  — read file
PUT  /api/v1/workspace/file  — update file (with conflict detection)
POST /api/v1/workspace/file  — create new file
DELETE /api/v1/workspace/file — trash file
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

# ── Constants ──────────────────────────────────────────────────────────────────
WORKSPACE_ROOT = Path(os.environ.get("WORKSPACE_ROOT", str(Path.home() / ".openclaw")))
PROTECTED_FILES = {"MEMORY.md", "SOUL.md", "IDENTITY.md", "USER.md", "AGENTS.md"}
EXCLUDED_DIRS = {"__pycache__", "node_modules", ".git", ".trash", ".next", "venv", "dist", "build"}
EXCLUDED_EXTS = {".pyc", ".pyo"}
MAX_FILE_SIZE = 1_048_576  # 1MB
BINARY_CHECK_BYTES = 8192

router = APIRouter(tags=["workspace"])


# ── Security helper ────────────────────────────────────────────────────────────
def safe_resolve(relative_path: str) -> Path:
    """Resolve path and ensure it's within workspace. Raises ValueError on violation."""
    if ".." in relative_path or relative_path.startswith("/"):
        raise ValueError("Invalid path")
    resolved = (WORKSPACE_ROOT / relative_path).resolve()
    if not str(resolved).startswith(str(WORKSPACE_ROOT.resolve())):
        raise ValueError("Path escapes workspace")
    return resolved


def is_binary(path: Path) -> bool:
    """Check if a file appears to be binary by looking for null bytes."""
    try:
        with open(path, "rb") as f:
            chunk = f.read(BINARY_CHECK_BYTES)
        return b"\x00" in chunk
    except OSError:
        return False


def should_exclude(path: Path) -> bool:
    """Return True if this path should be excluded from tree."""
    if path.is_dir() and path.name in EXCLUDED_DIRS:
        return True
    if path.suffix in EXCLUDED_EXTS:
        return True
    return False


# ── Tree builder ───────────────────────────────────────────────────────────────
def build_tree(path: Path, root: Path, depth: int, max_depth: int) -> Dict[str, Any]:
    """Recursively build directory tree entry."""
    rel = str(path.relative_to(root))
    stat = path.stat()

    if path.is_dir():
        entry: Dict[str, Any] = {
            "name": path.name,
            "path": rel,
            "type": "directory",
            "size": None,
            "mtime": stat.st_mtime,
            "binary": None,
            "children": [],
        }
        if depth < max_depth:
            children_raw = sorted(
                [c for c in path.iterdir() if not should_exclude(c)],
                key=lambda c: (0 if c.is_dir() else 1, c.name.lower()),
            )
            entry["children"] = [
                build_tree(c, root, depth + 1, max_depth) for c in children_raw
            ]
        return entry
    else:
        binary = is_binary(path)
        return {
            "name": path.name,
            "path": rel,
            "type": "file",
            "size": stat.st_size,
            "mtime": stat.st_mtime,
            "binary": binary,
            "children": None,
        }


# ── Request / Response models ──────────────────────────────────────────────────
class WriteFileBody(BaseModel):
    content: str
    mtime: float  # client's last-known mtime for conflict detection


class CreateFileBody(BaseModel):
    content: str


# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.get("/workspace/tree")
async def get_workspace_tree(
    depth: int = Query(default=3, ge=1, le=5),
):
    """Return recursive directory tree of the workspace."""
    root = WORKSPACE_ROOT.resolve()
    if not root.exists():
        raise HTTPException(status_code=404, detail="Workspace root not found")

    children_raw = sorted(
        [c for c in root.iterdir() if not should_exclude(c)],
        key=lambda c: (0 if c.is_dir() else 1, c.name.lower()),
    )
    tree = [build_tree(c, root, 1, depth) for c in children_raw]
    return {"root": str(root), "depth": depth, "children": tree}


@router.get("/workspace/file")
async def read_file(path: str = Query(...)):
    """Read a file from the workspace."""
    try:
        resolved = safe_resolve(path)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if not resolved.exists():
        raise HTTPException(status_code=404, detail="File not found")
    if resolved.is_dir():
        raise HTTPException(status_code=400, detail="Path is a directory")

    stat = resolved.stat()

    if stat.st_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large (max {MAX_FILE_SIZE // 1024}KB)",
        )

    binary = is_binary(resolved)

    if binary:
        return {
            "path": path,
            "name": resolved.name,
            "content": None,
            "size": stat.st_size,
            "mtime": stat.st_mtime,
            "binary": True,
            "encoding": None,
        }

    content = resolved.read_text(encoding="utf-8", errors="replace")
    return {
        "path": path,
        "name": resolved.name,
        "content": content,
        "size": stat.st_size,
        "mtime": stat.st_mtime,
        "binary": False,
        "encoding": "utf-8",
    }


@router.put("/workspace/file")
async def update_file(path: str = Query(...), body: WriteFileBody = ...):
    """Update an existing file with conflict detection."""
    try:
        resolved = safe_resolve(path)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if resolved.exists():
        server_mtime = resolved.stat().st_mtime
        # Allow a small float tolerance (1ms) to avoid spurious conflicts
        if server_mtime > body.mtime + 0.001:
            raise HTTPException(
                status_code=409,
                detail={
                    "server_mtime": server_mtime,
                    "message": "File was modified on the server after your last read. Reload before saving.",
                },
            )

    # Ensure parent dirs exist
    resolved.parent.mkdir(parents=True, exist_ok=True)
    resolved.write_text(body.content, encoding="utf-8")

    new_stat = resolved.stat()
    return {"path": path, "mtime": new_stat.st_mtime, "size": new_stat.st_size}


@router.post("/workspace/file")
async def create_file(path: str = Query(...), body: CreateFileBody = ...):
    """Create a new file. Returns 409 if it already exists."""
    try:
        resolved = safe_resolve(path)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if resolved.exists():
        raise HTTPException(status_code=409, detail="File already exists")

    resolved.parent.mkdir(parents=True, exist_ok=True)
    resolved.write_text(body.content, encoding="utf-8")

    stat = resolved.stat()
    return {"path": path, "mtime": stat.st_mtime, "size": stat.st_size}


@router.delete("/workspace/file")
async def delete_file(path: str = Query(...)):
    """Move file to trash. Blocks deletion of protected files."""
    try:
        resolved = safe_resolve(path)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if not resolved.exists():
        raise HTTPException(status_code=404, detail="File not found")
    if resolved.is_dir():
        raise HTTPException(status_code=400, detail="Use a directory endpoint to delete directories")

    # Block protected files
    if resolved.name in PROTECTED_FILES:
        raise HTTPException(
            status_code=403,
            detail=f"'{resolved.name}' is a protected file and cannot be deleted",
        )

    # Try trash-put first
    trashed = False
    if shutil.which("trash-put"):
        result = subprocess.run(["trash-put", str(resolved)], capture_output=True)
        trashed = result.returncode == 0

    if not trashed:
        # Fallback: move to .trash/ inside workspace
        trash_dir = WORKSPACE_ROOT / ".trash"
        trash_dir.mkdir(parents=True, exist_ok=True)
        dest = trash_dir / resolved.name
        # Avoid collision
        if dest.exists():
            base, suffix = dest.stem, dest.suffix
            counter = 1
            while dest.exists():
                dest = trash_dir / f"{base}_{counter}{suffix}"
                counter += 1
        os.rename(str(resolved), str(dest))

    return {"deleted": path}
